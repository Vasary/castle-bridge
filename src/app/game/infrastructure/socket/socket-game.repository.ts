import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AttackOccurred } from '../../domain/events/attack-occurred';
import { GameRepository } from '../../domain/repositories/game.repository';
import { AttackEventDto, JoinGameDto, ServerStateDto } from './dto/server-contracts';
import { EVENTS } from './event-names';
import { toDomainState } from './mappers/state.mapper';

import { Score } from '../../domain/entities/score';
import { Unit } from '../../domain/entities/unit';
import { GameScores } from '../../domain/events/game-state';
import { ServerScoresDto } from './dto/server-contracts';
import { toDomainScore } from './mappers/score.mapper';

@Injectable({ providedIn: 'root' })
export class SocketGameRepository implements GameRepository {
  constructor(private socket: Socket) {}

  join(nickname: string): void {
    const playerId = uuidv4();
    const joinData: JoinGameDto = {
      id: playerId,
      nickname
    };
    const payload = JSON.stringify(joinData);
    this.socket.emit(EVENTS.playerJoin, payload);
  }

  triggerAttack(): void {
    this.socket.emit(EVENTS.unitAttack);
  }

  restart(): void {
    this.socket.emit(EVENTS.gameRestart);
  }

  player$(): Observable<Unit | null> {
    return new Observable(obs => {
      const playerHandler = (msg: any) => {
        // If server emits full player object, map to domain; otherwise ignore until first state update
        if (msg && msg.id) {
          obs.next(new Unit(msg.id, msg.title, msg.avatar, 'Heroes', msg.health, msg.power));
        }
      };

      const restartedHandler = () => {
        // When server emits game.restarted, clear the current player
        obs.next(null);
      };

      this.socket.on(EVENTS.playerJoin, playerHandler);
      this.socket.on(EVENTS.gameRestarted, restartedHandler);

      return () => {
        this.socket.off(EVENTS.playerJoin, playerHandler);
        this.socket.off(EVENTS.gameRestarted, restartedHandler);
      };
    });
  }

  state$(): Observable<import('../../domain/events/game-state').GameState> {
    return new Observable(obs => {
      const stateHandler = (msg: ServerStateDto) => obs.next(toDomainState(msg));
      const restartedHandler = () => {
        // When server emits game.restarted, reset the game state
        obs.next({
          heroes: [],
          villains: [],
          isOver: false,
          isStarted: false
        });
      };

      this.socket.on(EVENTS.gameState, stateHandler);
      this.socket.on(EVENTS.gameRestarted, restartedHandler);

      return () => {
        this.socket.off(EVENTS.gameState, stateHandler);
        this.socket.off(EVENTS.gameRestarted, restartedHandler);
      };
    });
  }

  fightEvents$(): Observable<AttackOccurred> {
    return new Observable(obs => {
      const handler = (msg: AttackEventDto) =>
        obs.next(new AttackOccurred(
          msg.trigger.id,
          msg.target.id,
          msg.attackPower,
          Date.now()
        ));
      this.socket.on(EVENTS.unitAttack, handler);
      return () => this.socket.off(EVENTS.unitAttack, handler);
    });
  }

  scores$(): Observable<GameScores> {
    return new Observable(obs => {
      const handler = (msg: ServerScoresDto) =>
        obs.next({ scores: msg.scores.map(s => toDomainScore(s)) as Score[] });
      this.socket.on(EVENTS.gameOver, handler);
      return () => this.socket.off(EVENTS.gameOver, handler);
    });
  }
}
