#!/usr/bin/env node

import { program } from 'commander'
import * as path from 'path'
import { convert } from './lib/actions/convert'
import { logger } from './lib/utils'

function collect(value: string, previous: string[]) {
  return previous.concat(value.split(','))
}
interface Options {
  update: boolean
  output: string
  convert: string[]
  bin: string
  threads: number
}

program
  .argument('<input-dir>', 'Location of extracted New World folder')
  .option('-o,--output <path>', 'Output forlder for converted files')
  .option('-u,--update', 'Overrides previously converted files', false)
  .option('-b,--bin <path>', 'Binaries directory')
  .option('-t,--threads <threads>', 'Number of threads')
  .option('-c,--convert <convert>', 'Conversion directives', collect, [])
  .addHelpText(
    'afterAll',
    `
Example:
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "json:**/*.datasheet"
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "json:**/*.loc.xml"
  nw-convert ./nw-extract-out -o ./nw-convert-out -c "png:**/*.dds"
`,
  )
  .action(async (inputDir) => {
    const opts: Options = program.opts()
    logger.verbose(true)
    logger.debug('convert', inputDir, opts)
    await convert({
      bin: opts.bin,
      threads: opts.threads,
      update: !!opts.update,
      inputDir: inputDir,
      outputDir: path.join(process.cwd(), opts.output || inputDir),
      conversions: opts.convert.map((it) => {
        const [format, pattern] = it.split(':')
        return {
          format,
          pattern: pattern.split('+'),
        }
      }),
    })
  })
  .parse(process.argv)
