export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface ImageFile {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface StoredImage {
  url: string;
  provider: 'cloudinary' | 'local';
  key: string;
}

export interface ImageStorage {
  upload(file: ImageFile): Promise<StoredImage>;
  delete(key: string): Promise<void>;
}
