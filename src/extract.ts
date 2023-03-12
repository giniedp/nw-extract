#!/usr/bin/env node

import { program } from 'commander'
import * as path from 'path'
import { extract } from './lib'
import { MultiBar, Presets } from 'cli-progress'

function collect(value: string, previous: string[]) {
  return previous.concat(value.split(','))
}

interface Options {
  update: boolean
  output: string
  filter: string[]
  lib: string
}

program
  .argument('<input-dir>', 'New World game folder')
  .option('-o,--output <path>', 'Output folder', './nw-extract-out')
  .option('-f,--filter <filter>', 'Filter glob pattern', collect, [])
  .option('--lib <path>', 'Directory where oo2core_8_win64.dll is located')
  .addHelpText(
    'afterAll',
    `
Example:
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\"  
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\" -f **/*.datasheet
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\" -f **/*.datasheet,**/*.loc.xml
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\" -f **/*.datasheet -f **/*.loc.xml
`,
  )
  .action(async (inputDir) => {
    const opts: Options = program.opts()
    const bar = new MultiBar(
      {
        stopOnComplete: true,
        clearOnComplete: false,
        hideCursor: true,
        format: '{bar} {percentage}% | {value}/{total} | {filename}',
      },
      Presets.shades_grey,
    )
    const b1 = bar.create(0, 0)
    const b2 = bar.create(0, 0)
    const filter: string[] = opts.filter || []

    await extract({
      inputDir: inputDir,
      outputDir: path.join(process.cwd(), opts.output),
      libDir: opts.lib,
      filter: filter,
      onProgress: (p) => {
        b1.setTotal(p.mainTotal)
        b1.update(p.mainDone, { filename: p.mainInfo })
        b2.setTotal(p.subTotal || 1)
        b2.update(p.subDone, { filename: p.subInfo })
      },
    })
    bar.stop()
  })
  .parse(process.argv)
