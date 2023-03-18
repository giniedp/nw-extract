import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../utils/logger'
import { convertDatasheetFile } from '../converter/datasheet/converter'
import { convertImageFile } from '../converter/images/converter'
import { convertLocaleFile } from '../converter/locale/converter'
import { isDatasheet, isImageFile, isLocale } from '../listFiles'
import { replaceExtname } from '../utils/file-utils'

export interface ConvertFileOptions {
  bin?: string
  file: string
  outDir: string
  update?: boolean
  format: string
}

export async function convertFile({ file, bin, outDir, update, format }: ConvertFileOptions) {
  const outFile = path.join(outDir, replaceExtname(path.basename(file), `.${format}`))
  if (fs.existsSync(outFile) && !update) {
    logger.info('skipped', file)
    return
  }
  if (isDatasheet(file)) {
    return convertDatasheetFile({
      file, outDir, format
    })
  }
  if (isLocale(file)) {
    return convertLocaleFile({
      file, outDir, format
    })
  }
  if (isImageFile(file)) {
    return convertImageFile({
      bin, file, outDir, format
    })
  }
}
