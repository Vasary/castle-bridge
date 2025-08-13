import { GameState } from '../../../domain/events/game-state';
import { ServerStateDto } from '../dto/server-contracts';
import { toDomainUnit } from './unit.mapper';

export const toDomainState = (dto: ServerStateDto): GameState => ({
  heroes: dto.heroes.map(h => toDomainUnit(h, 'Heroes')),
  villains: dto.villains.map(v => toDomainUnit(v, 'Villains')),
  isOver: dto.isOver,
  isStarted: dto.isStarted,
});

