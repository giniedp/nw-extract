#!/usr/bin/env node

import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import * as path from 'path'
import { AssetFilter, convert, createConverter, createFilter } from "./lib"
import { debug } from './lib/debug'

interface Options {
  update: boolean
  output: string
  filter: string
}

program
  .argument('<input-dir>', 'Input dir or file')
  .option('-o,--output <path>', 'Output folder')
  .option('-u,--update', 'Skips cache mechanisms for subsequential runs.', false)
  .option('-f,--filter <type>', 'Asset filter and conversion flags.')
  .addHelpText('afterAll', `
Example:
  nw-convert \"path/to/dir\" -f "datasheet:json"
`)
  .action(async (inputDir) => {
    const opts: Options = program.opts()
    const bar = new MultiBar({
      stopOnComplete: true,
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} {percentage}% | {value}/{total} | {filename}'
    }, Presets.shades_grey)
    const b1 = bar.create(0, 0)
    const filter = opts.filter?.split(/[,.| ]/) as AssetFilter[]

    await convert({
      update: !!opts.update,
      inputDir: inputDir,
      outputDir: path.join(process.cwd(), opts.output || inputDir),
      filter: createFilter(filter),
      converterFactory: createConverter(filter),
      onProgress: (p) => {
        if (!debug.enabled) {
          b1.setTotal(p.mainTotal)
          b1.update(p.mainDone, { filename: p.mainInfo })
        }
      }
    })
    bar.stop()
  }).parse(process.argv)
