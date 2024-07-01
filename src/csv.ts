import { createReadStream } from 'fs'
import unzipper from 'unzipper'
import csv from 'csv-parser'
import { isBadPart, singleQuoteRegex, plusRegex, minusRegex } from './text'

const csvConfig = {
  separator: '\t',
  headers: ['GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate', 'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode', 'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code', 'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code', 'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode', 'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code', 'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code', 'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode', 'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles', 'AvgTone', 'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_Lat', 'Actor1Geo_Long', 'Actor1Geo_FeatureID', 'Actor2Geo_Type', 'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID', 'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode', 'ActionGeo_ADM1Code', 'ActionGeo_Lat', 'ActionGeo_Long', 'ActionGeo_FeatureID', 'DATEADDED', 'SOURCEURL']
}

let tempUrl = 0

/**
 *
 */
export async function extractAndProcessZip (zipFilePath) {
  const results = []

  // Create a stream to read the zip file
  const zipStream = createReadStream(zipFilePath)
    .pipe(unzipper.Parse({ forceStream: true }))

  for await (const entry of zipStream) {
    const fileName = entry.path.toLowerCase()
    const type = entry.type // 'Directory' or 'File'

    if (type === 'File' && fileName.endsWith('.csv')) {
      const csvResults = await processCsv(entry)

      for (const csvRow of csvResults) {
        results.push(csvRow)
      }
      // results.push(csvResults)
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

        const url = data.SOURCEURL || ''
        const urlParts = url
          .toLowerCase()
          .replace(plusRegex, '-')
          .split('/')
        
        let urlKey

        if (url === '') {
          urlKey = tempUrl
          tempUrl += 1
        } else {
          urlKey = url
        }

        if (urls[urlKey] === undefined) {
          urls[urlKey] = {
            year: parseInt(data.Year),
            month: parseInt(data.MonthYear.substring(4)),
            day: parseInt(data.SQLDATE.substring(6)),
            conflict: 0,
            events: 0,
            tone: parseFloat(data.AvgTone),
            domain: '',
            url: url.replace(singleQuoteRegex, "''"),
            summary: '',
            entities: []          
          }
        }

        const source = urls[urlKey]
        source.entities = addEntities(data.Actor1Geo_FullName, source.entities)
        source.entities = addEntities(data.Actor2Geo_FullName, source.entities)
        source.entities = addEntities(data.Actor1Name, source.entities)
        source.entities = addEntities(data.Actor2Name, source.entities)
        source.entities = addEntities(data.ActionGeo_FullName, source.entities)

        source.domain = url === ''
          ? url
          : (urlParts[2] || urlParts[0]).replace('www.', '').replace(singleQuoteRegex, "''")

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

          summary = newSummary.join(' ')
        }

        source.summary = summary.replace(singleQuoteRegex, "''")

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
        source.conflict += parseInt(data.GoldsteinScale || 0) * -1
      })
      .on('end', () => {
        const results = Object.values(urls)

        results.map(result => {
          result.entities = result.entities.join(',').replace(singleQuoteRegex, "''")
          return result
        })

        console.log(results.length + ' records to save...')

        resolve(results)
      })
      .on('error', (error) => reject(error))
  })
}
