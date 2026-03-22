import { AIEnemy } from '../entities/AIEnemy';
import { WAVE_CONFIG, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class WaveManager {
  constructor(scene, levelManager) {
    this.scene = scene;
    this.levelManager = levelManager;
    this.currentWave = 0;
    this.enemies = [];
    this.waveConfig = [];
    this.spawnTimer = 0;
    this.waveInProgress = false;
    this.waveTimer = null;
    this.waveDelay = 5000;
    this.maxWaves = 10;
    this.difficultyMultiplier = 1;
    this.waveBonusMultiplier = 1;
    this.bossWave = false;
    this.waveStartTime = 0;
    this.waveCompleteTime = 0;
    
    // Статистика волн
    this.waveStats = {
      totalWaves: 0,
      fastestWave: Infinity,
      slowestWave: 0,
      totalEnemiesKilled: 0,
      wavesCompleted: 0,
      bossWavesDefeated: 0
    };
    
    // Визуальные эффекты
    this.waveEffects = [];
    this.particleEmitters = [];
    
    this.initWaveConfig();
  }

  // =========================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // =========================================================================

  initWaveConfig() {
    const theme = this.levelManager.getCurrentTheme();
    const worldId = this.levelManager.currentWorld;
    
    // Получаем конфиг волн для текущего мира
    this.waveConfig = WAVE_CONFIG[theme] || WAVE_CONFIG.space;
    
    // Применяем модификаторы сложности от мира
    this.applyWorldModifiers(worldId);
    
    console.log(`WaveManager initialized for world ${worldId}, theme: ${theme}`);
  }

  applyWorldModifiers(worldId) {
    const modifiers = {
      0: { delay: 1.0, enemyCount: 1.0, rewardMultiplier: 1.0 },      // Космос
      1: { delay: 0.8, enemyCount: 1.2, rewardMultiplier: 1.2 },      // Киберпанк
      2: { delay: 1.2, enemyCount: 1.3, rewardMultiplier: 1.3 },      // Подземелье
      3: { delay: 0.9, enemyCount: 1.4, rewardMultiplier: 1.4 },      // Астероиды
      4: { delay: 1.1, enemyCount: 1.5, rewardMultiplier: 1.5 }       // Чёрная дыра
    };
    
    const mod = modifiers[worldId] || modifiers[0];
    this.waveDelay = 5000 * mod.delay;
    this.waveBonusMultiplier = mod.rewardMultiplier;
    this.difficultyMultiplier = mod.enemyCount;
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  update(time, delta, playerPos) {
    if (this.scene.level < 1 || this.levelManager.isBossLevel()) return;

    this.spawnTimer += delta;
    
    // Проверка на спавн новой волны
    if (!this.waveInProgress && this.spawnTimer > this.waveDelay && this.currentWave < this.maxWaves) {
      this.startWave(this.currentWave);
    }

    // Обновление врагов
    this.enemies.forEach(enemy => {
      if (enemy && enemy.isActive && enemy.isActive()) {
        enemy.update(playerPos, time, delta);
      }
    });

    // Удаление мёртвых врагов
    const previousCount = this.enemies.length;
    this.enemies = this.enemies.filter(enemy => enemy && enemy.isActive && enemy.isActive());
    
    // Обновляем статистику убитых врагов
    const killedCount = previousCount - this.enemies.length;
    if (killedCount > 0) {
      this.waveStats.totalEnemiesKilled += killedCount;
    }

    // Проверка завершения волны
    if (this.waveInProgress && this.enemies.length === 0) {
      this.completeWave();
    }
    
    // Обновляем визуальные эффекты волны
    this.updateWaveEffects(delta);
  }

  startWave(waveIndex) {
    if (waveIndex >= this.waveConfig.length) return;

    const wave = this.waveConfig[waveIndex];
    if (!wave) return;

    this.waveInProgress = true;
    this.bossWave = wave.isBoss || false;
    this.waveStartTime = Date.now();
    
    // Показываем предупреждение о волне
    this.showWaveWarning(waveIndex + 1, wave.isBoss);
    
    // Спавним врагов волны с учётом сложности
    let count = Math.floor(wave.count * this.difficultyMultiplier);
    
    // Для босс-волн увеличиваем здоровье босса
    if (wave.isBoss) {
      count = 1;
      this.showBossWarning(wave.type);
    }
    
    // Распределяем спавн врагов
    const spawnDelay = wave.isBoss ? 500 : 300;
    
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * spawnDelay, () => {
        if (!this.scene.dead && this.scene.started) {
          const enemy = this.spawnEnemy(wave.type, i === count - 1 && wave.isBoss);
          if (wave.isBoss && enemy) {
            this.applyBossEffects(enemy);
          }
        }
      });
    }
    
    // Эффект начала волны
    this.createWaveStartEffect(waveIndex);
    
    // Звук начала волны
    this.playWaveStartSound(wave.isBoss);
  }

  spawnEnemy(type, isBoss = false) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Позиция спавна
    let x, y;
    
    if (isBoss) {
      // Босс спавнится в центре справа
      x = w + 50;
      y = h / 2;
    } else {
      x = w + 100 + Phaser.Math.Between(0, 200);
      y = Phaser.Math.Between(80, h - 80);
    }
    
    // Создаём врага с учётом мира
    const worldType = this.levelManager.currentWorld;
    const enemy = new AIEnemy(this.scene, x, y, type, worldType);
    
    if (isBoss) {
      // Увеличиваем здоровье босса в зависимости от уровня
      const healthBonus = this.levelManager.currentLevel * 10;
      enemy.health += healthBonus;
      enemy.maxHealth += healthBonus;
      enemy.scoreValue *= 2;
    }
    
    this.enemies.push(enemy);
    return enemy;
  }

  completeWave() {
    this.waveInProgress = false;
    const waveTime = (Date.now() - this.waveStartTime) / 1000;
    
    // Обновляем статистику
    this.waveStats.wavesCompleted++;
    this.waveStats.totalWaves++;
    if (waveTime < this.waveStats.fastestWave) this.waveStats.fastestWave = waveTime;
    if (waveTime > this.waveStats.slowestWave) this.waveStats.slowestWave = waveTime;
    if (this.bossWave) this.waveStats.bossWavesDefeated++;
    
    // Показываем сообщение о завершении
    this.showWaveComplete();
    
    // Награда за волну
    this.giveWaveReward();
    
    // Увеличиваем комбо
    if (this.scene.comboSystem) {
      this.scene.comboSystem.add(5);
    }
    
    // Переходим к следующей волне
    this.currentWave++;
    this.spawnTimer = 0;
    
    // Проверяем, все ли волны пройдены
    if (this.currentWave >= this.maxWaves) {
      this.onAllWavesComplete();
    }
  }

  giveWaveReward() {
    // Базовые кристаллы за волну
    let reward = 5 + this.currentWave * 2;
    
    // Множитель от мира
    reward = Math.floor(reward * this.waveBonusMultiplier);
    
    // Бонус за быстрое прохождение
    const waveTime = (Date.now() - this.waveStartTime) / 1000;
    if (waveTime < 10) {
      reward += 10;
      this.showBonusNotification('⚡ БЫСТРОЕ ПРОХОЖДЕНИЕ! +10 💎', '#ffff00');
    }
    
    // Бонус за босс-волну
    if (this.bossWave) {
      reward += 20;
      this.showBonusNotification('👑 БОСС ПОБЕЖДЁН! +20 💎', '#ff44ff');
    }
    
    // Бонус за чистую волну (без потери вагонов)
    if (this.scene.wagons && this.scene.wagons.length === this.scene.maxWagons) {
      reward += 15;
      this.showBonusNotification('✨ ИДЕАЛЬНАЯ ВОЛНА! +15 💎', '#00ffff');
    }
    
    // Добавляем награду
    this.scene.crystals += reward;
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    gameManager.addCrystals(reward, 'wave_complete');
    
    // Анимация получения награды
    this.createRewardEffect(reward);
    
    // Звук завершения
    this.playWaveCompleteSound(this.bossWave);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  showWaveWarning(waveNumber, isBoss = false) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    
    const color = isBoss ? '#ff4444' : '#ffaa44';
    const text = isBoss ? `⚠️ БОСС ВОЛНА ${waveNumber} ⚠️` : `⚠️ ВОЛНА ${waveNumber} ⚠️`;
    
    const warning = scene.add.text(w / 2, h / 2, text, {
      fontSize: isBoss ? '36px' : '28px',
      fontFamily: "'Audiowide', 'Orbitron', monospace",
      color: color,
      stroke: '#ff0000',
      strokeThickness: isBoss ? 4 : 3,
      shadow: { blur: 15, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    warning.setScale(0.5);
    scene.tweens.add({
      targets: warning,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: isBoss ? 2000 : 1500,
      ease: 'Power2.easeOut',
      onComplete: () => warning.destroy()
    });
    
    // Эффект пульсации экрана для босс-волны
    if (isBoss) {
      scene.cameras.main.flash(500, 255, 0, 0, false);
      scene.cameras.main.shake(300, 0.01);
    }
  }

  showBossWarning(bossType) {
    const scene = this.scene;
    const w = scene.scale.width;
    
    const bossNames = {
      boss_cyber: 'КИБЕР-БОСС',
      boss_dungeon: 'ПОВЕЛИТЕЛЬ ТЬМЫ',
      boss_asteroid: 'АСТЕРОИДНЫЙ ТИТАН',
      boss_final: 'ПОЖИРАТЕЛЬ ВСЕЛЕННЫХ'
    };
    
    const name = bossNames[bossType] || 'БОСС';
    
    const bossText = scene.add.text(w / 2, 150, name, {
      fontSize: '24px',
      fontFamily: "'Audiowide', monospace",
      color: '#ff0000',
      stroke: '#ff8800',
      strokeThickness: 3,
      shadow: { blur: 15, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    
    scene.tweens.add({
      targets: bossText,
      alpha: 0,
      y: bossText.y - 50,
      duration: 2000,
      onComplete: () => bossText.destroy()
    });
  }

  showWaveComplete() {
    const scene = this.scene;
    const w = scene.scale.width;
    const waveTime = ((Date.now() - this.waveStartTime) / 1000).toFixed(1);
    
    const container = scene.add.container(w / 2, 80).setDepth(50).setScrollFactor(0);
    
    const bg = scene.add.rectangle(0, 0, 280, 70, 0x0a2a0a, 0.9)
      .setStrokeStyle(2, 0x00ff00, 0.8);
    
    const title = scene.add.text(0, -15, 'ВОЛНА ПРОЙДЕНА!', {
      fontSize: '20px',
      fontFamily: "'Audiowide', monospace",
      color: '#00ff00',
      stroke: '#00aa00',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const timeText = scene.add.text(0, 15, `⏱️ ${waveTime} сек`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#88ff88'
    }).setOrigin(0.5);
    
    container.add([bg, title, timeText]);
    
    container.setAlpha(0);
    container.setY(60);
    
    scene.tweens.add({
      targets: container,
      alpha: 1,
      y: 80,
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        scene.tweens.add({
          targets: container,
          alpha: 0,
          y: 100,
          duration: 500,
          delay: 2000,
          onComplete: () => container.destroy()
        });
      }
    });
  }

  createWaveStartEffect(waveIndex) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    
    // Эффект расходящегося круга
    const ring = scene.add.circle(w / 2, h / 2, 10, 0x00ffff, 0.6);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    
    scene.tweens.add({
      targets: ring,
      radius: 200,
      alpha: 0,
      duration: 800,
      onComplete: () => ring.destroy()
    });
    
    // Частицы по краям экрана
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const particle = scene.add.circle(x, y, 2, 0xff44ff, 0.5);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 2,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  createRewardEffect(reward) {
    const scene = this.scene;
    const w = scene.scale.width;
    
    const rewardText = scene.add.text(w / 2, 120, `+${reward} 💎`, {
      fontSize: '24px',
      fontFamily: "'Audiowide', sans-serif",
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 3,
      shadow: { blur: 10, color: '#ffaa00', fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    scene.tweens.add({
      targets: rewardText,
      y: rewardText.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => rewardText.destroy()
    });
  }

  showBonusNotification(text, color) {
    const scene = this.scene;
    const w = scene.scale.width;
    
    const notification = scene.add.text(w / 2, 160, text, {
      fontSize: '14px',
      fontFamily: "'Orbitron', monospace",
      color: color,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    
    scene.tweens.add({
      targets: notification,
      alpha: 0,
      y: notification.y - 30,
      duration: 1500,
      onComplete: () => notification.destroy()
    });
  }

  updateWaveEffects(delta) {
    // Обновляем эффекты, связанные с волной
    if (this.waveInProgress) {
      // Эффект напряжения во время волны
      const intensity = Math.min(0.1, this.enemies.length * 0.005);
      if (this.scene.cameras.main && intensity > 0) {
        this.scene.cameras.main.shake(intensity * 100, 0.001);
      }
    }
  }

  applyBossEffects(enemy) {
    const scene = this.scene;
    
    // Эффект появления босса
    const spawnEffect = scene.add.circle(enemy.sprite.x, enemy.sprite.y, 30, 0xff0000, 0.8);
    scene.tweens.add({
      targets: spawnEffect,
      scale: 3,
      alpha: 0,
      duration: 500,
      onComplete: () => spawnEffect.destroy()
    });
    
    // Замедление времени на момент появления
    scene.time.timeScale = 0.5;
    scene.time.delayedCall(500, () => {
      scene.time.timeScale = 1;
    });
    
    // Музыка босса (если есть)
    try {
      audioManager.playSound(scene, 'boss_theme', 0.6);
    } catch (e) {}
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playWaveStartSound(isBoss = false) {
    try {
      if (isBoss) {
        audioManager.playSound(this.scene, 'boss_alert', 0.6);
      } else {
        audioManager.playSound(this.scene, 'alert_sound', 0.4);
      }
    } catch (e) {
      try {
        this.scene.sound.play('alert_sound', { volume: 0.4 });
      } catch (e2) {}
    }
  }

  playWaveCompleteSound(isBoss = false) {
    try {
      if (isBoss) {
        audioManager.playSound(this.scene, 'boss_defeated', 0.7);
      } else {
        audioManager.playSound(this.scene, 'level_up_sound', 0.5);
      }
    } catch (e) {
      try {
        this.scene.sound.play('level_up_sound', { volume: 0.5 });
      } catch (e2) {}
    }
  }

  // =========================================================================
  // ЗАВЕРШЕНИЕ ВСЕХ ВОЛН
  // =========================================================================

  onAllWavesComplete() {
    const scene = this.scene;
    
    // Финальная награда
    const finalReward = 100 * this.waveBonusMultiplier;
    scene.crystals += finalReward;
    if (scene.crystalText) {
      scene.crystalText.setText(`💎 ${scene.crystals}`);
    }
    gameManager.addCrystals(finalReward, 'all_waves');
    
    // Показываем сообщение
    const w = scene.scale.width;
    const completion = scene.add.text(w / 2, scene.scale.height / 2, 'ВСЕ ВОЛНЫ ПРОЙДЕНЫ!', {
      fontSize: '32px',
      fontFamily: "'Audiowide', monospace",
      color: '#ffff00',
      stroke: '#ffaa00',
      strokeThickness: 4,
      shadow: { blur: 15, color: '#ffff00', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    scene.tweens.add({
      targets: completion,
      alpha: 0,
      duration: 3000,
      onComplete: () => completion.destroy()
    });
    
    // Достижение
    gameManager.unlockAchievement('wave_master');
    
    // Сохраняем рекорд
    if (this.waveStats.fastestWave !== Infinity) {
      gameManager.data.stats.fastestWaveClear = this.waveStats.fastestWave;
      gameManager.save();
    }
  }

  // =========================================================================
  // ГЕТТЕРЫ И СТАТИСТИКА
  // =========================================================================

  getEnemyCount() {
    return this.enemies.length;
  }

  hasEnemies() {
    return this.enemies.length > 0;
  }

  getCurrentWave() {
    return this.currentWave;
  }

  isWaveInProgress() {
    return this.waveInProgress;
  }

  isBossWave() {
    return this.bossWave;
  }

  getWaveStats() {
    return {
      ...this.waveStats,
      currentWave: this.currentWave,
      enemiesRemaining: this.enemies.length,
      waveInProgress: this.waveInProgress,
      bossWave: this.bossWave,
      timeInWave: this.waveInProgress ? (Date.now() - this.waveStartTime) / 1000 : 0
    };
  }

  getWaveProgress() {
    if (!this.waveInProgress || this.waveConfig.length === 0) return 0;
    const totalEnemies = this.waveConfig[this.currentWave]?.count || 0;
    const killedEnemies = totalEnemies - this.enemies.length;
    return (killedEnemies / totalEnemies) * 100;
  }

  // =========================================================================
  // УПРАВЛЕНИЕ
  // =========================================================================

  reset() {
    // Уничтожаем всех врагов
    this.enemies.forEach(enemy => {
      if (enemy && enemy.destroy) enemy.destroy();
    });
    this.enemies = [];
    this.currentWave = 0;
    this.spawnTimer = 0;
    this.waveInProgress = false;
    this.bossWave = false;
    this.waveStats = {
      totalWaves: 0,
      fastestWave: Infinity,
      slowestWave: 0,
      totalEnemiesKilled: 0,
      wavesCompleted: 0,
      bossWavesDefeated: 0
    };
    
    if (this.waveTimer) {
      this.waveTimer.remove();
      this.waveTimer = null;
    }
    
    // Очищаем эффекты
    this.waveEffects.forEach(effect => {
      if (effect && effect.destroy) effect.destroy();
    });
    this.waveEffects = [];
  }

  setDifficulty(multiplier) {
    this.difficultyMultiplier = multiplier;
    this.applyWorldModifiers(this.levelManager.currentWorld);
  }

  forceNextWave() {
    if (!this.waveInProgress && this.currentWave < this.maxWaves) {
      this.startWave(this.currentWave);
    }
  }

  skipWave() {
    if (this.waveInProgress) {
      this.enemies.forEach(enemy => enemy.die());
      this.enemies = [];
      this.completeWave();
    }
  }

  destroy() {
    this.reset();
    this.particleEmitters.forEach(emitter => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
    this.particleEmitters = [];
  }
}