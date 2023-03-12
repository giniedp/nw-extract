import * as fs from 'fs'
import * as path from 'path'
import { listFiles, listFilesInZip, listPakFiles } from './listFiles'
import { logger } from './utils'
import { oodleLibrary } from './utils/oodle'
import { decompress } from './utils/decompress'

export type FilterFn = (entry: string) => boolean
export type ConverterFactory = (file: string, data: Buffer) => Converter
export type Converter = { format?: string; data: Buffer | ConverterFn }
export type ConverterFn = () => Promise<Buffer>

export interface ExtractOptions {
  update?: boolean
  inputDir: string
  outputDir: string
  libDir?: string
  filter?: FilterFn
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
  onProgress,
  update,
}: ExtractOptions) {
  logger.activity('extract', ` ${inputDir} -> ${outputDir}`)
  const pakFiles = await listPakFiles(inputDir)
  const groups = pakFiles.map((file) => {
    return {
      file: file,
      entries: () => listFilesInZip(file, filter || (() => true)),
    }
  })
  const oodle = oodleLibrary(libDir)
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

    await decompress({
      oodle: oodle,
      zipFile: group.file,
      entries: entries,
      handler: async (entry, data) => {
        progress.subInfo = entry.fileName
        progress.subDone += 1
        onProgress?.(progress)

        const filePath = path.join(outputDir, entry.fileName)
        const outDir = path.dirname(filePath)
        const outFile = path.basename(filePath)
        const outPath = path.join(outDir, outFile)
        const outExists = fs.existsSync(outPath)
        if (update || !outExists) {
          await fs.promises.mkdir(outDir, { recursive: true })
          await fs.promises.writeFile(outPath, data)
        }
      },
    })
  }
}

export interface ConvertOptions {
  update?: boolean
  inputDir: string
  outputDir: string
  filter?: FilterFn
  converterFactory?: ConverterFactory
  onProgress?: (data: ExtractProgress) => void
}

export async function convert({ inputDir, outputDir, filter, converterFactory, onProgress, update }: ConvertOptions) {
  logger.activity(`convert ${inputDir} -> ${outputDir}`)
  
  const files = await listFiles(inputDir)
  
  const progress: ExtractProgress = {
    mainTotal: files.length,
    mainDone: 0,
    mainInfo: '',
    subTotal: 0,
    subDone: 0,
    subInfo: '',
  }
  converterFactory =
    converterFactory ||
    ((file, buffer) => ({
      data: buffer,
    }))

  for (const file of files) {
    progress.mainInfo = file
    progress.mainDone += 1
    progress.subTotal = 1
    progress.subDone = 0
    progress.subInfo = 'resolve entries'
    onProgress?.(progress)

    const data = await fs.promises.readFile(file)
    const converter = converterFactory(file, data)
    const ext = path.extname(file)
    const filePath = path.join(outputDir, path.relative(inputDir, file))

    const outDir = path.dirname(filePath)
    const outFile = path.basename(filePath, ext) + (converter.format ? `.${converter.format}` : ext)
    const outPath = path.join(outDir, outFile)
    const outExists = fs.existsSync(outPath)
    if (update || !outExists) {
      const outData = typeof converter.data === 'function' ? await converter.data() : converter.data
      await fs.promises.mkdir(outDir, { recursive: true })
      await fs.promises.writeFile(outPath, outData)
    }
  }
}
