## Domain-Driven Design (DDD) Roadmap for Castle Bridge (Angular)

This roadmap guides an incremental refactor of the existing Angular app into a DDD-aligned architecture while keeping the app working at each step. It’s designed for small, verifiable PRs.

---

### Goals
- Model core business concepts explicitly in a domain layer (pure TypeScript).
- Separate concerns into domain, application, infrastructure, and UI.
- Isolate external systems (Socket.IO) behind repositories and mappers.
- Keep presentation-only state out of domain entities.
- Add tests around domain logic and mappings.

---

### Target Bounded Context and Layers
- Bounded Context: Game
- Layers:
  - Domain: Entities, Value Objects, Domain Events, Repository interfaces, (optional) Domain Services
  - Application: Use cases and a Facade that orchestrates repositories and exposes state to UI
  - Infrastructure: Socket.IO repository implementation, DTOs, mappers, configuration
  - UI: Components, animations, modals, pipes, view-models

---

### Target Directory Layout
```
src/app/game/
  domain/
    entities/ (Unit.ts, Score.ts, …)
    value-objects/ (unit-id.ts, health.ts, power.ts, team.ts)
    events/ (attack-occurred.ts, game-state.ts)
    repositories/ (game.repository.ts)
    services/ (optional domain services like CombatService)
  application/
    use-cases/ (join-game.ts, trigger-attack.ts, restart-game.ts, observe-state.ts, observe-scores.ts)
    game.facade.ts
  infrastructure/
    socket/
      event-names.ts
      dto/ (server contracts moved here; e.g., server-state.dto.ts)
      mappers/ (unit.mapper.ts, score.mapper.ts)
      socket-game.repository.ts
    tokens/ (API tokens/config if needed)
  ui/
    scene/ (component)
    login/ (component)
    scores/ (component)
    animations/
    pipes/
    view-models/ (UnitVM with UI-only state like damaged/timer)
```

---

### Phase 0: Prep and Baseline
1) Branch: create a working branch for the refactor.
2) Verify: `npm run build` and `npm test` (when tests are added) succeed before every PR.
3) Agree on ubiquitous language: Unit, Score, Team, Player (is Player a Unit or separate?)

Acceptance: No code changes yet; just a branch and shared glossary.

---

### Phase 1: Introduce the Domain Layer (no behavior change)
1) Create domain entities and types:
   - `src/app/game/domain/entities/unit.ts` (id, health, power, title, avatar, team)
   - `src/app/game/domain/entities/score.ts`
   - Value Objects: team, ids, health (optional at first)
2) Extract Domain Events:
   - `attack-occurred.ts` (triggerId, targetId, attackPower)
   - `game-state.ts` (heroes, villains, isOver, isStarted, maybe currentPlayer)
3) Define Repository interfaces:
   - `game.repository.ts` with methods:
     - `join(nickname: string): void`
     - `triggerAttack(): void`
     - `restart(): void`
     - `state$(): Observable<GameState>`
     - `scores$(): Observable<GameScores>`
     - `fightEvents$(): Observable<AttackOccurred>`
4) Keep existing UI and services intact for now.

Acceptance: Domain code compiles; nothing else changed.

---

### Phase 2: Infrastructure — Socket Repository and Mappers
1) Move server contracts to infrastructure DTOs:
   - From `src/app/service/contract/contracts.ts` to `src/app/game/infrastructure/socket/dto/*`
   - Keep the shapes the same but rename with `*Dto` suffix for clarity.
2) Add mappers:
   - `mappers/unit.mapper.ts`: ServerUnitDto <-> Domain Unit
   - `mappers/score.mapper.ts`: ServerScoreDto <-> Domain Score
   - Avoid mixing mapping in components or helpers.
3) Implement repository:
   - `socket-game.repository.ts` uses `ngx-socket-io` and event-names.ts to wrap `.on/.emit`
   - Map DTOs to domain before exposing.
   - Ensure `Observable` cleanup via return of `() => socket.off(event)`.
4) Provide DI token:
   - Register repository as `GameRepository` provider in `AppModule` (or a new `GameModule`).

Acceptance: Build passes; no UI wiring changed yet.

---

### Phase 3: Application Layer — Facade and Use Cases
1) Create use-case classes or functions under `application/use-cases` implementing repository calls.
2) Add a `GameFacade` that coordinates use cases and streams:
   - Expose `player$`, `state$`, `scores$`, `fightEvents$`, and convenience selectors like `heroes$`, `villains$`, `isOver$`, `isStarted$`.
   - Expose methods: `joinGame(nickname)`, `attack()`, `restart()`.
   - Optionally use Angular Signals for derived state.
3) Provide `GameFacade` at root/in a feature module.

Acceptance: Build passes; no UI wiring changed yet.

---

### Phase 4: UI — Replace direct service calls with the Facade
1) Update `SceneComponent` to inject `GameFacade` instead of `SocketService`.
2) Replace subscriptions:
   - `api.player()/state()/fightEvents()/scores()` -> `facade.player$/state$/fightEvents$/scores$`.
   - Remove mapping helpers (now done in infrastructure mappers).
3) Extract UI-only state from domain:
   - Move `damaged` and `timer` out of `src/app/model/unit/unit.ts`.
   - Create `src/app/game/ui/view-models/unit-vm.ts` that composes domain `Unit` and holds `damaged` and `timer` for animations.
   - Update animations and templates to use `UnitVM` (or local component state).
4) Remove `scene/helper/helper` mapping in favor of Facade/Repository outputs.

Acceptance: App runs with same behavior; SceneComponent is thinner and uses domain/app layers.

---

### Phase 5: Tests — Lock down contracts and mapping
1) Add unit tests for mappers:
   - ServerUnitDto -> Unit; ServerScoreDto -> Score
2) Add unit tests for `GameFacade`:
   - Given streams from repository (mocked), verify derived selectors and commands.
3) (Optional) Add contract tests to ensure DTOs still match backend payloads.

Commands:
```
npm run test
```

Acceptance: Tests pass in CI; mapping and facade behavior covered.

---

### Phase 6: Tech Debt and Type Safety
1) Contain `ngx-socket-io` types inside `socket-game.repository.ts` only.
2) Remove `skipLibCheck: true` after typings friction is isolated.
3) Ensure teardown for all socket listeners; verify no memory leaks in navigation.
4) Normalize naming in UI: never render `Server*` types.

Acceptance: Build and tests green without `skipLibCheck` (when feasible).

---

### Phase 7: Optional Enhancements
- Migrate to Angular standalone components if desired (already partially migrated by CLI).
- Consider Nx or a lib structure if the app grows (e.g., `libs/game-domain`, `libs/game-infra`, `libs/game-ui`).
- Introduce state management (Signals store or RxJS store) inside the `GameFacade` if complexity grows.

---

### Phase 8: Deployment/Builder Notes
- Angular CLI migration moved to the application builder; default output is `dist/client` (or `dist/client/browser` depending on config). Adjust deployment script if needed.
- Keep `styles.scss` using `@use 'bootstrap/scss/bootstrap' as *;` (we already changed this).

---

### Detailed Step-by-Step — First Two Phases (copy/paste friendly)

Phase 1 files (stubs):
```
src/app/game/domain/entities/unit.ts
src/app/game/domain/entities/score.ts
src/app/game/domain/events/attack-occurred.ts
src/app/game/domain/events/game-state.ts
src/app/game/domain/repositories/game.repository.ts
```

Suggested content examples:

`game.repository.ts`
```ts
import { Observable } from 'rxjs';
import { GameState } from '../events/game-state';
import { AttackOccurred } from '../events/attack-occurred';
import { Score } from '../entities/score';

export interface GameRepository {
  join(nickname: string): void;
  triggerAttack(): void;
  restart(): void;

  state$(): Observable<GameState>;
  fightEvents$(): Observable<AttackOccurred>;
  scores$(): Observable<{ scores: Score[] }>;
}
```

`entities/unit.ts`
```ts
export type Team = 'Heroes' | 'Villains';

export class Unit {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly avatar: string,
    public readonly team: Team,
    public health: number,
    public power: number,
  ) {}

  isDead(): boolean { return this.health <= 0; }
}
```

Phase 2 files:
```
src/app/game/infrastructure/socket/event-names.ts
src/app/game/infrastructure/socket/dto/*.ts (moved from service/contract)
src/app/game/infrastructure/socket/mappers/unit.mapper.ts
src/app/game/infrastructure/socket/mappers/score.mapper.ts
src/app/game/infrastructure/socket/socket-game.repository.ts
```

`event-names.ts`
```ts
export const EVENTS = {
  playerJoin: 'player.join',
  gameState: 'game.state',
  unitAttack: 'unit.attack',
  gameOver: 'game.over',
  gameRestart: 'game.restart',
  gameRestarted: 'game.restarted',
} as const;
```

`socket-game.repository.ts` (outline)
```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { GameRepository } from '../../domain/repositories/game.repository';
import { EVENTS } from './event-names';
import { toDomainState, toDomainAttack, toDomainScores } from './mappers/...';

@Injectable({ providedIn: 'root' })
export class SocketGameRepository implements GameRepository {
  constructor(private socket: Socket) {}

  join(nickname: string): void {
    this.socket.emit(EVENTS.playerJoin, JSON.stringify({ nickname }));
  }

  triggerAttack(): void {
    this.socket.emit(EVENTS.unitAttack);
  }

  restart(): void {
    this.socket.emit(EVENTS.gameRestart);
  }

  state$(): Observable<GameState> {
    return new Observable(obs => {
      const handler = (msg: ServerStateDto) => obs.next(toDomainState(msg));
      this.socket.on(EVENTS.gameState, handler);
      return () => this.socket.off(EVENTS.gameState, handler);
    });
  }

  // fightEvents$() and scores$() similar pattern
}
```

Wire-up:
- In `AppModule` (or a new `GameModule`), provide the repository as the `GameRepository` token if using interface-typed injection via `InjectionToken`.

---

### Acceptance Criteria per Phase
- P1: Domain compiles; no runtime change.
- P2: Build succeeds; repository compiles; still unused from UI.
- P3: Facade exposes required streams and actions; build green.
- P4: SceneComponent uses Facade; behaviors unchanged.
- P5: Mapper and Facade tests pass.
- P6: Type checks strict without `skipLibCheck` (or isolated to infra only).

---

### How to Verify Each Step
- Build: `npm run build`
- Serve: `npm start`
- Tests: `npm test`
- Manual: Trigger join/attack/restart flows and confirm UI behavior unchanged.

---

### Notes and Decisions to Make Together
- Clarify “Player” vs “Unit”: is the player a specific Unit instance or a separate aggregate?
- Decide if derived UI state (damaged/timer) should live in UnitVM or a local component store.
- Consider Signals for facade state to simplify template consumption.

---

### Suggested PR Breakdown
1) Domain skeleton + repository interface
2) Infrastructure DTOs + mappers + socket repository
3) Application facade + use-cases (no UI changes)
4) SceneComponent refactor to facade; remove helper mapping
5) Extract UnitVM and presentation state
6) Tests for mappers and facade; type-safety cleanup

Small, focused PRs make review and rollback simple.

