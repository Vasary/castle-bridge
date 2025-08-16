import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { Score } from '../domain/entities/score';
import { Unit } from '../domain/entities/unit';
import { AttackOccurred } from '../domain/events/attack-occurred';
import { GameState } from '../domain/events/game-state';
import { GAME_REPOSITORY } from '../domain/repositories/game-repository.token';
import { GameRepository } from '../domain/repositories/game.repository';
import { GameFacade } from './game.facade';

// Mock repository that simulates complete game behavior
class MockGameRepository implements GameRepository {
  private playerSubject = new BehaviorSubject<Unit | null>(null);
  private stateSubject = new BehaviorSubject<GameState>({
    heroes: [],
    villains: [],
    isOver: false,
    isStarted: false
  });
  private fightEventsSubject = new Subject<AttackOccurred>();
  private scoresSubject = new Subject<{ scores: Score[] }>();

  private gameStarted = false;
  private currentPlayer: Unit | null = null;

  join(nickname: string): void {
    // Simulate player creation with unique ID
    const playerId = `player_${Date.now()}`;
    this.currentPlayer = new Unit(
      playerId,
      nickname,
      'hero1.png',
      'Heroes',
      100,
      15
    );

    // Emit player
    this.playerSubject.next(this.currentPlayer);

    // Update game state
    const currentState = this.stateSubject.value;
    const updatedState: GameState = {
      ...currentState,
      heroes: [...currentState.heroes, this.currentPlayer],
      isStarted: true
    };

    this.stateSubject.next(updatedState);
    this.gameStarted = true;

    // Add some villains after player joins
    setTimeout(() => this.addVillains(), 100);
  }

  triggerAttack(): void {
    if (!this.gameStarted || !this.currentPlayer) return;

    const currentState = this.stateSubject.value;
    if (currentState.villains.length === 0) return;

    const target = currentState.villains[0];
    const damage = this.currentPlayer.power;

    // Emit attack event
    const attackEvent = new AttackOccurred(
      this.currentPlayer.id,
      target.id,
      damage,
      Date.now()
    );

    this.fightEventsSubject.next(attackEvent);

    // Update target health
    const updatedVillains = currentState.villains.map(v =>
      v.id === target.id
        ? new Unit(v.id, v.title, v.avatar, v.team, Math.max(0, v.health - damage), v.power)
        : v
    );

    // Check if game is over
    const isOver = updatedVillains.every(v => v.health <= 0);

    const updatedState: GameState = {
      ...currentState,
      villains: updatedVillains,
      isOver
    };

    this.stateSubject.next(updatedState);

    // If game is over, emit scores
    if (isOver) {
      setTimeout(() => this.emitScores(), 50);
    }
  }

  restart(): void {
    // Reset game state
    const initialState: GameState = {
      heroes: [],
      villains: [],
      isOver: false,
      isStarted: false
    };

    this.stateSubject.next(initialState);
    this.gameStarted = false;
    this.currentPlayer = null;
    this.playerSubject.next(null);

    // Emit final scores
    this.emitScores();
  }

  player$() {
    return this.playerSubject.asObservable();
  }

  state$() {
    return this.stateSubject.asObservable();
  }

  fightEvents$() {
    return this.fightEventsSubject.asObservable();
  }

  scores$() {
    return this.scoresSubject.asObservable();
  }

  private addVillains(): void {
    const currentState = this.stateSubject.value;
    const villains = [
      new Unit('villain1', 'Evil Orc', 'orc.png', 'Villains', 80, 12),
      new Unit('villain2', 'Dark Wizard', 'wizard.png', 'Villains', 60, 18)
    ];

    const updatedState: GameState = {
      ...currentState,
      villains
    };

    this.stateSubject.next(updatedState);
  }

  private emitScores(): void {
    const scores: Score[] = [
      new Score('TestPlayer', 150, Date.now(), 0),
      new Score('Player2', 100, Date.now() - 1000, 0)
    ];

    this.scoresSubject.next({ scores });
  }
}

describe('GameFacade Integration Tests', () => {
  let facade: GameFacade;
  let mockRepository: MockGameRepository;

  beforeEach(() => {
    mockRepository = new MockGameRepository();

    TestBed.configureTestingModule({
      providers: [
        GameFacade,
        { provide: GAME_REPOSITORY, useValue: mockRepository }
      ]
    });

    facade = TestBed.inject(GameFacade);
  });

  describe('Player Join Flow', () => {
    it('should handle player joining and update state', (done) => {
      let stateUpdated = false;

      facade.state$.subscribe(state => {
        if (!stateUpdated && state.heroes.length > 0) {
          stateUpdated = true;
          expect(state.heroes.length).toBe(1);
          expect(state.heroes[0].title).toBe('IntegrationTestPlayer');
          expect(state.isStarted).toBe(true);
          done();
        }
      });

      facade.joinGame('IntegrationTestPlayer');
    });

    it('should provide player observable', (done) => {
      facade.player$.subscribe(player => {
        if (player) {
          expect(player.title).toBe('TestPlayer');
          expect(player.team).toBe('Heroes');
          expect(player.health).toBe(100);
          done();
        }
      });

      facade.joinGame('TestPlayer');
    });
  });

  describe('Combat Flow', () => {
    beforeEach((done) => {
      // Join game and wait for villains to be added
      facade.joinGame('CombatTestPlayer');

      facade.state$.subscribe(state => {
        if (state.villains.length > 0) {
          done();
        }
      });
    });

    it('should handle attack and update villain health', (done) => {
      let attackProcessed = false;

      facade.fightEvents$.subscribe(attackEvent => {
        if (!attackProcessed) {
          attackProcessed = true;
          expect(attackEvent.attackerId).toBeDefined();
          expect(attackEvent.targetId).toBe('villain1');
          expect(attackEvent.damage).toBe(15);
          done();
        }
      });

      facade.attack();
    });

    it('should detect game over when all villains defeated', (done) => {
      let attackCount = 0;
      const maxAttacks = 10; // Ensure we don't loop forever

      facade.state$.subscribe(state => {
        if (state.isOver) {
          expect(state.villains.every(v => v.health <= 0)).toBe(true);
          done();
        } else if (state.villains.length > 0 && attackCount < maxAttacks) {
          // Continue attacking until game is over
          setTimeout(() => {
            attackCount++;
            facade.attack();
          }, 10);
        }
      });

      // Start attacking
      facade.attack();
    });
  });

  describe('Game Restart Flow', () => {
    it('should reset game state and emit scores', (done) => {
      let scoresReceived = false;

      // First join and then restart
      facade.joinGame('RestartTestPlayer');

      facade.scores$.subscribe(gameScores => {
        if (!scoresReceived) {
          scoresReceived = true;
          expect(gameScores.scores.length).toBeGreaterThan(0);
          expect(gameScores.scores[0].playerName).toBeDefined();
          done();
        }
      });

      // Wait a bit then restart
      setTimeout(() => facade.restart(), 100);
    });

    it('should clear heroes and villains after restart', (done) => {
      let gameRestarted = false;

      // Join game first
      facade.joinGame('ClearTestPlayer');

      facade.state$.subscribe(state => {
        if (gameRestarted && state.heroes.length === 0 && state.villains.length === 0) {
          expect(state.isStarted).toBe(false);
          expect(state.isOver).toBe(false);
          done();
        }
      });

      // Wait for game to start, then restart
      setTimeout(() => {
        gameRestarted = true;
        facade.restart();
      }, 150);
    });
  });

  describe('Complete Game Flow', () => {
    it('should handle full game cycle: join -> attack -> win -> restart', (done) => {
      const gameFlow = {
        joined: false,
        villainsAdded: false,
        attacked: false,
        gameWon: false,
        restarted: false
      };

      // Monitor state changes
      facade.state$.subscribe(state => {
        if (!gameFlow.joined && state.heroes.length > 0) {
          gameFlow.joined = true;
          expect(state.isStarted).toBe(true);
        }

        if (!gameFlow.villainsAdded && state.villains.length > 0) {
          gameFlow.villainsAdded = true;
          // Start attacking
          facade.attack();
        }

        if (!gameFlow.gameWon && state.isOver) {
          gameFlow.gameWon = true;
          expect(state.villains.every(v => v.health <= 0)).toBe(true);
          // Restart game
          setTimeout(() => facade.restart(), 50);
        }

        if (gameFlow.gameWon && !gameFlow.restarted &&
            state.heroes.length === 0 && state.villains.length === 0) {
          gameFlow.restarted = true;
          expect(state.isStarted).toBe(false);
          done();
        }
      });

      // Monitor attack events
      facade.fightEvents$.subscribe(attackEvent => {
        if (!gameFlow.attacked) {
          gameFlow.attacked = true;
          expect(attackEvent.damage).toBeGreaterThan(0);

          // Continue attacking if game not over
          setTimeout(() => {
            facade.state$.subscribe(state => {
              if (!state.isOver && state.villains.some(v => v.health > 0)) {
                facade.attack();
              }
            }).unsubscribe();
          }, 20);
        }
      });

      // Start the game flow
      facade.joinGame('FullFlowTestPlayer');
    });
  });

  describe('Error Handling', () => {
    it('should handle attack when no villains present', () => {
      facade.joinGame('ErrorTestPlayer');

      // Attack immediately before villains are added
      expect(() => facade.attack()).not.toThrow();
    });

    it('should handle restart when game not started', () => {
      expect(() => facade.restart()).not.toThrow();
    });

    it('should handle multiple rapid attacks', (done) => {
      let attackCount = 0;

      facade.joinGame('RapidAttackPlayer');

      facade.state$.subscribe(state => {
        if (state.villains.length > 0 && attackCount < 3) {
          // Trigger multiple rapid attacks
          facade.attack();
          facade.attack();
          facade.attack();
          attackCount = 3;

          // Verify game still works
          setTimeout(() => {
            expect(state.villains.some(v => v.health < 80)).toBe(true);
            done();
          }, 100);
        }
      });
    });
  });
});
