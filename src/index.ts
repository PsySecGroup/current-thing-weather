// import { Command } from 'commander'
import { createReadStream } from 'fs'
import unzipper from 'unzipper'
import csv from 'csv-parser'
import { workerCount, startWriters, enqueue } from '@psysecgroup/threaded-sqlite-write'

const isBadPart = /\d/
const singleQuoteRegex = /'/g
const plusRegex = /\+|_/g
const minusRegex = /-/g
const csvConfig = {
  separator: '\t',
  headers: ['GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate', 'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode', 'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code', 'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code', 'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode', 'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code', 'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code', 'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode', 'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles', 'AvgTone', 'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_Lat', 'Actor1Geo_Long', 'Actor1Geo_FeatureID', 'Actor2Geo_Type', 'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID', 'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode', 'ActionGeo_ADM1Code', 'ActionGeo_Lat', 'ActionGeo_Long', 'ActionGeo_FeatureID', 'DATEADDED', 'SOURCEURL']
}

/**
 *
 */
async function extractAndProcessZip (zipFilePath) {
  const results = []

  // Create a stream to read the zip file
  const zipStream = createReadStream(zipFilePath)
    .pipe(unzipper.Parse({ forceStream: true }))

  for await (const entry of zipStream) {
    const fileName = entry.path.toLowerCase()
    const type = entry.type // 'Directory' or 'File'

    if (type === 'File' && fileName.endsWith('.csv')) {
      const csvResults = await processCsv(entry)
      results.push(...csvResults)
    } else {
      entry.autodrain()
    }
  }

  return results
}

/**
 *
 */
function addEntities (str, array) {
  if (str.length > 0) {
    str
      .toLowerCase()
      .split(',')
      .forEach(entity => {
        const trimmed = entity.trim()
        if (array.indexOf(trimmed) === -1) {
          array.push(trimmed)
        }
      })
  }
  return array
}

/**
 *
 */
function processCsv (csvStream) {
  return new Promise((resolve, reject) => {
    const urls = {}

    csvStream
      .pipe(csv(csvConfig))
      .on('data', (data) => { 
        if (urls[data.SOURCEURL] === undefined) {
          urls[data.SOURCEURL] = {
            year: parseInt(data.Year),
            month: parseInt(data.MonthYear.substring(4)),
            day: parseInt(data.SQLDATE.substring(6)),
            conflict: 0,
            events: 0,
            tone: parseFloat(data.AvgTone),
            domain: '',
            url: data.SOURCEURL.replace(singleQuoteRegex, "''"),
            summary: '',
            entities: []          
          }
        }

        const source = urls[data.SOURCEURL]

        source.entities = addEntities(data.Actor1Geo_FullName, source.entities)
        source.entities = addEntities(data.Actor2Geo_FullName, source.entities)
        source.entities = addEntities(data.Actor1Name, source.entities)
        source.entities = addEntities(data.Actor2Name, source.entities)
        source.entities = addEntities(data.ActionGeo_FullName, source.entities)

        const urlParts = data.SOURCEURL
          .toLowerCase()
          .replace(plusRegex, '-')
          .split('/')

        source.domain = urlParts[2].replace('www.', '').replace(singleQuoteRegex, "''")

        let summary = ''

        for (const part of urlParts) {
          if (part.length > summary.length && part.indexOf('?') === -1 && part.indexOf('-') > -1) {
            summary = part
          }
        }

        summary = summary
          .replace('.html', '')
          .replace('.htm', '')
          .replace(minusRegex, ' ')
          .trim()

        if (summary === '') {
          const newSummary = []
          for (let part of urlParts.slice(3)) {
            if (part.length <= 1 || part === '*') {
              continue
            }

            let index = part.indexOf('?')

            if (index > -1) {
              part = part.substring(0, index)
            }

            index = part.indexOf('.')

            if (index > -1) {
              part = part.substring(0, index)
            }

            if (part.length === 0) {
              continue
            }

            if (isBadPart.test(part) === false) {
              if (newSummary.indexOf(part) === -1) {
                newSummary.push(part.replace(minusRegex, ' '))
              }
            }
          }

          summary = newSummary.join(' ').replace(singleQuoteRegex, "''")
        }

        source.summary = summary

        switch (data.QuadClass) {
          case '2':
            source.conflict += 0
            break
          case '1':
            source.conflict += 25
            break
          case '3':
            source.conflict += 50
            break
          case '4':
            source.conflict += 75
            break
        }

        source.events += 1
        source.conflict += parseInt(data.GoldsteinScale) * -1
      })
      .on('end', () => {
        const results = Object.values(urls)

        results.map(result => {
          result.entities = result.entities.join(',').replace(singleQuoteRegex, "''")
          return result
        })

        resolve(results)
      })
      .on('error', (error) => reject(error))
  })
}

/**
 *
 */
async function main () {
  const zipFilePath = 'data/20240512.export.CSV.zip'
  const results = await extractAndProcessZip(zipFilePath)

  const rows = []
  let i = 0

  for (const result of results) {
    const index = i % workerCount

    if (rows[index] === undefined) {
      rows[index] = []
    }

    rows[index].push(result)

    i += 1
  }

  for (const row of rows) {
    enqueue(row)
  }

  await startWriters(
    // Directory to save the sqlite databases
    'data',

    // The name of the sqlite databases
    '20240512',

    // The CREATE TABLE sql for the table to populate (Must be CREATE TABLE IF NOT EXISTS)
    'CREATE TABLE IF NOT EXISTS events (year INTEGER, month INTEGER, day INTEGER, conflict INTEGER, events INTEGER, tone REAL, domain TEXT, url TEXT, summary TEXT, entities TEXT);',

    // The function that converts enqueue() arrays of data into a semicolon-separated string of SQL INSERTs.
    function (data) {
      let query = '';

      for (const item of data) {
        const year = item.year
        const month = item.month
        const day = item.day
        const conflict = item.conflict
        const events = item.events
        const tone = item.tone
        const domain = item.domain
        const url = item.url
        const summary = item.summary
        const entities = item.entities

        query += `INSERT INTO events (year, month, day, conflict, events, tone, domain, url, summary, entities) VALUES ('${year}, ${month}, ${day}, ${conflict}, ${events}, ${tone}, ${domain}, ${url}, ${summary}, ${entities}');`
      }

      return query
    }
  )
}

main()
