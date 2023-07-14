import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Observer} from 'rxjs';
import {io} from "socket.io-client";
import {Socket} from "ngx-socket-io";
import {AttackEvent, PlayerType, ServerScores, ServerState} from "./contract/contracts";
import {v4} from "uuid";


@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private socket = io('http://localhost:3000')

  constructor() {
  }

  public joinPlayer(nickname: string) {
    const message: string = JSON.stringify({
      nickname: nickname,
      id: v4(),
    });

    this.socket.emit('player.join', message);
  }

  triggerAttack() {
    this.socket.emit('unit.attack');
  }

  restartGame() {
    this.socket.emit('game.restart');
  }

  player(): Observable<PlayerType> {
    return new Observable((observer: Observer<PlayerType>) => {
      this.socket.on('player.join', (message: PlayerType) => {
        observer.next(message)
      })
    })
  }

  state(): Observable<ServerState> {
    return new Observable((observer: Observer<ServerState>) => {
      this.socket.on('game.state', (message: ServerState) => {
        observer.next(message)
      })
    })
  }

  fightEvents(): Observable<AttackEvent> {
    return new Observable((observer: Observer<AttackEvent>) => {
      this.socket.on('unit.attack', (message: AttackEvent) => {
        observer.next(message)
      })
    })
  }

  scores(): Observable<ServerScores> {
    return new Observable((observer: Observer<ServerScores>) => {
      this.socket.on('game.over', (message: ServerScores) => {
        observer.next(message)
      })
    })
  }

  gameRestarted(): Observable<ServerScores> {
    return new Observable((observer: Observer<ServerScores>) => {
      this.socket.on('game.restarted', (message: ServerScores) => {
        observer.next(message)
      })
    })
  }
}
