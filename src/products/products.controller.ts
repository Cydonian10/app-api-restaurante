import { Authenticate } from '@nestjs/authentication';
import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtAuthProvider } from '../auth/providers/jwt-auth.provider.js';
import { ListUsersAdminGuard } from '../users/guards/list-users-admin.guard.js';
import {
  createProductSchema,
  type CreateProductDto,
} from './dtos/create-product.dto.js';
import { Product } from './entities/product.entity.js';
import {
  IMAGE_STORAGE,
  type ImageFile,
  type ImageStorage,
  type StoredImage,
} from './storage/image-storage.js';

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

function validateImage(file: UploadedImage): ImageFile {
  const data = file.buffer;
  const jpeg =
    data.length >= 3 &&
    data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  const png =
    data.length >= 8 &&
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp =
    data.length >= 12 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP';
  if (
    file.size > 5 * 1024 * 1024 ||
    !(
      (jpeg && file.mimetype === 'image/jpeg') ||
      (png && file.mimetype === 'image/png') ||
      (webp && file.mimetype === 'image/webp')
    )
  ) {
    throw new BadRequestException(
      'La imagen debe ser JPG, PNG o WebP y no superar 5 MB',
    );
  }
  return { buffer: data, mimeType: file.mimetype as ImageFile['mimeType'] };
}

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}

  @Post()
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @UseInterceptors(
    FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear producto (solo administradores)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nombre', 'precio', 'tipo'],
      properties: {
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        precio: { type: 'string', example: '12.50' },
        tipo: {
          type: 'string',
          enum: ['BEBIDA', 'EXTRA', 'PLATO_FONDO', 'POSTRE'],
        },
        imagen: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(
    @Body({ schema: createProductSchema }) body: CreateProductDto,
    @UploadedFile() file?: UploadedImage,
  ) {
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

  @Post(':id/imagen')
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @UseInterceptors(
    FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar una imagen a un producto sin imagen' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagen'],
      properties: { imagen: { type: 'string', format: 'binary' } },
    },
  })
  async addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: UploadedImage,
  ) {
    if (!file) throw new BadRequestException('La imagen es obligatoria');
    const imageFile = validateImage(file);
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.imageUrl)
      throw new ConflictException('El producto ya tiene una imagen');
    const image = await this.storage.upload(imageFile);
    try {
      const result = await this.products.update(
        { id, imageUrl: IsNull() },
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
