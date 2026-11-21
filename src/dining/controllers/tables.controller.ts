import { Authenticate } from '@nestjs/authentication';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthProvider } from '../../auth/providers/jwt-auth.provider.js';
import { ListUsersAdminGuard } from '../../users/guards/list-users-admin.guard.js';
import {
  tableSchema,
  updateTableSchema,
  type CreateTableDto,
  type UpdateTableDto,
} from '../dtos/dining.dto.js';
import { CreateTableCommand } from '../commands/create-table/create-table.command.js';
import { UpdateTableCommand } from '../commands/update-table/update-table.command.js';

@ApiTags('Mesas')
@ApiBearerAuth()
@Authenticate({ providers: [JwtAuthProvider] })
@Controller('dining/tables')
export class TablesController {
  constructor(private readonly commands: CommandBus) {}
  @Post()
  @UseGuards(ListUsersAdminGuard)
  create(@Body({ schema: tableSchema }) body: CreateTableDto) {
    return this.commands.execute(new CreateTableCommand(body));
  }
  @Patch(':id')
  @UseGuards(ListUsersAdminGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: updateTableSchema }) body: UpdateTableDto,
  ) {
    return this.commands.execute(new UpdateTableCommand(id, body));
  }
  @Delete(':id')
  @UseGuards(ListUsersAdminGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commands.execute(new UpdateTableCommand(id, {}, true));
  }
}
