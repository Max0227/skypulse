import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('levelComplete');
  }

  init(data) {
    this.world = data.world;
    this.level = data.level;
    this.score = data.score;
    this.stars = data.stars || 0;
    this.wagons = data.wagons || 0;
    this.crystals = data.crystals || 0;
    this.success = data.success !== false; // true по умолчанию
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.image(0, 0, 'menu_bg').setOrigin(0);

    const title = this.success ? 'УРОВЕНЬ ПРОЙДЕН!' : 'ИГРА ОКОНЧЕНА';
    const color = this.success ? COLORS.success : COLORS.danger;

    this.add.text(w / 2, 100, title, {
      fontSize: '32px',
      fontFamily: "'Orbitron', sans-serif",
      color,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    let y = 200;
    this.add.text(w / 2, y, `Счёт: ${this.score}`, { fontSize: '20px', fontFamily: "'Space Mono', monospace", color: COLORS.text_primary }).setOrigin(0.5);
    this.add.text(w / 2, y + 40, `Вагонов: ${this.wagons}`, { fontSize: '20px', fontFamily: "'Space Mono', monospace", color: COLORS.text_primary }).setOrigin(0.5);
    this.add.text(w / 2, y + 80, `Кристаллов: ${this.crystals}`, { fontSize: '20px', fontFamily: "'Space Mono', monospace", color: COLORS.text_primary }).setOrigin(0.5);

    if (this.success) {
      this.add.text(w / 2, y + 120, '⭐'.repeat(this.stars) + '☆'.repeat(3 - this.stars), { fontSize: '30px', fontFamily: "'Space Mono', monospace", color: COLORS.accent }).setOrigin(0.5);
    }

    this.createButton(w / 2, h - 80, 'ПРОДОЛЖИТЬ', () => this.scene.start('levelSelect'));
    this.createButton(w / 2, h - 40, 'В МЕНЮ', () => this.scene.start('menu'));
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