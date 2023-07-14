import {Team, Timer} from "../../types/types";

export class Unit {
  damaged: number | null = null;
  timer: null | Timer = null;

  constructor(
    public id: string,
    public health: number,
    public power: number,
    public title: string,
    public avatar: string,
    public team: Team
  ) {
  }

  public isDied(): boolean {
    return this.health <= 0;
  }

  public applyDamage(value: number): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.damaged = null;
    }

    this.timer = setTimeout(() => this.damaged = null, 500);

    this.damaged = value;

    this.health = this.health - value < 0 ? 0 : this.health - value;
  }
}
