export class Score {
  constructor(
    public readonly playerName: string,
    public readonly score: number,
    public readonly timestamp: number,
    public readonly targetHealth: number = 0,
  ) {}
}
