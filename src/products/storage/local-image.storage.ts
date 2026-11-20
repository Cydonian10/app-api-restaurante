import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { ImageFile, ImageStorage, StoredImage } from './image-storage.js';

export class LocalImageStorage implements ImageStorage {
  constructor(
    private readonly directory: string,
    private readonly baseUrl: string,
  ) {}

  async upload(file: ImageFile): Promise<StoredImage> {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const key = `${randomUUID()}.${extensions[file.mimeType]}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, key), file.buffer, { flag: 'wx' });
    return {
      provider: 'local',
      key,
      url: `${this.baseUrl.replace(/\/$/, '')}/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    if (basename(key) !== key || !key)
      throw new Error('Clave de imagen inválida');
    await unlink(join(this.directory, key));
  }
}
