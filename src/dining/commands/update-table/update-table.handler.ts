import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { DiningTable } from '../../entities/dining-table.entity.js';
import { TableSession } from '../../entities/table-session.entity.js';

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UpdateTableCommand } from './update-table.command.js';

@CommandHandler(UpdateTableCommand)
export class UpdateTableHandler implements ICommandHandler<UpdateTableCommand> {
  constructor(private readonly db: DataSource) {}
  execute({ id, input, deactivate }: UpdateTableCommand) {
    return this.updateTable(id, input, deactivate);
  }
  async updateTable(
    id: string,
    input: {
      number?: number;
      capacity?: number;
      outOfService?: boolean;
      positionX?: number;
      positionY?: number;
    },
    deactivate = false,
  ) {
    try {
      return await this.db.transaction(async (manager) => {
        const table = await manager.getRepository(DiningTable).findOne({
          where: { id, active: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!table) throw new NotFoundException('Mesa no encontrada');
        const session = await manager
          .getRepository(TableSession)
          .findOne({ select: { id: true, partySize: true }, where: { tableId: id, closedAt: IsNull() } });
        if (session && (deactivate || input.outOfService === true))
          throw new ConflictException('La mesa tiene una atención abierta');
        if (
          session &&
          input.capacity !== undefined &&
          input.capacity < session.partySize
        )
          throw new ConflictException(
            'La capacidad es menor que la cantidad de personas',
          );
        Object.assign(table, input);
        if (deactivate) table.active = false;
        return manager.save(table);
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
