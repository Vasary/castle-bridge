import {Team} from "../../types/types";

// Deprecated: UI logic moved to UnitVM. This legacy model will be removed.
export class Unit {
  constructor(
    public id: string,
    public health: number,
    public power: number,
    public title: string,
    public avatar: string,
    public team: Team
  ) {}

  public isDied(): boolean {
    return this.health <= 0;
  }
}
