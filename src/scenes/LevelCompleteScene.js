import Phaser from 'phaser';
import { COLORS } from '../config';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('levelComplete');
  }

  init(data) {
    this.world = data.world;
    this.level = data.level;
    this.score = data.score;
    this.stars = data.stars;
    this.coins = data.coins;
    this.wagons = data.wagons;
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('complete_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'complete_bg').setOrigin(0);

    this.add.text(w / 2, 80, 'УРОВЕНЬ ПРОЙДЕН!', {
      fontSize: '36px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.success,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Звёзды
    this.add.text(w / 2, 160, '⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), {
      fontSize: '48px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Статистика
    const statsY = 250;
    this.add.text(w / 2, statsY, `Счёт: ${this.score}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_primary
    }).setOrigin(0.5);

    this.add.text(w / 2, statsY + 30, `Монет: ${this.coins}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_primary
    }).setOrigin(0.5);

    this.add.text(w / 2, statsY + 60, `Вагонов: ${this.wagons}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_primary
    }).setOrigin(0.5);

    // Кнопки
    this.createButton(w / 2 - 100, h - 100, 'ЗАНОВО', () => {
      this.scene.start('play');
    });

    this.createButton(w / 2 + 100, h - 100, 'ВЫБОР УРОВНЯ', () => {
      this.scene.start('levelSelect');
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 },
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