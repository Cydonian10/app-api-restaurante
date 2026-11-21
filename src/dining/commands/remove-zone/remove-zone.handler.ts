import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiningTable } from '../../entities/dining-table.entity.js';
import { TableSession } from '../../entities/table-session.entity.js';
import { Zone } from '../../entities/zone.entity.js';

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { RemoveZoneCommand } from './remove-zone.command.js';

@CommandHandler(RemoveZoneCommand)
export class RemoveZoneHandler implements ICommandHandler<RemoveZoneCommand> {
  constructor(private readonly db: DataSource) {}
  execute({ id }: RemoveZoneCommand) {
    return this.removeZone(id);
  }
  async removeZone(id: string) {
    return this.db.transaction(async (manager) => {
      const zone = await manager.getRepository(Zone).findOne({
        where: { id, active: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!zone) throw new NotFoundException('Zona no encontrada');
      const count = await manager
        .getRepository(DiningTable)
        .createQueryBuilder('table')
        .leftJoin(
          TableSession,
          'session',
          'session.table_id = table.id AND session.closed_at IS NULL',
        )
        .where('table.zone_id = :id', { id })
        .andWhere('(table.active = true OR session.id IS NOT NULL)')
        .getCount();
      if (count)
        throw new ConflictException(
          'La zona tiene mesas activas o atenciones abiertas',
        );
      zone.active = false;
      return manager.save(zone);
    });
  }
}
