import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NgOptimizedImage } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { GAME_REPOSITORY } from './game/domain/repositories/game-repository.token';
import { SocketGameRepository } from './game/infrastructure/socket/socket-game.repository';
import { LoginComponent } from './game/ui/components/login/login.component';
import { PlayerPanelComponent } from './game/ui/components/scene/player-panel/player-panel.component';
import { SceneComponent } from './game/ui/components/scene/scene.component';
import { ScoresComponent } from './game/ui/components/scores/scores.component';
import { UnitComponent } from './game/ui/components/unit/unit.component';
import { CountPipe } from './game/ui/pipes/count.pipe';
import { MaxPipe } from './game/ui/pipes/max.pipe';
import { SumPipe } from './game/ui/pipes/sum.pipe';
import { UniquePipe } from './game/ui/pipes/unique.pipe';

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
