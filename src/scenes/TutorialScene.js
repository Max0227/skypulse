import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super('tutorial');
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.slideIndex = 0;
    const slides = [
      { text: 'Нажимай на экран, чтобы такси подпрыгивало.', icon: '🖐️', bg: 0x0a0a1a },
      { text: 'Собирай монеты. Каждые 15 монет добавляют вагон.', icon: '🪙', bg: 0x1a0a2a },
      { text: 'Вагоны увеличивают очки, но их можно потерять.', icon: '🚃', bg: 0x2a1a0a },
      { text: 'Красные монеты = ускорение, синие = щит.', icon: '🔴🔵', bg: 0x0a1a2a },
      { text: 'Зелёные = магнит, фиолетовые = замедление.', icon: '🟢🟣', bg: 0x2a0a1a },
      { text: 'В магазине можно улучшить способности.', icon: '🛒', bg: 0x1a2a0a },
      { text: 'На уровнях появляются враги – атакуй их кнопкой!', icon: '⚔️', bg: 0x2a2a0a },
    ];

    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('tutorial_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'tutorial_bg').setOrigin(0);

    this.textObj = this.add.text(w/2, h/2 - 50, slides[0].text, {
      fontSize: '20px',
      fontFamily: "'Orbitron', monospace",
      color: COLORS.text_primary,
      align: 'center',
      wordWrap: { width: w - 60 }
    }).setOrigin(0.5);

    this.iconObj = this.add.text(w/2, h/2 + 50, slides[0].icon, {
      fontSize: '60px'
    }).setOrigin(0.5);

    this.prevBtn = this.createButton(w/2 - 100, h - 80, 'НАЗАД', () => this.prevSlide());
    this.nextBtn = this.createButton(w/2 + 100, h - 80, 'ДАЛЕЕ', () => this.nextSlide(slides.length));
    this.skipBtn = this.createButton(w/2, h - 40, 'ПРОПУСТИТЬ', () => {
      gameManager.data.tutorialCompleted = true;
      gameManager.save();
      this.scene.start('play');
    });

    this.slides = slides;
  }

  prevSlide() {
    this.slideIndex = Math.max(0, this.slideIndex - 1);
    this.updateSlide();
  }

  nextSlide(total) {
    if (this.slideIndex === total - 1) {
      gameManager.data.tutorialCompleted = true;
      gameManager.save();
      this.scene.start('play');
    } else {
      this.slideIndex++;
      this.updateSlide();
    }
  }

  updateSlide() {
    this.textObj.setText(this.slides[this.slideIndex].text);
    this.iconObj.setText(this.slides[this.slideIndex].icon);
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
      .on('pointerover', () => btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary }))
      .on('pointerout', () => btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' }))
      .on('pointerdown', callback);
    return btn;
  }
}