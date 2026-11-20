import { Authenticate, Public } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { ListUsersAdminGuard } from '../../users/guards/list-users-admin.guard.js';
import {
  createProductSchema,
  type CreateProductDto,
} from '../dtos/create-product.dto.js';
import { ProductType } from '../enums/product-type.enum.js';
import {
  listProductsSchema,
  type ListProductsDto,
} from '../dtos/list-products.dto.js';
import type { UploadedImage } from '../storage/image-validation.js';
import { CreateProductCommand } from '../commands/create-product/create-product.command.js';
import { AddProductImageCommand } from '../commands/add-product-image/add-product-image.command.js';
import { ListProductsQuery } from '../queries/list-products/list-products.query.js';
import { UpdateAvailabilityCommand } from '../commands/update-availability/update-availability.command.js';
import {
  updateAvailabilitySchema,
  type UpdateAvailabilityDto,
} from '../dtos/update-availability.dto.js';
import {
  ProductPageSwaggerDto,
  ProductSwaggerDto,
} from '../dtos/product-swagger.dto.js';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiOkResponse({ type: ProductPageSwaggerDto })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
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
  @ApiOkResponse({ type: ProductPageSwaggerDto })
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
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
  @ApiCreatedResponse({ type: ProductSwaggerDto })
  @ApiBadRequestResponse({ description: 'Datos o imagen inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
  @ApiInternalServerErrorResponse({
    description: 'Error al guardar el producto o la imagen.',
  })
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
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      required: ['id', 'imageUrl'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        imageUrl: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Identificador o imagen inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado.' })
  @ApiConflictResponse({ description: 'El producto ya tiene una imagen.' })
  @ApiInternalServerErrorResponse({
    description: 'Error al guardar la imagen.',
  })
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

  @Patch(':id/disponibilidad')
  @Authenticate({ providers: [JwtAuthProvider] })
  @UseGuards(ListUsersAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar disponibilidad (solo administradores)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['disponible'],
      properties: { disponible: { type: 'boolean' } },
    },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['id', 'disponible'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        disponible: { type: 'boolean' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Identificador o disponibilidad inválidos.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
  @ApiForbiddenResponse({ description: 'Se requiere el rol ADMIN.' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado.' })
  updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: updateAvailabilitySchema }) body: UpdateAvailabilityDto,
  ) {
    return this.commands.execute(
      new UpdateAvailabilityCommand(id, body.disponible),
    );
  }
}
