import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('levelSelect');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const world = gameManager.getCurrentWorld();
    const worldName = WORLD_CONFIG[world].name;

    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('level_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'level_bg').setOrigin(0);

    this.add.text(w / 2, 40, worldName, {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Уровни с 0 по 4
    let y = 120;
    for (let level = 0; level < 5; level++) {
      const unlocked = gameManager.isLevelUnlocked(world, level);
      const stars = gameManager.getLevelStars(world, level);
      const color = unlocked ? COLORS.text_primary : COLORS.text_muted;

      const bg = this.add.rectangle(w / 2, y, w - 60, 60, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a))
        .on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8))
        .on('pointerdown', () => {
          if (unlocked) {
            gameManager.setCurrentLevel(level);
            this.scene.start('play');
          }
        });

      this.add.text(w / 2, y - 15, `УРОВЕНЬ ${level + 1}`, {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color
      }).setOrigin(0.5);

      this.add.text(w / 2, y + 10, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0.5);

      y += 70;
    }

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('worldSelect'));
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 8 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive()
      .on('pointerover', () => {
        btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
        btn.setScale(1.05);
      })
      .on('pointerout', () => {
        btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
        btn.setScale(1);
      })
      .on('pointerdown', callback);
    return btn;
  }
}