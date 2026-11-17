import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtAuthProvider extends JwtBearerProvider<User> {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    registry: AuthenticationRegistry,
  ) {
    // Identifica el ámbito de autenticación y registra este proveedor.
    super({ realm: 'restaurante' });
    registry.registerProvider(this);
  }

  // Usa el sujeto del JWT como identificador para recuperar al usuario.
  validate({ sub }: JwtClaims) {
    return sub ? this.findById(sub) : null;
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }
}
