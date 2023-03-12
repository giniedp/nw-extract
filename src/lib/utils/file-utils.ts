import * as fs from 'fs'
import * as path from 'path'
import fastGlob from 'fast-glob'
import { logger } from './logger'
import micromatch from 'micromatch'

export async function mkdir(dirPath: string, options?: fs.MakeDirectoryOptions) {
  return fs.promises.mkdir(dirPath, options)
}

export async function copyFile(input: string, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(output), { recursive: true })
  }
  logger.activity('copy', input, '->', output)
  return fs.promises.copyFile(input, output)
}

export async function writeFile(
  target: string,
  data: string,
  options: { createDir?: boolean; encoding: BufferEncoding },
) {
  if (options?.createDir) {
    await mkdir(path.dirname(target), { recursive: true })
  }
  logger.activity('write', target)
  return fs.promises.writeFile(target, data, {
    encoding: options.encoding,
  })
}

export function replaceExtname(file: string, extname: string) {
  const dir = path.dirname(file)
  const base = path.basename(file, path.extname(file))
  return path.join(dir, base) + extname
}

export async function transformTextFile(file: string, transform: (text: string) => Promise<string>) {
  const text = await fs.promises.readFile(file, { encoding: 'utf-8' })
  const result = await transform(text)
  await fs.promises.writeFile(file, Buffer.from(result), { encoding: 'utf-8' })
}

export function glob(pattern: string | string[], options?: fastGlob.Options): Promise<string[]> {
  options = options || {}
  options.caseSensitiveMatch = options.caseSensitiveMatch ?? false
  pattern = Array.isArray(pattern) ? pattern : [pattern]
  pattern = pattern.map((it) => it.replace(/\\/gi, '/'))
  return fastGlob(pattern, options)
}

export function globMatch(list: string[], pattern: string[]) {
  list = list.map((it) => it.replace(/\\/gi, '/'))
  pattern = pattern.map((it) => it.replace(/\\/gi, '/'))
  return micromatch(list, pattern)
}

export async function readJsonFile<T>(file: string) {
  const data = await fs.promises.readFile(file)
  return JSON.parse(data.toString('utf-8')) as T
}
