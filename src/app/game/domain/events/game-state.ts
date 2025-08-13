import { Unit } from '../entities/unit';

export interface GameState {
  heroes: Unit[];
  villains: Unit[];
  isOver: boolean;
  isStarted: boolean;
}

export interface GameScores {
  scores: Array<{
    triggerId: string;
    targetId: string;
    triggerHit: number;
    targetHealth: number;
  }>;
}

