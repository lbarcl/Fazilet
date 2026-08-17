import type { ReelPhoto } from './photos';

export type PhotoMetadata = {
  displayName: string;
  takenAt?: Date;
  dateLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit'
});

export function fallbackMetadata(photo: ReelPhoto): PhotoMetadata {
  return {
    displayName: photo.name,
    dateLabel: 'No embedded date'
  };
}

export function formatPhotoDate(date: Date) {
  return `${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
}

export async function readPhotoMetadata(photo: ReelPhoto): Promise<PhotoMetadata> {
  const metadata = fallbackMetadata(photo);

  if (!/\.(jpe?g)$/i.test(photo.fileName)) {
    return metadata;
  }

  try {
    const response = await fetch(photo.src);
    const buffer = await response.arrayBuffer();
    const takenAt = readJpegExifDate(buffer);

    if (!takenAt) return metadata;

    return {
      displayName: photo.name,
      takenAt,
      dateLabel: formatPhotoDate(takenAt)
    };
  } catch {
    return metadata;
  }
}

function readJpegExifDate(buffer: ArrayBuffer) {
  const view = new DataView(buffer);

  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return undefined;
  }

  let offset = 2;

  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return undefined;

    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);

    if (marker === 0xe1 && hasExifHeader(view, offset + 4)) {
      return readTiffExifDate(view, offset + 10, size - 8);
    }

    offset += 2 + size;
  }

  return undefined;
}

function hasExifHeader(view: DataView, offset: number) {
  return (
    view.getUint8(offset) === 0x45 &&
    view.getUint8(offset + 1) === 0x78 &&
    view.getUint8(offset + 2) === 0x69 &&
    view.getUint8(offset + 3) === 0x66 &&
    view.getUint8(offset + 4) === 0x00 &&
    view.getUint8(offset + 5) === 0x00
  );
}

function readTiffExifDate(view: DataView, tiffStart: number, length: number) {
  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const tiffEnd = tiffStart + length;

  return readExifDateFromIfd(view, tiffStart, tiffStart + firstIfdOffset, tiffEnd, littleEndian);
}

function readExifDateFromIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  tiffEnd: number,
  littleEndian: boolean
) {
  if (ifdOffset + 2 > tiffEnd) return undefined;

  const entries = view.getUint16(ifdOffset, littleEndian);
  const dateTags = new Map<number, string>();
  let exifSubIfdOffset: number | undefined;

  for (let index = 0; index < entries; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > tiffEnd) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const valueOffset = view.getUint32(entryOffset + 8, littleEndian);

    if (tag === 0x8769) {
      exifSubIfdOffset = tiffStart + valueOffset;
      continue;
    }

    if (tag === 0x0132) {
      const value = readAsciiValue(view, tiffStart, entryOffset, tiffEnd, littleEndian);
      if (value) dateTags.set(tag, value);
    }
  }

  if (exifSubIfdOffset) {
    const subIfdDates = readExifDateTags(view, tiffStart, exifSubIfdOffset, tiffEnd, littleEndian);
    for (const [tag, value] of subIfdDates) {
      dateTags.set(tag, value);
    }
  }

  return parseExifDate(dateTags.get(0x9003) ?? dateTags.get(0x9004) ?? dateTags.get(0x0132));
}

function readExifDateTags(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  tiffEnd: number,
  littleEndian: boolean
) {
  const tags = new Map<number, string>();
  if (ifdOffset + 2 > tiffEnd) return tags;

  const entries = view.getUint16(ifdOffset, littleEndian);

  for (let index = 0; index < entries; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > tiffEnd) break;

    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 0x9003 || tag === 0x9004) {
      const value = readAsciiValue(view, tiffStart, entryOffset, tiffEnd, littleEndian);
      if (value) tags.set(tag, value);
    }
  }

  return tags;
}

function readAsciiValue(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  tiffEnd: number,
  littleEndian: boolean
) {
  const type = view.getUint16(entryOffset + 2, littleEndian);
  const count = view.getUint32(entryOffset + 4, littleEndian);

  if (type !== 2 || count === 0) return undefined;

  const valueOffset = count <= 4 ? entryOffset + 8 : tiffStart + view.getUint32(entryOffset + 8, littleEndian);
  if (valueOffset + count > tiffEnd) return undefined;

  let value = '';
  for (let index = 0; index < count; index += 1) {
    const char = view.getUint8(valueOffset + index);
    if (char === 0) break;
    value += String.fromCharCode(char);
  }

  return value.trim();
}

function parseExifDate(value?: string) {
  if (!value) return undefined;

  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}
