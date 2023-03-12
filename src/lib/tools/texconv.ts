import { logger, spawn } from "../utils"

export interface TexconvArgs {
  exe?: string
  input: string
  // Output directory.
  output?: string
  // A file type for the output texture
  fileType: string
  //
  format?: string
  // overwrite existing output file
  overwrite: boolean
  width?: number
  height?: number
  invertY?: boolean
  reconstructZ?: boolean
}

export async function texconv({
  exe,
  input,
  output,
  fileType,
  format,
  overwrite,
  width,
  height,
  invertY,
  reconstructZ,
}: TexconvArgs) {
  // https://github.com/Microsoft/DirectXTex/wiki/Texconv
  const tool = exe || 'texconv.exe'
  const args = []
  if (fileType) {
    args.push(`-ft`, fileType)
  }
  if (format) {
    args.push(`-f`, format)
  }
  if (overwrite) {
    args.push(`-y`)
  }
  if (output) {
    args.push(`-o`, output)
  }
  if (width) {
    args.push(`-w`, width)
  }
  if (height) {
    args.push(`-h`, height)
  }
  if (invertY) {
    args.push(`-inverty`, invertY)
  }
  if (reconstructZ) {
    args.push(`-reconstructz`, reconstructZ)
  }
  args.push('-nologo')
  args.push('-fl', '12.1')
  args.push(input)

  await spawn(tool, args, {
    stdio: logger.isVerbose ? 'inherit' : null,
  })
}
