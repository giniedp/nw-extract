import * as glob from "fast-glob";
import * as fs from "fs"
import * as path from "path"

export function globFiles(pattern: string): Promise<string[]> {
  pattern = pattern.replace(/\\/gi, '/')
  return glob(pattern)
}

export async function listPakFiles(dir: string): Promise<string[]> {
  const files = await listFiles(dir)
  return files.filter((it) => it.endsWith('.pak'))
}

async function listFiles(dirPath: string): Promise<string[]> {
  const files = await fs.promises.readdir(dirPath)
  const result = await Promise.all(files.map(async (file) => {
    file = path.join(dirPath, file)
    const stat = await fs.promises.stat(file)
    if (stat.isDirectory()) {
      return listFiles(file)
    } else {
      return [file]
    }
  }))
  return result.flat(1)
}
