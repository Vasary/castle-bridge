import { TestBed } from '@angular/core/testing';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Subject } from 'rxjs';
import { AttackOccurred } from '../../domain/events/attack-occurred';
import { AttackEventDto, JoinGameDto, ServerScoresDto, ServerStateDto } from './dto/server-contracts';
import { EVENTS } from './event-names';
import { SocketGameRepository } from './socket-game.repository';

// Mock Socket.IO implementation that simulates server behavior
class MockSocket {
  private eventHandlers: { [event: string]: Function[] } = {};
  private emittedEvents: { event: string; data: any }[] = [];

  // Subjects to simulate server responses
  private stateSubject = new BehaviorSubject<ServerStateDto>({
    heroes: [],
    villains: [],
    isOver: false,
    isStarted: false
  });

  private attackSubject = new Subject<AttackEventDto>();
  private scoresSubject = new Subject<ServerScoresDto>();
  private playerSubject = new Subject<any>();

  // Mock socket methods
  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  emit(event: string, data?: any): void {
    this.emittedEvents.push({ event, data });

    // Simulate server responses based on emitted events
    this.simulateServerResponse(event, data);
  }

  fromEvent(event: string) {
    switch (event) {
      case EVENTS.gameState:
        return this.stateSubject.asObservable();
      case EVENTS.unitAttack:
        return this.attackSubject.asObservable();
      case EVENTS.gameOver:
        return this.scoresSubject.asObservable();
      case EVENTS.playerJoin:
        return this.playerSubject.asObservable();
      default:
        return new Subject().asObservable();
    }
  }

  // Simulate server behavior
  private simulateServerResponse(event: string, data: any): void {
    setTimeout(() => {
      switch (event) {
        case EVENTS.playerJoin:
          this.simulatePlayerJoin(data);
          break;
        case EVENTS.unitAttack:
          this.simulateAttack();
          break;
        case EVENTS.gameRestart:
          this.simulateRestart();
          break;
      }
    }, 10); // Small delay to simulate network
  }

  private simulatePlayerJoin(data: string): void {
    const joinData: JoinGameDto = JSON.parse(data);

    // Simulate player creation
    const newPlayer = {
      id: joinData.id,
      title: joinData.nickname,
      avatar: 'hero1.png',
      health: 100,
      power: 15,
      team: 'Heroes'
    };

    // Emit player event
    this.playerSubject.next(newPlayer);

    // Update game state with new player
    const currentState = this.stateSubject.value;
    const updatedState: ServerStateDto = {
      ...currentState,
      heroes: [...currentState.heroes, newPlayer],
      isStarted: currentState.heroes.length >= 0 // Start game when first player joins
    };

    this.stateSubject.next(updatedState);
  }

  private simulateAttack(): void {
    const currentState = this.stateSubject.value;
    if (currentState.heroes.length === 0) return;

    // Simulate attack event
    const attackEvent: AttackEventDto = {
      trigger: { id: currentState.heroes[0].id, title: 'Hero', avatar: 'hero1.png', health: 100, power: 15 },
      target: { id: 'villain1', title: 'Villain', avatar: 'orc.png', health: 80, power: 12 },
      attackPower: 15
    };

    this.attackSubject.next(attackEvent);

    // Update state after attack
    const updatedState: ServerStateDto = {
      ...currentState,
      villains: currentState.villains.map(v =>
        v.id === 'villain1' ? { ...v, health: Math.max(0, v.health - 15) } : v
      )
    };

    this.stateSubject.next(updatedState);
  }

  private simulateRestart(): void {
    // Reset game state
    const initialState: ServerStateDto = {
      heroes: [],
      villains: [],
      isOver: false,
      isStarted: false
    };

    this.stateSubject.next(initialState);

    // Emit scores
    const scores: ServerScoresDto = {
      scores: [
        { triggerId: 'TestPlayer', targetId: 'villain1', triggerHit: 100, targetHealth: 0 }
      ]
    };

    this.scoresSubject.next(scores);
  }

  // Test helper methods
  getEmittedEvents() {
    return this.emittedEvents;
  }

  clearEmittedEvents() {
    this.emittedEvents = [];
  }

  // Simulate adding villains for testing
  addVillains() {
    const currentState = this.stateSubject.value;
    const updatedState: ServerStateDto = {
      ...currentState,
      villains: [
        {
          id: 'villain1',
          title: 'Evil Orc',
          avatar: 'orc.png',
          health: 80,
          power: 12
        }
      ]
    };

    this.stateSubject.next(updatedState);
  }

  // Simulate server emitting gameRestarted event
  simulateGameRestarted() {
    // Trigger the gameRestarted event handlers
    if (this.eventHandlers[EVENTS.gameRestarted]) {
      this.eventHandlers[EVENTS.gameRestarted].forEach(handler => handler());
    }
  }
}

describe('SocketGameRepository Integration Tests', () => {
  let repository: SocketGameRepository;
  let mockSocket: MockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();

    TestBed.configureTestingModule({
      providers: [
        SocketGameRepository,
        { provide: Socket, useValue: mockSocket }
      ]
    });

    repository = TestBed.inject(SocketGameRepository);
  });

  describe('Player Join Flow', () => {
    it('should emit join event with player ID and nickname', () => {
      // Act
      repository.join('TestPlayer');

      // Assert
      const emittedEvents = mockSocket.getEmittedEvents();
      expect(emittedEvents.length).toBe(1);
      expect(emittedEvents[0].event).toBe(EVENTS.playerJoin);

      const joinData: JoinGameDto = JSON.parse(emittedEvents[0].data);
      expect(joinData.nickname).toBe('TestPlayer');
      expect(joinData.id).toBeDefined();
      expect(typeof joinData.id).toBe('string');
      expect(joinData.id.length).toBeGreaterThan(0);
    });

    it('should receive player data after joining', (done) => {
      // Arrange
      let playerReceived = false;

      repository.player$().subscribe(player => {
        if (!playerReceived && player) {
          playerReceived = true;
          expect(player.title).toBe('TestPlayer');
          expect(player.id).toBeDefined();
          expect(player.health).toBe(100);
          expect(player.team).toBe('Heroes');
          done();
        }
      });

      // Act
      repository.join('TestPlayer');
    });

    it('should update game state when player joins', (done) => {
      // Arrange
      let stateUpdated = false;

      repository.state$().subscribe(state => {
        if (!stateUpdated && state.heroes.length > 0) {
          stateUpdated = true;
          expect(state.heroes.length).toBe(1);
          expect(state.heroes[0].title).toBe('TestPlayer');
          expect(state.isStarted).toBe(true);
          done();
        }
      });

      // Act
      repository.join('TestPlayer');
    });
  });

  describe('Attack Flow', () => {
    beforeEach(() => {
      // Setup: Add a player and villains
      repository.join('TestPlayer');
      mockSocket.addVillains();
    });

    it('should emit attack event', () => {
      // Act
      repository.triggerAttack();

      // Assert
      const emittedEvents = mockSocket.getEmittedEvents();
      const attackEvents = emittedEvents.filter(e => e.event === EVENTS.unitAttack);
      expect(attackEvents.length).toBe(1);
    });

    it('should receive attack events with correct structure', (done) => {
      // Arrange
      repository.fightEvents$().subscribe(attackEvent => {
        expect(attackEvent).toBeInstanceOf(AttackOccurred);
        expect(attackEvent.attackerId).toBeDefined();
        expect(attackEvent.targetId).toBe('villain1');
        expect(attackEvent.damage).toBe(15);
        expect(attackEvent.timestamp).toBeDefined();
        done();
      });

      // Act
      repository.triggerAttack();
    });
  });

  describe('Game Restart Flow', () => {
    it('should emit restart event', () => {
      // Act
      repository.restart();

      // Assert
      const emittedEvents = mockSocket.getEmittedEvents();
      const restartEvents = emittedEvents.filter(e => e.event === EVENTS.gameRestart);
      expect(restartEvents.length).toBe(1);
    });

    it('should receive scores after restart', (done) => {
      // Arrange
      repository.scores$().subscribe(gameScores => {
        expect(gameScores.scores).toBeDefined();
        expect(gameScores.scores.length).toBeGreaterThan(0);
        expect(gameScores.scores[0].playerName).toBe('TestPlayer');
        expect(gameScores.scores[0].score).toBe(100);
        done();
      });

      // Act
      repository.restart();
    });

    it('should reset game state when server emits gameRestarted', (done) => {
      // Arrange: First join a game and add villains
      repository.join('RestartTestPlayer');
      mockSocket.addVillains();

      let initialStateReceived = false;

      repository.state$().subscribe(state => {
        if (!initialStateReceived && state.heroes.length > 0 && state.villains.length > 0) {
          initialStateReceived = true;
          expect(state.isStarted).toBe(true);

          // Simulate server emitting gameRestarted event
          mockSocket.simulateGameRestarted();
        } else if (initialStateReceived && state.heroes.length === 0 && state.villains.length === 0) {
          // Verify state was reset
          expect(state.heroes).toEqual([]);
          expect(state.villains).toEqual([]);
          expect(state.isOver).toBe(false);
          expect(state.isStarted).toBe(false);
          done();
        }
      });
    });

    it('should clear player when server emits gameRestarted', (done) => {
      // Arrange: First join a game
      repository.join('PlayerClearTestPlayer');

      let playerReceived = false;

      repository.player$().subscribe(player => {
        if (!playerReceived && player) {
          playerReceived = true;
          expect(player.title).toBe('PlayerClearTestPlayer');

          // Simulate server emitting gameRestarted event
          mockSocket.simulateGameRestarted();
        } else if (playerReceived && player === null) {
          // Verify player was cleared
          expect(player).toBeNull();
          done();
        }
      });
    });
  });

  describe('Complete Game Flow Integration', () => {
    it('should handle complete game flow: join -> attack -> restart', (done) => {
      let step = 0;

      // Monitor state changes
      repository.state$().subscribe(state => {
        if (step === 0 && state.heroes.length > 0) {
          step++;
          // Add villains and trigger attack
          mockSocket.addVillains();
          setTimeout(() => repository.triggerAttack(), 10);
        }
      });

      // Monitor attack events
      repository.fightEvents$().subscribe(attackEvent => {
        if (step === 1) {
          step++;
          expect(attackEvent.damage).toBe(15);
          // Restart game
          setTimeout(() => repository.restart(), 10);
        }
      });

      // Monitor scores (indicates restart completed)
      repository.scores$().subscribe(scores => {
        if (step === 2) {
          expect(scores.scores.length).toBeGreaterThan(0);
          done();
        }
      });

      // Start the flow
      repository.join('IntegrationTestPlayer');
    });
  });
});
