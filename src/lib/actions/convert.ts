import * as path from 'path'
import { glob, globMatch } from '../utils/file-utils'
import { runTasks } from '../worker'
import { ConvertFileOptions } from '../worker/convert-file'
import { cpus } from 'os'
export interface ConversionRequest {
  pattern: string[]
  format: string
}

export interface ConvertOptions {
  bin?: string
  update?: boolean
  inputDir: string
  outputDir?: string
  conversions?: ConversionRequest[]
  threads?: number
}

export async function convert({ inputDir, outputDir, conversions, update, threads, bin }: ConvertOptions) {
  outputDir = outputDir || inputDir
  const files = await glob(path.join(inputDir, '**'))
  const tasks = conversions
    .map(({ pattern, format }) => {
      return globMatch(files, pattern).map((file): ConvertFileOptions => {
        return {
          bin,
          file,
          format,
          outDir: path.join(outputDir, path.dirname(path.relative(inputDir, file))),
          update,
        }
      })
    })
    .flat()
  await runTasks({
    taskName: 'convertFile',
    tasks: tasks,
    threads: threads ?? cpus().length,
  })
}
