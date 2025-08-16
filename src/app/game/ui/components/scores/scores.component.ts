import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Score } from "../../../domain/entities/score";

interface State {
  player: string;
  hits: number[];
  attackedEnemies: string[];
}

@Component({
    selector: 'app-scores',
    templateUrl: './scores.component.html',
    styleUrls: ['./scores.component.scss'],
    standalone: false
})
export class ScoresComponent {
  @Input() scores: Score[] = [];
  @Output() output: EventEmitter<true> = new EventEmitter();

  getStatistics() {
    let statistic: State[] = [];

    this.scores.forEach(score => {
      let statisticScore = statistic.find(s => s.player === score.playerName);

      if (statisticScore === undefined) {
        let hits: number[] = [];
        let enemies: string[] = [];

        hits.push(score.score)
        enemies.push('enemy') // Placeholder since we don't have target info in new Score

        statistic.push({
          player: score.playerName,
          hits: hits,
          attackedEnemies: enemies
        })
      } else {
        statisticScore.hits.push(score.score)
        statisticScore.attackedEnemies.push('enemy')
      }
    });

    return statistic;
  }

  restart() {
    this.output.emit(true);
  }
}
