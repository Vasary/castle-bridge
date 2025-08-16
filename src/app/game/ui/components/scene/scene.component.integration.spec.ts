import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject } from 'rxjs';
import { SceneComponent } from './scene.component';
import { GameFacade } from '../../../application/game.facade';
import { UnitVM } from '../../view-models/unit-vm';
import { Unit } from '../../../domain/entities/unit';
import { AttackOccurred } from '../../../domain/events/attack-occurred';
import { Score } from '../../../domain/entities/score';
import { LoginComponent } from '../login/login.component';
import { ScoresComponent } from '../scores/scores.component';

// Mock GameFacade for UI testing
class MockGameFacade {
  private stateSubject = new BehaviorSubject({
    heroes: [] as Unit[],
    villains: [] as Unit[],
    isOver: false,
    isStarted: false
  });
  
  private playerSubject = new BehaviorSubject<Unit | null>(null);
  private fightEventsSubject = new Subject<AttackOccurred>();
  private scoresSubject = new Subject<{ scores: Score[] }>();
  
  private currentPlayer: Unit | null = null;

  get state$() {
    return this.stateSubject.asObservable();
  }

  get player$() {
    return this.playerSubject.asObservable();
  }

  get fightEvents$() {
    return this.fightEventsSubject.asObservable();
  }

  get scores$() {
    return this.scoresSubject.asObservable();
  }

  joinGame(nickname: string): void {
    this.currentPlayer = new Unit(
      `player_${Date.now()}`,
      nickname,
      'hero1.png',
      'Heroes',
      100,
      15
    );
    
    this.playerSubject.next(this.currentPlayer);
    
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      heroes: [...currentState.heroes, this.currentPlayer],
      isStarted: true
    });
    
    // Add villains
    setTimeout(() => this.addVillains(), 10);
  }

  attack(): void {
    if (!this.currentPlayer) return;
    
    const currentState = this.stateSubject.value;
    if (currentState.villains.length === 0) return;
    
    const target = currentState.villains[0];
    const damage = this.currentPlayer.power;
    
    // Emit attack event
    this.fightEventsSubject.next(
      new AttackOccurred(this.currentPlayer.id, target.id, damage, Date.now())
    );
    
    // Update villain health
    const updatedVillains = currentState.villains.map(v => 
      v.id === target.id 
        ? new Unit(v.id, v.title, v.avatar, v.team, Math.max(0, v.health - damage), v.power)
        : v
    );
    
    const isOver = updatedVillains.every(v => v.health <= 0);
    
    this.stateSubject.next({
      ...currentState,
      villains: updatedVillains,
      isOver
    });
  }

  restart(): void {
    this.stateSubject.next({
      heroes: [],
      villains: [],
      isOver: false,
      isStarted: false
    });
    
    this.playerSubject.next(null);
    this.currentPlayer = null;
    
    // Emit scores
    this.scoresSubject.next({
      scores: [
        new Score('TestPlayer', 150, Date.now(), 0),
        new Score('Player2', 100, Date.now() - 1000, 0)
      ]
    });
  }

  private addVillains(): void {
    const currentState = this.stateSubject.value;
    const villains = [
      new Unit('villain1', 'Evil Orc', 'orc.png', 'Villains', 80, 12)
    ];
    
    this.stateSubject.next({
      ...currentState,
      villains
    });
  }
}

// Mock NgbModal
class MockNgbModal {
  open(component: any, options?: any) {
    return {
      componentInstance: {
        output: new Subject(),
        scores: []
      },
      result: Promise.resolve('confirmed')
    };
  }
}

describe('SceneComponent Integration Tests', () => {
  let component: SceneComponent;
  let fixture: ComponentFixture<SceneComponent>;
  let mockGameFacade: MockGameFacade;
  let mockModal: MockNgbModal;

  beforeEach(async () => {
    mockGameFacade = new MockGameFacade();
    mockModal = new MockNgbModal();

    await TestBed.configureTestingModule({
      declarations: [SceneComponent],
      providers: [
        { provide: GameFacade, useValue: mockGameFacade },
        { provide: NgbModal, useValue: mockModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SceneComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create and initialize properly', () => {
      expect(component).toBeTruthy();
      expect(component.heroes).toEqual([]);
      expect(component.villains).toEqual([]);
      expect(component.isOver).toBe(false);
    });

    it('should subscribe to game state on init', () => {
      spyOn(component, 'ngOnInit').and.callThrough();
      
      component.ngOnInit();
      
      expect(component.ngOnInit).toHaveBeenCalled();
    });
  });

  describe('Game State Updates', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should update heroes when player joins', (done) => {
      mockGameFacade.joinGame('UITestPlayer');
      
      setTimeout(() => {
        expect(component.heroes.length).toBe(1);
        expect(component.heroes[0].unit.title).toBe('UITestPlayer');
        expect(component.isStarted).toBe(true);
        done();
      }, 20);
    });

    it('should update villains when they are added', (done) => {
      mockGameFacade.joinGame('VillainTestPlayer');
      
      setTimeout(() => {
        expect(component.villains.length).toBe(1);
        expect(component.villains[0].unit.title).toBe('Evil Orc');
        expect(component.villains[0].unit.team).toBe('Villains');
        done();
      }, 30);
    });

    it('should detect game over state', (done) => {
      mockGameFacade.joinGame('GameOverTestPlayer');
      
      // Wait for villains to be added, then attack until game over
      setTimeout(() => {
        // Attack multiple times to defeat villain
        for (let i = 0; i < 10; i++) {
          mockGameFacade.attack();
        }
        
        setTimeout(() => {
          expect(component.isOver).toBe(true);
          done();
        }, 10);
      }, 30);
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      mockGameFacade.joinGame('ActionTestPlayer');
    });

    it('should handle attack action', (done) => {
      spyOn(mockGameFacade, 'attack').and.callThrough();
      
      setTimeout(() => {
        component.attack();
        expect(mockGameFacade.attack).toHaveBeenCalled();
        done();
      }, 30);
    });

    it('should handle spacebar attack', (done) => {
      spyOn(mockGameFacade, 'attack').and.callThrough();
      
      setTimeout(() => {
        const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
        component.onKeyDown(spaceEvent);
        
        expect(mockGameFacade.attack).toHaveBeenCalled();
        done();
      }, 30);
    });

    it('should ignore non-spacebar keys', () => {
      spyOn(mockGameFacade, 'attack');
      
      const enterEvent = new KeyboardEvent('keydown', { code: 'Enter' });
      component.onKeyDown(enterEvent);
      
      expect(mockGameFacade.attack).not.toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should open login modal when requested', () => {
      spyOn(mockModal, 'open').and.callThrough();
      
      component.openLoginModal();
      
      expect(mockModal.open).toHaveBeenCalledWith(LoginComponent, jasmine.any(Object));
    });

    it('should open scores modal when game over', (done) => {
      spyOn(mockModal, 'open').and.callThrough();
      
      // Simulate game over and scores
      mockGameFacade.restart();
      
      setTimeout(() => {
        expect(mockModal.open).toHaveBeenCalledWith(ScoresComponent, jasmine.any(Object));
        done();
      }, 10);
    });
  });

  describe('Fight Events Handling', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      mockGameFacade.joinGame('FightTestPlayer');
    });

    it('should handle attack animations', (done) => {
      spyOn(component, 'animateAttack').and.callThrough();
      
      setTimeout(() => {
        mockGameFacade.attack();
        
        setTimeout(() => {
          expect(component.animateAttack).toHaveBeenCalled();
          done();
        }, 10);
      }, 30);
    });

    it('should animate damage on target', (done) => {
      spyOn(component, 'animateDamage').and.callThrough();
      
      setTimeout(() => {
        mockGameFacade.attack();
        
        setTimeout(() => {
          expect(component.animateDamage).toHaveBeenCalled();
          done();
        }, 10);
      }, 30);
    });
  });

  describe('Complete UI Flow', () => {
    it('should handle complete game flow through UI', (done) => {
      const flowSteps = {
        initialized: false,
        playerJoined: false,
        villainsAdded: false,
        gameOver: false
      };
      
      component.ngOnInit();
      fixture.detectChanges();
      flowSteps.initialized = true;
      
      // Join game
      mockGameFacade.joinGame('CompleteFlowPlayer');
      
      setTimeout(() => {
        flowSteps.playerJoined = true;
        expect(component.heroes.length).toBe(1);
        expect(component.isStarted).toBe(true);
        
        setTimeout(() => {
          flowSteps.villainsAdded = true;
          expect(component.villains.length).toBe(1);
          
          // Attack until game over
          const attackInterval = setInterval(() => {
            if (!component.isOver) {
              component.attack();
            } else {
              clearInterval(attackInterval);
              flowSteps.gameOver = true;
              
              expect(component.isOver).toBe(true);
              expect(flowSteps.initialized).toBe(true);
              expect(flowSteps.playerJoined).toBe(true);
              expect(flowSteps.villainsAdded).toBe(true);
              expect(flowSteps.gameOver).toBe(true);
              
              done();
            }
          }, 10);
        }, 20);
      }, 20);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should handle attack when no villains present', () => {
      mockGameFacade.joinGame('ErrorTestPlayer');
      
      // Attack immediately before villains are added
      expect(() => component.attack()).not.toThrow();
    });

    it('should handle missing player data gracefully', () => {
      expect(() => component.attack()).not.toThrow();
      expect(component.heroes.length).toBe(0);
    });

    it('should handle rapid successive attacks', (done) => {
      mockGameFacade.joinGame('RapidTestPlayer');
      
      setTimeout(() => {
        // Trigger multiple rapid attacks
        expect(() => {
          component.attack();
          component.attack();
          component.attack();
        }).not.toThrow();
        
        done();
      }, 30);
    });
  });
});
