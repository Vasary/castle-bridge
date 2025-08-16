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
      this.openScoresTable(scores);
      this.stopGame();
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
    const scoresComponent = this.modalService.open(ScoresComponent);

    let scores: any[] = [];
    serverScores.scores.forEach(serverScore => scores.push(serverScore))

    scoresComponent.componentInstance.scores = scores;
    scoresComponent.componentInstance.output.subscribe((receivedEntry: any) => {
      this.facade.restart();
      this.player = null;
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
    this.isOver = state.isOver;
    this.isStarted = state.isStarted;

    const updateUnit = (serverUnit: any, list: UnitVM[], team: 'Heroes' | 'Villains') => {
      const units = list.filter(u => u.unit.id === serverUnit.id);

      if (units.length === 0) {
        list.push(new UnitVM(serverUnit));
      } else {
        units[0].unit.health = serverUnit.health;
        units[0].unit.power = serverUnit.power;
      }
    }

    const updateList = (serverUnits: any[], list: UnitVM[], team: 'Heroes' | 'Villains') => {
      for (let hero of serverUnits) {
        updateUnit(hero, list, team)
        if (hero.id === this.player?.unit.id) {
          this.player!.unit.health = hero.health;
        }

        checkedId.push(hero.id)
      }
    }

    updateList(state.heroes, this.units, 'Heroes')
    updateList(state.villains, this.units, 'Villains')

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
