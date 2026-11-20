import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryImageStorage } from './cloudinary-image.storage.js';
import { LocalImageStorage } from './local-image.storage.js';

afterEach(() => vi.restoreAllMocks());

describe('almacenamiento de imágenes', () => {
  it('guarda y elimina archivos locales', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'image-storage-'));
    try {
      const storage = new LocalImageStorage(
        directory,
        'http://localhost/uploads',
      );
      const file = {
        buffer: Buffer.from('contenido'),
        mimeType: 'image/png' as const,
      };
      const image = await storage.upload(file);
      expect(image.url).toBe(`http://localhost/uploads/${image.key}`);
      expect(await readFile(join(directory, image.key))).toEqual(file.buffer);
      await storage.delete(image.key);
      await expect(readFile(join(directory, image.key))).rejects.toThrow();
      await expect(storage.delete('../otro')).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('traduce la respuesta y los errores del SDK de Cloudinary', async () => {
    const upload = vi
      .spyOn(cloudinary.uploader, 'upload')
      .mockResolvedValueOnce({
        public_id: 'productos/abc',
        secure_url: 'https://example.com/img',
      } as never)
      .mockRejectedValueOnce(new Error('fallo remoto'));
    const storage = new CloudinaryImageStorage('cloud', 'key', 'secret');
    const file = {
      buffer: Buffer.from('imagen'),
      mimeType: 'image/png' as const,
    };
    await expect(storage.upload(file)).resolves.toEqual({
      provider: 'cloudinary',
      key: 'productos/abc',
      url: 'https://example.com/img',
    });
    expect(upload).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64,'),
      expect.objectContaining({ resource_type: 'image' }),
    );
    await expect(storage.upload(file)).rejects.toThrow('fallo remoto');
  });
});
