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
    
    // Расширенная палитра цветов для разных уровней комбо
    this.comboColors = [
      0xffffff, // 0-4: белый
      0xffff00, // 5-9: желтый
      0xffaa00, // 10-14: оранжевый
      0xff00ff, // 15-19: розовый
      0x00ffff, // 20-24: голубой
      0xff44ff, // 25-29: фиолетовый
      0xff0000  // 30+: красный
    ];
    
    this.particleEmitters = [];
    this.soundKeys = {
      combo: 'combo_sound',
      maxCombo: 'max_combo_sound',
      lost: 'combo_lost_sound'
    };
    
    // Флаги для отслеживания рекордов
    this.comboMilestones = [5, 10, 15, 20, 25, 30, 40, 50];
    this.reachedMilestones = [];
  }

  add(amount = 1) {
    const oldCombo = this.combo;
    this.combo += amount;
    
    // Проверка на новый рекорд
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
      this.onNewMaxCombo();
    }
    
    // Обновляем множитель
    this.updateMultiplier();
    
    // Визуальные и звуковые эффекты
    this.showComboText();
    this.createComboParticles();
    this.pulseScreen();
    this.playComboSound();
    
    // Проверка достижения milestone
    this.checkMilestones(oldCombo);
    
    // Сбрасываем таймер
    this.resetTimer();
  }

  updateMultiplier() {
    // Более плавная кривая множителя
    if (this.combo < 5) {
      this.multiplier = 1 + (this.combo * 0.2); // 1.0, 1.2, 1.4, 1.6, 1.8
    } else if (this.combo < 10) {
      this.multiplier = 2 + ((this.combo - 5) * 0.2); // 2.0, 2.2, 2.4, 2.6, 2.8
    } else if (this.combo < 20) {
      this.multiplier = 3 + ((this.combo - 10) * 0.15); // 3.0, 3.15, 3.3... до 4.5
    } else if (this.combo < 30) {
      this.multiplier = 4.5 + ((this.combo - 20) * 0.1); // 4.5, 4.6... до 5.5
    } else if (this.combo < 50) {
      this.multiplier = 5.5 + ((this.combo - 30) * 0.05); // 5.5, 5.55... до 6.5
    } else {
      this.multiplier = 6.5 + ((this.combo - 50) * 0.02); // до 7.5 максимум
    }
    
    this.multiplier = Math.min(7.5, Math.round(this.multiplier * 100) / 100);
  }

  reset() {
    const oldCombo = this.combo;
    
    if (oldCombo > 0) {
      this.combo = 0;
      this.multiplier = 1;
      
      if (this.timer) this.timer.remove();
      if (this.comboText) this.comboText.destroy();
      if (this.comboCountText) this.comboCountText.destroy();
      
      if (oldCombo >= 5) {
        this.showComboLost();
        this.playSound('lost');
      }
      
      // Очищаем все эмиттеры
      this.clearParticles();
    }
  }

  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  showComboText() {
    if (this.combo < 2) return;
    
    // Удаляем старые тексты
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    
    const w = this.scene.scale.width;
    const colorIndex = Math.min(
      Math.floor(this.combo / 5), 
      this.comboColors.length - 1
    );
    const color = this.comboColors[colorIndex] || 0xff00ff;
    const colorString = this.getColorString(color);
    
    // Главный текст с множителем
    this.comboText = this.scene.add.text(w / 2, 120, `x${this.multiplier.toFixed(1)}`, {
      fontSize: this.getFontSize(),
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: colorString,
      strokeThickness: 6,
      shadow: { blur: 15, color: colorString, fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    // Текст с количеством комбо
    this.comboCountText = this.scene.add.text(w / 2, 70, `${this.combo} КОМБО`, {
      fontSize: '20px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffffff',
      stroke: colorString,
      strokeThickness: 3,
      shadow: { blur: 10, color: colorString, fill: true }
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
      fontSize: '28px',
      fontFamily: "'Orbitron', monospace",
      color: '#ff4444',
      stroke: '#880000',
      strokeThickness: 4,
      shadow: { blur: 10, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    
    lostText.setScale(0.5);
    this.scene.tweens.add({
      targets: lostText,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => lostText.destroy()
    });
  }

  createComboParticles() {
    if (this.combo < 3) return;
    
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colorIndex = Math.min(
      Math.floor(this.combo / 5), 
      this.comboColors.length - 1
    );
    const color = this.comboColors[colorIndex] || 0xff00ff;
    
    // Количество частиц зависит от комбо
    const particleCount = Math.min(30, 5 + Math.floor(this.combo / 2));
    
    const emitter = this.scene.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 600,
      quantity: particleCount,
      blendMode: Phaser.BlendModes.ADD,
      tint: color
    });
    
    emitter.explode(particleCount);
    this.particleEmitters.push(emitter);
    
    // Автоматическое удаление
    this.scene.time.delayedCall(700, () => {
      if (emitter && emitter.destroy) {
        emitter.destroy();
        this.particleEmitters = this.particleEmitters.filter(e => e !== emitter);
      }
    });
    
    // Добавляем искры вокруг игрока
    if (this.combo >= 10 && this.scene.player) {
      this.createPlayerSparkEffect(color);
    }
  }

  createPlayerSparkEffect(color) {
    if (!this.scene.player) return;
    
    const sparkEmitter = this.scene.add.particles(
      this.scene.player.x, 
      this.scene.player.y, 
      'spark', 
      {
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        quantity: 3,
        frequency: 50,
        blendMode: Phaser.BlendModes.ADD,
        tint: color,
        follow: this.scene.player
      }
    );
    
    this.particleEmitters.push(sparkEmitter);
    
    // Останавливаем через секунду
    this.scene.time.delayedCall(1000, () => {
      if (sparkEmitter && sparkEmitter.stop) {
        sparkEmitter.stop();
      }
    });
    
    this.scene.time.delayedCall(1500, () => {
      if (sparkEmitter && sparkEmitter.destroy) {
        sparkEmitter.destroy();
        this.particleEmitters = this.particleEmitters.filter(e => e !== sparkEmitter);
      }
    });
  }

  pulseScreen() {
    if (this.combo < 3) return;
    
    // Интенсивность тряски зависит от комбо
    const intensity = Math.min(0.05, 0.01 * Math.sqrt(this.combo));
    this.scene.cameras.main.shake(100, intensity);
    
    // Эффект свечения по краям
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    const glow = this.scene.add.graphics();
    
    // Цвет свечения зависит от комбо
    const colorIndex = Math.min(
      Math.floor(this.combo / 5), 
      this.comboColors.length - 1
    );
    const color = this.comboColors[colorIndex] || 0xffff00;
    
    glow.lineStyle(5 + Math.floor(this.combo / 5), color, 0.3);
    glow.strokeRect(5, 5, w - 10, h - 10);
    glow.setDepth(200);
    glow.setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 300,
      onComplete: () => glow.destroy()
    });
  }

  playComboSound() {
    if (this.combo % 5 === 0 && this.combo > 0) {
      this.playSound('maxCombo');
    } else {
      this.playSound('combo');
    }
  }

  playSound(type) {
    const soundKey = this.soundKeys[type];
    if (!soundKey) return;
    
    try {
      if (this.scene.cache.audio.has(soundKey)) {
        const sound = this.scene.sound.add(soundKey, { volume: 0.4 });
        sound.play();
      }
    } catch (e) {
      // Игнорируем ошибки звука
    }
  }

  checkMilestones(oldCombo) {
    for (const milestone of this.comboMilestones) {
      if (oldCombo < milestone && this.combo >= milestone && !this.reachedMilestones.includes(milestone)) {
        this.reachedMilestones.push(milestone);
        this.showMilestoneMessage(milestone);
      }
    }
  }

  showMilestoneMessage(milestone) {
    const w = this.scene.scale.width;
    
    const msg = this.scene.add.text(w / 2, 200, `${milestone} КОМБО!`, {
      fontSize: '32px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffaa00',
      stroke: '#ff5500',
      strokeThickness: 4,
      shadow: { blur: 15, color: '#ffaa00', fill: true }
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
    
    msg.setScale(0.5);
    this.scene.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => msg.destroy()
    });
    
    // Добавляем бонусные кристаллы за достижение
    if (this.scene.crystals) {
      this.scene.crystals += milestone;
      if (this.scene.crystalText) {
        this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      }
    }
  }

  onNewMaxCombo() {
    const w = this.scene.scale.width;
    
    const recordText = this.scene.add.text(w / 2, 250, 'НОВЫЙ РЕКОРД!', {
      fontSize: '24px',
      fontFamily: "'Orbitron', monospace",
      color: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: recordText,
      alpha: 0,
      duration: 2000,
      onComplete: () => recordText.destroy()
    });
    
    // Дополнительная тряска
    this.scene.cameras.main.shake(200, 0.02);
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

  clearParticles() {
    this.particleEmitters.forEach(e => {
      if (e && e.destroy) e.destroy();
    });
    this.particleEmitters = [];
  }

  update(delta) {
    // Можно добавить пульсацию множителя или другие эффекты
  }

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    this.clearParticles();
  }
}