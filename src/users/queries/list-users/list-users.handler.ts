import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../auth/entities/user.entity.js';
import type {
  ListedUserDto,
  ListUsersResponseDto,
} from '../../dtos/list-users.dto.js';
import { ListUsersQuery } from './list-users.query.js';

type UserRow = Omit<ListedUserDto, 'person'> & {
  name: string | null;
  lastName: string | null;
  phone: string | null;
};

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async execute({ filters }: ListUsersQuery): Promise<ListUsersResponseDto> {
    const { page, limit, search, role, emailVerified } = filters;
    const query = this.users
      .createQueryBuilder('u')
      .leftJoin('u.person', 'person');

    if (search) {
      // Treat LIKE metacharacters as literal search text.
      const pattern = `%${search.replace(/[!%_]/g, '!$&')}%`;
      query.andWhere(
        `(
          person.name ILIKE :pattern ESCAPE '!'
          OR person.lastName ILIKE :pattern ESCAPE '!'
          OR concat_ws(' ', person.name, person.lastName) ILIKE :pattern ESCAPE '!'
          OR u.email ILIKE :pattern ESCAPE '!'
        )`,
        { pattern },
      );
    }
    if (role !== undefined) query.andWhere('u.role = :role', { role });
    if (emailVerified !== undefined) {
      query.andWhere('u.emailVerified = :emailVerified', { emailVerified });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);
    if (page > totalPages) return { items: [], page, limit, total, totalPages };

    // The person join is at most one row per user, so SQL LIMIT/OFFSET is safe.
    const rows = await query
      .select('u.id', 'id')
      .addSelect('u.email', 'email')
      .addSelect('u.role', 'role')
      .addSelect('u.emailVerified', 'emailVerified')
      .addSelect('person.name', 'name')
      .addSelect('person.lastName', 'lastName')
      .addSelect('person.phone', 'phone')
      .orderBy('u.createdAt', 'DESC')
      .addOrderBy('u.id', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<UserRow>();

    return {
      items: rows.map(
        ({ id, email, role, emailVerified, name, lastName, phone }) => ({
          id,
          email,
          role,
          emailVerified,
          person: name === null ? null : { name, lastName, phone },
        }),
      ),
      page,
      limit,
      total,
      totalPages,
    };
  }
}
