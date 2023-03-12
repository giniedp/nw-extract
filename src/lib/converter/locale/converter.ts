import * as path from 'path'
import * as fs from 'fs'
import { unparse } from "papaparse"
import { JSDOM } from 'jsdom'
import { replaceExtname, writeFile } from '../../utils'

export interface ConvertLocaleOptions {
  file: string
  outDir?: string
  format: string
  unlink?: boolean
}

export async function convertLocaleFile({ file, format, outDir, unlink }: ConvertLocaleOptions) {
  const buffer = await fs.promises.readFile(file)
  const outData = await convertLocale(buffer, format)
  const outFile = path.join(outDir || path.dirname(file), replaceExtname(path.basename(file), `.${format}`))
  await writeFile(outFile, outData, { encoding: 'utf-8', createDir: true })
  if (unlink) {
    fs.unlinkSync(file)
  }
}

export async function convertLocale(xmlData: Buffer, format: string) {
  switch (format) {
    case "xml":
      return xmlData.toString();
    case "csv":
      return localeToCsv(xmlData);
    case "json":
      return localeToJson(xmlData);
  }
  throw new Error(`Unsupported format: ${format}`)
}

function localeToJson(data: Buffer) {

  const result: Record<string, {
    attributes: Record<string, string>,
    value: string
  }> = {}

  const dom = new JSDOM(data.toString('utf-8'))
  const strings = dom.window.document.querySelectorAll('string')
  strings.forEach((node) => {
    const key = node.getAttribute('key')
    result[key] = {
      attributes: node.getAttributeNames().reduce((res, key) => {
        if (key !== 'key') {
          res[key] = node.getAttribute(key)
        }
        return res
      }, {}),
      value: node.textContent
    }
  })
  return JSON.stringify(result, null, 2)
}

function localeToCsv(data: Buffer) {
  const dom = new JSDOM(data.toString('utf-8'))
  const strings = dom.window.document.querySelectorAll('string')
  const rows: Array<[string, string]> = []

  strings.forEach((node) => {
    const key = node.getAttribute('key')
    rows.push([key, node.textContent])
  })

  return unparse({
    fields: ["key", "value"],
    data: rows
  }, {
    quotes: true,
    header: true,
  })

}
