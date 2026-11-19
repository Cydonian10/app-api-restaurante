import { Query } from '@nestjs/cqrs';
import type {
  ListUsersDto,
  ListUsersResponseDto,
} from '../../dtos/list-users.dto.js';

export class ListUsersQuery extends Query<ListUsersResponseDto> {
  constructor(public readonly filters: ListUsersDto) {
    super();
  }
}
