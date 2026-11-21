import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiningTable } from '../../entities/dining-table.entity.js';
import { Zone } from '../../entities/zone.entity.js';

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateTableCommand } from './create-table.command.js';

@CommandHandler(CreateTableCommand)
export class CreateTableHandler implements ICommandHandler<CreateTableCommand> {
  constructor(private readonly db: DataSource) {}
  execute({ input }: CreateTableCommand) {
    return this.createTable(input);
  }
  async createTable(input: {
    zoneId: string;
    number: number;
    capacity: number;
  }) {
    try {
      return await this.db.transaction(async (manager) => {
        const zone = await manager.getRepository(Zone).findOne({
          where: { id: input.zoneId, active: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!zone) throw new NotFoundException('Zona no encontrada');
        const tables = await manager
          .getRepository(DiningTable)
          .findBy({ zoneId: input.zoneId, active: true });
        let slot = 0;
        while (
          tables.some(
            (table) =>
              table.positionX === 20 + (slot % 6) * 140 &&
              table.positionY === 20 + Math.floor(slot / 6) * 120,
          )
        )
          slot++;
        return manager.save(DiningTable, {
          ...input,
          positionX: 20 + (slot % 6) * 140,
          positionY: 20 + Math.floor(slot / 6) * 120,
        });
      });
    } catch (error) {
      this.rethrowConflict(error);
    }
  }

  private rethrowConflict(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    )
      throw new ConflictException('El número de mesa ya existe en la zona');
    throw error;
  }
}
