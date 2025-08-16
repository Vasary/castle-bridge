import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { GAME_REPOSITORY } from '../domain/repositories/game-repository.token';
import { GameRepository } from '../domain/repositories/game.repository';
import { GameState, GameScores } from '../domain/events/game-state';
import { AttackOccurred } from '../domain/events/attack-occurred';

@Injectable({ providedIn: 'root' })
export class GameFacade {
  private repo = inject<GameRepository>(GAME_REPOSITORY);

  player$ = this.repo.player$().pipe(shareReplay(1));
  state$: Observable<GameState> = this.repo.state$().pipe(shareReplay(1));
  scores$: Observable<GameScores> = this.repo.scores$().pipe(shareReplay(1));
  fightEvents$: Observable<AttackOccurred> = this.repo.fightEvents$();

  heroes$ = this.state$.pipe(map(s => s.heroes));
  villains$ = this.state$.pipe(map(s => s.villains));
  isOver$ = this.state$.pipe(map(s => s.isOver));
  isStarted$ = this.state$.pipe(map(s => s.isStarted));

  joinGame(nickname: string): void { this.repo.join(nickname); }
  attack(): void { this.repo.triggerAttack(); }
  restart(): void { this.repo.restart(); }
}

