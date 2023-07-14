import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Score} from "../model/scores/score";

interface State {
  player: string;
  hits: number[];
  attackedEnemies: string[];
}

@Component({
  selector: 'app-scores',
  templateUrl: './scores.component.html',
  styleUrls: ['./scores.component.scss']
})
export class ScoresComponent {
  @Input() scores: Score[] = [];
  @Output() output: EventEmitter<true> = new EventEmitter();

  getStatistics() {
    let statistic: State[] = [];

    this.scores.forEach(score => {
      let statisticScore = statistic.find(s => s.player === score.triggerId);

      if (statisticScore === undefined) {
        let hits: number[] = [];
        let enemies: string[] = [];

        hits.push(score.triggerHit)
        enemies.push(score.targetId)

        statistic.push({
          player: score.triggerId,
          hits: hits,
          attackedEnemies: enemies
        })
      } else {
        statisticScore.hits.push(score.triggerHit)
        statisticScore.attackedEnemies.push(score.targetId)
      }
    });

    return statistic;
  }

  restart() {
    this.output.emit(true);
  }
}
