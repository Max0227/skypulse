import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super('worldSelect');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('world_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'world_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 40, 'ВЫБОР МИРА', {
      fontSize: '32px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Список миров
    const worlds = [0, 1, 2];
    let y = 130;

    worlds.forEach(worldIndex => {
      const world = LEVEL_CONFIG[worldIndex];
      const unlocked = gameManager.data.unlockedWorlds.includes(worldIndex);
      const stars = gameManager.getStarsForWorld(worldIndex);

      // Карточка мира
      const bg = this.add.rectangle(w / 2, y, w - 60, 90, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, unlocked ? this.getWorldColor(worldIndex) : COLORS.text_muted)
        .setInteractive({ useHandCursor: true });

      // Название
      this.add.text(w / 2, y - 25, world.name, {
        fontSize: '22px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? this.getWorldColorString(worldIndex) : COLORS.text_muted
      }).setOrigin(0.5);

      // Описание
      this.add.text(w / 2, y + 5, world.description, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: unlocked ? COLORS.text_secondary : COLORS.text_muted
      }).setOrigin(0.5);

      // Звёзды
      this.add.text(w / 2, y + 30, `⭐ ${stars}/15`, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: unlocked ? COLORS.accent : COLORS.text_muted
      }).setOrigin(0.5);

      bg.on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8));
      bg.on('pointerdown', () => {
        if (unlocked) {
          gameManager.setCurrentWorld(worldIndex);
          this.scene.start('levelSelect');
          try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
        }
      });

      y += 110;
    });

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.2));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setDepth(-5);
    }
  }

  getWorldColor(worldIndex) {
    const colors = [0x00ffff, 0xff00ff, 0xff6600];
    return colors[worldIndex] || 0x00ffff;
  }

  getWorldColorString(worldIndex) {
    const colors = ['#00ffff', '#ff00ff', '#ff6600'];
    return colors[worldIndex] || '#00ffff';
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