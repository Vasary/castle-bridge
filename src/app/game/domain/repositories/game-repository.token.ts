import { InjectionToken } from '@angular/core';
import { GameRepository } from './game.repository';

export const GAME_REPOSITORY = new InjectionToken<GameRepository>('GAME_REPOSITORY');

