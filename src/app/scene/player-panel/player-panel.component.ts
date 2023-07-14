import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Unit} from "../../model/unit/unit";
import {Timer} from "../../types/types";

@Component({
  selector: 'app-player-panel',
  templateUrl: './player-panel.component.html',
  styleUrls: ['./player-panel.component.scss']
})
export class PlayerPanelComponent {
  @Input() player!: Unit;
  @Output() output: EventEmitter<any> = new EventEmitter();

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.attack();
    }
  }

  reload: boolean = false;
  reloadTimer: null | Timer = null;

  attack() {
    if (this.reload) {
      return;
    }

    this.output.emit('attack');

    this.reload = true;
    this.reloadTimer = setTimeout(() => {
      this.reload = false;
      if (null !== this.reloadTimer) {
        clearTimeout(this.reloadTimer)
      }
    }, this.reloadTime)
  }

  get reloadTime(): number {
    return 500 * this.player.power / 10;
  }
}
