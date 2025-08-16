import { ElementRef, QueryList } from "@angular/core";
import { UnitVM } from "../../../view-models/unit-vm";

export const getUnitArea = (unit: UnitVM, elements: QueryList<ElementRef>): ElementRef => {
  const unitElement = elements.filter(e => e.nativeElement.getAttribute('data-unit-id') === unit.unit.id)

  if (unitElement.length === 1) {
    return unitElement[0]
  }

  throw new Error('Element area not found');
}
