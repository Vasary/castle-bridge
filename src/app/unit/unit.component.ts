import {Component, Input} from '@angular/core';
import { UnitVM } from "../game/ui/view-models/unit-vm";

@Component({
    selector: 'app-unit',
    templateUrl: './unit.component.html',
    styleUrls: ['./unit.component.scss'],
    standalone: false
})
export class UnitComponent {
  @Input() unit!: UnitVM;
}
