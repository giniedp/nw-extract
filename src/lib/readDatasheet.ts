import { promises as fs } from "fs";

const OFFSET_NUM_COLUMNS = 0x44;
const OFFSET_NUM_ROWS = 0x48;
const OFFSET_HEADER = 0x5c;
const OFFSET_HEADER_SIZE_IN_BYTES = 12;
const OFFSET_CELL_SIZE_IN_BYTES = 8;

export interface HeaderCell {
  text: string
  type: number
}

export type DatasheetRow = Array<string | number | boolean>

export interface Datasheet {
  header: HeaderCell[]
  rows: DatasheetRow[]
}

export async function parseDatasheet(data: Buffer): Promise<Datasheet> {
  const columnCount = data.readInt32LE(OFFSET_NUM_COLUMNS);
  const rowCount = data.readInt32LE(OFFSET_NUM_ROWS);

  const cellsOffset = OFFSET_HEADER + columnCount * OFFSET_HEADER_SIZE_IN_BYTES;
  const rowSizeInBytes = OFFSET_CELL_SIZE_IN_BYTES * columnCount;
  const stringsOffset =
    cellsOffset + rowCount * columnCount * OFFSET_CELL_SIZE_IN_BYTES;

  const header: HeaderCell[] = [];
  for (let i = 0; i < columnCount; i++) {
    const offset = OFFSET_HEADER + i * OFFSET_HEADER_SIZE_IN_BYTES;
    const meta = readCellMeta(data, offset);
    const text = readString(data, stringsOffset + meta.data.readInt32LE());
    const type = data.readInt32LE(offset + 8);
    header.push({ text, type });
  }

  const rows: DatasheetRow[] = [];
  for (let i = 0; i < rowCount; i++) {
    const cells: DatasheetRow = [];
    for (let j = 0; j < columnCount; j++) {
      const cellOffset = cellsOffset + i * rowSizeInBytes + j * OFFSET_CELL_SIZE_IN_BYTES;
      const type = header[j].type;
      const meta = readCellMeta(data, cellOffset);
      const value = readCell(data, stringsOffset, type, meta.data)
      cells.push(value);
    }
    rows.push(cells);
  }

  return { header, rows }
}

function readString(data: Buffer, offset: number) {
  let length = -1;
  let next: number;
  do {
    length += 1  
    next = data.readInt8(offset + length);
  } while (next !== 0 && ((offset + length) < data.byteLength));
  if (length <= 0) {
    return null;
  }
  return data.slice(offset, offset + length).toString();
}

function readCell(data: Buffer, offset: number, type: number, value: Buffer) {
  switch (type) {
    case 1:
      return readString(data, offset + value.readInt32LE());
    case 2:
      return value.readFloatLE();
    case 3:
      return !!value.readInt32LE();
  }
}

function readCellMeta(data: Buffer, offset: number) {
  return {
    hash: data.readInt32LE(offset),
    data: data.slice(offset + 4, offset + 8)
  };
}
