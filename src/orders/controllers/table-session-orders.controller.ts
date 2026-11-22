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
import { CreateOrderCommand } from '../commands/create-order/create-order.command.js';
import { orderItemsSchema, type OrderItemsDto } from '../dtos/order.dto.js';
import {
  OrderItemsInputDto,
  OrderResponseDto,
} from '../dtos/order-swagger.dto.js';
import { OrdersGuard } from '../guards/orders.guard.js';
import { ListOrdersQuery } from '../queries/list-orders/list-orders.query.js';

@ApiTags('Órdenes')
@ApiBearerAuth()
@Authenticate({ providers: [JwtAuthProvider] })
@UseGuards(OrdersGuard)
@ApiUnauthorizedResponse({ description: 'Token ausente o inválido.' })
@ApiForbiddenResponse({ description: 'Rol no autorizado.' })
@Controller('table-sessions/:id/orders')
export class TableSessionOrdersController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden para una atención abierta' })
  @ApiBody({ type: OrderItemsInputDto })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos, productos o selecciones inválidos.',
  })
  @ApiNotFoundResponse({ description: 'Atención no encontrada.' })
  @ApiConflictResponse({ description: 'La atención está cerrada.' })
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: orderItemsSchema }) body: OrderItemsDto,
  ) {
    return this.commands.execute(new CreateOrderCommand(id, body.items));
  }

  @Get()
  @ApiOperation({ summary: 'Listar las órdenes de una atención' })
  @ApiOkResponse({ type: [OrderResponseDto] })
  @ApiBadRequestResponse({ description: 'Identificador inválido.' })
  @ApiNotFoundResponse({ description: 'Atención no encontrada.' })
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.queries.execute(new ListOrdersQuery(id));
  }
}
