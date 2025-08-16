// DTOs corresponding to server payloads
export interface PlayerDto {
  id: string;
  title: string;
  health: number;
  power: number;
  avatar: string;
}

export interface ServerUnitDto extends PlayerDto {}

export interface ServerStateDto {
  heroes: ServerUnitDto[];
  villains: ServerUnitDto[];
  isOver: boolean;
  isStarted: boolean;
}

export interface AttackEventDto {
  trigger: ServerUnitDto;
  target: ServerUnitDto;
  attackPower: number;
}

export interface ServerScoreDto {
  targetHealth: number;
  targetId: string;
  triggerHit: number;
  triggerId: string;
}

export interface ServerScoresDto {
  scores: ServerScoreDto[];
}

