import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class MultiplierSystem {
  constructor(scene) {
    this.scene = scene;
    this.baseMultiplier = 1;
    this.bonusMultipliers = {};
    this.tempMultipliers = [];
    this.totalMultiplier = 1;
    this.multiplierHistory = [];
    this.maxHistorySize = 50;
    
    // Визуальные элементы
    this.multiplierText = null;
    this.multiplierBar = null;
    this.multiplierGlow = null;
    this.lastMultiplierUpdate = 0;
    this.multiplierAnimations = [];
    
    // Настройки
    this.enableVisualEffects = true;
    this.enableSounds = true;
    this.updateFrequency = 100; // мс
    
    // Статистика
    this.highestMultiplier = 1;
    this.totalMultiplierTime = 0;
    this.multiplierStartTime = 0;
    
    // Цветовая схема для разных множителей
    this.multiplierColors = {
      1: { color: 0xffffff, textColor: '#ffffff', glow: 0xffffff },
      1.5: { color: 0x88aaff, textColor: '#88aaff', glow: 0x4488ff },
      2: { color: 0x44ff44, textColor: '#44ff44', glow: 0x00ff00 },
      3: { color: 0xffaa44, textColor: '#ffaa44', glow: 0xff8800 },
      4: { color: 0xff44ff, textColor: '#ff44ff', glow: 0xff00ff },
      5: { color: 0xff4444, textColor: '#ff4444', glow: 0xff0000 }
    };
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  addMultiplier(key, value, duration = null, options = {}) {
    const multiplier = {
      key,
      value,
      duration,
      startTime: Date.now(),
      source: options.source || 'unknown',
      visualEffect: options.visualEffect || 'normal',
      soundEffect: options.soundEffect || 'default'
    };
    
    if (duration) {
      // Временный множитель
      this.tempMultipliers.push(multiplier);
      
      // Визуальный эффект появления
      if (this.enableVisualEffects) {
        this.showMultiplierEffect(value, duration, options);
      }
      
      // Звук
      if (this.enableSounds) {
        this.playMultiplierSound(value, options);
      }
      
      // Автоматическое удаление через duration
      this.scene.time.delayedCall(duration * 1000, () => {
        this.removeTempMultiplier(key);
      });
    } else {
      // Постоянный множитель
      this.bonusMultipliers[key] = value;
    }
    
    this.recalculateMultiplier();
    this.addToHistory(key, value, duration);
  }

  removeMultiplier(key) {
    if (this.bonusMultipliers[key]) {
      delete this.bonusMultipliers[key];
      this.recalculateMultiplier();
      this.showMultiplierRemoved(key);
      return true;
    }
    return false;
  }

  removeTempMultiplier(key) {
    const removed = this.tempMultipliers.find(m => m.key === key);
    if (removed) {
      this.tempMultipliers = this.tempMultipliers.filter(m => m.key !== key);
      this.recalculateMultiplier();
      
      if (this.enableVisualEffects && removed.value > 1) {
        this.showMultiplierExpired(removed.value);
      }
      return true;
    }
    return false;
  }

  recalculateMultiplier() {
    const oldMultiplier = this.totalMultiplier;
    
    this.totalMultiplier = this.baseMultiplier;
    
    // Применяем постоянные множители
    for (let key in this.bonusMultipliers) {
      this.totalMultiplier *= this.bonusMultipliers[key];
    }
    
    // Применяем временные множители (сортируем по значению)
    const sortedTemp = [...this.tempMultipliers].sort((a, b) => b.value - a.value);
    for (let temp of sortedTemp) {
      this.totalMultiplier *= temp.value;
    }
    
    // Ограничиваем максимальный множитель
    this.totalMultiplier = Math.min(10, Math.max(0.1, this.totalMultiplier));
    
    // Округляем до 2 знаков
    this.totalMultiplier = Math.round(this.totalMultiplier * 100) / 100;
    
    // Обновляем рекорд
    if (this.totalMultiplier > this.highestMultiplier) {
      this.highestMultiplier = this.totalMultiplier;
      this.onNewRecord();
    }
    
    // Обновляем визуал
    if (oldMultiplier !== this.totalMultiplier) {
      this.updateVisuals(oldMultiplier);
    }
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createVisualElements() {
    const w = this.scene.scale.width;
    
    // Текст множителя
    this.multiplierText = this.scene.add.text(w / 2, 50, 'x1', {
      fontSize: '36px',
      fontFamily: '"Audiowide", "Orbitron", sans-serif',
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 4,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(20).setScrollFactor(0);
    
    // Полоска множителя
    this.multiplierBar = this.scene.add.graphics();
    this.multiplierBar.setDepth(19);
    
    // Свечение
    this.multiplierGlow = this.scene.add.circle(w / 2, 50, 40, 0x00ffff, 0);
    this.multiplierGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.multiplierGlow.setDepth(18);
    
    // Анимация появления
    this.multiplierText.setAlpha(0);
    this.multiplierText.setScale(0.5);
    this.scene.tweens.add({
      targets: this.multiplierText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.out'
    });
  }

  updateVisuals(oldMultiplier) {
    if (!this.multiplierText) return;
    
    const color = this.getMultiplierColor();
    const textColor = this.getMultiplierTextColor();
    const glowColor = this.getMultiplierGlowColor();
    
    // Обновляем текст
    this.multiplierText.setText(`x${this.totalMultiplier.toFixed(1)}`);
    this.multiplierText.setStyle({
      color: textColor,
      stroke: glowColor,
      shadow: { blur: 15, color: glowColor, fill: true }
    });
    
    // Обновляем полоску
    this.updateMultiplierBar();
    
    // Анимация при изменении
    if (this.totalMultiplier !== oldMultiplier) {
      this.animateMultiplierChange(oldMultiplier);
    }
    
    // Пульсация свечения
    if (this.multiplierGlow) {
      const intensity = Math.min(0.8, 0.2 + this.totalMultiplier / 10);
      this.multiplierGlow.setAlpha(intensity);
      
      this.scene.tweens.add({
        targets: this.multiplierGlow,
        scale: { from: 1, to: 1.2 },
        alpha: { from: intensity, to: intensity * 0.5 },
        duration: 300,
        yoyo: true,
        repeat: 0
      });
    }
  }

  updateMultiplierBar() {
    if (!this.multiplierBar) return;
    
    const w = this.scene.scale.width;
    const barWidth = 200;
    const barHeight = 6;
    const x = w / 2 - barWidth / 2;
    const y = 85;
    
    const progress = (this.totalMultiplier - 1) / 9; // от 1 до 10
    
    this.multiplierBar.clear();
    
    // Фон
    this.multiplierBar.fillStyle(0x333333, 0.5);
    this.multiplierBar.fillRoundedRect(x, y, barWidth, barHeight, 3);
    
    // Заполнение
    const fillColor = this.getMultiplierColor();
    this.multiplierBar.fillStyle(fillColor, 0.8);
    this.multiplierBar.fillRoundedRect(x, y, barWidth * progress, barHeight, 3);
  }

  animateMultiplierChange(oldMultiplier) {
    // Анимация текста
    this.scene.tweens.add({
      targets: this.multiplierText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Back.out'
    });
    
    // Анимация свечения
    if (this.multiplierGlow) {
      this.scene.tweens.add({
        targets: this.multiplierGlow,
        scale: 1.5,
        alpha: 0.6,
        duration: 200,
        yoyo: true
      });
    }
    
    // Эффект частиц при увеличении множителя
    if (this.totalMultiplier > oldMultiplier && this.enableVisualEffects) {
      this.createMultiplierIncreaseEffect();
    }
  }

  createMultiplierIncreaseEffect() {
    const w = this.scene.scale.width;
    const x = w / 2;
    const y = 50;
    const color = this.getMultiplierColor();
    
    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.circle(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(2, 5),
        color,
        0.7
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  showMultiplierEffect(value, duration, options) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    const notification = this.scene.add.text(w / 2, h / 3, `x${value} МНОЖИТЕЛЬ!`, {
      fontSize: '28px',
      fontFamily: '"Audiowide", sans-serif',
      color: this.getMultiplierTextColor(),
      stroke: this.getMultiplierGlowColor(),
      strokeThickness: 3,
      shadow: { blur: 15, color: this.getMultiplierGlowColor(), fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    const durationText = this.scene.add.text(w / 2, h / 3 + 35, `${duration}с`, {
      fontSize: '16px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#ffaa00'
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    notification.setAlpha(0);
    notification.setScale(0.5);
    durationText.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [notification, durationText],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.out'
    });
    
    this.scene.tweens.add({
      targets: [notification, durationText],
      alpha: 0,
      y: notification.y - 50,
      duration: 500,
      delay: 2000,
      onComplete: () => {
        notification.destroy();
        durationText.destroy();
      }
    });
  }

  showMultiplierExpired(value) {
    const w = this.scene.scale.width;
    
    const text = this.scene.add.text(w / 2, 100, `x${value} МНОЖИТЕЛЬ ИСЧЕЗ`, {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff8888',
      stroke: '#ff0000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 30,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  showMultiplierRemoved(key) {
    const w = this.scene.scale.width;
    
    const text = this.scene.add.text(w / 2, 80, `Множитель ${key} удалён`, {
      fontSize: '12px',
      fontFamily: "'Share Tech Mono', monospace",
      color: '#aaaaaa'
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playMultiplierSound(value, options) {
    try {
      const volume = Math.min(0.5, 0.2 + value * 0.05);
      
      if (value >= 2) {
        audioManager.playSound(this.scene, 'level_up_sound', volume);
      } else {
        audioManager.playSound(this.scene, 'powerup_sound', volume * 0.7);
      }
    } catch (e) {}
  }

  // =========================================================================
  // ЦВЕТА
  // =========================================================================

  getMultiplierColor() {
    if (this.totalMultiplier >= 5) return 0xff4444;
    if (this.totalMultiplier >= 4) return 0xff44ff;
    if (this.totalMultiplier >= 3) return 0xffaa44;
    if (this.totalMultiplier >= 2) return 0x44ff44;
    if (this.totalMultiplier >= 1.5) return 0x88aaff;
    return 0xffffff;
  }

  getMultiplierTextColor() {
    if (this.totalMultiplier >= 5) return '#ff4444';
    if (this.totalMultiplier >= 4) return '#ff44ff';
    if (this.totalMultiplier >= 3) return '#ffaa44';
    if (this.totalMultiplier >= 2) return '#44ff44';
    if (this.totalMultiplier >= 1.5) return '#88aaff';
    return '#ffffff';
  }

  getMultiplierGlowColor() {
    if (this.totalMultiplier >= 5) return '#ff0000';
    if (this.totalMultiplier >= 4) return '#ff00ff';
    if (this.totalMultiplier >= 3) return '#ff8800';
    if (this.totalMultiplier >= 2) return '#00ff00';
    if (this.totalMultiplier >= 1.5) return '#4488ff';
    return '#00ffff';
  }

  // =========================================================================
  // СТАТИСТИКА И ИСТОРИЯ
  // =========================================================================

  addToHistory(key, value, duration) {
    this.multiplierHistory.unshift({
      key,
      value,
      duration,
      timestamp: Date.now(),
      total: this.totalMultiplier
    });
    
    if (this.multiplierHistory.length > this.maxHistorySize) {
      this.multiplierHistory.pop();
    }
  }

  getMultiplierHistory() {
    return [...this.multiplierHistory];
  }

  getHighestMultiplier() {
    return this.highestMultiplier;
  }

  onNewRecord() {
    const w = this.scene.scale.width;
    
    const recordText = this.scene.add.text(w / 2, 120, 'НОВЫЙ РЕКОРД МНОЖИТЕЛЯ!', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: recordText,
      alpha: 0,
      y: recordText.y - 30,
      duration: 1500,
      onComplete: () => recordText.destroy()
    });
    
    try {
      audioManager.playSound(this.scene, 'level_up_sound', 0.6);
    } catch (e) {}
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getMultiplier() {
    return this.totalMultiplier;
  }

  getBaseMultiplier() {
    return this.baseMultiplier;
  }

  getBonusMultipliers() {
    return { ...this.bonusMultipliers };
  }

  getTempMultipliers() {
    return [...this.tempMultipliers];
  }

  getMultiplierBreakdown() {
    return {
      base: this.baseMultiplier,
      permanent: { ...this.bonusMultipliers },
      temporary: this.tempMultipliers.map(m => ({
        key: m.key,
        value: m.value,
        remaining: Math.max(0, m.duration - (Date.now() - m.startTime) / 1000),
        source: m.source
      })),
      total: this.totalMultiplier
    };
  }

  hasActiveMultiplier(key) {
    return this.bonusMultipliers[key] !== undefined || 
           this.tempMultipliers.some(m => m.key === key);
  }

  getActiveMultiplierValue(key) {
    if (this.bonusMultipliers[key]) return this.bonusMultipliers[key];
    const temp = this.tempMultipliers.find(m => m.key === key);
    return temp ? temp.value : null;
  }

  // =========================================================================
  // УПРАВЛЕНИЕ
  // =========================================================================

  setBaseMultiplier(value) {
    this.baseMultiplier = value;
    this.recalculateMultiplier();
  }

  reset() {
    this.baseMultiplier = 1;
    this.bonusMultipliers = {};
    this.tempMultipliers = [];
    this.totalMultiplier = 1;
    this.multiplierHistory = [];
    
    if (this.multiplierText) {
      this.multiplierText.setText('x1');
      this.multiplierText.setStyle({
        color: '#ffffff',
        stroke: '#00ffff',
        shadow: { blur: 10, color: '#00ffff', fill: true }
      });
    }
    
    if (this.multiplierBar) {
      this.updateMultiplierBar();
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ
  // =========================================================================

  update(delta) {
    // Обновляем временные множители
    const now = Date.now();
    let changed = false;
    
    this.tempMultipliers = this.tempMultipliers.filter(m => {
      const elapsed = (now - m.startTime) / 1000;
      const active = elapsed < m.duration;
      if (!active && this.enableVisualEffects && m.value > 1) {
        this.showMultiplierExpired(m.value);
      }
      return active;
    });
    
    if (this.tempMultipliers.length > 0) {
      this.recalculateMultiplier();
    }
    
    // Обновляем статистику времени
    if (this.totalMultiplier > 1) {
      if (this.multiplierStartTime === 0) {
        this.multiplierStartTime = now;
      }
      this.totalMultiplierTime += delta / 1000;
    } else {
      this.multiplierStartTime = 0;
    }
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  destroy() {
    // Останавливаем все анимации
    this.multiplierAnimations.forEach(anim => {
      if (anim && anim.stop) anim.stop();
    });
    this.multiplierAnimations = [];
    
    // Удаляем визуальные элементы
    if (this.multiplierText) this.multiplierText.destroy();
    if (this.multiplierBar) this.multiplierBar.destroy();
    if (this.multiplierGlow) this.multiplierGlow.destroy();
    
    this.multiplierText = null;
    this.multiplierBar = null;
    this.multiplierGlow = null;
  }
}