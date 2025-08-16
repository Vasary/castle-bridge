import { Unit } from '../entities/unit';
import { Score } from '../entities/score';

export interface GameState {
  heroes: Unit[];
  villains: Unit[];
  isOver: boolean;
  isStarted: boolean;
}

export interface GameScores {
  scores: Score[];
}

