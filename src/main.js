import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TutorialScene } from './scenes/TutorialScene';
import { WorldSelectScene } from './scenes/WorldSelectScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { PlayScene } from './scenes/PlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { ShopScene } from './scenes/ShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { QuestsScene } from './scenes/QuestsScene';
import { SettingsScene } from './scenes/SettingsScene';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 390,
  height: 844,
  backgroundColor: '#030712',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
    orientation: Phaser.Scale.Orientation.PORTRAIT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1300 },
      debug: false,
      maxEntities: 500,
      enableBody: true
    }
  },
  render: {
    pixelArt: false,
    antialias: true,
    powerPreference: 'high-performance',
    transparent: false
  },
  scene: [
    BootScene,
    MenuScene,
    TutorialScene,
    WorldSelectScene,
    LevelSelectScene,
    PlayScene,
    LevelCompleteScene,
    ShopScene,
    AchievementsScene,
    QuestsScene,
    SettingsScene
  ],
  input: {
    touch: { target: window },
    keyboard: { target: window }
  }
};

window.game = new Phaser.Game(config);