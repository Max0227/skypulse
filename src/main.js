import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { TutorialScene } from './scenes/TutorialScene';
import { WorldSelectScene } from './scenes/WorldSelectScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { PlayScene } from './scenes/PlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';
import { SkinShopScene } from './scenes/SkinShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { QuestsScene } from './scenes/QuestsScene';
import { SettingsScene } from './scenes/SettingsScene';

// Конфигурация игры
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
    WorldSelectScene,
    LevelSelectScene,
    PlayScene,
    LevelCompleteScene,
    GameOverScene,
    ShopScene,
    SkinShopScene,
    AchievementsScene,
    QuestsScene,
    SettingsScene
  ],
  input: {
    touch: { target: window },
    keyboard: { target: window }
  }
};

// Создаём экземпляр игры
const game = new Phaser.Game(config);

// ===== TELEGRAM INTEGRATION =====
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // Инициализация
  tg.ready();
  tg.expand();
  
  // Настройка цвета
  tg.setHeaderColor('#030712');
  tg.setBackgroundColor('#030712');
  
  // Обработка изменения размера
  tg.onEvent('viewportChanged', () => {
    const viewport = tg.viewportStableHeight;
    game.scale.setGameSize(window.innerWidth, viewport);
  });

  // Кнопка назад
  tg.BackButton.onClick(() => {
    const currentScene = game.scene.getScenes(true)[0];
    if (currentScene && currentScene.scene.key === 'play') {
      currentScene.confirmExit();
    } else if (currentScene && currentScene.scene.key !== 'menu') {
      game.scene.start('menu');
    }
  });

  // Показываем кнопку назад если не в меню
  tg.BackButton.show();
  
  // Данные пользователя
  if (tg.initDataUnsafe?.user) {
    console.log('Telegram user:', tg.initDataUnsafe.user);
  }
}

// ===== ОБРАБОТКА ОШИБОК =====
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

// ===== ОТЛАДКА =====
window.gameDebug = {
  addCrystals: (amount) => {
    gameManager.data.crystals += amount;
    gameManager.save();
    console.log(`💎 Added ${amount} crystals. Total: ${gameManager.data.crystals}`);
  },
  
  unlockAllLevels: () => {
    for (let world = 0; world < 5; world++) {
      for (let level = 0; level < 10; level++) {
        gameManager.unlockLevel(world, level);
      }
    }
    console.log('🔓 All levels unlocked');
  },
  
  unlockAllSkins: () => {
    SKINS.forEach(skin => {
      if (!gameManager.data.ownedSkins.includes(skin.id)) {
        gameManager.data.ownedSkins.push(skin.id);
      }
    });
    gameManager.save();
    console.log('🎨 All skins unlocked');
  },
  
  unlockAllAchievements: () => {
    for (let key in ACHIEVEMENTS) {
      gameManager.unlockAchievement(key);
    }
    console.log('🏆 All achievements unlocked');
  },
  
  resetData: () => {
    localStorage.clear();
    location.reload();
  },
  
  getGameData: () => gameManager.data,
  
  getStats: () => gameManager.data.stats,
  
  setDifficulty: (level) => {
    gameManager.data.difficulty = level;
    gameManager.save();
    console.log(`⚡ Difficulty set to ${level}`);
  },
  
  addWagons: (count) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive()) {
      for (let i = 0; i < count; i++) {
        scene.addWagon();
      }
    }
  },
  
  spawnAsteroids: (count) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive()) {
      for (let i = 0; i < count; i++) {
        scene.spawnAsteroid();
      }
    }
  },
  
  toggleDebug: () => {
    game.config.physics.arcade.debug = !game.config.physics.arcade.debug;
    console.log(`🐛 Debug mode: ${game.config.physics.arcade.debug ? 'ON' : 'OFF'}`);
  }
};

console.log('🎮 SkyPulse v3.5.0 загружена');
console.log('💡 Для отладки используйте: window.gameDebug');
console.log('📱 Telegram WebApp: ', window.Telegram?.WebApp ? 'доступен' : 'не доступен');