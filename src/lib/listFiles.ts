import { open, Entry } from "yauzl";
import { DecompressEntry } from "./decompress";

export function isDatasheet(file: string) {
  return file.endsWith('.datasheet')
}

export function isXML(file: string) {
  return file.endsWith('.xml')
}

export function isLocale(file: string) {
  return file.endsWith('.loc.xml')
}

export function isImageFile(file: string) {
  return file.endsWith(".dds") || file.endsWith(".png") // || file.includes(".dds.")
}

export function isImage(file: string) {
  return isImageFile(file) && /images/gi.test(file)
}

export function isTexture(file: string) {
  return isImageFile(file) && /texture/gi.test(file)
}

export function isIcon(file: string) {
  return isImageFile(file) && /icon/gi.test(file)
}

export async function listFiles(file: string, predicate: (entry: Entry) => boolean) {
  return new Promise<DecompressEntry[]>((resolve) => {
    const entries: DecompressEntry[] = [];
    open(file, { lazyEntries: true }, (err, zipFile) => {
      zipFile.readEntry();
      zipFile.on("entry", (entry: Entry) => {
        if (predicate(entry)) {
          entries.push({
            offset: entry.relativeOffsetOfLocalHeader,
            file: entry.fileName,
            compressedSize: entry.compressedSize,
            uncompressedSize: entry.uncompressedSize,
          });
        }
        zipFile.readEntry();
      });
      zipFile.once("end", () => {
        resolve(entries)
      });
    });
  });
}
