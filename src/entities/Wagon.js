import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    // Получаем конфигурацию для текущего мира
    this.worldConfig = this.getWorldConfig();
    
    // Выбираем текстуру с учётом индекса
    this.texture = this.getTextureForWorld();
    
    // ===== СОЗДАНИЕ СПРАЙТА С НЕОНОВЫМ ЭФФЕКТОМ =====
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.92)
      .setDepth(5 + index);
    
    // Настройка физики
    this.setupPhysics();
    
    // Визуальные эффекты
    this.setupVisuals();
    
    // Ссылка на объект
    this.sprite.wagonRef = this;
    
    // ===== ХАРАКТЕРИСТИКИ =====
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.isConnected = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500;
    
    // ===== МНОЖИТЕЛЬ МОНЕТ (УВЕЛИЧЕН) =====
    this.coinMultiplier = 1 + (this.index + 1) * 0.6;
    
    // ===== ПАРАМЕТРЫ СЛЕДОВАНИЯ =====
    // Используем значение из PlayScene (синхронизация)
    this.targetDistance = scene.wagonGap || 52;
    this.smoothSpeed = 0.15;
    this.velocity = { x: 0, y: 0 };
    this.springForce = 0.18;
    this.damping = 0.94;
    
    // ===== ВИЗУАЛЬНЫЕ ЭЛЕМЕНТЫ =====
    this.glowEffect = null;
    this.trailEmitter = null;
    this.multiplierIndicator = null;
    this.shieldEffect = null;
    this.pulseAnimation = null;
    
    // ===== СОЗДАНИЕ ЭФФЕКТОВ =====
    this.createMultiplierIndicator();
    this.createTrail();
    this.createGlowForRareWagons();
    
    // Эффекты мира
    this.applyWorldVisuals();
    
    // Анимация появления
    this.animateSpawn();
    
    // Звук появления
    this.playSpawnSound();
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ МИРОВ (УЛУЧШЕНА)
  // =========================================================================

  getWorldConfig() {
    const configs = {
      0: { 
        color: 0x44aaff, 
        glowColor: 0x88ccff, 
        trailColor: [0x44aaff, 0x88ccff],
        textureSet: 'space', 
        particleColor: 0x44aaff, 
        drag: 0.96,
        lightIntensity: 0.4
      },
      1: { 
        color: 0xff44ff, 
        glowColor: 0xff88ff, 
        trailColor: [0xff44ff, 0xff88ff, 0xffaaff],
        textureSet: 'neon', 
        particleColor: 0xff44ff, 
        drag: 0.94,
        lightIntensity: 0.7
      },
      2: { 
        color: 0xcc8866, 
        glowColor: 0xffaa88, 
        trailColor: [0xcc8866, 0xffaa88],
        textureSet: 'dark', 
        particleColor: 0xff6600, 
        drag: 0.98,
        lightIntensity: 0.3
      },
      3: { 
        color: 0xffaa66, 
        glowColor: 0xffcc88, 
        trailColor: [0xffaa66, 0xffcc88],
        textureSet: 'rocky', 
        particleColor: 0xffaa44, 
        drag: 0.97,
        lightIntensity: 0.5
      },
      4: { 
        color: 0xaa88ff, 
        glowColor: 0xcc88ff, 
        trailColor: [0xaa88ff, 0xcc88ff, 0xeeaaff],
        textureSet: 'void', 
        particleColor: 0xaa88ff, 
        drag: 0.92,
        lightIntensity: 0.6
      },
    };
    return configs[this.worldType] || configs[0];
  }

  getTextureForWorld() {
    const textureMaps = {
      space: ['wagon_0', 'wagon_1', 'wagon_2', 'wagon_3', 'wagon_4', 'wagon_5', 'wagon_6', 'wagon_7', 'wagon_8', 'wagon_9'],
      neon: ['wagon_neon_0', 'wagon_neon_1', 'wagon_neon_2', 'wagon_neon_3', 'wagon_neon_4'],
      dark: ['wagon_dark_0', 'wagon_dark_1', 'wagon_dark_2', 'wagon_dark_3'],
      rocky: ['wagon_rock_0', 'wagon_rock_1', 'wagon_rock_2', 'wagon_rock_3'],
      void: ['wagon_void_0', 'wagon_void_1', 'wagon_void_2', 'wagon_void_3'],
    };
    const textures = textureMaps[this.worldConfig.textureSet] || textureMaps.space;
    const texIndex = this.index % textures.length;
    return this.scene.textures.exists(textures[texIndex]) ? textures[texIndex] : `wagon_${this.index % 10}`;
  }

  // =========================================================================
  // ФИЗИКА И ВИЗУАЛЫ
  // =========================================================================

  setupPhysics() {
    this.sprite.body.setCircle(17, 8, 6);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setMass(0.75);
    this.sprite.body.setDrag(this.worldConfig.drag);
    this.sprite.body.setBounce(0.35);
    this.sprite.body.setMaxVelocity(15, 15);
  }

  setupVisuals() {
    // Основной цвет с неоновым оттенком
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Дополнительное свечение для каждого 3-го вагона
    if (this.index % 3 === 0) {
      this.createPulseGlow();
    }
  }

  createPulseGlow() {
    this.glowEffect = this.scene.add.circle(
      this.sprite.x, 
      this.sprite.y, 
      32, 
      this.worldConfig.glowColor, 
      0.3
    );
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(4);
    
    // Пульсация свечения
    this.pulseAnimation = this.scene.tweens.add({
      targets: this.glowEffect,
      alpha: { from: 0.2, to: 0.5 },
      scale: { from: 0.9, to: 1.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (this.glowEffect && this.sprite?.active) {
          this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
        }
      }
    });
  }

  createTrail() {
    // Неоновый след
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 12, max: 30 },
      scale: { start: 0.22, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 260,
      quantity: 1,
      frequency: 38,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldConfig.trailColor,
      follow: this.sprite,
      followOffset: { x: -20, y: 0 }
    });
  }

  createGlowForRareWagons() {
    // Эффект для каждого 5-го вагона (редкий)
    if (this.index > 0 && this.index % 5 === 0) {
      const rareGlow = this.scene.add.circle(
        this.sprite.x,
        this.sprite.y,
        28,
        this.worldConfig.glowColor,
        0.25
      );
      rareGlow.setBlendMode(Phaser.BlendModes.ADD);
      rareGlow.setDepth(3);
      
      this.scene.tweens.add({
        targets: rareGlow,
        alpha: { from: 0.15, to: 0.45 },
        scale: { from: 1, to: 1.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (rareGlow && this.sprite?.active) {
            rareGlow.setPosition(this.sprite.x, this.sprite.y);
          }
        },
        onComplete: () => {
          if (rareGlow) rareGlow.destroy();
        }
      });
    }
  }

  // =========================================================================
  // ХАРАКТЕРИСТИКИ
  // =========================================================================

  getMaxHealth() {
    let baseHealth = 1;
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    
    // Бонус от индекса (чем дальше вагон, тем прочнее)
    baseHealth += Math.floor(this.index / 3);
    
    return Math.max(1, baseHealth);
  }

  // =========================================================================
  // ИНДИКАТОР МНОЖИТЕЛЯ (КИБЕРПАНК СТИЛЬ)
  // =========================================================================

  createMultiplierIndicator() {
    const multiplierValue = this.coinMultiplier.toFixed(1);
    const isHighMultiplier = this.coinMultiplier >= 3;
    
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 42,
      `x${multiplierValue}`,
      {
        fontSize: isHighMultiplier ? '16px' : '14px',
        fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: isHighMultiplier ? '#ff44ff' : '#ffaa00',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { 
          blur: isHighMultiplier ? 10 : 6, 
          color: isHighMultiplier ? '#ff44ff' : '#ffaa00', 
          fill: true 
        }
      }
    ).setOrigin(0.5).setDepth(21);
    
    // Добавляем маленькую неоновую точку под индикатором
    this.indicatorDot = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y - 30,
      3,
      this.worldConfig.color,
      0.7
    );
    this.indicatorDot.setBlendMode(Phaser.BlendModes.ADD);
    this.indicatorDot.setDepth(20);
  }

  updateMultiplierIndicator() {
    if (!this.multiplierIndicator) return;
    
    this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 42);
    
    if (this.indicatorDot) {
      this.indicatorDot.setPosition(this.sprite.x, this.sprite.y - 30);
    }
    
    // Пульсация для высоких множителей
    if (this.coinMultiplier >= 4) {
      const intensity = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
      this.multiplierIndicator.setAlpha(intensity);
    } else {
      this.multiplierIndicator.setAlpha(1);
    }
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ МИРА
  // =========================================================================

  applyWorldVisuals() {
    // Киберпанк - неоновое мерцание
    if (this.worldType === 1) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.85, to: 1 },
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }
    
    // Чёрная дыра - гравитационное искажение
    if (this.worldType === 4) {
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: { from: 0.92, to: 0.98 },
        scaleY: { from: 0.92, to: 0.98 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Подземелье - тёмная аура
    if (this.worldType === 2 && this.index % 2 === 0) {
      const darkAura = this.scene.add.circle(
        this.sprite.x,
        this.sprite.y,
        25,
        0x442200,
        0.2
      );
      darkAura.setBlendMode(Phaser.BlendModes.MULTIPLY);
      darkAura.setDepth(3);
      
      this.scene.tweens.add({
        targets: darkAura,
        alpha: { from: 0.1, to: 0.3 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (darkAura && this.sprite?.active) {
            darkAura.setPosition(this.sprite.x, this.sprite.y);
          }
        }
      });
    }
  }

  // =========================================================================
  // АНИМАЦИЯ ПОЯВЛЕНИЯ (УЛУЧШЕНА)
  // =========================================================================

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    if (this.indicatorDot) this.indicatorDot.setAlpha(0);
    
    // Эффект "материализации"
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 450,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 42);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
        if (this.indicatorDot) {
          this.indicatorDot.setPosition(this.sprite.x, this.sprite.y - 30);
          this.indicatorDot.setAlpha(this.sprite.alpha * 0.8);
        }
      },
      onComplete: () => {
        if (this.trailEmitter) this.trailEmitter.start();
        
        // Неоновая вспышка при появлении
        this.createSpawnFlash();
      }
    });
  }

  createSpawnFlash() {
    const flash = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      20,
      this.worldConfig.color,
      0.7
    );
    flash.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  // =========================================================================
  // ЗВУКИ
  // =========================================================================

  playSpawnSound() {
    try { 
      audioManager.playSound(this.scene, 'wagon_spawn', 0.4); 
    } catch(e) {}
  }

  playDamageSound() {
    try { 
      audioManager.playSound(this.scene, 'hit_sound', 0.28); 
    } catch(e) {}
  }

  playDetachSound() {
    try { 
      audioManager.playSound(this.scene, 'wagon_destroy', 0.5); 
    } catch(e) {}
  }

  // =========================================================================
  // УПРАВЛЕНИЕ ХП
  // =========================================================================

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite.setData('hp', hp);
    this.sprite.setData('maxHP', maxHp);
  }

  takeDamage(amount = 1) {
    if (this.protectionFrames > 0 || !this.isConnected || this.hp <= 0) return false;
    
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    this.protectionFrames = this.protectionDuration;
    this.showDamageEffect();
    this.playDamageSound();
    return false;
  }

  showDamageEffect() {
    // Мигание красным
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) this.sprite.setTint(this.worldConfig.color);
    });
    
    // Искры
    const sparkCount = Math.min(8, 4 + Math.floor(this.hp / 2));
    for (let i = 0; i < sparkCount; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-20, 20),
        this.sprite.y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(2, 5),
        this.worldConfig.particleColor,
        0.9
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-60, 60),
        y: spark.y + Phaser.Math.Between(-60, 60),
        duration: 450,
        onComplete: () => spark.destroy()
      });
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОЗИЦИИ (УЛУЧШЕННАЯ ФИЗИКА)
  // =========================================================================

  update(prevX, prevY, gap) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }
    
    // Синхронизируем targetDistance с gap из PlayScene
    this.targetDistance = gap;
    
    // Неуязвимость
    if (this.protectionFrames > 0) {
      this.protectionFrames -= 16;
      const blinkAlpha = this.protectionFrames % 100 < 50 ? 0.6 : 1;
      this.sprite.setAlpha(blinkAlpha);
    } else {
      this.sprite.setAlpha(1);
    }
    
    // ===== УЛУЧШЕННАЯ ФИЗИКА СЛЕДОВАНИЯ =====
    const targetX = prevX - this.targetDistance;
    const targetY = prevY;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    
    // Сила притяжения (пружинная)
    let force = 0;
    if (distance > this.targetDistance) {
      // Чем дальше, тем сильнее притяжение
      force = Math.min(0.22, (distance - this.targetDistance) * 0.012);
    }
    
    const angle = Math.atan2(dy, dx);
    
    if (force !== 0) {
      this.velocity.x += Math.cos(angle) * force * 2.2;
      this.velocity.y += Math.sin(angle) * force * 2.2;
    }
    
    // Демпфирование
    this.velocity.x *= this.damping;
    this.velocity.y *= this.damping;
    
    // Применяем скорость
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    
    // ===== ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ДВИЖЕНИЯ =====
    // Болтание в зависимости от скорости
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    const wobbleIntensity = Math.min(3, speed * 0.15);
    this.sprite.y += Math.sin(Date.now() * 0.005 + this.index) * wobbleIntensity * 0.6;
    
    // Поворот в сторону движения
    if (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.y) > 0.5) {
      const moveAngle = Math.atan2(this.velocity.y, this.velocity.x);
      this.sprite.rotation += (moveAngle * 0.35 - this.sprite.rotation) * 0.12;
    } else {
      this.sprite.rotation *= 0.98;
    }
    
    // Обновляем физическое тело
    if (this.sprite.body) {
      this.sprite.body.setVelocity(this.velocity.x, this.velocity.y);
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Обновляем визуальные элементы
    this.updateMultiplierIndicator();
    if (this.glowEffect) this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    
    // Эффект следа при высокой скорости
    if (this.trailEmitter && speed > 5) {
      this.trailEmitter.setFrequency(25);
    } else if (this.trailEmitter) {
      this.trailEmitter.setFrequency(45);
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ МНОЖИТЕЛЯ ПОСЛЕ ОТЦЕПЛЕНИЯ
  // =========================================================================

  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.6;
    
    if (this.multiplierIndicator) {
      const multiplierValue = this.coinMultiplier.toFixed(1);
      const isHighMultiplier = this.coinMultiplier >= 3;
      
      this.multiplierIndicator.setText(`x${multiplierValue}`);
      this.multiplierIndicator.setFontSize(isHighMultiplier ? '16px' : '14px');
      this.multiplierIndicator.setColor(isHighMultiplier ? '#ff44ff' : '#ffaa00');
      this.multiplierIndicator.setShadowBlur(isHighMultiplier ? 10 : 6);
    }
  }

  // =========================================================================
  // ОТЦЕПЛЕНИЕ ВАГОНА
  // =========================================================================

  detach() {
    this.isConnected = false;
    this.sprite.setTint(0x666666);
    
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setColor('#888888');
      this.multiplierIndicator.setText(`x1.0`);
      this.multiplierIndicator.setShadowBlur(0);
    }
    
    if (this.indicatorDot) {
      this.indicatorDot.setFillStyle(0x666666);
    }
    
    this.playDetachSound();
    
    // Эффект отбрасывания
    this.velocity.x = -280;
    this.velocity.y = Phaser.Math.Between(-120, 120);
    
    // Убираем свечение
    if (this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.glowEffect) this.glowEffect.destroy();
          this.glowEffect = null;
        }
      });
    }
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  destroy() {
    // Останавливаем эмиттер следа
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      if (this._isDestroying) return;
      this._isDestroying = true;
    }
    
    // Уничтожаем свечение
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = null;
    }
    
    // Уничтожаем индикаторы
    if (this.multiplierIndicator) {
      this.multiplierIndicator.destroy();
      this.multiplierIndicator = null;
    }
    
    if (this.indicatorDot) {
      this.indicatorDot.destroy();
      this.indicatorDot = null;
    }
    
    // Останавливаем анимацию пульсации
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
      this.pulseAnimation = null;
    }
    
    // Уничтожаем спрайт
    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { 
        audioManager.playSound(this.scene, 'wagon_destroy', 0.6); 
      } catch(e) {}
      this.sprite.destroy();
    }
    
    this.active = false;
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getPosition() { 
    return { x: this.sprite.x, y: this.sprite.y }; 
  }
  
  getHealth() { 
    return this.hp; 
  }
  
  getMaxHealth() { 
    return this.maxHp; 
  }
  
  getMultiplier() { 
    return this.getCurrentMultiplier(); 
  }
  
  getIndex() { 
    return this.index; 
  }
  
  isActive() { 
    return this.active && this.sprite?.active && this.isConnected; 
  }
  
  isConnected() { 
    return this.isConnected; 
  }
  
  getCurrentMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
  }
  
  getVelocity() {
    return { x: this.velocity.x, y: this.velocity.y };
  }
}