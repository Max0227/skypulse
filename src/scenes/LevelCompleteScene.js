import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('levelComplete');
  }

  init(data) {
    this.world = data.world;
    this.level = data.level;
    this.score = data.score;
    this.stars = data.stars;
    this.coins = data.coins || 0;
    this.wagons = data.wagons || 0;
    this.newUnlock = data.newUnlock || false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('complete_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'complete_bg').setOrigin(0);

    // Звёзды для атмосферы
    this.createStars();

    // Заголовок
    const title = this.add.text(w / 2, 80, 'УРОВЕНЬ ПРОЙДЕН!', {
      fontSize: '36px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.success,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Анимация заголовка
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      yoyo: true,
      repeat: 1
    });

    // Контейнер для звёзд
    const starsContainer = this.add.container(w / 2, 170);
    
    for (let i = 0; i < 3; i++) {
      const starX = (i - 1) * 60;
      const star = this.add.text(starX, 0, '⭐', {
        fontSize: '60px'
      }).setOrigin(0.5);
      
      if (i < this.stars) {
        star.setAlpha(1);
        // Анимация для полученных звёзд
        this.tweens.add({
          targets: star,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 300,
          delay: i * 200,
          yoyo: true,
          ease: 'Back.out'
        });
      } else {
        star.setAlpha(0.2);
      }
      
      starsContainer.add(star);
    }

    // Статистика
    const statsY = 260;
    const statsBg = this.add.rectangle(w / 2, statsY, w - 60, 120, 0x1a1a3a, 0.8)
      .setStrokeStyle(2, COLORS.primary);

    this.add.text(w / 2, statsY - 35, 'РЕЗУЛЬТАТЫ', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5);

    this.add.text(w / 2 - 80, statsY, `Счёт: ${this.score}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    this.add.text(w / 2 + 20, statsY, `Монет: +${this.coins}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0, 0.5);

    this.add.text(w / 2 - 80, statsY + 30, `Вагонов: ${this.wagons}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    // Награда
    const reward = 50 + this.stars * 25;
    this.add.text(w / 2 + 20, statsY + 30, `Награда: +${reward} 💎`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.success
    }).setOrigin(0, 0.5);

    // Сообщение о разблокировке
    if (this.newUnlock) {
      const unlockMsg = this.add.text(w / 2, statsY + 80, '✨ НОВЫЙ УРОВЕНЬ ОТКРЫТ! ✨', {
        fontSize: '14px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.accent
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: unlockMsg,
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

    // Кнопка "Выбор уровня"
    const selectBtn = this.add.text(w / 2 + 120, btnY, 'УРОВНИ', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 25, y: 12 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setInteractive().setOrigin(0.5);

    // Кнопка "Далее" (если есть следующий уровень)
    if (this.level < 9) {
      const nextBtn = this.add.text(w / 2, btnY + 50, 'СЛЕДУЮЩИЙ УРОВЕНЬ →', {
        fontSize: '18px',
        fontFamily: "'Orbitron', sans-serif",
        color: COLORS.accent,
        backgroundColor: '#1a1a3a',
        padding: { x: 30, y: 12 },
        stroke: COLORS.accent,
        strokeThickness: 2
      }).setInteractive().setOrigin(0.5);

      nextBtn.on('pointerover', () => {
        nextBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.accent });
        nextBtn.setScale(1.05);
      });

      nextBtn.on('pointerout', () => {
        nextBtn.setStyle({ color: COLORS.accent, backgroundColor: '#1a1a3a' });
        nextBtn.setScale(1);
      });

      nextBtn.on('pointerdown', () => {
        gameManager.setCurrentLevel(this.level + 1);
        this.scene.start('play');
        try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
      });
    }

    // Обработчики для кнопок
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

    selectBtn.on('pointerover', () => {
      selectBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      selectBtn.setScale(1.05);
    });

    selectBtn.on('pointerout', () => {
      selectBtn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      selectBtn.setScale(1);
    });

    selectBtn.on('pointerdown', () => {
      this.scene.start('levelSelect');
      try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
    });

    // Звук победы
    try { audioManager.playSound(this, 'win_sound', 0.5); } catch (e) {}
    
    // Добавляем кристаллы за прохождение
    gameManager.addCrystals(reward);
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
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.0));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }
  }
}