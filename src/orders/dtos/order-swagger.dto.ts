import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemStatus } from '../enums/order-item-status.enum.js';

export class MenuSelectionInputDto {
  @ApiPropertyOptional({ format: 'uuid' }) extraProductId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) drinkProductId?: string;
}
export class OrderLineInputDto {
  @ApiProperty({ format: 'uuid' }) productId: string;
  @ApiProperty({ minimum: 1, type: 'integer' }) quantity: number;
  @ApiPropertyOptional({
    type: [MenuSelectionInputDto],
    description: 'Selecciones por unidad de menú, en orden.',
  })
  selections?: MenuSelectionInputDto[];
}
export class OrderItemsInputDto {
  @ApiProperty({ type: [OrderLineInputDto], minItems: 1 })
  items: OrderLineInputDto[];
}
export class MenuSelectionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) orderItemId: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  extraProductId: string | null;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  drinkProductId: string | null;
}
export class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) orderId: string;
  @ApiProperty({ format: 'uuid' }) productId: string;
  @ApiProperty() productName: string;
  @ApiProperty({ example: '12.50' }) unitPrice: string;
  @ApiProperty({ enum: OrderItemStatus }) status: OrderItemStatus;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  deliveredAt: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
  @ApiPropertyOptional({ type: MenuSelectionResponseDto, nullable: true })
  menuSelection?: MenuSelectionResponseDto | null;
}
export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) tableSessionId: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: [OrderItemResponseDto] }) items: OrderItemResponseDto[];
}
