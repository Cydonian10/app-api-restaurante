import { Module } from '@nestjs/common';
import { ZonesController } from './controllers/zones.controller.js';
import { TablesController } from './controllers/tables.controller.js';
import { DiningReadGuard } from './guards/dining-read.guard.js';
import { ListDiningHandler } from './queries/list-dining/list-dining.handler.js';
import { CreateZoneHandler } from './commands/create-zone/create-zone.handler.js';
import { UpdateZoneHandler } from './commands/update-zone/update-zone.handler.js';
import { RemoveZoneHandler } from './commands/remove-zone/remove-zone.handler.js';
import { CreateTableHandler } from './commands/create-table/create-table.handler.js';
import { UpdateTableHandler } from './commands/update-table/update-table.handler.js';
import { ListUsersAdminGuard } from '../users/guards/list-users-admin.guard.js';

@Module({
  controllers: [ZonesController, TablesController],
  providers: [
    ListDiningHandler,
    CreateZoneHandler,
    UpdateZoneHandler,
    RemoveZoneHandler,
    CreateTableHandler,
    UpdateTableHandler,
    DiningReadGuard,
    ListUsersAdminGuard,
  ],
})
export class DiningModule {}
