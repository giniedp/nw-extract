import { promises as fs } from "fs";
import * as path from "path";
import { globFiles } from "./globFiles";
import * as tmp from 'tmp'
import { spawn } from "./spawn";
import { mkdir } from "./copy";

export async function convertImages(srcDir: string, format: string | string[], options?: { unlink: boolean }) {
  const glob = path.join(srcDir, '**', "*.dds")
  const files = await globFiles(glob);

  for (const file of files) {
    
  }
}

export async function convertImage(data: Buffer, format: string, options: {
  texconv: string,
  tmpdir: string
}) {
  const tmpDir = options.tmpdir || path.join(process.cwd(), 'tmp')
  const ddsDir = path.join(tmpDir, 'nw-extract-dds')
  // const ddsFile = await tmpFile({
  //   dir: tmpDir,
  //   postfix: '.dds'
  // }) 
  const ddsFile = path.join(ddsDir, 'image.dds')
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

function tmpFile(options: tmp.TmpNameOptions) {
  return new Promise<string>((resolve, reject) => {
    tmp.tmpName(options, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}
