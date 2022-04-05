import { program } from 'commander'
import * as path from 'path'
import { extract } from "./lib";
import { MultiBar, Presets } from 'cli-progress'

interface Options {
  update: boolean
  input: string,
  output: string,
  filter: string,
  convert: string
}

program
  .requiredOption('-i,--input <path>', 'New World game folder')
  .option('-u,--update', 'force update', false)
  .option('-o,--output <path>', 'destination folder', './nw-extract-output')
  .option('-f,--filter <type>', 'type of assets to extract')
  .option('-c,--convert <format>', 'preferred output format')
  .action(async () => {
    const opts: Options = program.opts()
    const bar = new MultiBar({
      clearOnComplete: false,
      hideCursor: true,
    }, Presets.shades_grey)
    const b1 = bar.create(0, 0)
    const b2 = bar.create(0, 0)

    await extract({
      update: !!opts.update,
      inputDir: opts.input,
      outputDir: path.join(process.cwd(), opts.output),
      filter: opts.filter?.split(/[,.| ]/) as any,
      onProgress: (p) => {
        b1.setTotal(p.mainTotal)
        b1.update(p.mainDone, { filename: p.mainInfo })

        b2.setTotal(p.subTotal || 1)
        b2.update(p.subDone, { filename: p.subInfo })
      }
    })
    bar.stop()
  }).parse(process.argv)
