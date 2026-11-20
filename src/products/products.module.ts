import { CreateProductHandler } from './commands/create-product/create-product.handler.js';
import { AddProductImageHandler } from './commands/add-product-image/add-product-image.handler.js';
import { ListProductsHandler } from './queries/list-products/list-products.handler.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity.js';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { IMAGE_STORAGE } from './storage/image-storage.js';
import { CloudinaryImageStorage } from './storage/cloudinary-image.storage.js';
import { LocalImageStorage } from './storage/local-image.storage.js';
import { ProductsController } from './products.controller.js';
import { ListUsersAdminGuard } from '../users/guards/list-users-admin.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [
    ListUsersAdminGuard,
    CreateProductHandler,
    AddProductImageHandler,
    ListProductsHandler,
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
