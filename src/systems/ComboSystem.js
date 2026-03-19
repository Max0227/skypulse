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
    this.comboGlowText = null;
    this.particleEmitters = [];
    this.activeTweens = [];
    this.comboMilestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    this.reachedMilestones = [];

    // Расширенная цветовая палитра для комбо
    this.comboColors = [
      { color: 0xffffff, glow: '#ffffff' }, // 0-4: белый
      { color: 0xffdd44, glow: '#ffff00' }, // 5-9: золотой
      { color: 0xffaa00, glow: '#ffaa00' }, // 10-14: оранжевый
      { color: 0xff66aa, glow: '#ff44ff' }, // 15-19: розовый
      { color: 0xaa88ff, glow: '#aa88ff' }, // 20-24: фиолетовый
      { color: 0x66ccff, glow: '#00ffff' }, // 25-29: голубой
      { color: 0xff4444, glow: '#ff0000' }  // 30+: красный
    ];

    // Настройки эффектов
    this.enableParticles = true;
    this.enableScreenShake = true;
    this.enableMilestoneMessages = true;
    this.enableSounds = true;
    this.enableGlowEffect = true;
    this.enablePulseEffect = true;

    // Кэш для звуков
    this.soundCache = {};

    // Статистика
    this.totalComboPoints = 0;
    this.longestComboStreak = 0;
    this.comboStartTime = 0;
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  add(amount = 1) {
    const oldCombo = this.combo;
    const oldMultiplier = this.multiplier;
    
    this.combo += amount;
    this.totalComboPoints += amount;
    
    // Отслеживаем время комбо
    if (this.combo === 1) {
      this.comboStartTime = Date.now();
    }

    // Обновляем рекорды
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
      this.longestComboStreak = this.combo;
      this.onNewMaxCombo();
    }

    // Обновляем множитель
    this.updateMultiplier();

    // Показываем визуальные эффекты
    this.showComboText(oldMultiplier);
    
    // Эффекты частиц
    if (this.enableParticles) {
      this.createComboParticles();
    }

    // Эффект пульсации
    if (this.enablePulseEffect) {
      this.pulseScreen();
    }

    // Эффект свечения
    if (this.enableGlowEffect && this.combo >= 5) {
      this.createGlowEffect();
    }

    // Проверка достижений
    this.checkMilestones(oldCombo);

    // Звук
    if (this.enableSounds) {
      this.playComboSound();
    }

    // Сброс таймера
    this.resetTimer();

    // Обновляем статистику
    this.updateStats();
  }

  updateMultiplier() {
    // Плавная кривая множителя
    if (this.combo < 5) {
      this.multiplier = 1 + this.combo * 0.2;               // 1.0, 1.2, 1.4, 1.6, 1.8
    } else if (this.combo < 10) {
      this.multiplier = 2 + (this.combo - 5) * 0.2;        // 2.0, 2.2, 2.4, 2.6, 2.8
    } else if (this.combo < 20) {
      this.multiplier = 3 + (this.combo - 10) * 0.15;      // 3.0...4.5
    } else if (this.combo < 30) {
      this.multiplier = 4.5 + (this.combo - 20) * 0.1;     // 4.5...5.5
    } else if (this.combo < 50) {
      this.multiplier = 5.5 + (this.combo - 30) * 0.05;    // 5.5...6.5
    } else if (this.combo < 100) {
      this.multiplier = 6.5 + (this.combo - 50) * 0.02;    // 6.5...7.5
    } else {
      this.multiplier = 7.5 + (this.combo - 100) * 0.01;   // до 8.5
    }
    
    this.multiplier = Math.min(8.5, Math.round(this.multiplier * 100) / 100);
  }

  reset() {
    const oldCombo = this.combo;
    
    if (oldCombo > 0) {
      this.combo = 0;
      this.multiplier = 1;

      // Очищаем таймеры и тексты
      if (this.timer) this.timer.remove();
      if (this.comboText) this.comboText.destroy();
      if (this.comboCountText) this.comboCountText.destroy();
      if (this.comboGlowText) this.comboGlowText.destroy();
      
      this.clearParticles();
      this.clearTweens();

      // Показываем сообщение о потерянном комбо
      if (oldCombo >= 5) {
        this.showComboLost();
      }

      // Вычисляем длительность комбо
      if (this.comboStartTime > 0) {
        const duration = (Date.now() - this.comboStartTime) / 1000;
        console.log(`Combo lasted ${duration.toFixed(1)} seconds`);
      }
    }
  }

  resetTimer() {
    if (this.timer) this.timer.remove();
    this.timer = this.scene.time.delayedCall(this.comboTimeout, () => this.reset());
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  showComboText(oldMultiplier) {
    if (this.combo < 2) return;

    // Очищаем старые тексты
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    if (this.comboGlowText) this.comboGlowText.destroy();

    const w = this.scene.scale.width;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const colors = this.comboColors[colorIndex] || this.comboColors[0];
    const colorString = this.getColorString(colors.color);

    // Проверяем, увеличился ли множитель
    const multiplierIncreased = this.multiplier > oldMultiplier;

    // Основной текст с множителем
    this.comboText = this.scene.add.text(w / 2, 120, `x${this.multiplier.toFixed(1)}`, {
      fontSize: this.getFontSize(),
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: colors.glow,
      strokeThickness: 6,
      shadow: { 
        offsetX: 0, 
        offsetY: 0, 
        color: colors.glow, 
        blur: 20, 
        fill: true,
        stroke: true
      }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    // Дополнительное свечение
    this.comboGlowText = this.scene.add.text(w / 2, 120, `x${this.multiplier.toFixed(1)}`, {
      fontSize: this.getFontSize(),
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#ffffff',
      strokeThickness: 2,
      alpha: 0.3
    }).setOrigin(0.5).setDepth(99).setScrollFactor(0);

    // Текст с количеством комбо
    this.comboCountText = this.scene.add.text(w / 2, 70, `${this.combo} КОМБО`, {
      fontSize: '22px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#ffffff',
      stroke: colors.glow,
      strokeThickness: 3,
      shadow: { blur: 10, color: colors.glow, fill: true }
    }).setOrigin(0.5).setDepth(99).setScrollFactor(0);

    // Анимация появления
    const targets = [this.comboText, this.comboCountText, this.comboGlowText];
    targets.forEach(text => {
      if (!text) return;
      text.setScale(multiplierIncreased ? 0.3 : 0.5);
      this.scene.tweens.add({
        targets: text,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.out'
      });
    });

    // Дополнительная анимация для увеличения множителя
    if (multiplierIncreased) {
      this.scene.tweens.add({
        targets: this.comboText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        delay: 200
      });
    }

    // Анимация исчезновения
    this.scene.tweens.add({
      targets: targets,
      alpha: 0,
      duration: 800,
      delay: 700,
      ease: 'Power2.easeOut',
      onComplete: () => {
        targets.forEach(text => {
          if (text && text.destroy) text.destroy();
        });
        this.comboText = null;
        this.comboCountText = null;
        this.comboGlowText = null;
      }
    });
  }

  getFontSize() {
    if (this.combo < 10) return '48px';
    if (this.combo < 20) return '56px';
    if (this.combo < 30) return '64px';
    if (this.combo < 50) return '72px';
    if (this.combo < 100) return '80px';
    return '96px';
  }

  showComboLost() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // Затемнение фона
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.3)
      .setDepth(98)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 500,
      delay: 500,
      onComplete: () => overlay.destroy()
    });

    // Текст
    const lostText = this.scene.add.text(w / 2, h / 2, 'КОМБО ПРЕРВАНО', {
      fontSize: '32px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ff4444',
      stroke: '#880000',
      strokeThickness: 6,
      shadow: { blur: 15, color: '#ff0000', fill: true }
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    lostText.setScale(0.5);
    this.scene.tweens.add({
      targets: lostText,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => lostText.destroy()
    });

    // Маленькая тряска
    if (this.enableScreenShake) {
      this.scene.cameras.main.shake(200, 0.01);
    }
  }

  createComboParticles() {
    if (this.combo < 3) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const color = this.comboColors[colorIndex].color;

    // Количество частиц зависит от комбо
    const count = Math.min(30, 5 + Math.floor(this.combo / 2));

    // Основные частицы
    const emitter1 = this.scene.add.particles(w / 2, h / 2, 'flare', {
      speed: { min: -200, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: count,
      blendMode: Phaser.BlendModes.ADD,
      tint: color
    });

    // Дополнительные частицы по кругу
    const emitter2 = this.scene.add.particles(w / 2, h / 2, 'spark', {
      speed: { min: 100, max: 250 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: count / 2,
      blendMode: Phaser.BlendModes.ADD,
      tint: [color, 0xffffff],
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 100),
        quantity: count / 2
      }
    });

    emitter1.explode(count);
    emitter2.explode(count / 2);

    this.particleEmitters.push(emitter1, emitter2);

    // Автоматическое удаление
    this.scene.time.delayedCall(700, () => {
      if (emitter1 && emitter1.destroy) emitter1.destroy();
      if (emitter2 && emitter2.destroy) emitter2.destroy();
      this.particleEmitters = this.particleEmitters.filter(e => e !== emitter1 && e !== emitter2);
    });

    // Добавляем частицы вокруг игрока для высоких комбо
    if (this.combo >= 15 && this.scene.player) {
      this.createPlayerParticles(color);
    }
  }

  createPlayerParticles(color) {
    if (!this.scene.player) return;

    const emitter = this.scene.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400,
      quantity: 2,
      frequency: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: color,
      follow: this.scene.player,
      followOffset: { x: 0, y: 0 },
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, 40),
        quantity: 1
      }
    });

    this.particleEmitters.push(emitter);

    // Останавливаем через 1.5 секунды
    this.scene.time.delayedCall(1500, () => {
      if (emitter && emitter.stop) emitter.stop();
      this.scene.time.delayedCall(500, () => {
        if (emitter && emitter.destroy) emitter.destroy();
        this.particleEmitters = this.particleEmitters.filter(e => e !== emitter);
      });
    });
  }

  createGlowEffect() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colorIndex = Math.min(Math.floor(this.combo / 5), this.comboColors.length - 1);
    const glowColor = this.comboColors[colorIndex].glow;

    // Эффект свечения по краям экрана
    const glow = this.scene.add.graphics();
    glow.lineStyle(10, Phaser.Display.Color.HexStringToColor(glowColor).color, 0.3);
    glow.strokeRect(5, 5, w - 10, h - 10);
    glow.setDepth(95);
    glow.setScrollFactor(0);

    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 400,
      onComplete: () => glow.destroy()
    });
  }

  pulseScreen() {
    if (this.combo < 3) return;

    // Интенсивность тряски зависит от комбо
    const intensity = Math.min(0.05, 0.01 * Math.sqrt(this.combo));
    this.scene.cameras.main.shake(100, intensity);

    // Пульсация камеры (zoom)
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      zoom: 1.02,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  // =========================================================================
  // МИЛЕСТОУНЫ И ДОСТИЖЕНИЯ
  // =========================================================================

  checkMilestones(oldCombo) {
    if (!this.enableMilestoneMessages) return;

    for (const milestone of this.comboMilestones) {
      if (oldCombo < milestone && this.combo >= milestone && !this.reachedMilestones.includes(milestone)) {
        this.reachedMilestones.push(milestone);
        this.showMilestoneMessage(milestone);
        this.playMilestoneSound();
        
        // Дополнительный эффект для крупных милестоунов
        if (milestone >= 50) {
          this.createMilestoneExplosion(milestone);
        }
      }
    }
  }

  showMilestoneMessage(milestone) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    const colorIndex = Math.min(Math.floor(milestone / 10), this.comboColors.length - 1);
    const colors = this.comboColors[colorIndex] || this.comboColors[this.comboColors.length - 1];

    const msg = this.scene.add.text(w / 2, h / 3, `${milestone} КОМБО!`, {
      fontSize: '36px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffffff',
      stroke: colors.glow,
      strokeThickness: 6,
      shadow: { blur: 20, color: colors.glow, fill: true }
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0);

    msg.setScale(0.5);
    this.scene.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => msg.destroy()
    });

    // Награда за милестоун
    if (this.scene.crystals) {
      const reward = Math.floor(milestone / 2);
      this.scene.crystals += reward;
      if (this.scene.crystalText) {
        this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      }
      
      // Показываем награду
      const rewardText = this.scene.add.text(w / 2, h / 3 + 50, `+${reward} 💎`, {
        fontSize: '24px',
        fontFamily: '"Share Tech Mono", monospace',
        color: '#ffaa00'
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
      
      this.scene.tweens.add({
        targets: rewardText,
        alpha: 0,
        y: rewardText.y - 30,
        duration: 1500,
        onComplete: () => rewardText.destroy()
      });
    }
  }

  createMilestoneExplosion(milestone) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Создаем множество частиц
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const color = Phaser.Utils.Array.GetRandom([0xffff00, 0xff00ff, 0x00ffff, 0xffaa00]);
      
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 6), color, 0.8);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-200, 200),
        y: y + Phaser.Math.Between(-200, 200),
        alpha: 0,
        scale: 0,
        duration: 1500,
        onComplete: () => particle.destroy()
      });
    }
  }

  onNewMaxCombo() {
    const w = this.scene.scale.width;
    
    const recordText = this.scene.add.text(w / 2, 200, 'НОВЫЙ РЕКОРД!', {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 5,
      shadow: { blur: 15, color: '#ffff00', fill: true }
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    this.scene.tweens.add({
      targets: recordText,
      alpha: 0,
      y: recordText.y - 50,
      duration: 2000,
      onComplete: () => recordText.destroy()
    });

    this.scene.cameras.main.flash(200, 255, 255, 100, false);
    this.scene.cameras.main.shake(200, 0.02);
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playComboSound() {
    if (this.combo % 5 === 0 && this.combo > 0) {
      this.playSound('level_up_sound', 0.5);
    } else {
      this.playSound('tap_sound', 0.2);
    }
  }

  playMilestoneSound() {
    this.playSound('level_up_sound', 0.7);
  }

  playSound(key, volume = 0.5) {
    if (!this.enableSounds) return;
    
    try {
      if (!this.soundCache[key] && this.scene.cache.audio.has(key)) {
        this.soundCache[key] = this.scene.sound.add(key, { volume });
      }
      if (this.soundCache[key]) {
        this.soundCache[key].play();
      }
    } catch (e) {
      // Игнорируем ошибки звука
    }
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  clearParticles() {
    this.particleEmitters.forEach(emitter => {
      if (emitter && emitter.destroy) emitter.destroy();
    });
    this.particleEmitters = [];
  }

  clearTweens() {
    this.activeTweens.forEach(tween => {
      if (tween && tween.stop) tween.stop();
    });
    this.activeTweens = [];
  }

  // =========================================================================
  // СТАТИСТИКА И ГЕТТЕРЫ
  // =========================================================================

  getMultiplier() {
    return this.multiplier;
  }

  getCombo() {
    return this.combo;
  }

  getMaxCombo() {
    return this.maxCombo;
  }

  getFormattedMultiplier() {
    return `x${this.multiplier.toFixed(1)}`;
  }

  getComboProgress() {
    // Прогресс до следующего уровня комбо
    if (this.combo < 5) return this.combo / 5;
    if (this.combo < 10) return (this.combo - 5) / 5;
    if (this.combo < 20) return (this.combo - 10) / 10;
    if (this.combo < 30) return (this.combo - 20) / 10;
    if (this.combo < 50) return (this.combo - 30) / 20;
    if (this.combo < 100) return (this.combo - 50) / 50;
    return 1;
  }

  getNextMilestone() {
    for (const milestone of this.comboMilestones) {
      if (milestone > this.combo && !this.reachedMilestones.includes(milestone)) {
        return milestone;
      }
    }
    return null;
  }

  updateStats() {
    // Обновляем статистику в GameManager
    if (this.scene.gameManager) {
      // Можно добавить логи
    }
  }

  getColorString(colorHex) {
    const r = (colorHex >> 16) & 255;
    const g = (colorHex >> 8) & 255;
    const b = colorHex & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ
  // =========================================================================

  update(delta) {
    // Обновляем таймер (уже работает через delayedCall)
    // Можно добавить пульсацию множителя или другие эффекты
  }

  // =========================================================================
  // ДЕСТРУКТОР
  // =========================================================================

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.comboText) this.comboText.destroy();
    if (this.comboCountText) this.comboCountText.destroy();
    if (this.comboGlowText) this.comboGlowText.destroy();
    this.clearParticles();
    this.clearTweens();
    
    // Очищаем звуки
    Object.values(this.soundCache).forEach(sound => {
      if (sound && sound.stop) sound.stop();
    });
    this.soundCache = {};
  }
}