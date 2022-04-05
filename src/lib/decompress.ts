import { Library } from "ffi-napi";
import { promises as fs } from "fs";

let libInstance: any = null;

function getLib() {
  if (!libInstance) {
    libInstance = Library("oo2core_8_win64.dll", {
      OodleLZ_Decompress: [
        "void",
        [
          "char *",
          "int",
          "char *",
          "int",
          "int",
          "int",
          "int",
          "void *",
          "void *",
          "void *",
          "void *",
          "void *",
          "void *",
          "int",
        ],
      ],
    });
  }
  return libInstance;
}

export interface DecompressEntry {
  file: string;
  offset: number;
  compressedSize: number;
  uncompressedSize: number;
}

export async function decompress(
  zipFile: string,
  entries: DecompressEntry[],
  cb: (entry: DecompressEntry, data: Buffer) => Promise<void>
) {
  const lib = getLib();
  const fileHandle = await fs.open(zipFile, "r");

  for (let entry of entries) {
    const localHeader = Buffer.alloc(4);
    await fileHandle.read({
      buffer: localHeader,
      position: entry.offset + 26,
    });
    const fileNameLength = localHeader.readUInt16LE(0);
    const extraFieldLength = localHeader.readUInt16LE(2);

    const compressedData = Buffer.alloc(entry.compressedSize);
    await fileHandle.read({
      buffer: compressedData,
      position: entry.offset + 30 + fileNameLength + extraFieldLength,
    });

    const uncompressedData = Buffer.alloc(entry.uncompressedSize);
    lib.OodleLZ_Decompress(
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
      3
    );

    await cb(entry, uncompressedData).catch((err) => {
      console.error(err)
    });
  }
  await fileHandle.close();
}
