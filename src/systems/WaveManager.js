import { WAVE_CONFIG } from '../config';
import { AIEnemy } from '../entities/AIEnemy';

export class WaveManager {
  constructor(scene, levelManager) {
    this.scene = scene;
    this.levelManager = levelManager;
    this.currentWave = 0;
    this.enemies = [];
    this.waveConfig = WAVE_CONFIG[levelManager.getCurrentTheme()] || WAVE_CONFIG.space;
    this.spawnTimer = 0;
  }

  update(time, delta, playerPos) {
    if (this.scene.level < 1) return;

    this.spawnTimer += delta;
    if (this.spawnTimer > 5000 && this.enemies.length === 0 && this.currentWave < this.waveConfig.length) {
      this.showWaveWarning(this.currentWave);
      this.spawnWave(this.currentWave);
      this.currentWave++;
      this.spawnTimer = 0;
    }

    this.enemies.forEach(enemy => {
      enemy.update(playerPos, time, delta);
    });
    this.enemies = this.enemies.filter(e => e.health > 0);
  }

  spawnWave(waveIndex) {
    const config = this.waveConfig[waveIndex];
    if (!config) return;
    for (let i = 0; i < config.count; i++) {
      const x = Phaser.Math.Between(this.scene.scale.width + 50, this.scene.scale.width + 300);
      const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
      const enemy = new AIEnemy(this.scene, x, y, config.type);
      this.enemies.push(enemy);
    }
  }

  showWaveWarning(waveIndex) {
    const scene = this.scene;
    const w = scene.scale.width;
    const h = scene.scale.height;
    const warning = scene.add.text(w/2, h/2, `⚠️ ВОЛНА ${waveIndex + 1}`, {
      fontSize: '32px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff4444',
      stroke: '#ff0000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    scene.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 1500,
      onComplete: () => warning.destroy()
    });
  }

  reset() {
    this.enemies.forEach(e => e.sprite.destroy());
    this.enemies = [];
    this.currentWave = 0;
    this.spawnTimer = 0;
  }
}