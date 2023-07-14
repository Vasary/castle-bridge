import {animate, AnimationTriggerMetadata, style, transition, trigger} from "@angular/animations";
import {Team} from "../../types/types";

export function fadeInOut(): AnimationTriggerMetadata {
  return trigger('fadeInOut', [
    transition(':enter', [
      style({opacity: 0}),
      animate(700, style({opacity: 1})),
    ]),
    transition(':leave', [
      animate(700, style({opacity: 0})),
    ])
  ]);
}

export function animateAttack(direction: Team): any {
  const value = direction === 'Heroes' ? -6 : 6;

  return {
    transitions: [
      {transform: 'translateX(' + value + 'rem)'},
      {transform: 'scale(1.1)'},
      {transform: 'scale(1)'},
      {transform: 'translateX(0rem)'},
    ],
    params: {
      duration: 350,
      iterations: 1,
    }
  }
}

export function animateDamage(): any {
  return {
    transitions: [
      {transform: 'rotate(0)'},
      {transform: 'scale(1.05)'},
      {transform: 'translateX(.25rem)'},
      {transform: 'translateX(-.25rem)'},
      {transform: 'scale(1)'},
      {transform: 'rotate(0)'},
    ],
    params: {
      duration: 200,
      iterations: 3,
    }
  }
}
