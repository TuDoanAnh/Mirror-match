import Phaser from 'phaser';
import StartScene from './StartScene';
import PreparationScene from './PreparationScene';
import GameScene from './GameScene';
import GameOverScene from './GameOverScene';
import AugmentSelectScene from './AugmentSelectScene';
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
  scene: [StartScene, PreparationScene, GameScene, GameOverScene, AugmentSelectScene]
};

export default new Phaser.Game(config);
