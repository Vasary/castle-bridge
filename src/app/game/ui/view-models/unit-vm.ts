import { Unit } from '../../domain/entities/unit';

export type Timer = ReturnType<typeof setTimeout>;

export class UnitVM {
  damaged: number | null = null;
  timer: null | Timer = null;

  constructor(public readonly unit: Unit) {}

  isDead(): boolean { return this.unit.isDead(); }

  applyDamage(value: number): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.damaged = null;
    }
    this.timer = setTimeout(() => (this.damaged = null), 500);
    this.damaged = value;

    this.unit.health = this.unit.health - value < 0 ? 0 : this.unit.health - value;
  }
}

