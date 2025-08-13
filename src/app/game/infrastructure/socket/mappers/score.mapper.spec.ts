import { toDomainScore } from './score.mapper';

describe('score.mapper', () => {
  it('maps server score dto to domain', () => {
    const dto = { triggerId: 't', targetId: 'x', triggerHit: 12, targetHealth: 34 };
    const score = toDomainScore(dto as any);
    expect(score.triggerId).toBe('t');
    expect(score.targetId).toBe('x');
    expect(score.triggerHit).toBe(12);
    expect(score.targetHealth).toBe(34);
  });
});

