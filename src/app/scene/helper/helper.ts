import {Unit} from "../../model/unit/unit";
import {ElementRef, QueryList} from "@angular/core";
import {PlayerType, ServerScore, ServerUnit} from "../../service/contract/contracts";
import {Score} from "../../model/scores/score";
import {Team} from "../../types/types";

export const getUnitArea = (unit: Unit, elements: QueryList<ElementRef>): ElementRef => {
  const unitElement = elements.filter(e => e.nativeElement.getAttribute('data-unit-id') === unit.id)

  if (unitElement.length === 1) {
    return unitElement[0]
  }

  throw new Error('Element area not found');
}

export const createPlayer = (player: PlayerType): Unit => {
  return new Unit(player.id, player.health, player.power, player.title, player.avatar, 'Heroes')
}

export const createScore = (serverScore: ServerScore): Score => {
  return new Score(serverScore.triggerId, serverScore.targetId, serverScore.triggerHit, serverScore.targetHealth);
}

export const createUnit = (serverUnit: ServerUnit, team: Team): Unit => {
  return new Unit(serverUnit.id, serverUnit.health, serverUnit.power, serverUnit.title, serverUnit.avatar, team);
}

export const updateUnitWithServerData = (serverUnit: ServerUnit, unit: Unit) => {
  if (unit.health !== serverUnit.health) {
    unit.health = serverUnit.health;
  }
}
