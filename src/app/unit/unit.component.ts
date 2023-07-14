import {Component, Input} from '@angular/core';
import {Unit} from "../model/unit/unit";

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss']
})
export class UnitComponent {
  @Input() unit!: Unit;
}
