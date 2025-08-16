import { Observable } from 'rxjs';
import { Unit } from '../entities/unit';
import { AttackOccurred } from '../events/attack-occurred';
import { GameScores, GameState } from '../events/game-state';

export abstract class GameRepository {
  abstract join(nickname: string): void;
  abstract triggerAttack(): void;
  abstract restart(): void;

  abstract player$(): Observable<Unit | null>;
  abstract state$(): Observable<GameState>;
  abstract fightEvents$(): Observable<AttackOccurred>;
  abstract scores$(): Observable<GameScores>;
}
