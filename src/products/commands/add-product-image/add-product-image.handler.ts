import {
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../storage/image-storage.js';
import { validateImage } from '../../storage/image-validation.js';
import { AddProductImageCommand } from './add-product-image.command.js';
@CommandHandler(AddProductImageCommand)
export class AddProductImageHandler implements ICommandHandler<AddProductImageCommand> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}
  async execute({ id, file }: AddProductImageCommand) {
    if (!file) throw new BadRequestException('La imagen es obligatoria');
    const imageFile = validateImage(file);
    const product = await this.products.findOneBy({ id, deletedAt: IsNull() });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.imageUrl)
      throw new ConflictException('El producto ya tiene una imagen');
    const image = await this.storage.upload(imageFile);
    try {
      const result = await this.products.update(
        { id, imageUrl: IsNull(), deletedAt: IsNull() },
        {
          imageUrl: image.url,
          imageProvider: image.provider,
          imageKey: image.key,
        },
      );
      if (!result.affected)
        throw new ConflictException(
          'El producto ya tiene una imagen o no existe',
        );
    } catch (error) {
      await this.storage.delete(image.key).catch(() => undefined);
      throw error;
    }
    return { id, imageUrl: image.url };
  }
}
