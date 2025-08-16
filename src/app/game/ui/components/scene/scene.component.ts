import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { GameFacade } from "../../../application/game.facade";
import { Score } from "../../../domain/entities/score";
import { animateAttack, animateDamage, fadeInOut } from '../../animations/animation';
import { UnitVM } from "../../view-models/unit-vm";
import { LoginComponent } from "../login/login.component";
import { ScoresComponent } from "../scores/scores.component";
import { getUnitArea } from "./helper/helper";

@Component({
    selector: 'app-scene',
    templateUrl: './scene.component.html',
    styleUrls: ['./scene.component.scss'],
    animations: [fadeInOut()],
    providers: [NgbModalConfig, NgbModal],
    standalone: false
})
export class SceneComponent implements OnInit {
  player: UnitVM | null;
  units: UnitVM[] = [];
  isOver: boolean = false;
  isStarted: boolean = false;
  private currentScoresModal: any = null;

  @ViewChildren('unit') elements!: QueryList<ElementRef>;

  constructor(config: NgbModalConfig, private modalService: NgbModal, private facade: GameFacade) {
    config.backdrop = 'static';
    config.keyboard = false;
    config.centered = true
    config.size = 'lg';
    this.player = null;
  }

  ngOnInit(): void {
    this.facade.player$.subscribe((player) => this.player = player ? new UnitVM(player) : null);
    this.facade.state$.subscribe(state => this.updateState(state));

    this.facade.fightEvents$.subscribe(event => {
      const targets = this.units.filter(target => target.unit.id === event.targetId)
      const triggers = this.units.filter(trigger => trigger.unit.id === event.attackerId)
      const power = event.damage;

      if (targets.length === 0 || triggers.length === 0) {
        throw new Error('Invalid attack event declaration')
      }

      const trigger = triggers[0];
      const target = targets[0];

      this.animateAttack(trigger)
      this.animateDamage(target, power);
    })

    this.facade.scores$.subscribe(scores => {
      // Only show scores table and stop game if there are actual scores

      if (scores.scores && scores.scores.length > 0) {
        this.openScoresTable(scores);
        this.stopGame();
      }
    })
  }

  isGameOver(): boolean {
    return this.villains.filter(v => v.unit.health > 0).length === 0 || this.heroes.filter(h => h.unit.health > 0).length === 0;
  }

  stopGame(): void {
    this.isOver = true;
    this.player = null;
  }

  joinGame(): void {
    const loginForm = this.modalService.open(LoginComponent);

    loginForm.componentInstance.output.subscribe((form: any) => {
      this.facade.joinGame(form.username);
      loginForm.close();
    })
  }

  attack(): void {
    this.facade.attack();
  }

  private openScoresTable(serverScores: { scores: Score[] }): void {
    if (this.currentScoresModal == null) {
      this.currentScoresModal = this.modalService.open(ScoresComponent);
    }

    let scores: any[] = [];
    serverScores.scores.forEach(serverScore => scores.push(serverScore))

    this.currentScoresModal.componentInstance.scores = scores;
    this.currentScoresModal.componentInstance.output.subscribe(() => {
      this.facade.restart();

      this.currentScoresModal.close();
      this.currentScoresModal = null;
    })
  }

  // Public methods for testing
  animateAttack(unit: UnitVM): void {
    const area = getUnitArea(unit, this.elements);
    const animation = animateAttack(unit.unit.team);

    area.nativeElement.animate(animation.transitions, animation.params);
  }

  animateDamage(target: UnitVM, power: number): void {
    target.applyDamage(power)

    const area = getUnitArea(target, this.elements);
    const animation = animateDamage();

    area.nativeElement.animate(animation.transitions, animation.params);
  }

  openLoginModal(): void {
    this.joinGame();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault();
      this.attack();
    }
  }

  private updateState(state: { heroes: any[]; villains: any[]; isOver: boolean; isStarted: boolean; }) {
    let checkedId: string[] = [];

    // Detect game restart: if we had a scores modal open and now game is fresh
    const wasGameRestarted = this.currentScoresModal && !state.isStarted && !state.isOver;

    this.isOver = state.isOver;
    this.isStarted = state.isStarted;

    // If game was restarted, close scores modal but continue processing the new state
    if (wasGameRestarted) {
      if (this.currentScoresModal) {
        // Remove focus from any active element before closing modal
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        // Use setTimeout to ensure focus is removed before closing
        setTimeout(() => {
          if (this.currentScoresModal) {
            this.currentScoresModal.close();
            this.currentScoresModal = null;
          }
        }, 0);
      }
      // Clear player (they need to rejoin) but process the new villains
      this.player = null;
    }

    const updateUnit = (serverUnit: any, list: UnitVM[]) => {
      const units = list.filter(u => u.unit.id === serverUnit.id);

      if (units.length === 0) {
        list.push(new UnitVM(serverUnit));
      } else {
        units[0].unit.health = serverUnit.health;
        units[0].unit.power = serverUnit.power;
      }
    }

    const updateList = (serverUnits: any[], list: UnitVM[]) => {
      for (let hero of serverUnits) {
        updateUnit(hero, list)
        if (hero.id === this.player?.unit.id) {
          this.player!.unit.health = hero.health;
        }

        checkedId.push(hero.id)
      }
    }

    updateList(state.heroes, this.units)
    updateList(state.villains, this.units)

    for (const unit of this.units) {
      if (!checkedId.includes(unit.unit.id)) {
        const position = this.units.findIndex(u => u.unit.id === unit.unit.id);

        if (position > -1) {
          this.units.splice(position, 1);
        }
      }
    }
  }

  get villains(): UnitVM[] {
    return this.units.filter(u => u.unit.team === 'Villains');
  }

  get heroes(): UnitVM[] {
    return this.units.filter(u => u.unit.team === 'Heroes');
  }
}
