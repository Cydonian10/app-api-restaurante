import { Authenticate } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthProvider } from '../auth/providers/jwt-auth.provider.js';
import { ListUsersAdminGuard } from '../users/guards/list-users-admin.guard.js';
import {
  createProductSchema,
  type CreateProductDto,
} from './dtos/create-product.dto.js';
import { ProductType } from './enums/product-type.enum.js';
import {
  listProductsSchema,
  type ListProductsDto,
} from './dtos/list-products.dto.js';
import type { UploadedImage } from './storage/image-validation.js';
import { CreateProductCommand } from './commands/create-product/create-product.command.js';
import { AddProductImageCommand } from './commands/add-product-image/add-product-image.command.js';
import { ListProductsQuery } from './queries/list-products/list-products.query.js';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'tipo', required: false, enum: ProductType })
  list(@Query({ schema: listProductsSchema }) query: ListProductsDto) {
    return this.queries.execute(new ListProductsQuery(query, false));
  }

  @Get('admin')
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todos los productos (solo administradores)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'tipo', required: false, enum: ProductType })
  listAdmin(@Query({ schema: listProductsSchema }) query: ListProductsDto) {
    return this.queries.execute(new ListProductsQuery(query, true));
  }

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
    return this.commands.execute(new CreateProductCommand(body, file));
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
    return this.commands.execute(new AddProductImageCommand(id, file));
  }
}
