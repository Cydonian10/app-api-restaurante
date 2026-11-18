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
      name: [user.person.name, user.person.lastName].filter(Boolean).join(' '),
      person: {
        id: user.person.id,
        name: user.person.name,
        lastName: user.person.lastName,
        phone: user.person.phone,
        document: user.person.document,
        birthDate: user.person.birthDate,
        residence: user.person.residence,
      },
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
