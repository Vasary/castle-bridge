import { Observable } from 'rxjs';
import { GameState, GameScores } from '../events/game-state';
import { AttackOccurred } from '../events/attack-occurred';
import { Unit } from '../entities/unit';

export abstract class GameRepository {
  abstract join(nickname: string): void;
  abstract triggerAttack(): void;
  abstract restart(): void;

  abstract player$(): Observable<Unit>;
  abstract state$(): Observable<GameState>;
  abstract fightEvents$(): Observable<AttackOccurred>;
  abstract scores$(): Observable<GameScores>;
}

