export interface PlayerType {
  id: string;
  title: string;
  health: number;
  power: number;
  avatar: string;
}

export interface ServerUnit extends PlayerType {
}

export interface ServerState {
  heroes: ServerUnit[];
  villains: ServerUnit[];
  isOver: boolean;
  isStarted: boolean;
}

export interface AttackEvent {
  trigger: ServerUnit;
  target: ServerUnit;
  attackPower: number;
}

export interface ServerScore {
  targetHealth: number;
  targetId: string;
  triggerHit: number;
  triggerId: string;
}

export interface ServerScores {
  scores: ServerScore[];
}
