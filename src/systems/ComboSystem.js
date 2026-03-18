import Phaser from 'phaser';

export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.timer = null;
    this.comboTimeout = 3000; // 3 секунды
    this.comboText = null;
    this.comboColors = [0xffffff, 0xffff00, 0xffaa00, 0xff00ff, 0x00ffff];
    this.particleEmitters = [];
    this.lastPulseTime = 0;
    this.pulseCooldown = 500; // мс между пульсациями
    this.soundEnabled = true;
  }

  /**
   * Добавить комбо
   * @param {number} amount - количество добавляемых очков комбо
   */
  add(amount = 1) {
    this.combo += amount;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    
    // Множитель: x1, x1.2, x1.5, x2, x2.5, x3 и т.д.
    if (this.combo < 5) this.multiplier = 1 + (this.combo * 0.2);
    else if (this.combo < 10) this.multiplier = 2 + ((this.combo - 5) * 0.3);
    else if (this.combo < 20) this.multiplier = 3.5 + ((this.combo - 10) * 0.2);
    else this.multiplier = 5 + ((this.combo - 20) * 0.1);
    
    this.multiplier = Math.min(10, this.multiplier); // Максимум x10
    this.multiplier = Math.round(this.multiplier * 10) / 10; // Округляем до 1 знака
    
    this.showComboText();
    this.createComboParticles();
    this.pulseScreen();
    this.resetTimer();
    
    // Визуальный эффект на экране
    this.flashScreen();
    
    // Звук комбо
    this.playComboSound();
  }

  /**
   * Сбросить комбо
   */
  reset() {
    const oldCombo = this.combo;
    this.combo = 0;
    this.multiplier = 1;
    
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    
    if (oldCombo > 5) {
      this.showComboLost();
    }
  }

  /**
   * Сбросить таймер комбо
   */
  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  /**
   * Показать текст комбо
   */
  showComboText() {
    if (this.combo < 2) return;
    
    if (this.comboText) this.comboText.destroy();
    
    const w = this.scene.scale.width;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex] || 0xff00ff;
    
    // Основной текст комбо
    this.comboText = this.scene.add.text(w / 2, 120, `x${this.multiplier.toFixed(1)}`, {
      fontSize: '48px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: this.getColorString(color),
      strokeThickness: 6,
      shadow: { blur: 15, color: this.getColorString(color), fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    // Анимация появления
    this.comboText.setScale(0.5);
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.out'
    });
    
    // Анимация исчезновения
    this.scene.tweens.add({
      targets: this.comboText,
      alpha: 0,
      duration: 800,
      delay: 700,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.comboText) this.comboText.destroy();
      }
    });
    
    // Добавляем маленький текст с количеством комбо
    const comboCount = this.scene.add.text(w / 2, 80, `${this.combo} КОМБО`, {
      fontSize: '18px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(99).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: comboCount,
      alpha: 0,
      duration: 800,
      delay: 700,
      onComplete: () => comboCount.destroy()
    });
  }

  /**
   * Показать сообщение о потере комбо
   */
  showComboLost() {
    const w = this.scene.scale.width;
    
    const lostText = this.scene.add.text(w / 2, 150, 'КОМБО ПРЕРВАНО', {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff4444',
      stroke: '#880000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: lostText,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => lostText.destroy()
    });
  }

  /**
   * Создать частицы комбо
   */
  createComboParticles() {
    if (this.combo < 3) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex] || 0xff00ff;
    
    const emitter = this.scene.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: 10 + Math.floor(this.combo / 2),
      blendMode: Phaser.BlendModes.ADD,
      tint: color
    });
    
    emitter.explode(10 + Math.floor(this.combo / 2));
    
    this.particleEmitters.push(emitter);
    
    this.scene.time.delayedCall(600, () => {
      emitter.destroy();
      this.particleEmitters = this.particleEmitters.filter(e => e !== emitter);
    });
  }

  /**
   * Эффект пульсации экрана
   */
  pulseScreen() {
    if (this.combo < 3) return;
    
    // Проверяем кулдаун пульсации
    const now = Date.now();
    if (now - this.lastPulseTime < this.pulseCooldown) return;
    this.lastPulseTime = now;
    
    const intensity = Math.min(0.03, 0.005 * this.combo);
    this.scene.cameras.main.shake(100, intensity);
  }

  /**
   * Эффект вспышки на экране
   */
  flashScreen() {
    if (this.combo < 3) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    const flash = this.scene.add.rectangle(w / 2, h / 2, w, h, 0xffff00, 0.1)
      .setDepth(90)
      .setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });
  }

  /**
   * Воспроизвести звук комбо
   */
  playComboSound() {
    if (!this.soundEnabled) return;
    
    try {
      if (this.combo === 5) {
        this.scene.sound.play('combo_5', { volume: 0.3 });
      } else if (this.combo === 10) {
        this.scene.sound.play('combo_10', { volume: 0.4 });
      } else if (this.combo === 20) {
        this.scene.sound.play('combo_20', { volume: 0.5 });
      } else if (this.combo === 30) {
        this.scene.sound.play('combo_30', { volume: 0.6 });
      }
    } catch (e) {
      // Игнорируем ошибки звука
    }
  }

  /**
   * Получить текущий множитель
   * @returns {number}
   */
  getMultiplier() {
    return this.multiplier;
  }

  /**
   * Получить текущее комбо
   * @returns {number}
   */
  getCombo() {
    return this.combo;
  }

  /**
   * Получить максимальное комбо
   * @returns {number}
   */
  getMaxCombo() {
    return this.maxCombo;
  }

  /**
   * Получить цвет в строковом формате
   * @param {number} colorHex - цвет в HEX
   * @returns {string}
   */
  getColorString(colorHex) {
    const r = (colorHex >> 16) & 255;
    const g = (colorHex >> 8) & 255;
    const b = colorHex & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Обновление системы
   * @param {number} delta - время между кадрами
   */
  update(delta) {
    // Ничего не делаем, таймер сам сбрасывает
  }

  /**
   * Уничтожить систему
   */
  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    this.particleEmitters.forEach(e => e.destroy());
  }
}