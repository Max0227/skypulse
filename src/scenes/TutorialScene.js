import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super('tutorial');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.slideIndex = 0;

    const slides = [
      {
        text: 'Нажимай на экран, чтобы такси подпрыгивало.',
        icon: '🖐️',
        detail: 'Чем выше прыжок, тем дольше полёт',
        color: 0x00ffff
      },
      {
        text: 'Собирай монеты. Каждые 15 монет добавляют вагон.',
        icon: '🪙',
        detail: 'Жёлтые = 1💎, Красные = 2💎 + ускорение',
        color: 0xffaa00
      },
      {
        text: 'Цветные монеты дают бонусы:',
        icon: '🔴🔵🟢🟣',
        detail: 'Красные - ускорение | Синие - щит | Зелёные - магнит | Фиолетовые - замедление',
        color: 0xff44ff
      },
      {
        text: 'Вагоны увеличивают очки, но их можно потерять.',
        icon: '🚃',
        detail: 'У вагонов есть здоровье, они цепляются друг за другом',
        color: 0x88ccff
      },
      {
        text: 'Синие кубы модернизируют такси прямо во время игры!',
        icon: '🔷',
        detail: 'Добавляют новые визуальные элементы и эффекты',
        color: 0x3366ff
      },
      {
        text: 'Астероиды опасны – уворачивайся от них!',
        icon: '☄️',
        detail: 'При столкновении теряешь здоровье и сбрасываешь комбо',
        color: 0xff6600
      },
      {
        text: 'Спецсобытия делают игру разнообразнее:',
        icon: '⚡🌪️🌀',
        detail: 'Метеоритный дождь, гравитационные скачки, временные искажения',
        color: 0xff00ff
      },
      {
        text: 'В магазине можно купить скины и улучшения.',
        icon: '🛒',
        detail: 'Скины меняют внешний вид такси, улучшения прокачивают характеристики',
        color: 0xffaa00
      },
      {
        text: 'Открывай новые миры и проходи уровни!',
        icon: '🌌🌆🏰☄️⚫',
        detail: '5 уникальных миров с разной сложностью и визуалом',
        color: 0x00ffff
      }
    ];

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('tutorial_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'tutorial_bg').setOrigin(0);

    // Звёзды для атмосферы
    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }

    // Контейнер для слайда
    this.slideContainer = this.add.container(w / 2, h / 2);

    // Иконка
    this.iconObj = this.add.text(0, -120, slides[0].icon, {
      fontSize: '80px'
    }).setOrigin(0.5);

    // Текст
    this.textObj = this.add.text(0, -20, slides[0].text, {
      fontSize: '20px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 80 },
      lineSpacing: 10
    }).setOrigin(0.5);

    // Детали
    this.detailObj = this.add.text(0, 40, slides[0].detail, {
      fontSize: '14px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_secondary,
      align: 'center',
      wordWrap: { width: w - 80 }
    }).setOrigin(0.5);

    // Индикатор цвета
    this.colorIndicator = this.add.rectangle(0, -180, 100, 4, slides[0].color)
      .setOrigin(0.5);

    this.slideContainer.add([this.iconObj, this.textObj, this.detailObj, this.colorIndicator]);

    // Прогресс
    this.progressText = this.add.text(w / 2, h - 150, `1/${slides.length}`, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_secondary
    }).setOrigin(0.5);

    // Кнопки навигации
    this.prevBtn = this.createButton(w / 2 - 120, h - 80, '◀ НАЗАД', () => this.prevSlide());
    this.nextBtn = this.createButton(w / 2 + 120, h - 80, 'ДАЛЕЕ ▶', () => this.nextSlide(slides.length));
    
    // Кнопка пропуска
    this.skipBtn = this.add.text(w / 2, h - 40, 'ПРОПУСТИТЬ ОБУЧЕНИЕ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_muted,
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 8 },
      stroke: COLORS.text_muted,
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive();

    this.skipBtn.on('pointerover', () => {
      this.skipBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
    });

    this.skipBtn.on('pointerout', () => {
      this.skipBtn.setStyle({ color: COLORS.text_muted, backgroundColor: '#1a1a3a' });
    });

    this.skipBtn.on('pointerdown', () => {
      gameManager.data.tutorialCompleted = true;
      gameManager.save();
      this.scene.start('worldSelect');
    });

    this.slides = slides;

    // Звук переключения
    this.switchSound = () => {
      try { audioManager.playSound(this, 'tap_sound', 0.2); } catch (e) {}
    };
  }

  prevSlide() {
    if (this.slideIndex > 0) {
      this.slideIndex--;
      this.updateSlide();
      this.switchSound();
    }
  }

  nextSlide(total) {
    if (this.slideIndex === total - 1) {
      gameManager.data.tutorialCompleted = true;
      gameManager.save();
      this.scene.start('worldSelect');
    } else {
      this.slideIndex++;
      this.updateSlide();
      this.switchSound();
    }
  }

  updateSlide() {
    const slide = this.slides[this.slideIndex];

    // Анимация смены слайда
    this.tweens.add({
      targets: this.slideContainer,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.iconObj.setText(slide.icon);
        this.textObj.setText(slide.text);
        this.detailObj.setText(slide.detail);
        this.colorIndicator.setFillStyle(slide.color);
        this.progressText.setText(`${this.slideIndex + 1}/${this.slides.length}`);

        this.tweens.add({
          targets: this.slideContainer,
          alpha: 1,
          duration: 150
        });
      }
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 20, y: 10 },
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