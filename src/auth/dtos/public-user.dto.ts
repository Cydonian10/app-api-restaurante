import { User } from '../entities/user.entity.js';

export class PublicUser {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public createdAt: Date,
  ) {}

  static toDto(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
