import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '../enums/product-type.enum.js';

export class ProductSwaggerDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
  @ApiProperty({ type: String, nullable: true }) descripcion: string | null;
  @ApiProperty({ type: String, example: '12.50' }) precio: string;
  @ApiProperty({ enum: ProductType }) tipo: ProductType;
  @ApiProperty() principal: boolean;
  @ApiProperty() disponible: boolean;
  @ApiProperty({ type: String, nullable: true }) imageUrl: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date;
}

export class ProductPageSwaggerDto {
  @ApiProperty({ type: [ProductSwaggerDto] }) items: ProductSwaggerDto[];
  @ApiProperty({ minimum: 1 }) page: number;
  @ApiProperty({ minimum: 1, maximum: 100 }) limit: number;
  @ApiProperty({ minimum: 0 }) total: number;
  @ApiProperty({ minimum: 0 }) totalPages: number;
}
