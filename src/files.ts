import fs from 'fs/promises'
import path from 'path'

/**
 *
 */
export async function getFiles (directoryPath, ext) {
  const result = []
  try {
    
    const files = await fs.readdir(directoryPath)

    for (const file of files) {
      if (path.extname(file) === '.' + ext) {
        result.push(file)
      }
    }
  } catch (err) {
    throw new RangeError('Unable to scan directory:', err)
  }

  return result
}

/**
 *
 */
export const readJsonFile = async (filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error(`Error reading the file from disk: ${err}`)
    throw err
  }
}

/**
 *
 */
export const writeJsonFile = async (filePath: string, data): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data, null, 2)
    await fs.writeFile(filePath, jsonData, 'utf-8')
  } catch (err) {
    console.error(`Error writing the file to disk: ${err}`)
    throw err
  }
}

/**
 *
 */
export const readOrCreateJsonFile = async (filePath: string, defaultContent) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeJsonFile(filePath, defaultContent)
      return defaultContent
    } else {
      console.error(`Error reading the file: ${err}`)
      throw err
    }
  }
}
