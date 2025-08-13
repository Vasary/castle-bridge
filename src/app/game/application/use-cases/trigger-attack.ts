import { inject } from '@angular/core';
import { GAME_REPOSITORY } from '../../domain/repositories/game-repository.token';
import { GameRepository } from '../../domain/repositories/game.repository';

export function triggerAttack() {
  const repo = inject<GameRepository>(GAME_REPOSITORY);
  repo.triggerAttack();
}

