import glob from 'fast-glob'
import * as fs from 'fs'
import micromatch from 'micromatch'
import * as path from 'path'
import { Entry, open } from 'yauzl'
import { debug } from './debug'
import { handleError } from './error'

export function isDatasheet(file: string) {
  return file.endsWith('.datasheet')
}

export function isXML(file: string) {
  return file.endsWith('.xml')
}

export function isLocale(file: string) {
  return file.endsWith('.loc.xml')
}

export function isScript(file: string) {
  return file.endsWith('.luac')
}

export function isImageFile(file: string) {
  return file.endsWith('.dds') || file.endsWith('.png') // || file.includes(".dds.")
}

export function isImage(file: string) {
  return isImageFile(file) && /images/gi.test(file)
}

export function isTexture(file: string) {
  return isImageFile(file) && /texture/gi.test(file)
}

export function isIcon(file: string) {
  return isImageFile(file) && /icon/gi.test(file)
}

export function globFiles(pattern: string): Promise<string[]> {
  pattern = pattern.replace(/\\/gi, '/')
  return glob(pattern)
}

export function globMatch(list: string[], pattern: string[]) {
  list = list.map((it) => it.replace(/\\/gi, '/'))
  pattern = pattern.map((it) => it.replace(/\\/gi, '/'))
  return micromatch(list, pattern)
}

export async function listPakFiles(dir: string): Promise<string[]> {
  return await listFiles(dir, {
    recursive: true,
    predicate: (file) => path.extname(file) === '.pak',
  })
}

export interface ListFilesOptions {
  recursive?: boolean
  predicate?: (file: string, stat: fs.Stats) => boolean
}

export async function listFiles(dirPath: string, options?: ListFilesOptions): Promise<string[]> {
  const files = await fs.promises.readdir(dirPath)
  const result = await Promise.all(
    files.map(async (file) => {
      file = path.join(dirPath, file)
      const stat = await fs.promises.stat(file)
      if (stat.isFile() && (!options?.predicate || options?.predicate(file, stat))) {
        return [file]
      }
      if (stat.isDirectory() && options?.recursive) {
        return listFiles(file, options)
      }
      return []
    }),
  )
  return result.flat(1)
}

export async function listFilesInZip(zipFile: string, predicate: (entry: Entry) => boolean) {
  return new Promise<Entry[]>((resolve) => {
    const entries: Entry[] = []
    open(zipFile, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        handleError(err)
        resolve(entries)
        return
      }
      zipFile.on('entry', (entry: Entry) => {
        if (predicate(entry)) {
          debug(`include ${entry.compressionMethod} ${entry.fileName}`)
          entries.push(entry)
        } else {
          debug(`exclude ${entry.compressionMethod} ${entry.fileName}`)
        }
        zipFile.readEntry()
      })
      zipFile.once('end', () => resolve(entries))
      zipFile.readEntry()
    })
  })
}
