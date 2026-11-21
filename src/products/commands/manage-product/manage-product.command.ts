import type { CreateProductDto } from '../../dtos/create-product.dto.js';
import type { UploadedImage } from '../../storage/image-validation.js';

export class UpdateProductCommand {
  constructor(
    public readonly id: string,
    public readonly data: CreateProductDto,
    public readonly file?: UploadedImage,
  ) {}
}
export class DeleteProductCommand {
  constructor(public readonly id: string) {}
}
