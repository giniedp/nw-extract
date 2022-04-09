import { promises as fs } from "fs";
import * as path from "path";


import { Datasheet, parseDatasheet } from "./readDatasheet";
import { unparse } from "papaparse";
import { globFiles } from "./globFiles";

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
