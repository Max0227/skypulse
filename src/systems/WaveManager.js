import { AIEnemy } from '../entities/AIEnemy';
import { WAVE_CONFIG } from '../config';

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
    this.waveDelay = 5000; // 5 секунд между волнами
    this.maxWaves = 10;
    this.difficultyMultiplier = 1;
    
    this.initWaveConfig();
  }

  initWaveConfig() {
    const theme = this.levelManager.getCurrentTheme();
    this.waveConfig = WAVE_CONFIG[theme] || WAVE_CONFIG.space;
  }

  update(time, delta, playerPos) {
    if (this.scene.level < 1 || this.levelManager.isBossLevel()) return;

    this.spawnTimer += delta;
    
    // Спавн новой волны
    if (!this.waveInProgress && this.spawnTimer > this.waveDelay && this.currentWave < this.maxWaves) {
      this.startWave(this.currentWave);
    }

    // Обновление врагов
    this.enemies.forEach(enemy => {
      if (enemy.isActive()) {
        enemy.update(playerPos, time, delta);
      }
    });

    // Удаление мертвых врагов
    this.enemies = this.enemies.filter(enemy => enemy.isActive());

    // Проверка завершения волны
    if (this.waveInProgress && this.enemies.length === 0) {
      this.waveInProgress = false;
      this.currentWave++;
      this.showWaveComplete();
    }
  }

  startWave(waveIndex) {
    if (waveIndex >= this.waveConfig.length) return;

    const wave = this.waveConfig[waveIndex];
    if (!wave) return;

    this.waveInProgress = true;
    this.showWaveWarning(waveIndex + 1);

    // Спавним врагов волны
    const count = Math.floor(wave.count * this.difficultyMultiplier);
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        if (!this.scene.dead && this.scene.started) {
          this.spawnEnemy(wave.type);
        }
      });
    }
  }

  spawnEnemy(type) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Спавним врага справа за экраном
    const x = w + 100 + Phaser.Math.Between(0, 200);
    const y = Phaser.Math.Between(100, h - 100);
    
    const enemy = new AIEnemy(this.scene, x, y, type);
    this.enemies.push(enemy);
    
    return enemy;
  }

  showWaveWarning(waveNumber) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    
    const warning = scene.add.text(w / 2, h / 2, `⚠️ ВОЛНА ${waveNumber} ⚠️`, {
      fontSize: '32px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff4444',
      stroke: '#ff0000',
      strokeThickness: 3,
      shadow: { blur: 10, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    scene.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => warning.destroy()
    });
    
    // Звук предупреждения
    try { scene.sound.play('alert_sound', { volume: 0.5 }); } catch (e) {}
  }

  showWaveComplete() {
    const scene = this.scene;
    const w = scene.scale.width;
    
    const complete = scene.add.text(w / 2, 100, 'ВОЛНА ПРОЙДЕНА!', {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#00ff00',
      stroke: '#00aa00',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    scene.tweens.add({
      targets: complete,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => complete.destroy()
    });
    
    // Награда за волну
    const reward = 5 + this.currentWave * 2;
    scene.crystals += reward;
    scene.crystalText.setText(`💎 ${scene.crystals}`);
    gameManager.addCrystals(reward);
    
    // Звук завершения
    try { scene.sound.play('level_up_sound', { volume: 0.5 }); } catch (e) {}
  }

  getEnemyCount() {
    return this.enemies.length;
  }

  hasEnemies() {
    return this.enemies.length > 0;
  }

  reset() {
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    this.currentWave = 0;
    this.spawnTimer = 0;
    this.waveInProgress = false;
    
    if (this.waveTimer) {
      this.waveTimer.remove();
      this.waveTimer = null;
    }
  }

  setDifficulty(multiplier) {
    this.difficultyMultiplier = multiplier;
  }

  forceNextWave() {
    if (!this.waveInProgress) {
      this.startWave(this.currentWave);
    }
  }
}