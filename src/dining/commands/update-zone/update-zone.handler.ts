import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Zone } from '../../entities/zone.entity.js';

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UpdateZoneCommand } from './update-zone.command.js';

@CommandHandler(UpdateZoneCommand)
export class UpdateZoneHandler implements ICommandHandler<UpdateZoneCommand> {
  constructor(private readonly db: DataSource) {}
  execute({ id, name }: UpdateZoneCommand) {
    return this.updateZone(id, name);
  }
  async updateZone(id: string, name: string) {
    const repo = this.db.getRepository(Zone);
    const zone = await repo.findOneBy({ id, active: true });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    zone.name = name;
    return repo.save(zone);
  }
}
