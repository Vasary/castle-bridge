# Castle Bridge

A real-time multiplayer battle game built with Angular and Socket.IO. The right team represents heroes, the left team represents villains. The goal is to defeat the opposing team. The team with at least one surviving character wins.

**🎮 [Play Castle Bridge](https://castle-bridge.onrender.com/)**

![Main](docs/images/img1.png)

## 🏗️ Architecture

This project follows **Domain-Driven Design (DDD)** principles with a **ports and adapters** architecture:

```
src/app/game/
├── domain/          # Core business logic
│   ├── entities/    # Unit, Score
│   ├── events/      # AttackOccurred, GameState
│   └── repositories/# Repository interfaces
├── application/     # Use cases and facades
├── infrastructure/  # External integrations (Socket.IO)
└── ui/             # Components, animations, pipes
```

## 🚀 Getting Started

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200) and click "Join Game". When the first player joins, a countdown begins before the villain team starts attacking the hero team. The game also starts immediately if any hero attacks before the countdown ends.

## 🎯 Game Features

- **Real-time multiplayer** - Multiple players can join and battle simultaneously
- **Dynamic teams** - Enemies spawn randomly when the game starts
- **Session management** - Refreshing the page will reset your session and remove your character
- **Keyboard controls** - Use spacebar to attack
- **Visual feedback** - Damage indicators and animations

## 💥 Taking Damage

When a character takes damage, a visual indicator shows how many health points were lost. Attack power is assigned randomly when a player registers.

![Hit](docs/images/img2.png)

## ⚔️ Dealing Damage

To attack, press the spacebar or click the "Attack" button. After each attack, your character needs time to prepare for the next strike. Higher attack power requires longer preparation time.

![Hit](docs/images/img3.png)

## 🛠️ Development

### Tech Stack
- **Frontend**: Angular 20+ with TypeScript
- **Real-time**: Socket.IO for multiplayer communication
- **Architecture**: Domain-Driven Design (DDD) with ports and adapters
- **Styling**: Bootstrap 5 + SCSS

### Available Scripts
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
npm run lint       # Code linting
```

### Project Structure
The codebase follows DDD principles with clear separation of concerns:
- **Domain Layer**: Business entities and rules
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External integrations (Socket.IO)
- **UI Layer**: Angular components and presentation logic

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
