import { copyFile, glob, logger, mkdir, replaceExtname } from '../../utils'
import * as fs from 'fs'
import { sortBy } from 'lodash'
import * as path from 'path'
import { texconv, TexconvArgs } from '../../tools/texconv'

export interface DdsToPngOptions {
  isNormal: boolean
  file: string
  format: string
  outDir: string
  size?: number
}

export async function convertDdsFile({ isNormal, file, format, outDir, size }: DdsToPngOptions) {
  const pngFile = replaceExtname(file, `.${format}`)
  const options: TexconvArgs = {
    input: file,
    overwrite: true,
    fileType: format,
    output: outDir,
    width: size,
    height: size,
  }

  if (fs.existsSync(pngFile)) {
    fs.unlinkSync(pngFile)
  }

  if (isNormal) {
    return await texconv({
      ...options,
      format: 'rgba',
      reconstructZ: true, // normal map has only RG channels. Z must be reconstructed
      invertY: true, // invert Y to fix bump direction
    }).catch((err) => {
      if (!fs.existsSync(pngFile)) {
        logger.warn('texconv failed', file, err)
      }
    })
  }
  await texconv({
    ...options,
  })
    .catch((err) => {
      logger.warn('retry with rgba format', file, err)
      return texconv({
        ...options,
        format: 'rgba',
      })
    })
    .catch((err) => {
      if (!fs.existsSync(pngFile)) {
        logger.warn('texconv failed', file, err)
      }
    })
}

export async function copyDdsFile({ input, output }: { input: string; output: string }): Promise<string[]> {
  
  const mips = await glob(input + '.*', {
    caseSensitiveMatch: false,
  })
  // some dds images are split into multiple files and have the ending
  // - .dds.1
  // - .dds.2
  // ... etc.
  // Those are actually mipmaps that can be stitched to the given input file
  const mipFiles = mips.filter((it) => !!it.match(/\d$/))

  // Some files have additional mipmaps
  // - .dds.1a
  // - .dds.2a
  // They can be stitched to the same header file, but as a separate texture
  const mipAlpha = mips.filter((it) => !!it.match(/\da$/))

  await mkdir(path.dirname(output), { recursive: true })

  if (!mipFiles.length && !mipAlpha.length) {
    // file does not need processing
    await copyFile(input, output, {
      createDir: true
    })
    return [output]
  }

  if (mipFiles.length) {
    await joinMips(input, mipFiles, output)
  }

  if (mipAlpha.length) {
    let inputA = input
    if (fs.existsSync(input + '.a')) {
      inputA = input + '.a'
    }
    let outputA = replaceExtname(output, '.a' + path.extname(output))
    await joinMips(inputA, mipAlpha, outputA)
    return [output, outputA]
  }
  return [output]
}

async function joinMips(input: string, mips: string[], target: string) {
  const files = sortBy(mips, (it) => path.extname(it).match(/\d+/)[0]).reverse()
  const first = await fs.promises.readFile(input)
  const second = await fs.promises.readFile(files[0])

  // hack into DDS header. Set only one mipmap and cutoff header
  first[0x1c] = 0 // set mip count
  const header = first.slice(0, 0x94)
  return fs.promises.writeFile(target, Buffer.concat([header, second]))
}
