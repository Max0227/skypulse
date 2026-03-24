import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

/**
 * Класс вагона – полная версия с множеством функций, визуальными эффектами,
 * разнообразными текстурами, плавной физикой и без воздействия на камеру.
 */
export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);

    // Конфигурация мира (расширенная)
    this.worldConfig = this.getWorldConfig();

    // Выбор текстуры или создание fallback
    this.textureKey = this.getTextureForWorld();
    this.ensureTextureExists();

    // Создание спрайта – яркий, непрозрачный
    this.sprite = scene.physics.add.image(x, y, this.textureKey)
      .setScale(1.05)                 // крупный, как такси
      .setDepth(5 + index)
      .setAlpha(1)                    // полная непрозрачность
      .setBlendMode(Phaser.BlendModes.ADD);

    // Настройка физики (без гравитации)
    this.setupPhysics();

    // Визуальные эффекты
    this.setupVisuals();

    // Ссылка на объект
    this.sprite.wagonRef = this;

    // Характеристики
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.isConnected = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500;   // ms

    // Множитель очков (увеличивается с индексом)
    this.coinMultiplier = 1 + (this.index + 1) * 0.55;

    // Параметры следования (пружинная система)
    this.followDistance = 52;          // желаемое расстояние до предыдущего
    this.springStrength = 0.44;        // жёсткость пружины
    this.damping = 0.95;               // затухание

    // Позиция и скорость
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };

    // Визуальные элементы
    this.glowEffect = null;
    this.trailEmitter = null;
    this.multiplierIndicator = null;
    this.shieldEffect = null;
    this.decorations = [];

    // Создание элементов интерфейса и эффектов
    this.createMultiplierIndicator();
    this.createTrail();
    this.applyWorldVisuals();
    this.animateSpawn();
    this.playSpawnSound();
    this.addDecorativeElements();

    // Если вагон имеет высокий множитель – добавить дополнительные эффекты
    if (this.coinMultiplier >= 4) {
      this.addHighMultiplierEffects();
    }
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ МИРОВ (расширенная)
  // =========================================================================
  getWorldConfig() {
    const configs = {
      0: {
        name: 'space',
        color: 0x4a8cff,
        glowColor: 0x6aacff,
        textureSet: 'space',
        particleColor: 0x4a8cff,
        drag: 0.95,
        lightIntensity: 0.4,
        trailColor: [0x4a8cff, 0x8abaff],
        engineGlow: 0x88aaff,
        speedEffect: 0.8
      },
      1: {
        name: 'neon',
        color: 0xff44ff,
        glowColor: 0xff88ff,
        textureSet: 'neon',
        particleColor: 0xff44ff,
        drag: 0.92,
        lightIntensity: 0.7,
        trailColor: [0xff44ff, 0xff88ff, 0xffaaff],
        engineGlow: 0xff88ff,
        speedEffect: 1.0
      },
      2: {
        name: 'dark',
        color: 0xcc8866,
        glowColor: 0xffaa88,
        textureSet: 'dark',
        particleColor: 0xff6600,
        drag: 0.98,
        lightIntensity: 0.3,
        trailColor: [0xcc8866, 0xffaa88],
        engineGlow: 0xff8844,
        speedEffect: 0.7
      },
      3: {
        name: 'rocky',
        color: 0xffaa66,
        glowColor: 0xffcc88,
        textureSet: 'rocky',
        particleColor: 0xffaa44,
        drag: 0.96,
        lightIntensity: 0.5,
        trailColor: [0xffaa66, 0xffcc88],
        engineGlow: 0xffaa66,
        speedEffect: 0.85
      },
      4: {
        name: 'void',
        color: 0xaa88ff,
        glowColor: 0xcc88ff,
        textureSet: 'void',
        particleColor: 0xaa88ff,
        drag: 0.9,
        lightIntensity: 0.6,
        trailColor: [0xaa88ff, 0xcc88ff, 0xeeaaff],
        engineGlow: 0xaa88ff,
        speedEffect: 0.9
      }
    };
    return configs[this.worldType] || configs[0];
  }

  // =========================================================================
  // ВЫБОР ТЕКСТУРЫ С ЗАПАСНЫМ ВАРИАНТОМ
  // =========================================================================
  getTextureForWorld() {
    const textureMaps = {
      space: ['wagon_0', 'wagon_1', 'wagon_2', 'wagon_3', 'wagon_4', 'wagon_5', 'wagon_6', 'wagon_7', 'wagon_8', 'wagon_9'],
      neon: ['wagon_neon_0', 'wagon_neon_1', 'wagon_neon_2', 'wagon_neon_3', 'wagon_neon_4'],
      dark: ['wagon_dark_0', 'wagon_dark_1', 'wagon_dark_2', 'wagon_dark_3'],
      rocky: ['wagon_rock_0', 'wagon_rock_1', 'wagon_rock_2', 'wagon_rock_3'],
      void: ['wagon_void_0', 'wagon_void_1', 'wagon_void_2', 'wagon_void_3']
    };
    const textures = textureMaps[this.worldConfig.textureSet] || textureMaps.space;
    const texIndex = this.index % textures.length;
    const candidate = textures[texIndex];
    if (this.scene.textures.exists(candidate)) return candidate;

    // fallback: попробуем стандартные wagon_0..9
    const fallback = `wagon_${this.index % 10}`;
    if (this.scene.textures.exists(fallback)) return fallback;

    // если вообще нет – создадим простую текстуру на лету
    return this.createFallbackTexture();
  }

  ensureTextureExists() {
    if (!this.scene.textures.exists(this.textureKey)) {
      this.textureKey = this.createFallbackTexture();
    }
  }

  createFallbackTexture() {
    const key = `wagon_fallback_${this.index}`;
    if (this.scene.textures.exists(key)) return key;

    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const width = 48;
    const height = 36;
    graphics.fillStyle(this.worldConfig.color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 8);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(6, 6, 8, 8);
    graphics.fillRect(width - 14, 6, 8, 8);
    graphics.fillStyle(this.worldConfig.glowColor, 0.6);
    graphics.fillCircle(12, height - 10, 6);
    graphics.fillCircle(width - 12, height - 10, 6);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    return key;
  }

  // =========================================================================
  // ФИЗИКА (ручное управление)
  // =========================================================================
  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.enable = false;   // отключаем стандартную физику
    this.sprite.setCircle(20);         // увеличенный радиус коллизии
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);

    // Добавляем свечение для всех вагонов, но интенсивность разная
    const glowAlpha = 0.2 + (this.index % 3) * 0.1;
    this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 34, this.worldConfig.glowColor, glowAlpha);
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(4);
  }

  createTrail() {
    // Неоновый след
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 12, max: 32 },
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 260,
      quantity: 1,
      frequency: 32,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldConfig.trailColor,
      follow: this.sprite,
      followOffset: { x: -24, y: 0 }
    });
  }

  createMultiplierIndicator() {
    const fontSize = this.coinMultiplier >= 4 ? 18 : 15;
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 52,
      `x${this.coinMultiplier.toFixed(1)}`,
      {
        fontSize: `${fontSize}px`,
        fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: '#ffaa44',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { blur: 8, color: '#ffaa44', fill: true }
      }
    ).setOrigin(0.5).setDepth(21);
  }

  updateMultiplierIndicator() {
    if (!this.multiplierIndicator) return;
    this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 52);
    const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
    this.multiplierIndicator.setAlpha(intensity);
  }

  applyWorldVisuals() {
    // Для киберпанка – пульсация свечения
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.7 },
        scale: { from: 1, to: 1.3 },
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
  }

  addDecorativeElements() {
    // Разнообразие: огни, антенны, полоски
    if (this.index % 3 === 0) {
      const light = this.scene.add.circle(this.sprite.x, this.sprite.y - 10, 4, 0xffaa44, 0.7);
      light.setBlendMode(Phaser.BlendModes.ADD);
      this.decorations.push(light);
      this.scene.tweens.add({
        targets: light,
        alpha: { from: 0.4, to: 0.9 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        onUpdate: () => { if (light.active) light.setPosition(this.sprite.x, this.sprite.y - 10); }
      });
    }

    if (this.index % 5 === 2 && this.scene.textures.exists('antenna')) {
      const antenna = this.scene.add.image(this.sprite.x, this.sprite.y - 16, 'antenna')
        .setScale(0.5).setDepth(this.sprite.depth + 1);
      antenna.setBlendMode(Phaser.BlendModes.ADD);
      this.decorations.push(antenna);
      this.scene.tweens.add({
        targets: antenna,
        alpha: { from: 0.5, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (antenna.active) antenna.setPosition(this.sprite.x, this.sprite.y - 16);
        }
      });
    }
  }

  addHighMultiplierEffects() {
    // Дополнительный эффект для вагонов с высоким множителем
    const particles = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 15, max: 35 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      quantity: 1,
      frequency: 25,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xffaa44, 0xff66aa],
      follow: this.sprite,
      followOffset: { x: -18, y: 0 }
    });
    this.decorations.push(particles);
  }

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    if (this.glowEffect) this.glowEffect.setAlpha(0);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 480,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 52);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
        if (this.glowEffect) {
          this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
          this.glowEffect.setAlpha(this.sprite.alpha * 0.7);
        }
      },
      onComplete: () => {
        if (this.trailEmitter) this.trailEmitter.start();
        this.createSpawnFlash();
      }
    });
  }

  createSpawnFlash() {
    const flash = this.scene.add.circle(this.sprite.x, this.sprite.y, 28, this.worldConfig.color, 0.9);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      scale: 2.5,
      alpha: 0,
      duration: 450,
      onComplete: () => flash.destroy()
    });
  }

  playSpawnSound() {
    try { audioManager.playSound(this.scene, 'wagon_spawn', 0.5); } catch(e) {}
  }

  playDamageSound() {
    try { audioManager.playSound(this.scene, 'hit_sound', 0.32); } catch(e) {}
  }

  playDetachSound() {
    try { audioManager.playSound(this.scene, 'wagon_destroy', 0.6); } catch(e) {}
  }

  // =========================================================================
  // ЗДОРОВЬЕ И ПОВРЕЖДЕНИЯ
  // =========================================================================
  getMaxHealth() {
    let baseHealth = 2;  // теперь вагоны прочнее
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    baseHealth += Math.floor(this.index / 4);
    return Math.max(1, baseHealth);
  }

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
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
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) this.sprite.setTint(this.worldConfig.color);
    });

    for (let i = 0; i < 12; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-28, 28),
        this.sprite.y + Phaser.Math.Between(-28, 28),
        Phaser.Math.Between(2, 6),
        this.worldConfig.particleColor,
        0.9
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-80, 80),
        y: spark.y + Phaser.Math.Between(-80, 80),
        duration: 500,
        onComplete: () => spark.destroy()
      });
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОЗИЦИИ (ФИЗИКА ПОЕЗДА)
  // =========================================================================
  update(prevX, prevY, gap, delta) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }

    this.followDistance = gap;

    // Защитные кадры (мигание) – без изменения прозрачности, только tint
    if (this.protectionFrames > 0) {
      this.protectionFrames -= delta;
      if (this.protectionFrames % 100 < 50) {
        this.sprite.setTint(0xff8888);
      } else {
        this.sprite.setTint(this.worldConfig.color);
      }
    } else {
      this.sprite.setTint(this.worldConfig.color);
    }

    // Целевая позиция
    const targetX = prevX - this.followDistance;
    const targetY = prevY;

    const dx = targetX - this.pos.x;
    const dy = targetY - this.pos.y;

    // Пружинная сила с учётом дельты
    const forceX = dx * this.springStrength * (delta / 16);
    const forceY = dy * this.springStrength * (delta / 16);
    this.vel.x += forceX;
    this.vel.y += forceY;

    // Демпфирование
    this.vel.x *= this.damping;
    this.vel.y *= this.damping;

    // Обновление позиции
    this.pos.x += this.vel.x * (delta / 16);
    this.pos.y += this.vel.y * (delta / 16);

    // Применяем позицию к спрайту
    this.sprite.x = this.pos.x;
    this.sprite.y = this.pos.y;

    // Визуальное покачивание (очень слабое)
    const wobble = Math.sin(Date.now() * 0.0045 + this.index) * 0.35;
    this.sprite.y += wobble;

    // Поворот в зависимости от скорости
    const speed = Math.hypot(this.vel.x, this.vel.y);
    if (speed > 0.6) {
      const moveAngle = Math.atan2(this.vel.y, this.vel.x);
      this.sprite.rotation += (moveAngle * 0.28 - this.sprite.rotation) * 0.1;
    } else {
      this.sprite.rotation *= 0.98;
    }

    this.updateMultiplierIndicator();

    // Обновляем свечение
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }

    // Обновляем декоративные элементы
    for (let i = 0; i < this.decorations.length; i++) {
      const deco = this.decorations[i];
      if (deco && deco.active) {
        if (deco instanceof Phaser.GameObjects.Image) {
          deco.setPosition(this.sprite.x, this.sprite.y - 16);
        } else if (deco instanceof Phaser.GameObjects.Circle) {
          deco.setPosition(this.sprite.x, this.sprite.y - 10);
        }
      }
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОСЛЕ ОТЦЕПЛЕНИЯ
  // =========================================================================
  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.55;
    if (this.multiplierIndicator) {
      const fontSize = this.coinMultiplier >= 4 ? 18 : 15;
      this.multiplierIndicator.setFontSize(fontSize);
      this.multiplierIndicator.setText(`x${this.coinMultiplier.toFixed(1)}`);
    }
  }

  getCurrentMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
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
    }
    this.playDetachSound();

    // Отбрасываем вагон
    this.vel.x = -300;
    this.vel.y = Phaser.Math.Between(-140, 140);
  }

  // =========================================================================
  // УНИЧТОЖЕНИЕ
  // =========================================================================
  destroy() {
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      if (this._isDestroying) return;
      this._isDestroying = true;
    }
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.multiplierIndicator) this.multiplierIndicator.destroy();
    for (let deco of this.decorations) {
      if (deco && deco.destroy) deco.destroy();
    }
    this.decorations = [];

    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { audioManager.playSound(this.scene, 'wagon_destroy', 0.7); } catch(e) {}
      this.sprite.destroy();
    }
    this.active = false;
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================
  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getHealth() { return this.hp; }
  getMaxHealth() { return this.maxHp; }
  getMultiplier() { return this.getCurrentMultiplier(); }
  getIndex() { return this.index; }
  isActive() { return this.active && this.sprite?.active && this.isConnected; }
  isConnected() { return this.isConnected; }
}