import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import artworkUrl from './assets/image/Background.png';

// EXPAND gives the canvas the host aspect ratio without cropping the designed
// arena. Center the complete 1536x1024 play area over full-viewport artwork.
export class ViewportLayout extends Phaser.Plugins.ScenePlugin {
  boot() {
    if (this.scene.sys.settings.key === 'ViewportBackground') return;
    const scene = this.scene;
    const events = scene.sys.events;
    const scale = scene.scale;
    const layout = () => {
      const camera = scene.cameras?.main;
      if (!camera) return;
      const { WIDTH: width, HEIGHT: height } = GAME_CONFIG.CANVAS;
      const size = scale.gameSize;
      camera.setViewport((size.width - width) / 2, (size.height - height) / 2, width, height);
    };
    const stop = () => scale.off('resize', layout);
    const start = () => {
      // READY follows every plugin's START handler, so the camera exists even
      // when this scene is restarted after CameraManager.shutdown removed it.
      stop();
      scale.on('resize', layout);
      layout();
    };
    events.on('ready', start);
    events.on('shutdown', stop);
    events.once('destroy', () => {
      stop();
      events.off('ready', start);
      events.off('shutdown', stop);
    });
  }
}

export class ViewportBackground extends Phaser.Scene {
  constructor() {
    super('ViewportBackground');
  }

  preload() {
    this.load.image('viewport_artwork', artworkUrl);
  }

  create() {
    const background = this.add.image(0, 0, 'viewport_artwork').setTint(0x777777);
    const layout = () => {
      const { width, height } = this.scale.gameSize;
      this.cameras.main.setViewport(0, 0, width, height);
      background.setPosition(width / 2, height / 2);
      background.setScale(Math.max(width / background.width, height / background.height));
    };
    this.scale.on('resize', layout);
    this.events.once('shutdown', () => this.scale.off('resize', layout));
    layout();
    this.scene.launch('StartScene');
  }
}
