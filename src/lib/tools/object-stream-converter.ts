import * as path from 'path'
import { logger, spawn } from '../utils'
export interface ObjectStreamConverterArgs {
  bin?: string
  exe?: string
  input: string
  output: string
  threads?: number
  pretty?: boolean
}

export async function objectStreamConverter({ bin, exe, input, output, threads, pretty }: ObjectStreamConverterArgs) {
  // https://github.com/new-world-tools/new-world-tools
  exe = exe || 'object-stream-converter.exe'
  const tool = bin ? path.join(bin, exe) : exe
  const args = [`-input`, input, `-output`, output]
  if (threads) {
    args.push(`-threads`, String(threads))
  }
  if (pretty) {
    args.push(`-with-indents`)
  }
  await spawn(tool, args, {
    stdio: logger.isVerbose ? 'inherit' : null,
  })
}
