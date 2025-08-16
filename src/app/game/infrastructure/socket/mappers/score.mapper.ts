import { Score } from '../../../domain/entities/score';
import { ServerScoreDto } from '../dto/server-contracts';

export const toDomainScore = (dto: ServerScoreDto): Score =>
  new Score(dto.triggerId, dto.triggerHit, Date.now(), dto.targetHealth);
