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
  }

  add(amount = 1) {
    this.combo += amount;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    
    // Множитель: x1, x1.2, x1.5, x2, x2.5, x3 и т.д.
    if (this.combo < 5) this.multiplier = 1 + (this.combo * 0.2);
    else if (this.combo < 10) this.multiplier = 2 + ((this.combo - 5) * 0.3);
    else if (this.combo < 20) this.multiplier = 3.5 + ((this.combo - 10) * 0.2);
    else this.multiplier = 5 + ((this.combo - 20) * 0.1);
    
    this.multiplier = Math.min(10, this.multiplier); // Максимум x10
    
    this.showComboText();
    this.createComboParticles();
    this.resetTimer();
    
    // Визуальный эффект на экране
    this.pulseScreen();
  }

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

  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  showComboText() {
    if (this.combo < 2) return;
    
    if (this.comboText) this.comboText.destroy();
    
    const w = this.scene.scale.width;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex] || 0xff00ff;
    
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

  createComboParticles() {
    if (this.combo < 3) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const color = this.comboColors[Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1)] || 0xff00ff;
    
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

  pulseScreen() {
  if (this.combo < 3) return;
  
  const intensity = Math.min(0.05, 0.01 * this.combo);
  this.scene.cameras.main.shake(100, intensity);
  
  // Эффект свечения по краям
  const w = this.scene.scale.width;  // БЫЛО: this.scale.width
  const h = this.scene.scale.height; // БЫЛО: this.scale.height
  
  const glow = this.scene.add.graphics();
  glow.lineStyle(10, 0xffff00, 0.3);
  glow.strokeRect(5, 5, w - 10, h - 10);
  glow.setDepth(200);
  glow.setScrollFactor(0);
  
  this.scene.tweens.add({
    targets: glow,
    alpha: 0,
    duration: 200,
    onComplete: () => glow.destroy()
  });
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
    // Ничего не делаем, таймер сам сбрасывает
  }

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    this.particleEmitters.forEach(e => e.destroy());
  }
}