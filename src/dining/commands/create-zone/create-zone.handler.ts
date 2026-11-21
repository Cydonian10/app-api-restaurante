import { DataSource } from 'typeorm';
import { Zone } from '../../entities/zone.entity.js';

import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { CreateZoneCommand } from './create-zone.command.js';

@CommandHandler(CreateZoneCommand)
export class CreateZoneHandler implements ICommandHandler<CreateZoneCommand> {
  constructor(private readonly db: DataSource) {}
  execute({ name }: CreateZoneCommand) {
    return this.createZone(name);
  }
  createZone(name: string) {
    return this.db.getRepository(Zone).save({ name });
  }
}
