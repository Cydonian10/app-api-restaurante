import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../storage/image-storage.js';
import { validateImage } from '../../storage/image-validation.js';
import {
  DeleteProductCommand,
  UpdateProductCommand,
} from './manage-product.command.js';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}
  async execute({ id, data, file }: UpdateProductCommand) {
    const product = await this.products.findOneBy({ id, deletedAt: IsNull() });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const image = file
      ? await this.storage.upload(validateImage(file))
      : undefined;
    try {
      const result = await this.products.update(
        { id, deletedAt: IsNull() },
        {
          ...data,
          descripcion: data.descripcion ?? null,
          ...(image
            ? {
                imageUrl: image.url,
                imageProvider: image.provider,
                imageKey: image.key,
              }
            : {}),
        },
      );
      if (!result.affected)
        throw new NotFoundException('Producto no encontrado');
    } catch (error) {
      if (image) await this.storage.delete(image.key).catch(() => undefined);
      throw error;
    }
    if (image && product.imageKey && product.imageProvider === image.provider)
      await this.storage.delete(product.imageKey).catch(() => undefined);
    return { id };
  }
}
@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}
  async execute({ id }: DeleteProductCommand) {
    const result = await this.products.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
    if (!result.affected) throw new NotFoundException('Producto no encontrado');
    return { id };
  }
}
