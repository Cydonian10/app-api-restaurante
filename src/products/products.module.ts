import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { IMAGE_STORAGE } from './storage/image-storage.js';
import { CloudinaryImageStorage } from './storage/cloudinary-image.storage.js';
import { LocalImageStorage } from './storage/local-image.storage.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [
    {
      provide: IMAGE_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider =
          config.get<string>('IMAGE_STORAGE_PROVIDER') ?? 'cloudinary';
        if (provider === 'local') {
          return new LocalImageStorage(
            resolve(
              config.get<string>('IMAGE_LOCAL_DIR') ?? './uploads/products',
            ),
            config.get<string>('IMAGE_LOCAL_BASE_URL') ??
              'http://localhost:3000/uploads/products',
          );
        }
        if (provider === 'cloudinary') {
          return new CloudinaryImageStorage(
            config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '',
            config.get<string>('CLOUDINARY_API_KEY') ?? '',
            config.get<string>('CLOUDINARY_API_SECRET') ?? '',
          );
        }
        throw new Error('IMAGE_STORAGE_PROVIDER debe ser cloudinary o local');
      },
    },
  ],
  exports: [IMAGE_STORAGE],
})
export class ProductsModule {}
