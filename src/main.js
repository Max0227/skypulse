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
import { gameManager } from './managers/GameManager';
import { SKINS, ACHIEVEMENTS } from './config';

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
      if (currentScene.confirmExit) {
        currentScene.confirmExit();
      }
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
    if (gameManager && gameManager.data) {
      gameManager.data.crystals += amount;
      gameManager.save();
      console.log(`💎 Added ${amount} crystals. Total: ${gameManager.data.crystals}`);
    } else {
      console.warn('GameManager not initialized yet');
    }
  },
  
  unlockAllLevels: () => {
    if (gameManager) {
      for (let world = 0; world < 5; world++) {
        for (let level = 0; level < 10; level++) {
          gameManager.unlockLevel(world, level);
        }
      }
      console.log('🔓 All levels unlocked');
    } else {
      console.warn('GameManager not initialized yet');
    }
  },
  
  unlockAllSkins: () => {
    if (gameManager && SKINS) {
      SKINS.forEach(skin => {
        if (!gameManager.data.ownedSkins.includes(skin.id)) {
          gameManager.data.ownedSkins.push(skin.id);
        }
      });
      gameManager.save();
      console.log('🎨 All skins unlocked');
    } else {
      console.warn('GameManager or SKINS not available');
    }
  },
  
  unlockAllAchievements: () => {
    if (gameManager && ACHIEVEMENTS) {
      for (let key in ACHIEVEMENTS) {
        gameManager.unlockAchievement(key);
      }
      console.log('🏆 All achievements unlocked');
    } else {
      console.warn('GameManager or ACHIEVEMENTS not available');
    }
  },
  
  resetData: () => {
    if (confirm('⚠️ ВНИМАНИЕ! Это действие удалит весь прогресс. Продолжить?')) {
      localStorage.clear();
      location.reload();
    }
  },
  
  getGameData: () => {
    if (gameManager) {
      return gameManager.data;
    }
    console.warn('GameManager not initialized');
    return null;
  },
  
  getStats: () => {
    if (gameManager && gameManager.data) {
      return gameManager.data.stats;
    }
    console.warn('GameManager not initialized');
    return null;
  },
  
  setDifficulty: (level) => {
    if (gameManager) {
      gameManager.data.difficulty = level;
      gameManager.save();
      console.log(`⚡ Difficulty set to ${level}`);
    } else {
      console.warn('GameManager not initialized');
    }
  },
  
  addWagons: (count) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive() && scene.addWagon) {
      for (let i = 0; i < count; i++) {
        scene.addWagon();
      }
      console.log(`🚃 Added ${count} wagons`);
    } else {
      console.warn('Play scene not active or addWagon method not available');
    }
  },
  
  spawnAsteroids: (count) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive() && scene.spawnAsteroid) {
      for (let i = 0; i < count; i++) {
        scene.spawnAsteroid();
      }
      console.log(`☄️ Spawned ${count} asteroids`);
    } else {
      console.warn('Play scene not active or spawnAsteroid method not available');
    }
  },
  
  toggleDebug: () => {
    game.config.physics.arcade.debug = !game.config.physics.arcade.debug;
    console.log(`🐛 Debug mode: ${game.config.physics.arcade.debug ? 'ON' : 'OFF'}`);
  },
  
  // Дополнительные отладочные функции
  addScore: (amount) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive()) {
      scene.score += amount;
      if (scene.scoreText) {
        scene.scoreText.setText(String(scene.score));
      }
      console.log(`🏆 Added ${amount} score. Total: ${scene.score}`);
    }
  },
  
  healPlayer: () => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive() && scene.player) {
      scene.headHP = scene.maxHeadHP;
      if (scene.updateHearts) scene.updateHearts();
      console.log('❤️ Player fully healed');
    }
  },
  
  killAllEnemies: () => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive() && scene.waveManager) {
      scene.waveManager.enemies.forEach(enemy => {
        if (enemy && enemy.die) enemy.die();
      });
      scene.waveManager.enemies = [];
      console.log('👾 All enemies eliminated');
    }
  },
  
  godMode: () => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive() && scene.player) {
      scene.player.invincible = !scene.player.invincible;
      console.log(`✨ God mode: ${scene.player.invincible ? 'ON' : 'OFF'}`);
    }
  },
  
  setSpeed: (multiplier) => {
    const scene = game.scene.getScene('play');
    if (scene && scene.isActive()) {
      scene.currentSpeed = scene.baseSpeed * multiplier;
      console.log(`⚡ Speed set to ${scene.currentSpeed}`);
    }
  },
  
  showFPS: () => {
    if (!window.fpsText) {
      window.fpsText = document.createElement('div');
      window.fpsText.style.position = 'fixed';
      window.fpsText.style.top = '10px';
      window.fpsText.style.right = '10px';
      window.fpsText.style.color = '#00ff00';
      window.fpsText.style.fontFamily = 'monospace';
      window.fpsText.style.fontSize = '12px';
      window.fpsText.style.zIndex = '9999';
      window.fpsText.style.backgroundColor = 'rgba(0,0,0,0.5)';
      window.fpsText.style.padding = '2px 5px';
      window.fpsText.style.borderRadius = '3px';
      document.body.appendChild(window.fpsText);
      
      let fps = 0;
      let lastTime = performance.now();
      let frames = 0;
      
      function updateFPS() {
        const now = performance.now();
        frames++;
        if (now - lastTime >= 1000) {
          fps = frames;
          frames = 0;
          lastTime = now;
          window.fpsText.textContent = `FPS: ${fps}`;
        }
        requestAnimationFrame(updateFPS);
      }
      requestAnimationFrame(updateFPS);
      console.log('📊 FPS counter enabled');
    } else {
      window.fpsText.remove();
      window.fpsText = null;
      console.log('📊 FPS counter disabled');
    }
  }
};

console.log('🎮 SkyPulse v3.5.0 загружена');
console.log('💡 Для отладки используйте: window.gameDebug');
console.log('📱 Telegram WebApp: ', window.Telegram?.WebApp ? 'доступен' : 'не доступен');