import { promises as fs } from "fs"
import * as path from "path"
import { spawn } from "./spawn"
import { mkdir, pathExists } from "./copy"
import { handleError } from "./error"

export async function convertImage(data: Buffer, format: string, options: {
  texconv: string,
  tmpdir: string
}) {
  const tmpDir = options.tmpdir || process.cwd()
  const ddsDir = path.join(tmpDir, '.nw-convert')
  const ddsFile = path.join(tmpDir, 'image.dds')
  const texconv = options.texconv || 'texconv.exe'
  const resultFile = path.join(ddsDir, path.basename(ddsFile, '.dds') + `.${format}`) 
  let result: Buffer
  await mkdir(ddsDir, { recursive: true })
  await fs.writeFile(ddsFile, data, { encoding: 'binary', flag: 'w', mode: 0o777 })
  await spawn(`${texconv} -ft ${format} -y -o "${ddsDir}" "${ddsFile}"`, {
    shell: true,
    stdio: 'pipe',
    env: process.env,
    cwd: process.cwd()
  }).then(async () => {
    result = await fs.readFile(resultFile, { flag: 'r' })  
  }).catch(handleError)

  for (const file of [ddsFile, resultFile]) {
    if (await pathExists(file)) {
      await fs.unlink(file).catch(handleError)
    }
  }
  return result
}
