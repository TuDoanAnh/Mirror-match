import Phaser from 'phaser';
import StartScene from './StartScene';
import PreparationScene from './PreparationScene';
import GameScene from './GameScene';
import GameOverScene from './GameOverScene';
import AugmentSelectScene from './AugmentSelectScene';
import { GAME_CONFIG } from './gameConfig';
import { initPlaygamaSDK, attachPlaygamaGame } from './playgamaSDK';
import { ViewportBackground, ViewportLayout } from './viewportLayout';
import { installGameplayClock } from './platformLifecycle';
import './style.css';

initPlaygamaSDK();

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.CANVAS.WIDTH,
  height: GAME_CONFIG.CANVAS.HEIGHT,
  parent: 'app',
    scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  callbacks: {
    postBoot(game) {
      installGameplayClock(game);
      attachPlaygamaGame(game);
      if (import.meta.env.DEV) {
        window.arcaneGame = game;
      }
    }
  },
  plugins: {
    scene: [{ key: 'ViewportLayout', plugin: ViewportLayout, mapping: 'viewportLayout' }]
  },
  scene: [ViewportBackground, StartScene, PreparationScene, GameScene, GameOverScene, AugmentSelectScene]
};

export default new Phaser.Game(config);
