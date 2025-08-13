import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {UnitComponent} from './unit/unit.component';
import {LoginComponent} from './login/login.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SceneComponent} from './scene/scene.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ScoresComponent} from './scores/scores.component';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import { GAME_REPOSITORY } from './game/domain/repositories/game-repository.token';
import { SocketGameRepository } from './game/infrastructure/socket/socket-game.repository';
import {PlayerPanelComponent} from './scene/player-panel/player-panel.component';
import { SumPipe } from './pipe/sum.pipe';
import { MaxPipe } from './pipe/max.pipe';
import { CountPipe } from './pipe/count.pipe';
import { UniquePipe } from './pipe/unique.pipe';
import { environment } from '../environments/environment';

const config: SocketIoConfig = {url: environment.api, options: {}};

@NgModule({
  declarations: [
    AppComponent,
    UnitComponent,
    LoginComponent,
    SceneComponent,
    ScoresComponent,
    PlayerPanelComponent,
    SumPipe,
    MaxPipe,
    CountPipe,
    UniquePipe,
  ],
  imports: [
    BrowserModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    BrowserAnimationsModule,
    SocketIoModule.forRoot(config)
  ],
  providers: [
    { provide: GAME_REPOSITORY, useExisting: SocketGameRepository }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
