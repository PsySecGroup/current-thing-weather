import 'dotenv/config'
import { workerCount, save, enqueue } from './database'
import { extractAndProcessZip } from './csv'
import { getFiles, readOrCreateJsonFile, writeJsonFile } from './files'

const loadedJsonPath = 'data/loaded.json'
const sourceDir = process.env.GDELT_PATH
const outputDir = process.env.GDELT_SQLITE_PATH

/**
 *
 */
async function main (directory = sourceDir) {
  console.log('Gathering archives...')
  const loadedZips = await readOrCreateJsonFile(loadedJsonPath, '{}')
  const zips = await getFiles(directory, 'zip')
  const targets = []

  for (const zip of zips) {
    const zipPath = directory + '/' + zip

    if (loadedZips[zipPath] === undefined && zip !== 'GDELT.MASTERREDUCEDV2.1979-2013.zip') {
      targets.push(zipPath)
    }
  }

  for (const target of targets) {
    console.log(`Processing ${target}...`)
    const results = await extractAndProcessZip(target)

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

    console.log('Saving...')
    await save(outputDir, target)
    loadedZips[target] = true
    await writeJsonFile(loadedJsonPath, loadedZips)
  }
}

main()
