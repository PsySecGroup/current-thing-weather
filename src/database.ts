import { workerCount as WorkerCount, startWriters, enqueue as Enqueue } from '@psysecgroup/threaded-sqlite-write'
import { getDates } from './text'
import { readdir } from 'fs/promises'
import { parse, join } from 'path'

/**
 *
 */
export async function save (directory, filename) {
  try {
    await startWriters(
      // Directory to save the sqlite databases
      directory,

      // The name of the sqlite databases
      filename,

      // The CREATE TABLE sql for the table to populate (Must be CREATE TABLE IF NOT EXISTS)
      'events (year INTEGER, month INTEGER, day INTEGER, conflict INTEGER, events INTEGER, tone REAL, domain TEXT, url TEXT, summary TEXT, entities TEXT)',

      // The function that converts enqueue() arrays of data into a semicolon-separated string of SQL INSERTs.
      function (rows) {
        let query = '';

        for (const row of rows) {
          const year = row.year
          const month = row.month
          const day = row.day
          const conflict = row.conflict
          const events = row.events
          const tone = row.tone
          const domain = row.domain
          const url = row.url
          const summary = row.summary
          const entities = row.entities

          for (const key of Object.keys(row)) {
            if (Number.isNaN(row[key])) {
              console.log(row)
            }
          }

          query += `INSERT INTO events (year, month, day, conflict, events, tone, domain, url, summary, entities) VALUES (${year}, ${month}, ${day}, ${conflict}, ${events}, ${tone}, '${domain}', '${url}', '${summary}', '${entities}');`
        }

        return query
      },

      true
    )
  } catch (e) {
    console.error(e)
  }
}

/**
 *
 */
export async function findSqliteFiles(dir) {
  const sqliteFiles = []

  async function recurse(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true })

    const promises = entries.map(async (entry) => {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await recurse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.sqlite')) {
        sqliteFiles.push(fullPath)
      }
    })

    await Promise.all(promises)
  }

  await recurse(dir)
  return sqliteFiles
}

/**
 *
 */
export const consolidate = async (directory: string) => {
  const buckets = {}
  const dbFiles = await findSqliteFiles(directory)

  for (const db of dbFiles) {
    const { name } = parse(db)
    const dates = getDates(name)
    if (buckets[dates] === undefined) {
      buckets[dates] = []
    }

    buckets[dates].push(db)
  }

  Object.keys(buckets).forEach(key => {
    // @TODO open each database and dump to the key
    console.log(key, buckets[key].length)
  })
}

export const workerCount = WorkerCount
export const enqueue = Enqueue
