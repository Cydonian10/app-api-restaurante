import { NotFoundException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../../entities/product.entity.js';
import { UpdateAvailabilityCommand } from './update-availability.command.js';

@CommandHandler(UpdateAvailabilityCommand)
export class UpdateAvailabilityHandler implements ICommandHandler<UpdateAvailabilityCommand> {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async execute({ id, disponible }: UpdateAvailabilityCommand) {
    const result = await this.products.update(
      { id, deletedAt: IsNull() },
      { disponible },
    );
    if (!result.affected) throw new NotFoundException('Producto no encontrado');
    return { id, disponible };
  }
}
