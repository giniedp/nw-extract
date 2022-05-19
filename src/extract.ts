#!/usr/bin/env node

import { program } from 'commander'
import * as path from 'path'
import { AssetFilter, createConverter, createFilter, extract } from "./lib";
import { MultiBar, Presets } from 'cli-progress'

interface Options {
  update: boolean
  output: string
  filter: string
  lib: string
}

program
  .argument('<input-dir>', 'New World game folder')
  .option('-o,--output <path>', 'Output folder', './nw-extract-output')
  .option('-u,--update', 'Skips cache mechanisms for subsequential runs.', false)
  .option('-f,--filter <type>', 'Asset filter and conversion flags.')
  .option('--lib <path>', 'path to directory where oo2core_8_win64.dll is located')
  .addHelpText('afterAll', `
Example:
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\"  
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\" -f "datasheet:json,icon:png"
  nw-extract \"C:\\Program Files (x86)\\Steam\\steamapps\\common\\New World\" -f "datasheet:json,icon:png,image:png,locale"
`)
  .action(async (inputDir) => {
    const opts: Options = program.opts()
    const bar = new MultiBar({
      clearOnComplete: false,
      hideCursor: true,
    }, Presets.shades_grey)
    const b1 = bar.create(0, 0)
    const b2 = bar.create(0, 0)
    const filter = opts.filter?.split(/[,.| ]/) as AssetFilter[]

    await extract({
      update: !!opts.update,
      inputDir: inputDir,
      outputDir: path.join(process.cwd(), opts.output),
      libDir: opts.lib,
      filter: createFilter(filter),
      converterFactory: createConverter(filter),
      onProgress: (p) => {
        b1.setTotal(p.mainTotal)
        b1.update(p.mainDone, { filename: p.mainInfo })

        b2.setTotal(p.subTotal || 1)
        b2.update(p.subDone, { filename: p.subInfo })
      }
    })
    bar.stop()
  }).parse(process.argv)
