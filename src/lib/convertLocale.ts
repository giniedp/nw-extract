import { unparse } from "papaparse";
import { JSDOM } from 'jsdom'

export async function convertLocale(xmlData: Buffer, format: string) {
  switch (format) {
    case "xml":
      return xmlData.toString();
    case "csv":
      return localeToCsv(xmlData);
    case "json":
      return localeToJson(xmlData);
  }
  return ''
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
