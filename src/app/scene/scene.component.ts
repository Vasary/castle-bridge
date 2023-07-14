import {Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import {Unit} from "../model/unit/unit";
import {animateAttack, animateDamage, fadeInOut} from './animation/animation';
import {createPlayer, createScore, createUnit, getUnitArea, updateUnitWithServerData} from "./helper/helper";
import {NgbModal, NgbModalConfig} from '@ng-bootstrap/ng-bootstrap';
import {ScoresComponent} from "../scores/scores.component";
import {LoginComponent} from "../login/login.component";
import {ApiService} from "../service/api";
import {Score} from "../model/scores/score";
import {ServerScores, ServerState, ServerUnit} from "../service/contract/contracts";
import {Team} from "../types/types";

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
  animations: [fadeInOut()],
  providers: [NgbModalConfig, NgbModal],
})
export class SceneComponent implements OnInit {
  player: Unit | null;
  units: Unit[] = [];
  isOver: boolean = false;
  isStarted: boolean = false;

  @ViewChildren('unit') elements!: QueryList<ElementRef>;

  constructor(config: NgbModalConfig, private modalService: NgbModal, private api: ApiService) {
    config.backdrop = 'static';
    config.keyboard = false;
    config.centered = true
    config.size = 'lg';
    this.player = null;
  }

  ngOnInit(): void {
    this.api.player().subscribe(player => this.player = createPlayer(player))
    this.api.state().subscribe(state => this.updateState(state))

    this.api.fightEvents().subscribe(event => {
      const targets = this.units.filter(target => target.id === event.target.id)
      const triggers = this.units.filter(trigger => trigger.id === event.trigger.id)
      const power = event.attackPower;

      if (targets.length === 0 || triggers.length === 0) {
        throw new Error('Invalid attack event declaration')
      }

      const trigger = triggers[0];
      const target = targets[0];

      this.applyAttackAnimation(trigger)
      this.applyDamage(target, power);
    })

    this.api.scores().subscribe(scores => {
      this.openScoresTable(scores);
      this.stopGame();
    })

    this.api.gameRestarted().subscribe(() => location.reload());
  }

  isGameOver(): boolean {
    return this.villains.filter(v => v.health > 0).length === 0 || this.heroes.filter(h => h.health > 0).length === 0;
  }

  stopGame(): void {
    this.isOver = true;
    this.player = null;
  }

  joinGame(): void {
    const loginForm = this.modalService.open(LoginComponent);

    loginForm.componentInstance.output.subscribe((form: any) => {
      this.api.joinPlayer(form.username);
      loginForm.close();
    })
  }

  attack(): void {
    this.api.triggerAttack()
  }

  private openScoresTable(serverScores: ServerScores): void {
    const scoresComponent = this.modalService.open(ScoresComponent);

    let scores: Score[] = [];
    serverScores.scores.forEach(serverScore => scores.push(createScore(serverScore)))

    scoresComponent.componentInstance.scores = scores;
    scoresComponent.componentInstance.output.subscribe((receivedEntry: any) => {
      this.api.restartGame()
      this.player = null;
    })
  }

  private applyAttackAnimation(unit: Unit): void {
    const area = getUnitArea(unit, this.elements);
    const animation = animateAttack(unit.team);

    area.nativeElement.animate(animation.transitions, animation.params);
  }

  private applyDamage(target: Unit, power: number) {

    target.applyDamage(power)

    const area = getUnitArea(target, this.elements);
    const animation = animateDamage();

    area.nativeElement.animate(animation.transitions, animation.params);
  }

  private updateState(state: ServerState) {
    let checkedId: string[] = [];
    this.isOver = state.isOver;
    this.isStarted = state.isStarted;

    const updateUnit = (serverUnit: ServerUnit, list: Unit[], team: Team) => {
      const units = list.filter(u => u.id === serverUnit.id);

      units.length === 0
        ? list.push(createUnit(serverUnit, team))
        : updateUnitWithServerData(serverUnit, units[0])
    }

    const updateList = (serverUnits: ServerUnit[], list: Unit[], team: Team) => {
      for (let hero of serverUnits) {
        updateUnit(hero, list, team)
        if (hero.id === this.player?.id) {
          this.player.health = hero.health;
        }

        checkedId.push(hero.id)
      }
    }

    updateList(state.heroes, this.units, 'Heroes')
    updateList(state.villains, this.units, 'Villains')

    for (const unit of this.units) {
      if (!checkedId.includes(unit.id)) {
        const position = this.units.findIndex(u => u.id === unit.id);

        if (position > -1) {
          this.units.splice(position, 1);
        }
      }
    }
  }

  get villains(): Unit[] {
    return this.units.filter(u => u.team === 'Villains');
  }

  get heroes(): Unit[] {
    return this.units.filter(u => u.team === 'Heroes');
  }
}
