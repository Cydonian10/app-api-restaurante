import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Person } from './entities/person.entity.js';
import { UsersController } from './controllers/users.controller.js';
import { CreateUserHandler } from './commands/create-user/create-user.handler.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Person])],
  controllers: [UsersController],
  providers: [CreateUserHandler],
})
export class UsersModule {}
