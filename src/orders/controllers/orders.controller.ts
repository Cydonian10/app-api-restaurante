import { Authenticate } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { AddOrderItemsCommand } from '../commands/add-order-items/add-order-items.command.js';
import { orderItemsSchema, type OrderItemsDto } from '../dtos/order.dto.js';
import {
  OrderItemResponseDto,
  OrderItemsInputDto,
  OrderResponseDto,
} from '../dtos/order-swagger.dto.js';
import { OrdersGuard } from '../guards/orders.guard.js';
import { GetOrderQuery } from '../queries/get-order/get-order.query.js';

@ApiTags('Órdenes')
@ApiBearerAuth()
@Authenticate({ providers: [JwtAuthProvider] })
@UseGuards(OrdersGuard)
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Rol no autorizado.' })
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una orden' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Identificador inválido.' })
  @ApiNotFoundResponse({ description: 'Orden no encontrada.' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.execute(new GetOrderQuery(id));
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Agregar ítems a una orden' })
  @ApiBody({ type: OrderItemsInputDto })
  @ApiCreatedResponse({ type: [OrderItemResponseDto] })
  @ApiBadRequestResponse({
    description: 'Datos, productos o selecciones inválidos.',
  })
  @ApiNotFoundResponse({ description: 'Orden no encontrada.' })
  @ApiConflictResponse({ description: 'La atención está cerrada.' })
  addItems(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: orderItemsSchema }) body: OrderItemsDto,
  ) {
    return this.commands.execute(new AddOrderItemsCommand(id, body.items));
  }
}
