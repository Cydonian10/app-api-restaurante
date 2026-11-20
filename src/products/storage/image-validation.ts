import { BadRequestException } from '@nestjs/common';
import type { ImageFile } from './image-storage.js';

export type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

export function validateImage(file: UploadedImage): ImageFile {
  const data = file.buffer;
  const jpeg =
    data.length >= 3 &&
    data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png =
    data.length >= 8 &&
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    data.length >= 12 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP';
  if (
    file.size > 5 * 1024 * 1024 ||
    !(
      (jpeg && file.mimetype === 'image/jpeg') ||
      (png && file.mimetype === 'image/png') ||
      (webp && file.mimetype === 'image/webp')
    )
  ) {
    throw new BadRequestException(
      'La imagen debe ser JPG, PNG o WebP y no superar 5 MB',
    );
  }
  return { buffer: data, mimeType: file.mimetype as ImageFile['mimeType'] };
}
