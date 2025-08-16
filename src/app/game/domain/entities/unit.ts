export type Team = 'Heroes' | 'Villains';

export class Unit {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly avatar: string,
    public readonly team: Team,
    public health: number,
    public power: number,
  ) {}

  isDead(): boolean {
    return this.health <= 0;
  }
}

