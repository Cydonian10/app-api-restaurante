import { Command } from '@nestjs/cqrs';
import type { UploadedImage } from '../../storage/image-validation.js';
export class AddProductImageCommand extends Command<{
  id: string;
  imageUrl: string;
}> {
  constructor(
    public readonly id: string,
    public readonly file?: UploadedImage,
  ) {
    super();
  }
}
