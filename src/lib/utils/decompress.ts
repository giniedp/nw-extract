import concat from 'concat-stream'
import { debug } from './debug'
import { promises as fs } from 'fs'
import { Entry, open, ZipFile } from 'yauzl'
import { logger } from './logger'

export async function decompress({
  zipFile,
  entries,
  handler,
  oodle,
}: {
  zipFile: string
  entries: Entry[]
  handler: (entry: Entry, data: Buffer) => Promise<void>
  oodle: { OodleLZ_Decompress: Function }
}) {
  debug(`begin ${zipFile}`)

  const zipEntries: Entry[] = []
  const oodleEntries: Entry[] = []

  for (const entry of entries) {
    switch (entry.compressionMethod) {
      case 0:
      case 8:
        zipEntries.push(entry)
        break
      case 15:
        oodleEntries.push(entry)
        break
      default:
        logger.error(`unsupported compression method ${entry.compressionMethod} ${entry.fileName}`)
        handler(entry, null)
        break
    }
  }

  await decompressOodle({
    zipFile,
    entries: oodleEntries,
    handler,
    oodle,
  })
  await decompressZip({
    zipFile,
    entries: zipEntries,
    handler,
  })
}

export async function decompressOodle({
  zipFile,
  entries,
  handler,
  oodle,
}: {
  zipFile: string
  entries: Entry[]
  handler: (entry: Entry, data: Buffer) => Promise<void>
  oodle: { OodleLZ_Decompress: Function }
}) {
  if (!entries.length) {
    return
  }
  const fileHandle = await fs.open(zipFile, 'r')
  const stat = await fileHandle.stat()
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    try {
      debug(`decompress [${i + 1}/${entries.length}] ${entry.fileName} `)
      const localHeader = Buffer.alloc(4)
      await fileHandle.read({
        buffer: localHeader,
        position: entry.relativeOffsetOfLocalHeader + 26,
      })
      const fileNameLength = localHeader.readUInt16LE(0)
      const extraFieldLength = localHeader.readUInt16LE(2)

      const offset = entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength
      const compressedData = Buffer.alloc(entry.compressedSize)
      debug('  %O', {
        offset: offset,
        size: entry.compressedSize,
        end: offset + entry.compressedSize,
        limit: stat.size,
      })
      await fileHandle.read({
        position: offset,
        buffer: compressedData,
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

      await handler(entry, uncompressedData).catch((err) => logger.error(err))
    } catch (err) {
      logger.error(err)
    }
  }
  await fileHandle.close()
  debug(`end ${zipFile}`)
}

export async function decompressZip({
  zipFile,
  entries,
  handler,
}: {
  zipFile: string
  entries: Entry[]
  handler: (entry: Entry, data: Buffer) => Promise<void>
}) {
  if (!entries?.length) {
    return
  }
  return new Promise<void>((resolve, reject) => {
    open(zipFile, { lazyEntries: true, autoClose: true }, async (err, zip) => {
      if (err) {
        reject(err)
        return
      }

      zip.once('end', () => {
        resolve()
        debug(`end ${zipFile}`)
      })
      zip.on('entry', async (entry: Entry) => {
        if (entries.find((it) => it.fileName === entry.fileName)) {
          try {
            const buffer = await handleDeflate(entry, zip)
            await handler(entry, buffer)
          } catch (err) {
            logger.error(err)
          }
        }
        zip.readEntry()
      })
      zip.readEntry()
    })
  })
}

function handleDeflate(entry: Entry, zip: ZipFile) {
  return new Promise<Buffer>((resolve, reject) => {
    zip.openReadStream(entry, (err, stream) => {
      if (err) {
        reject(err)
        return
      }
      stream.pipe(concat(resolve))
    })
  })
}
