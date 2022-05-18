import { Library } from 'ffi-napi'
import { promises as fs } from 'fs'
import * as path from 'path'

export interface DecompressEntry {
  file: string
  offset: number
  compressedSize: number
  uncompressedSize: number
}

const LIB_NAME = 'oo2core_8_win64.dll'
export function decompressLibrary(libDir: string = LIB_NAME): { OodleLZ_Decompress: Function } {
  if (libDir && !libDir.match(/\.dll$/i)) {
    libDir = path.join(libDir, LIB_NAME)
  }
  return Library(libDir, {
    OodleLZ_Decompress: [
      'void',
      [
        'char *',
        'int',
        'char *',
        'int',
        'int',
        'int',
        'int',
        'void *',
        'void *',
        'void *',
        'void *',
        'void *',
        'void *',
        'int',
      ],
    ],
  })
}

export async function decompress({
  zipFile,
  entries,
  handler,
  oodle
}: {
  zipFile: string
  entries: DecompressEntry[]
  handler: (entry: DecompressEntry, data: Buffer) => Promise<void>
  oodle: { OodleLZ_Decompress: Function}
}) {

  const fileHandle = await fs.open(zipFile, 'r')

  for (let entry of entries) {
    const localHeader = Buffer.alloc(4)
    await fileHandle.read({
      buffer: localHeader,
      position: entry.offset + 26,
    })
    const fileNameLength = localHeader.readUInt16LE(0)
    const extraFieldLength = localHeader.readUInt16LE(2)

    const compressedData = Buffer.alloc(entry.compressedSize)
    await fileHandle.read({
      buffer: compressedData,
      position: entry.offset + 30 + fileNameLength + extraFieldLength,
    })

    const uncompressedData = Buffer.alloc(entry.uncompressedSize)
    oodle.OodleLZ_Decompress(
      compressedData,
      entry.compressedSize,
      uncompressedData,
      entry.uncompressedSize,
      0,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      3,
    )

    await handler(entry, uncompressedData).catch((err) => {
      console.error(err)
    })
  }
  await fileHandle.close()
}
