import { promises as fs } from 'fs'
import * as path from 'path'
import { listFiles } from './listFiles'
import { decompress, DecompressEntry, decompressLibrary } from './decompress'
import { listPakFiles } from './globFiles'
import { Entry } from 'yauzl'
import { pathIsFile } from './copy'

export type FilterFn = (entry: Entry) => boolean
export type ConverterFactory = (entry: DecompressEntry, data: Buffer) => Converter
export type Converter = { format?: string; data: Buffer | ConverterFn }
export type ConverterFn = () => Promise<Buffer>

export interface ExtractOptions {
  update?: boolean
  inputDir: string
  outputDir: string
  libDir?: string
  filter?: FilterFn
  converterFactory?: ConverterFactory
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

export async function extract({
  inputDir,
  outputDir,
  libDir,
  filter,
  converterFactory,
  onProgress,
  update,
}: ExtractOptions) {
  const pakFiles = await listPakFiles(inputDir)
  const groups = pakFiles.map((file) => {
    return {
      file: file,
      entries: () => listFiles(file, filter || (() => true)),
    }
  })
  const oodle = decompressLibrary(libDir)
  const progress: ExtractProgress = {
    mainTotal: groups.length,
    mainDone: 0,
    mainInfo: '',
    subTotal: 0,
    subDone: 0,
    subInfo: '',
  }
  converterFactory =
    converterFactory ||
    ((entry, buffer) => ({
      data: buffer,
    }))

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

    await decompress({
      oodle: oodle,
      zipFile: group.file,
      entries: entries,
      handler: async (entry, data) => {
        progress.subInfo = entry.file
        progress.subDone += 1
        onProgress?.(progress)

        const converter = converterFactory(entry, data)
        const ext = path.extname(entry.file)
        const filePath = path.join(outputDir, entry.file)

        const outDir = path.dirname(filePath)
        const outFile = path.basename(filePath, ext) + (converter.format ? `.${converter.format}` : ext)
        const outPath = path.join(outDir, outFile)
        const outExists = await pathIsFile(outPath)
        if (update || !outExists) {
          const outData = typeof converter.data === 'function' ? await converter.data() : converter.data
          await fs.mkdir(outDir, { recursive: true })
          await fs.writeFile(outPath, outData)
        }
      },
    })
  }
}
