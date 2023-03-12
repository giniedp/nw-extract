import * as path from 'path'
import * as fs from 'fs'
import { replaceExtname, writeFile } from '../../utils'
import { unparse } from 'papaparse'
import { Datasheet, readDatasheet } from './reader'

export interface ConvertDatasheetOptions {
  file: string
  outDir?: string
  format: string
  unlink?: boolean
}

export async function convertDatasheetFile({ file, outDir, format, unlink }: ConvertDatasheetOptions) {
  const datasheet = await readDatasheet(file)
  const outData = convertDatasheet(datasheet, format)
  const outFile = path.join(outDir || path.dirname(file), replaceExtname(path.basename(file), `.${format}`))
  await writeFile(outFile, outData, { encoding: 'utf-8', createDir: true })
  if (unlink) {
    fs.unlinkSync(file)
  }
}

export function convertDatasheet(sheet: Datasheet, format: string) {
  switch (format) {
    case 'csv':
      return datasheetToCsv(sheet)
    case 'json':
      return datasheetToJson(sheet)
  }
  throw new Error(`Unsupported format: ${format}`)
}

export function datasheetToCsv(sheet: Datasheet) {
  return unparse(
    {
      fields: sheet.header.map((it) => it.text),
      data: sheet.rows,
    },
    {
      quotes: true,
      header: true,
    },
  )
}

export function datasheetToJson(sheet: Datasheet) {
  const records = sheet.rows.map((row) => {
    const record = {}
    sheet.header.forEach((it, i) => {
      const key = it.text
      const value = row[i]
      if (value != null) {
        record[key] = value
      }
    })
    return record
  })
  return JSON.stringify(records, null, 2)
}
