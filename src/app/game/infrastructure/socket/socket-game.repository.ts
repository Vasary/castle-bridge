import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { GameRepository } from '../../domain/repositories/game.repository';
import { EVENTS } from './event-names';
import { ServerStateDto, AttackEventDto } from './dto/server-contracts';
import { toDomainState } from './mappers/state.mapper';
import { AttackOccurred } from '../../domain/events/attack-occurred';
import { toDomainUnit } from './mappers/unit.mapper';
import { GameScores } from '../../domain/events/game-state';
import { Unit } from '../../domain/entities/unit';
import { ServerScoresDto } from './dto/server-contracts';

@Injectable({ providedIn: 'root' })
export class SocketGameRepository implements GameRepository {
  constructor(private socket: Socket) {}

  join(nickname: string): void {
    const payload = JSON.stringify({ nickname });
    this.socket.emit(EVENTS.playerJoin, payload);
  }

  triggerAttack(): void {
    this.socket.emit(EVENTS.unitAttack);
  }

  restart(): void {
    this.socket.emit(EVENTS.gameRestart);
  }

  player$(): Observable<Unit> {
    return new Observable(obs => {
      const handler = (msg: any) => {
        // If server emits full player object, map to domain; otherwise ignore until first state update
        if (msg && msg.id) {
          obs.next(new Unit(msg.id, msg.title, msg.avatar, 'Heroes', msg.health, msg.power));
        }
      };
      this.socket.on(EVENTS.playerJoin, handler);
      return () => this.socket.off(EVENTS.playerJoin, handler);
    });
  }

  state$(): Observable<import('../../domain/events/game-state').GameState> {
    return new Observable(obs => {
      const handler = (msg: ServerStateDto) => obs.next(toDomainState(msg));
      this.socket.on(EVENTS.gameState, handler);
      return () => this.socket.off(EVENTS.gameState, handler);
    });
  }

  fightEvents$(): Observable<AttackOccurred> {
    return new Observable(obs => {
      const handler = (msg: AttackEventDto) =>
        obs.next({
          triggerId: msg.trigger.id,
          targetId: msg.target.id,
          attackPower: msg.attackPower,
        });
      this.socket.on(EVENTS.unitAttack, handler);
      return () => this.socket.off(EVENTS.unitAttack, handler);
    });
  }

  scores$(): Observable<GameScores> {
    return new Observable(obs => {
      const handler = (msg: ServerScoresDto) =>
        obs.next({ scores: msg.scores.map(s => ({ ...s })) });
      this.socket.on(EVENTS.gameOver, handler);
      return () => this.socket.off(EVENTS.gameOver, handler);
    });
  }
}

