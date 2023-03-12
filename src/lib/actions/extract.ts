import * as fs from 'fs'
import * as path from 'path'
import { listFilesInZip, listPakFiles } from '../listFiles'
import { decompress } from '../utils/decompress'
import { oodleLibrary } from '../utils/oodle'
import { debug } from '../utils/debug'
import { createFilter } from '../utils/create-filter'

export type FilterFn = (entry: string) => boolean

export interface ExtractOptions {
  inputDir: string
  outputDir: string
  libDir?: string
  filter?: string[]
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

export async function extract({ inputDir, outputDir, libDir, filter, onProgress }: ExtractOptions) {
  debug(`extract ${inputDir} -> ${outputDir}`)
  const pakFiles = await listPakFiles(inputDir)
  const fileFilter = filter?.length ? createFilter(filter) : () => true
  const groups = pakFiles.map((file) => {
    return {
      file: file,
      entries: () => listFilesInZip(file, fileFilter),
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
        await fs.promises.mkdir(outDir, { recursive: true })
        await fs.promises.writeFile(outPath, data)
      },
    })
  }
}
