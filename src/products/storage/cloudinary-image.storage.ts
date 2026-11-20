import { v2 as cloudinary } from 'cloudinary';
import type { ImageFile, ImageStorage, StoredImage } from './image-storage.js';

export class CloudinaryImageStorage implements ImageStorage {
  constructor(
    private readonly cloudName: string,
    private readonly apiKey: string,
    private readonly apiSecret: string,
  ) {}

  private configure(): void {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET',
      );
    }
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  async upload(file: ImageFile): Promise<StoredImage> {
    this.configure();
    const result = await cloudinary.uploader.upload(
      `data:${file.mimeType};base64,${file.buffer.toString('base64')}`,
      { folder: 'productos', resource_type: 'image' },
    );
    return {
      provider: 'cloudinary',
      key: result.public_id,
      url: result.secure_url,
    };
  }

  async delete(key: string): Promise<void> {
    this.configure();
    const result: { result: string } = await cloudinary.uploader.destroy(key, {
      resource_type: 'image',
    });
    if (result.result !== 'ok' && result.result !== 'not found')
      throw new Error('No se pudo eliminar la imagen de Cloudinary');
  }
}
