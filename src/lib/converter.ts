import * as path from 'path'
import { isDatasheet, isIcon, isImage, isImageFile, isLocale, isScript, isTexture, isXML } from './listFiles'
import { DecompressEntry } from './decompress'
import { Entry } from 'yauzl'
import { convertDatasheet } from './convertDatasheets'
import { parseDatasheet } from './readDatasheet'
import { convertLocale } from './convertLocale'
import { convertImage } from './convertImages'
import type { Converter, ConverterFactory } from './extract'

export type AssetType = '*' | 'datasheet' | 'locale' | 'texture' | 'icon' | 'image' | 'script' | 'xml'
export type AssetFormat = 'csv' | 'json' | 'xml' | 'png' | 'jpg'
export type AssetFilter = `${AssetType}:${AssetFormat}`

interface AssetConversion {
  type: AssetType
  target: AssetFormat
}

function parseFilter(filter: Array<AssetFilter>): Array<AssetConversion> {
  return (filter || [])
    .map((it) => {
      const split = it.split(':')
      return {
        type: split[0] as AssetType,
        target: split[1] as AssetFormat,
      }
    })
    .filter((it) => it.type)
}

export function createFilter(filterInput: AssetFilter[]) {
  const conversion = parseFilter(filterInput)
  const filter = conversion.map((it) => it.type)
  return (entry: Entry) => {
    if (!filter?.length || filter.includes('*')) {
      return true
    }
    if (filter.includes('locale') && isLocale(entry.fileName)) {
      return true
    }
    if (filter.includes('datasheet') && isDatasheet(entry.fileName)) {
      return true
    }
    if (filter.includes('texture') && isTexture(entry.fileName)) {
      return true
    }
    if (filter.includes('icon') && isIcon(entry.fileName)) {
      return true
    }
    if (filter.includes('image') && isImage(entry.fileName)) {
      return true
    }
    if (filter.includes('script') && isScript(entry.fileName)) {
      return true
    }
    if (filter.includes('xml') && isXML(entry.fileName)) {
      return true
    }
    return false
  }
}

export function createConverter(filterInput: AssetFilter[]): ConverterFactory {
  const conversion = parseFilter(filterInput)
  return (entry: DecompressEntry, data: Buffer): Converter => {
    if (isDatasheet(entry.file)) {
      const format = conversion.find((it) => it.type === 'datasheet')?.target
      if (format === 'json' || format === 'csv') {
        return {
          format: format,
          data: async () => Buffer.from(convertDatasheet(await parseDatasheet(data), format)),
        }
      }
    }
    if (isLocale(entry.file)) {
      const format = conversion.find((it) => it.type === 'locale')?.target
      if (format === 'json' || format === 'csv') {
        return {
          format: format,
          data: async () => Buffer.from(await convertLocale(data, format), 'utf-8'),
        }
      }
    }
    if (isImageFile(entry.file) && path.extname(entry.file) === '.dds') {
      const format = conversion.find((it) => {
        return (
          (isIcon(entry.file) && it.type === 'icon') ||
          (isTexture(entry.file) && it.type === 'texture') ||
          (isImage(entry.file) && it.type === 'image')
        )
      })?.target
      if (format === 'png' || format === 'jpg') {
        return {
          format: format,
          data: async () =>
          Buffer.from(
            await convertImage(data, format, {
              texconv: path.join(process.cwd(), 'texconv.exe'),
              tmpdir: path.join(process.cwd(), 'tmp'),
            }),
          )
        }
      }
    }
    return {
      data: data,
    }
  }
}