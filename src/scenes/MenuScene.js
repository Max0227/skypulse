import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('menu_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'menu_bg').setOrigin(0);

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'star');
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-10);
    }

    const title = this.add.text(w / 2, h * 0.15, 'SKYPULSE', {
      fontSize: '60px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 4,
      shadow: { blur: 20, color: COLORS.primary, fill: true }
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    const stats = gameManager.data.stats;
    this.add.text(w / 2, h * 0.28,
      `🏆 ${stats.maxScore} | ⭐ Уровень ${stats.maxLevel} | 🚃 ${stats.maxWagons}`,
      { fontSize: '14px', fontFamily: "'Space Mono', monospace", color: COLORS.text_secondary }
    ).setOrigin(0.5);

    // Кнопка ИГРАТЬ ведёт к выбору мира
    this.createButton(w / 2, h * 0.45, 'ИГРАТЬ', () => {
      this.scene.start('worldSelect');
    }, 'large');

    this.createButton(w / 2, h * 0.58, 'МАГАЗИН', () => this.scene.start('shop'));
    this.createButton(w / 2, h * 0.68, 'ДОСТИЖЕНИЯ', () => this.scene.start('achievements'));
    this.createButton(w / 2, h * 0.78, 'КВЕСТЫ', () => this.scene.start('quests'));
    this.createButton(w / 2, h * 0.88, 'НАСТРОЙКИ', () => this.scene.start('settings'));

    this.add.text(w / 2, h - 20, 'v3.0.0', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_muted
    }).setOrigin(0.5);

    audioManager.playMusic(this, 0.5);
  }

  createButton(x, y, text, callback, size = 'normal') {
    const fontSize = size === 'large' ? '24px' : '16px';
    const padding = size === 'large' ? { x: 40, y: 15 } : { x: 30, y: 10 };
    const btn = this.add.text(x, y, text, {
      fontSize,
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding,
      stroke: COLORS.primary,
      strokeThickness: 2,
      shadow: { blur: 10, color: COLORS.primary, fill: true }
    }).setOrigin(0.5).setInteractive()
      .on('pointerover', () => {
        btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
        btn.setScale(1.05);
      })
      .on('pointerout', () => {
        btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
        btn.setScale(1);
      })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: btn,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 100,
          yoyo: true,
          onComplete: callback
        });
      });
    return btn;
  }
}