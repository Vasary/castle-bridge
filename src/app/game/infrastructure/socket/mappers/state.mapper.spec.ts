import { toDomainState } from './state.mapper';
import { ServerStateDto } from '../dto/server-contracts';

describe('state.mapper', () => {
  it('maps heroes and villains with teams', () => {
    const input: ServerStateDto = {
      heroes: [{ id: 'h1', title: 'H', avatar: 'h.png', health: 100, power: 10 } as any],
      villains: [{ id: 'v1', title: 'V', avatar: 'v.png', health: 50, power: 7 } as any],
      isOver: false,
      isStarted: true,
    };

    const out = toDomainState(input);
    expect(out.heroes.length).toBe(1);
    expect(out.heroes[0].team).toBe('Heroes');
    expect(out.villains[0].team).toBe('Villains');
    expect(out.isOver).toBe(false);
    expect(out.isStarted).toBe(true);
  });
});

