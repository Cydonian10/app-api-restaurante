export class CreateTableCommand {
  constructor(
    public readonly input: { zoneId: string; number: number; capacity: number },
  ) {}
}
