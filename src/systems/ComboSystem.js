export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = null;
    this.comboTimeout = 3000; // 3 секунды
    this.comboText = null;
    this.comboCountText = null;
    this.particleEmitters = [];

    // Цвета для разных уровней комбо (мягкий градиент)
    this.comboColors = [
      0xffffff, // 0-4: белый
      0xffdd44, // 5-9: золотой
      0xffaa00, // 10-14: оранжевый
      0xff66aa, // 15-19: розовый
      0xaa88ff, // 20-24: фиолетовый
      0x66ccff, // 25-29: голубой
      0xff4444  // 30+: красный
    ];

    // Флаги для управления эффектами (можно включать/выключать)
    this.enableParticles = true;
    this.enableScreenShake = false; // отключаем тряску для производительности
    this.enableMilestoneMessages = false; // отключаем лишние сообщения
    this.enableSounds = false; // звуки отключены
  }

  add(amount = 1) {
    const oldCombo = this.combo;
    this.combo += amount;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Обновляем множитель по плавной кривой
    this.updateMultiplier();

    // Показываем текст комбо
    this.showComboText();

    // Частицы только на высоких комбо и если включены
    if (this.enableParticles && this.combo >= 10 && this.combo % 5 === 0) {
      this.createComboParticles();
    }

    // Сброс таймера
    this.resetTimer();
  }

  updateMultiplier() {
    if (this.combo < 5) {
      this.multiplier = 1 + this.combo * 0.2;               // 1.0, 1.2, 1.4, 1.6, 1.8
    } else if (this.combo < 10) {
      this.multiplier = 2 + (this.combo - 5) * 0.2;        // 2.0, 2.2, 2.4, 2.6, 2.8
    } else if (this.combo < 20) {
      this.multiplier = 3 + (this.combo - 10) * 0.15;      // 3.0...4.5
    } else if (this.combo < 30) {
      this.multiplier = 4.5 + (this.combo - 20) * 0.1;     // 4.5...5.5
    } else {
      this.multiplier = 5.5 + (this.combo - 30) * 0.05;    // до 6.5
    }
    this.multiplier = Math.min(6.5, Math.round(this.multiplier * 100) / 100);
  }

  reset() {
    const oldCombo = this.combo;
    this.combo = 0;
    this.multiplier = 1;

    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    this.clearParticles();

    if (oldCombo >= 5) {
      this.showComboLost();
    }
  }

  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  showComboText() {
    if (this.combo < 2) return;

    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();

    const w = this.scene.scale.width;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex] || 0xffffff;
    const colorString = this.getColorString(color);

    // Главный текст с множителем
    this.comboText = this.scene.add.text(w / 2, 120, `x${this.multiplier.toFixed(1)}`, {
      fontSize: this.getFontSize(),
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: colorString,
      strokeThickness: 5,
      shadow: { blur: 12, color: colorString, fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Текст с количеством комбо
    this.comboCountText = this.scene.add.text(w / 2, 70, `${this.combo} КОМБО`, {
      fontSize: '20px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(99).setScrollFactor(0);

    // Анимация появления
    [this.comboText, this.comboCountText].forEach(text => {
      text.setScale(0.5);
      this.scene.tweens.add({
        targets: text,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.out'
      });
    });

    // Анимация исчезновения
    this.scene.tweens.add({
      targets: [this.comboText, this.comboCountText],
      alpha: 0,
      duration: 800,
      delay: 700,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.comboText) this.comboText.destroy();
        if (this.comboCountText) this.comboCountText.destroy();
      }
    });
  }

  getFontSize() {
    if (this.combo < 10) return '48px';
    if (this.combo < 20) return '56px';
    if (this.combo < 30) return '64px';
    return '72px';
  }

  showComboLost() {
    const w = this.scene.scale.width;
    const lostText = this.scene.add.text(w / 2, 150, 'КОМБО ПРЕРВАНО', {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff8888',
      stroke: '#aa0000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.scene.tweens.add({
      targets: lostText,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => lostText.destroy()
    });
  }

  createComboParticles() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex] || 0xffaa00;

    // Умеренное количество частиц
    const count = Math.min(15, 5 + Math.floor(this.combo / 2));

    const emitter = this.scene.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -150, max: 150 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: count,
      blendMode: Phaser.BlendModes.ADD,
      tint: color
    });

    emitter.explode(count);
    this.particleEmitters.push(emitter);

    // Автоматическое удаление через 600 мс
    this.scene.time.delayedCall(600, () => {
      if (emitter && emitter.destroy) {
        emitter.destroy();
        this.particleEmitters = this.particleEmitters.filter(e => e !== emitter);
      }
    });
  }

  clearParticles() {
    this.particleEmitters.forEach(emitter => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
    this.particleEmitters = [];
  }

  getMultiplier() {
    return this.multiplier;
  }

  getCombo() {
    return this.combo;
  }

  getMaxCombo() {
    return this.maxCombo;
  }

  getColorString(colorHex) {
    const r = (colorHex >> 16) & 255;
    const g = (colorHex >> 8) & 255;
    const b = colorHex & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  update(delta) {
    // Можно ничего не делать
  }

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    this.clearParticles();
  }
}