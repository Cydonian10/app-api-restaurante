import { Authenticate } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { ListUsersAdminGuard } from '../../users/guards/list-users-admin.guard.js';
import { zoneSchema, type ZoneDto } from '../dtos/dining.dto.js';
import { DiningReadGuard } from '../guards/dining-read.guard.js';
import { ListDiningQuery } from '../queries/list-dining/list-dining.query.js';
import { CreateZoneCommand } from '../commands/create-zone/create-zone.command.js';
import { UpdateZoneCommand } from '../commands/update-zone/update-zone.command.js';
import { RemoveZoneCommand } from '../commands/remove-zone/remove-zone.command.js';

@ApiTags('Zonas')
@ApiBearerAuth()
@Authenticate({ providers: [JwtAuthProvider] })
@Controller('dining/zones')
export class ZonesController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}
  @Get()
  @UseGuards(DiningReadGuard)
  list() {
    return this.queries.execute(new ListDiningQuery());
  }
  @Post()
  @UseGuards(ListUsersAdminGuard)
  create(@Body({ schema: zoneSchema }) body: ZoneDto) {
    return this.commands.execute(new CreateZoneCommand(body.name));
  }
  @Patch(':id')
  @UseGuards(ListUsersAdminGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: zoneSchema }) body: ZoneDto,
  ) {
    return this.commands.execute(new UpdateZoneCommand(id, body.name));
  }
  @Delete(':id')
  @UseGuards(ListUsersAdminGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commands.execute(new RemoveZoneCommand(id));
  }
}
