export class AttackOccurred {
  constructor(
    public readonly attackerId: string,
    public readonly targetId: string,
    public readonly damage: number,
    public readonly timestamp: number
  ) {}
}
