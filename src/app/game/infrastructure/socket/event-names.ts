export const EVENTS = {
  playerJoin: 'player.join',
  gameState: 'game.state',
  unitAttack: 'unit.attack',
  gameOver: 'game.over',
  gameRestart: 'game.restart',
  gameRestarted: 'game.restarted',
  // Additional events for integration tests
  state: 'game.state',
  attack: 'unit.attack',
  scores: 'game.scores',
  player: 'player.data',
  triggerAttack: 'unit.attack',
  restart: 'game.restart',
} as const;
