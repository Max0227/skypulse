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

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('menu_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'menu_bg').setOrigin(0);

    // Звёзды (мерцающие)
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.5));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-10);
      this.stars.push({
        sprite: star,
        flicker: Phaser.Math.FloatBetween(0.01, 0.03)
      });
    }

    // Заголовок с анимацией
    const title = this.add.text(w / 2, h * 0.12, 'SKYPULSE', {
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
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Подзаголовок
    this.add.text(w / 2, h * 0.22, 'КИБЕРПАНК ТАКСИ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_secondary,
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Статистика
    const stats = gameManager.data.stats;
    this.add.text(w / 2, h * 0.28,
      `🏆 ${stats.maxScore} | ⭐ Уровень ${stats.maxLevel} | 🚃 ${stats.maxWagons}`,
      {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }
    ).setOrigin(0.5);

    // Кнопки меню
    const buttonY = [0.38, 0.48, 0.58, 0.68, 0.78, 0.88];
    const buttonTexts = ['ИГРАТЬ', 'МИРЫ', 'МАГАЗИН', 'СКИНЫ', 'ДОСТИЖЕНИЯ', 'НАСТРОЙКИ'];
    const buttonCallbacks = [
      () => {
        if (!gameManager.data.tutorialCompleted) {
          this.scene.start('tutorial');
        } else {
          this.scene.start('worldSelect');
        }
      },
      () => this.scene.start('worldSelect'),
      () => this.scene.start('shop'),
      () => this.scene.start('skinShop'),
      () => this.scene.start('achievements'),
      () => this.scene.start('settings')
    ];

    buttonTexts.forEach((text, index) => {
      const size = index === 0 ? 'large' : 'normal';
      this.createButton(w / 2, h * buttonY[index], text, buttonCallbacks[index], size);
    });

    // Версия
    this.add.text(w / 2, h - 20, 'v3.5.0', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_muted
    }).setOrigin(0.5);

    // Музыка
    audioManager.playMusic(this, 0.5);
    
    // Анимация мерцания звёзд
    this.time.addEvent({
      delay: 50,
      callback: this.updateStars,
      callbackScope: this,
      loop: true
    });
  }

  updateStars() {
    this.stars.forEach(star => {
      if (star.flicker) {
        star.sprite.alpha = 0.5 + Math.sin(Date.now() * star.flicker) * 0.4;
      }
    });
  }

  createButton(x, y, text, callback, size = 'normal') {
    const fontSize = size === 'large' ? '24px' : '18px';
    const padding = size === 'large' ? { x: 40, y: 15 } : { x: 30, y: 10 };
    const width = size === 'large' ? 200 : 180;

    // Фон кнопки с градиентом
    const bg = this.add.rectangle(x, y, width, 50, 0x1a1a3a)
      .setStrokeStyle(2, COLORS.primary)
      .setInteractive({ useHandCursor: true });

    // Текст кнопки
    const btnText = this.add.text(x, y, text, {
      fontSize,
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.primary,
      strokeThickness: 1
    }).setOrigin(0.5);

    // Эффекты наведения
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4a);
      btnText.setStyle({ color: COLORS.text_primary });
      bg.setScale(1.05);
      btnText.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a1a3a);
      btnText.setStyle({ color: COLORS.primary });
      bg.setScale(1);
      btnText.setScale(1);
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, btnText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback
      });
      try { audioManager.playSound(this, 'tap_sound', 0.2); } catch (e) {}
    });

    return { bg, btnText };
  }
}