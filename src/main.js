import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TutorialScene } from './scenes/TutorialScene';
import { PlayScene } from './scenes/PlayScene';
import { QuestsScene } from './scenes/QuestsScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
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
      enableBody: true,
      enableStaticBody: true
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
    PlayScene,
    GameOverScene,
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

const game = new Phaser.Game(config);

// Telegram интеграция
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  tg.onEvent('viewportChanged', () => {
    const viewport = tg.viewportStableHeight;
    game.scale.setGameSize(window.innerWidth, viewport);
  });

  tg.BackButton.onClick(() => {
    if (game.scene.isActive('play')) {
      game.scene.getScene('play').confirmExit();
    } else {
      game.scene.start('menu');
    }
  });
}

// Отладка
window.gameDebug = {
  addCrystals: (amount) => {
    import('./managers/GameManager').then(({ gameManager }) => {
      gameManager.data.crystals += amount;
      gameManager.save();
    });
  },
  resetData: () => {
    localStorage.clear();
    location.reload();
  }
};