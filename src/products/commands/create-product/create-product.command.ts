import { Command } from '@nestjs/cqrs';
import type { CreateProductDto } from '../../dtos/create-product.dto.js';
import type { UploadedImage } from '../../storage/image-validation.js';
import type { ProductResponse } from '../../dtos/product-response.js';
export class CreateProductCommand extends Command<ProductResponse> {
  constructor(
    public readonly data: CreateProductDto,
    public readonly file?: UploadedImage,
  ) {
    super();
  }
}
