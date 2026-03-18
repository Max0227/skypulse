import Phaser from 'phaser';
import { COLORS, WORLD_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';

export class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super('worldSelect');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('world_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'world_bg').setOrigin(0);

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'star');
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-10);
    }

    this.add.text(w / 2, 40, 'ВЫБОР МИРА', {
      fontSize: '32px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Отображаем все миры из WORLD_CONFIG (0,1,2)
    const worlds = Object.keys(WORLD_CONFIG).map(Number);
    let y = 120;
    worlds.forEach(worldId => {
      const world = WORLD_CONFIG[worldId];
      const unlocked = gameManager.data.unlockedWorlds.includes(worldId);
      const stars = gameManager.getStarsForWorld(worldId);
      const color = unlocked ? COLORS.primary : COLORS.text_muted;

      const bg = this.add.rectangle(w / 2, y, w - 60, 80, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, color)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a))
        .on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8))
        .on('pointerdown', () => {
          if (unlocked) {
            gameManager.setCurrentWorld(worldId);
            this.scene.start('levelSelect');
          }
        });

      this.add.text(w / 2, y - 25, world.name, {
        fontSize: '20px',
        fontFamily: "'Orbitron', sans-serif",
        color
      }).setOrigin(0.5);

      this.add.text(w / 2, y + 10, `${stars} ⭐`, {
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0.5);

      y += 100;
    });

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
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