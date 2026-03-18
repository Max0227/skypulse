import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';

export class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super('worldSelect');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('world_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'world_bg').setOrigin(0);

    // Звёзды
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

    // Список миров (все из LEVEL_CONFIG)
    const worlds = Object.keys(LEVEL_CONFIG).map(Number).filter(w => w >= 0); // все индексы
    const startY = 130;
    const spacing = 90;

    worlds.forEach((worldIndex, i) => {
      const world = LEVEL_CONFIG[worldIndex];
      const unlocked = gameManager.data.unlockedWorlds?.includes(worldIndex) || worldIndex === 0;
      const stars = gameManager.getStarsForWorld(worldIndex);

      const y = startY + i * spacing;
      const bg = this.add.rectangle(w / 2, y, w - 60, 80, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, unlocked ? COLORS.primary : COLORS.text_muted)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a))
        .on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8))
        .on('pointerdown', () => {
          if (unlocked) {
            gameManager.setCurrentWorld(worldIndex);
            this.scene.start('levelSelect');
          }
        });

      this.add.text(w / 2, y - 25, world.name, {
        fontSize: '20px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0.5);

      this.add.text(w / 2, y + 10, `⭐ ${stars} / 15`, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0.5);

      // Описание (можно добавить)
      this.add.text(w / 2, y + 30, world.description, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0.5);
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