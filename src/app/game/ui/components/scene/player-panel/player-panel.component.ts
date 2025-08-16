import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Unit } from "../../../../domain/entities/unit";

type Timer = ReturnType<typeof setTimeout>;

@Component({
    selector: 'app-player-panel',
    templateUrl: './player-panel.component.html',
    styleUrls: ['./player-panel.component.scss'],
    standalone: false
})
export class PlayerPanelComponent {
  @Input() player!: Unit;
  @Output() output: EventEmitter<any> = new EventEmitter();

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault();
      // Only attack if not already reloading (prevents rapid fire when holding space)
      if (!this.reload) {
        this.attack();
      }
    }
  }

  reload: boolean = false;
  reloadTimer: null | Timer = null;
  reloadProgress: number = 0;
  private reloadStartTime: number = 0;

  attack() {
    if (this.reload) {
      return;
    }

    this.output.emit('attack');

    this.reload = true;
    this.reloadProgress = 0;
    this.reloadStartTime = Date.now();

    // Update progress every 50ms for smooth animation
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - this.reloadStartTime;
      this.reloadProgress = Math.min((elapsed / this.reloadTime) * 100, 100);

      if (elapsed >= this.reloadTime) {
        clearInterval(progressInterval);
        this.reloadProgress = 100;

        // Reset progress after a brief moment
        setTimeout(() => {
          this.reloadProgress = 0;
        }, 200);
      }
    }, 50);

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
