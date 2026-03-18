import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('levelSelect');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const world = gameManager.getCurrentWorld();
    const worldConfig = LEVEL_CONFIG[world];

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('level_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'level_bg').setOrigin(0);

    // Заголовок
    this.add.text(w / 2, 40, worldConfig.name, {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: this.getWorldColorString(world),
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс кристаллов
    this.balanceText = this.add.text(w - 20, 80, `💎 ${gameManager.data.crystals}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(1, 0.5);

    let y = 130;
    const spacing = 70;

    for (let level = 0; level < 5; level++) {
      const unlocked = gameManager.isLevelUnlocked(world, level) || level === 0;
      const stars = gameManager.getLevelStars(world, level);

      // Карточка уровня
      const bg = this.add.rectangle(w / 2, y, w - 40, 60, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, unlocked ? this.getWorldColor(world) : COLORS.text_muted)
        .setInteractive({ useHandCursor: true });

      // Номер уровня
      this.add.text(30, y - 15, `${level + 1}`, {
        fontSize: '20px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0, 0.5);

      // Название
      this.add.text(30, y + 10, `УРОВЕНЬ ${level + 1}`, {
        fontSize: '12px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0, 0.5);

      // Цель
      const goalScore = worldConfig.goalScore * (level + 1);
      this.add.text(w - 100, y - 15, `Цель: ${goalScore}`, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Звёзды
      this.add.text(w - 100, y + 10, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0, 0.5);

      bg.on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8));
      bg.on('pointerdown', () => {
        if (unlocked) {
          gameManager.setCurrentLevel(level);
          this.scene.start('play');
          try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
        }
      });

      y += spacing;
    }

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('worldSelect'));
  }

  getWorldColor(world) {
    const colors = [0x00ffff, 0xff00ff, 0xff6600];
    return colors[world] || 0x00ffff;
  }

  getWorldColorString(world) {
    const colors = ['#00ffff', '#ff00ff', '#ff6600'];
    return colors[world] || '#00ffff';
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 10 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}