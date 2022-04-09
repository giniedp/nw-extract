import { promises as fs } from 'fs'
import * as path from 'path'
import { isDatasheet, isIcon, isImage, isImageFile, isLocale, isScript, isTexture, listFiles } from './listFiles'
import { decompress, DecompressEntry } from './decompress'
import { listPakFiles } from './globFiles'
import { Entry } from 'yauzl'
import { convertDatasheet } from './convertDatasheets'
import { parseDatasheet } from './readDatasheet'
import { convertLocale } from './convertLocale'
import { convertImage } from './convertImages'
import { pathIsFile } from './copy'

export type AssetType = 'datasheet' | 'locale' | 'texture' | 'icon' | 'image' | 'script'
export type AssetFormat = 'csv' | 'json' | 'xml' | 'png' | 'jpg'
export type AssetFilter = `${AssetType}:${AssetFormat}`

export interface ExtractOptions {
  update: boolean
  inputDir: string
  outputDir: string
  filter: AssetFilter[]
  onProgress?: (data: ExtractProgress) => void
}

export interface ExtractProgress {
  mainTotal: number
  mainDone: number
  mainInfo: string
  subTotal: number
  subDone: number
  subInfo: string
}

interface AssetConversion {
  type: AssetType
  target: AssetFormat
}

export async function extract({ inputDir, outputDir, filter, onProgress, update }: ExtractOptions) {
  const stat = await fs.stat(inputDir)
  const conversion = parseFilter(filter)
  const glob = path.join(inputDir, '**', '*.pak')
  // const pakFiles = await globFiles(glob)
  const pakFiles = await listPakFiles(inputDir)
  const entryFilter = createFilter(conversion)
  const entryConverter = createConverter(conversion)
  const groups = pakFiles.map((file) => {
    return {
      file: file,
      entries: () => listFiles(file, entryFilter),
    }
  })

  const progress: ExtractProgress = {
    mainTotal: groups.length,
    mainDone: 0,
    mainInfo: '',
    subTotal: 0,
    subDone: 0,
    subInfo: '',
  }
  for (const group of groups) {
    progress.mainInfo = group.file
    progress.mainDone += 1
    progress.subTotal = 1
    progress.subDone = 0
    progress.subInfo = 'resolve entries'
    onProgress?.(progress)

    const entries = await group.entries()
    progress.subTotal = entries.length
    progress.subDone = 0
    progress.subInfo = ''
    onProgress?.(progress)

    await decompress(group.file, entries, async (entry, data) => {
      progress.subInfo = entry.file
      progress.subDone += 1
      onProgress?.(progress)

      const converter = entryConverter(entry, data)
      const ext = path.extname(entry.file)
      const filePath = path.join(outputDir, entry.file)

      const outDir = path.dirname(filePath)
      const outFile = path.basename(filePath, ext) + (converter.format ? `.${converter.format}` : ext)
      const outPath = path.join(outDir, outFile)
      const outExists = await pathIsFile(outPath)
      if (update || !outExists) {
        const outData = await converter.convert()
        await fs.mkdir(outDir, { recursive: true })
        await fs.writeFile(outPath, outData)
      }
    })
  }
}

function parseFilter(filter: ExtractOptions['filter']): Array<AssetConversion> {
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

function createFilter(conversion: AssetConversion[]) {
  const filter = conversion.map((it) => it.type)
  return (entry: Entry) => {
    if (!filter?.length) {
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
    return false
  }
}

function createConverter(conversion: AssetConversion[]) {
  return (entry: DecompressEntry, data: Buffer) => {
    if (isDatasheet(entry.file)) {
      const format = conversion.find((it) => it.type === 'datasheet')?.target
      if (format === 'json' || format === 'csv') {
        return {
          format: format,
          data: data,
          convert: async () => Buffer.from(convertDatasheet(await parseDatasheet(data), format)),
        }
      }
    }
    if (isLocale(entry.file)) {
      const format = conversion.find((it) => it.type === 'locale')?.target
      if (format === 'json' || format === 'csv') {
        return {
          format: format,
          data: data,
          convert: async () => Buffer.from(await convertLocale(data, format), 'utf-8'),
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
          data: data,
          convert: async () =>
            Buffer.from(
              await convertImage(data, format, {
                texconv: path.join(process.cwd(), 'texconv.exe'),
                tmpdir: path.join(process.cwd(), 'tmp'),
              }),
            ),
        }
      }
    }
    return {
      format: null,
      data: data,
      convert: () => Promise.resolve(data),
    }
  }
}
