import { promises as fs } from "fs"
import * as path from "path"
import { spawn } from "./spawn"
import { mkdir } from "./copy"

export async function convertImage(data: Buffer, format: string, options: {
  texconv: string,
  tmpdir: string
}) {
  const tmpDir = options.tmpdir || process.cwd()
  const ddsDir = path.join(tmpDir, '.nw-convert')
  const ddsFile = path.join(tmpDir, 'image.dds')
  const texconv = options.texconv || 'texconv.exe'
  const resultFile = path.join(ddsDir, path.basename(ddsFile, '.dds') + `.${format}`) 

  await mkdir(ddsDir, { recursive: true })
  await fs.writeFile(ddsFile, data, { encoding: 'binary', flag: 'w', mode: 0o777 })
  await spawn(`${texconv} -ft ${format} -y -o "${ddsDir}" "${ddsFile}"`, {
    shell: true,
    stdio: 'pipe',
    env: process.env,
    cwd: process.cwd()
  })
  const result = await fs.readFile(resultFile, { flag: 'r' })
  
  await fs.unlink(ddsFile).catch(console.error)
  await fs.unlink(resultFile).catch(console.error)

  return result
}
