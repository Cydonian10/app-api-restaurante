import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
  type StoredImage,
} from '../../storage/image-storage.js';
import { validateImage } from '../../storage/image-validation.js';
import { CreateProductCommand } from './create-product.command.js';
@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}
  async execute({ data: body, file }: CreateProductCommand) {
    let image: StoredImage | undefined;
    if (file) image = await this.storage.upload(validateImage(file));
    try {
      const product = this.products.create({
        ...body,
        descripcion: body.descripcion ?? null,
        imageUrl: image?.url ?? null,
        imageProvider: image?.provider ?? null,
        imageKey: image?.key ?? null,
      });
      const saved = await this.products.save(product);
      return {
        id: saved.id,
        nombre: saved.nombre,
        descripcion: saved.descripcion,
        precio: saved.precio,
        tipo: saved.tipo,
        principal: saved.principal,
        disponible: saved.disponible,
        imageUrl: saved.imageUrl,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    } catch (error) {
      if (image) await this.storage.delete(image.key).catch(() => undefined);
      throw error;
    }
  }
}
