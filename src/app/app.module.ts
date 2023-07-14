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
import {PlayerPanelComponent} from './scene/player-panel/player-panel.component';
import { SumPipe } from './pipe/sum.pipe';
import { MaxPipe } from './pipe/max.pipe';
import { CountPipe } from './pipe/count.pipe';
import { UniquePipe } from './pipe/unique.pipe';

const config: SocketIoConfig = {url: 'http://localhost:8080', options: {}};

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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
