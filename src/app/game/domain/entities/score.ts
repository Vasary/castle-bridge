export class Score {
  constructor(
    public readonly triggerId: string,
    public readonly targetId: string,
    public readonly triggerHit: number,
    public readonly targetHealth: number,
  ) {}
}

