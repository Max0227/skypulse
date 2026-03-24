import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);

    // Конфигурация мира
    this.worldConfig = this.getWorldConfig();

    // Выбор текстуры
    this.textureKey = this.getTextureForWorld();

    // Создание спрайта – ВИДИМЫЙ И ЯРКИЙ
    this.sprite = scene.physics.add.image(x, y, this.textureKey)
      .setScale(1.05)
      .setDepth(5 + index)
      .setAlpha(1)
      .setVisible(true)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Настройка физики (без гравитации)
    this.setupPhysics();

    // Ссылка на объект
    this.sprite.wagonRef = this;

    // Характеристики
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.isConnected = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500;

    // Множитель очков
    this.coinMultiplier = 1 + (this.index + 1) * 0.55;

    // Параметры следования – ОПТИМИЗИРОВАНЫ
    this.followDistance = 52;
    this.springStrength = 0.48;
    this.damping = 0.96;

    // Позиция и скорость
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };

    // Визуальные элементы
    this.glowEffect = null;
    this.trailEmitter = null;
    this.multiplierIndicator = null;
    this.decorations = [];

    // Создание элементов
    this.createMultiplierIndicator();
    this.createTrail();
    this.applyWorldVisuals();
    this.animateSpawn();
    this.playSpawnSound();
    this.addDecorativeElements();

    if (this.coinMultiplier >= 4) {
      this.addHighMultiplierEffects();
    }

    console.log(`🚃 Вагон создан: индекс ${this.index}, позиция (${x}, ${y}), текстура: ${this.textureKey}`);
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ МИРОВ
  // =========================================================================
  getWorldConfig() {
    const configs = {
      0: { name: 'space', color: 0x4a8cff, glowColor: 0x6aacff, textureSet: 'space', particleColor: 0x4a8cff, trailColor: [0x4a8cff, 0x8abaff] },
      1: { name: 'neon', color: 0xff44ff, glowColor: 0xff88ff, textureSet: 'neon', particleColor: 0xff44ff, trailColor: [0xff44ff, 0xff88ff, 0xffaaff] },
      2: { name: 'dark', color: 0xcc8866, glowColor: 0xffaa88, textureSet: 'dark', particleColor: 0xff6600, trailColor: [0xcc8866, 0xffaa88] },
      3: { name: 'rocky', color: 0xffaa66, glowColor: 0xffcc88, textureSet: 'rocky', particleColor: 0xffaa44, trailColor: [0xffaa66, 0xffcc88] },
      4: { name: 'void', color: 0xaa88ff, glowColor: 0xcc88ff, textureSet: 'void', particleColor: 0xaa88ff, trailColor: [0xaa88ff, 0xcc88ff, 0xeeaaff] }
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
    
    if (this.scene.textures.exists(candidate)) {
      return candidate;
    }
    
    const fallback = `wagon_${this.index % 10}`;
    if (this.scene.textures.exists(fallback)) {
      return fallback;
    }
    
    return this.createFallbackTexture();
  }

  createFallbackTexture() {
    const key = `wagon_fallback_${this.index}`;
    if (this.scene.textures.exists(key)) return key;

    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    const width = 52;
    const height = 40;
    graphics.fillStyle(this.worldConfig.color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 10);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(8, 8, 10, 10);
    graphics.fillRect(width - 18, 8, 10, 10);
    graphics.fillStyle(this.worldConfig.glowColor, 0.7);
    graphics.fillCircle(14, height - 12, 7);
    graphics.fillCircle(width - 14, height - 12, 7);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    return key;
  }

  // =========================================================================
  // ФИЗИКА
  // =========================================================================
  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.enable = false;
    this.sprite.setCircle(22);
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    const glowAlpha = 0.25 + (this.index % 3) * 0.08;
    this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 36, this.worldConfig.glowColor, glowAlpha);
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(4);
  }

  createTrail() {
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 12, max: 32 },
      scale: { start: 0.3, end: 0 },
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
      this.sprite.y - 54,
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
    this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 54);
    const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
    this.multiplierIndicator.setAlpha(intensity);
  }

  applyWorldVisuals() {
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.25, to: 0.7 },
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
    if (this.index % 3 === 0) {
      const light = this.scene.add.circle(this.sprite.x, this.sprite.y - 12, 5, 0xffaa44, 0.7);
      light.setBlendMode(Phaser.BlendModes.ADD);
      this.decorations.push(light);
      this.scene.tweens.add({
        targets: light,
        alpha: { from: 0.4, to: 0.9 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (light.active) light.setPosition(this.sprite.x, this.sprite.y - 12);
        }
      });
    }
  }

  addHighMultiplierEffects() {
    const particles = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 15, max: 38 },
      scale: { start: 0.22, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 320,
      quantity: 1,
      frequency: 24,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xffaa44, 0xff66aa],
      follow: this.sprite,
      followOffset: { x: -20, y: 0 }
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
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 54);
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
    const flash = this.scene.add.circle(this.sprite.x, this.sprite.y, 30, this.worldConfig.color, 0.9);
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
    let baseHealth = 2;
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
        this.sprite.x + Phaser.Math.Between(-30, 30),
        this.sprite.y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(2, 6),
        this.worldConfig.particleColor,
        0.9
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-90, 90),
        y: spark.y + Phaser.Math.Between(-90, 90),
        duration: 500,
        onComplete: () => spark.destroy()
      });
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОЗИЦИИ (ФИЗИКА ПОЕЗДА) – ОПТИМИЗИРОВАНО
  // =========================================================================
  update(prevX, prevY, gap, delta) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }

    this.followDistance = gap;

    // Защитные кадры – только tint, без изменения прозрачности
    if (this.protectionFrames > 0) {
      this.protectionFrames -= delta;
      if (Math.floor(this.protectionFrames / 50) % 2 === 0) {
        this.sprite.setTint(0xff8888);
      } else {
        this.sprite.setTint(this.worldConfig.color);
      }
    } else {
      this.sprite.setTint(this.worldConfig.color);
      this.sprite.setAlpha(1);
    }

    // Целевая позиция
    const targetX = prevX - this.followDistance;
    const targetY = prevY;

    const dx = targetX - this.pos.x;
    const dy = targetY - this.pos.y;

    // Пружинная сила (ускорение) – нормализовано по дельте
    const forceX = dx * this.springStrength * Math.min(1, delta / 16);
    const forceY = dy * this.springStrength * Math.min(1, delta / 16);
    this.vel.x += forceX;
    this.vel.y += forceY;

    // Демпфирование
    this.vel.x *= this.damping;
    this.vel.y *= this.damping;

    // Обновление позиции
    this.pos.x += this.vel.x * Math.min(1, delta / 16);
    this.pos.y += this.vel.y * Math.min(1, delta / 16);

    // Применяем позицию к спрайту
    this.sprite.x = this.pos.x;
    this.sprite.y = this.pos.y;

    // Визуальное покачивание – очень слабое, только для эстетики
    const wobble = Math.sin(Date.now() * 0.0045 + this.index) * 0.3;
    this.sprite.y += wobble;

    // Поворот в зависимости от скорости
    const speed = Math.hypot(this.vel.x, this.vel.y);
    if (speed > 0.5) {
      const moveAngle = Math.atan2(this.vel.y, this.vel.x);
      this.sprite.rotation += (moveAngle * 0.3 - this.sprite.rotation) * 0.12;
    } else {
      this.sprite.rotation *= 0.98;
    }

    this.updateMultiplierIndicator();

    if (this.glowEffect && this.glowEffect.active) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }

    // Обновляем декоративные элементы
    for (let i = 0; i < this.decorations.length; i++) {
      const deco = this.decorations[i];
      if (!deco || !deco.active) continue;
      if (typeof deco.setPosition === 'function') {
        if (deco.constructor?.name === 'Circle') {
          deco.setPosition(this.sprite.x, this.sprite.y - 12);
        } else if (deco.constructor?.name !== 'ParticleEmitter') {
          deco.setPosition(this.sprite.x, this.sprite.y - 18);
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
    this.vel.x = -300;
    this.vel.y = Phaser.Math.Between(-150, 150);
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