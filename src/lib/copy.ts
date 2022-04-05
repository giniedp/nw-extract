import * as fs from 'fs'
import * as path from 'path'

export async function pathStats(filePath: string) {
  return fs.promises.stat(filePath).catch(() => null as fs.Stats)
}

export async function pathExists(filePath: string) {
  const stats = await pathStats(filePath)
  return stats?.isFile() || stats?.isDirectory()
}

export async function pathIsFile(filePath: string) {
  const stats = await pathStats(filePath)
  return stats?.isFile()
}

export async function pathIsDirectory(filePath: string) {
  const stats = await pathStats(filePath)
  return stats?.isDirectory()
}

export async function mkdir(dirPath: string, options?: fs.MakeDirectoryOptions) {
  const stat = await fs.promises.stat(dirPath).catch(() => null as fs.Stats)
  if (stat?.isDirectory()) {
    return
  }
  return new Promise<void>((resolve, reject) => {
    fs.mkdir(dirPath, options, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

export async function copyFile(input: string, output: string, options?: { createDir: boolean }) {
  if (options?.createDir) {
    await mkdir(path.dirname(input), { recursive: true })
  }
  return fs.promises.copyFile(input, output)
}

export async function copyJSONFile(input: string, output: string) {
  const data = await fs.promises.readFile(input)
  const dataOut = JSON.stringify(JSON.parse(data.toString('utf-8')), null, 1)
  return fs.promises.writeFile(output, dataOut, 'utf-8')
}

export function renameExtname(file: string, extname: string) {
  const dirName = path.dirname(file)
  const baseName = path.basename(file, path.extname(file))
  return path.join(dirName, baseName + extname)
}
