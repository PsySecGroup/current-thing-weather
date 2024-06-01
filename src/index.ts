// import { Command } from 'commander'
import { writeFileSync, createReadStream } from 'fs'
import unzipper from 'unzipper'
import csv from 'csv-parser'

const isBadPart = /\d/
const plusRegex = /\+|_/g
const minusRegex = /-/g
const headers = ['GLOBALEVENTID', 'SQLDATE', 'MonthYear', 'Year', 'FractionDate', 'Actor1Code', 'Actor1Name', 'Actor1CountryCode', 'Actor1KnownGroupCode', 'Actor1EthnicCode', 'Actor1Religion1Code', 'Actor1Religion2Code', 'Actor1Type1Code', 'Actor1Type2Code', 'Actor1Type3Code', 'Actor2Code', 'Actor2Name', 'Actor2CountryCode', 'Actor2KnownGroupCode', 'Actor2EthnicCode', 'Actor2Religion1Code', 'Actor2Religion2Code', 'Actor2Type1Code', 'Actor2Type2Code', 'Actor2Type3Code', 'IsRootEvent', 'EventCode', 'EventBaseCode', 'EventRootCode', 'QuadClass', 'GoldsteinScale', 'NumMentions', 'NumSources', 'NumArticles', 'AvgTone', 'Actor1Geo_Type', 'Actor1Geo_FullName', 'Actor1Geo_CountryCode', 'Actor1Geo_ADM1Code', 'Actor1Geo_Lat', 'Actor1Geo_Long', 'Actor1Geo_FeatureID', 'Actor2Geo_Type', 'Actor2Geo_FullName', 'Actor2Geo_CountryCode', 'Actor2Geo_ADM1Code', 'Actor2Geo_Lat', 'Actor2Geo_Long', 'Actor2Geo_FeatureID', 'ActionGeo_Type', 'ActionGeo_FullName', 'ActionGeo_CountryCode', 'ActionGeo_ADM1Code', 'ActionGeo_Lat', 'ActionGeo_Long', 'ActionGeo_FeatureID', 'DATEADDED', 'SOURCEURL']

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
    const type = entry.type; // 'Directory' or 'File'
    // const size = entry.vars.uncompressedSize; // There is also compressedSize;

    if (type === 'File' && fileName.endsWith('.csv')) {
      const csvResults = await processCsv(entry)
      results.push(...csvResults)
    } else {
      entry.autodrain()
    }
  }

  return results;
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
    const csvResults = [];
    csvStream
      .pipe(csv({
        separator: '\t',
        headers
      }))
      .on('data', (data) => { 
        // const values = Object
        let entities = addEntities(data.Actor1Geo_FullName, [])
        entities = addEntities(data.Actor2Geo_FullName, entities)
        entities = addEntities(data.Actor1Name, entities)
        entities = addEntities(data.Actor2Name, entities)

        const urlParts = data.SOURCEURL
          .toLowerCase()
          .replace(plusRegex, '-')
          .split('/')
        
        const domain = urlParts[2]

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

        const event = {
          isRoot: parseInt(data.IsRootEvent),
          year: parseInt(data.Year),
          month: parseInt(data.MonthYear.substring(4)),
          day: parseInt(data.SQLDATE.substring(6)),
          quad: parseInt(data.QuadClass),
          goldstein: parseInt(data.GoldsteinScale),
          mentions: parseInt(data.NumMentions),
          sources: parseInt(data.NumSources),
          articles: parseInt(data.NumArticles),
          tone: parseFloat(data.AvgTone),
          domain,
          url: data.SOURCEURL,
          summary,
          entities
        }
        
        csvResults.push(event)
      })
      .on('end', () => resolve(csvResults))
      .on('error', (error) => reject(error));
  });
}

/**
 *
 */
async function main () {
  const zipFilePath = 'data/20240512.export.CSV.zip';
  const results = await extractAndProcessZip(zipFilePath)
  writeFileSync('output.json', JSON.stringify(results, null, 2))
}

main()

/**
 * Get tweets piped in from a CURL query
 * Split words and strip stop words
 * Extract domains
 * Extact times
 * Extract username
 * INSERT username TO users IF NOT UNIQUE
 * INSERT tweetId, users.id, timestamp TO tweetIds IF NOT UNIQUE
 * INSERT word, tweetId.id TO words
 *   IF (word, tweetId.id) EXISTS
 *     iterate counter by 1
 *   ELSE
 *     set counter to 1
 * INSERT domain, tweetId.id TO domains
 *   IF (domain, tweetId.id) EXISTS
 *     iterate counter by 1
 *   ELSE
 *     set counter to 1
 * Run queries to generate report
 * Create a report image
 */
