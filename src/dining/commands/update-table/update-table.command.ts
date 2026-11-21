export class UpdateTableCommand {
  constructor(
    public readonly id: string,
    public readonly input: {
      number?: number;
      capacity?: number;
      outOfService?: boolean;
      positionX?: number;
      positionY?: number;
    },
    public readonly deactivate = false,
  ) {}
}
