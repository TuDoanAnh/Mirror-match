import Phaser from 'phaser';
import PreparationScene from './PreparationScene';
import GameScene from './GameScene';
import GameOverScene from './GameOverScene';
import './style.css';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'app',
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
