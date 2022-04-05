import { promises as fs } from "fs";
import * as path from "path";


import { Datasheet, parseDatasheet } from "./readDatasheet";
import { unparse } from "papaparse";
import { globFiles } from "./globFiles";

export async function convertDatasheets(srcDir: string, format: string | string[], options?: { unlink: boolean }) {
  const glob = path.join(srcDir, '**', "*.datasheet")
  const files = await globFiles(glob);

  for (const file of files) {
    const data = await fs.readFile(file);
    const sheet = await parseDatasheet(data)
    const formats = Array.isArray(format) ? format : [format]
    for (const fmt of formats) {
      const result = convertDatasheet(sheet, fmt)

      const dirName = path.dirname(file)
      const baseName = path.basename(file, path.extname(file))
      const target = path.join(dirName, `${baseName}.${fmt}`)

      if (result) {
        await fs.writeFile(target, Buffer.from(result))
      }
    }
    if (options?.unlink) {
      fs.unlink(file)
    }
  }
}

export function convertDatasheet(sheet: Datasheet, format: string) {
  switch (format) {
    case "csv":
      return datasheetToCsv(sheet);
    case "json":
      return datasheetToJson(sheet);
    case "ts":
      return datasheetToTs(sheet);
  }
  return ''
}

export function datasheetToCsv(sheet: Datasheet) {
  return unparse({
      fields: sheet.header.map((it) => it.text),
      data: sheet.rows
  }, {
      quotes: true,
      header: true,
  })
}

export function datasheetToJson(sheet: Datasheet) {
  const records = sheet.rows.map((row) => {
      const record = {};
      sheet.header.forEach((it, i) => {
          const key = it.text;
          const value = row[i];
          if (value != null) {
              record[key] = value;
          }
      })
      return record;
  });
  return JSON.stringify(records, null, 2);
}

export function datasheetToTs(sheet: Datasheet) {
  return ''
}