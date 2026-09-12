import Phaser from 'phaser';
import PreparationScene from './PreparationScene';
import GameScene from './GameScene';
import GameOverScene from './GameOverScene';
import { GAME_CONFIG } from './gameConfig';
import './style.css';

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.CANVAS.WIDTH,
  height: GAME_CONFIG.CANVAS.HEIGHT,
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [PreparationScene, GameScene, GameOverScene]
};

export default new Phaser.Game(config);
