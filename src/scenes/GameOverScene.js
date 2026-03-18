import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('gameover');
  }

  init(data) {
    this.resultData = data || {
      score: 0,
      level: 1,
      wagons: 0,
      crystals: 0,
      meters: 0
    };
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('gameover_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'gameover_bg').setOrigin(0);

    // Затемнение
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5);

    // Красное свечение
    const glow = this.add.rectangle(w / 2, h / 2, w, h, 0xff0000, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: glow,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Заголовок
    const title = this.add.text(w / 2, h * 0.15, 'ИГРА ОКОНЧЕНА', {
      fontSize: '40px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      stroke: COLORS.secondary,
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Панель статистики
    const panelY = h * 0.4;
    const panel = this.add.rectangle(w / 2, panelY, w - 60, 220, 0x1a1a3a, 0.9)
      .setStrokeStyle(3, COLORS.danger);

    // Статистика
    const stats = [
      { label: 'СЧЁТ', value: this.resultData.score },
      { label: 'УРОВЕНЬ', value: this.resultData.level },
      { label: 'ВАГОНОВ', value: this.resultData.wagons },
      { label: 'КРИСТАЛЛОВ', value: `+${this.resultData.crystals}` },
      { label: 'ПРОЛЕТЕНО', value: `${Math.floor(this.resultData.meters)} м` }
    ];

    stats.forEach((stat, index) => {
      const y = panelY - 70 + index * 35;
      
      this.add.text(w / 2 - 80, y, stat.label, {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      this.add.text(w / 2 + 80, y, String(stat.value), {
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        color: index === 3 ? COLORS.accent : COLORS.text_primary
      }).setOrigin(1, 0.5);
    });

    // Рекорд
    const best = gameManager.data.stats.maxScore;
    if (this.resultData.score >= best) {
      const recordText = this.add.text(w / 2, panelY + 100, '🏆 НОВЫЙ РЕКОРД! 🏆', {
        fontSize: '18px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.accent
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // Кнопки
    const btnY = h - 100;

    // Кнопка "Заново"
    const retryBtn = this.add.text(w / 2 - 120, btnY, 'ЗАНОВО', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 12 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setInteractive().setOrigin(0.5);

    // Кнопка "Меню"
    const menuBtn = this.add.text(w / 2 + 120, btnY, 'МЕНЮ', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 12 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setInteractive().setOrigin(0.5);

    // Кнопка "Магазин"
    const shopBtn = this.add.text(w / 2, btnY + 50, 'МАГАЗИН', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 8 },
      stroke: COLORS.accent,
      strokeThickness: 2
    }).setInteractive().setOrigin(0.5);

    // Обработчики
    retryBtn.on('pointerover', () => {
      retryBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      retryBtn.setScale(1.05);
    });

    retryBtn.on('pointerout', () => {
      retryBtn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      retryBtn.setScale(1);
    });

    retryBtn.on('pointerdown', () => {
      this.scene.start('play');
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
    });

    menuBtn.on('pointerover', () => {
      menuBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      menuBtn.setScale(1.05);
    });

    menuBtn.on('pointerout', () => {
      menuBtn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      menuBtn.setScale(1);
    });

    menuBtn.on('pointerdown', () => {
      this.scene.start('menu');
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
    });

    shopBtn.on('pointerover', () => {
      shopBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.accent });
      shopBtn.setScale(1.05);
    });

    shopBtn.on('pointerout', () => {
      shopBtn.setStyle({ color: COLORS.accent, backgroundColor: '#1a1a3a' });
      shopBtn.setScale(1);
    });

    shopBtn.on('pointerdown', () => {
      this.scene.start('shop');
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
    });

    // Звук поражения
    try { audioManager.playSound(this, 'gameover_sound', 0.5); } catch (e) {}
  }
}