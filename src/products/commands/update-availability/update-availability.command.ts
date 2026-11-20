import { Command } from '@nestjs/cqrs';

export class UpdateAvailabilityCommand extends Command<{
  id: string;
  disponible: boolean;
}> {
  constructor(
    public readonly id: string,
    public readonly disponible: boolean,
  ) {
    super();
  }
}
