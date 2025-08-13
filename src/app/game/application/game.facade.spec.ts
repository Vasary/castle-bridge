import { GameFacade } from './game.facade';
import { GAME_REPOSITORY } from '../domain/repositories/game-repository.token';
import { GameRepository } from '../domain/repositories/game.repository';
import { of, Subject } from 'rxjs';
import { Unit } from '../domain/entities/unit';

class RepoStub implements GameRepository {
  join(_: string): void {}
  triggerAttack(): void {}
  restart(): void {}
  player$ = () => of(new Unit('p1','Player','p.png','Heroes',100,10));
  state$ = () => of({ heroes: [], villains: [], isOver: false, isStarted: false });
  fightEvents$ = () => new Subject<any>();
  scores$ = () => of({ scores: [] });
}

describe('GameFacade', () => {
  it('exposes heroes$, villains$, and commands', (done) => {
    const repo: GameRepository = new RepoStub();
    const facade = new GameFacade();
    // monkey-patch inject to return our repo
    (facade as any).repo = repo;

    facade.state$.subscribe(state => {
      expect(state.isOver).toBe(false);
      done();
    });
  });
});

