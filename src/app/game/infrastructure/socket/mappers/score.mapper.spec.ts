import { toDomainScore } from './score.mapper';

describe('score.mapper', () => {
  it('maps server score dto to domain', () => {
    const dto = { triggerId: 'PlayerName', targetId: 'x', triggerHit: 12, targetHealth: 34 };
    const score = toDomainScore(dto as any);
    expect(score.playerName).toBe('PlayerName');
    expect(score.score).toBe(12);
    expect(score.timestamp).toBeDefined();
    expect(score.targetHealth).toBe(34);
  });
});
