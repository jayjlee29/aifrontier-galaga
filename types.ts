export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  RESPAWN = 'RESPAWN',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Entity extends Position, Velocity {
  width: number;
  height: number;
  active: boolean;
  color: string;
}

export interface Player extends Entity {
  cooldown: number;
  hp: number;
}

export interface Enemy extends Entity {
  type: 'drone' | 'scout' | 'commander';
  scoreValue: number;
  diveTimer: number;
}

export interface Bullet extends Entity {
  isEnemy: boolean;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export interface GameState {
  score: number;
  level: number;
  lives: number;
  status: GameStatus;
  highScore: number;
  gameSpeed: number;
}

export interface Briefing {
  title: string;
  message: string;
}