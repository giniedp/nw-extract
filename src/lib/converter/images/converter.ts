import * as fs from 'fs'
import { texconv } from '../../tools/texconv'
import * as path from 'path'
import { copyFile, replaceExtname } from '../../utils'
import { convertDdsFile, copyDdsFile } from '../dds/converter'

export interface ConvertTextureOptions {
  file: string
  outDir: string
  format: string
}

export async function convertImageFile({ file, outDir, format }: ConvertTextureOptions): Promise<void> {
  const extname = path.extname(file).toLowerCase()
  if (extname.endsWith('.dds')) {
    return convertDds({ file, outDir, format })
  }

  if (extname.endsWith(`.${format}`.toLowerCase())) {
    const outFile = path.join(outDir, replaceExtname(path.basename(file), `.${format}`)) 
    return copyFile(file, outFile, {
      createDir: true
    })
  }

  return texconv({
    input: file,
    fileType: format,
    overwrite: true,
    output: outDir
  })
}

async function convertDds({ file, outDir, format }: ConvertTextureOptions): Promise<void> {
  const files = await copyDdsFile({
    input: file,
    output: path.join(outDir, path.basename(file))
  })

  for (const tmpFile of files) {
    const isDDNA = path.basename(tmpFile, path.extname(tmpFile)).endsWith('_ddna')
    const isA = path.extname(tmpFile).endsWith('.a')
    await convertDdsFile({
      isNormal: isDDNA && !isA,
      file: tmpFile,
      outDir: outDir,
      format: format
    })
  }
  const dirA = path.resolve(process.cwd(), path.dirname(file))
  const dirB = path.resolve(process.cwd(), outDir)
  if (format !== 'dds' && dirA !== dirB) {
    for (const tmpFile of files) {
      fs.unlinkSync(tmpFile)
    }
  }
}
