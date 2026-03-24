import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

/**
 * Класс вагона – киберпанк-стиль, плавное следование, без прозрачности,
 * без тряски камеры, с красивыми частицами и полной очисткой эффектов.
 */
export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType ?? (scene.levelManager?.currentWorld ?? 0);

    // Конфигурация мира
    this.worldConfig = this.getWorldConfig();
    this.texture = this.getTextureForWorld();

    // Создание спрайта – крупный, яркий, без прозрачности
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.95)
      .setDepth(5 + index)
      .setAlpha(1); // полная непрозрачность

    // Отключаем гравитацию и стандартную физику
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
    this.protectionDuration = 500; // ms

    // Множитель очков
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;

    // Параметры следования (пружинная система)
    this.followDistance = 50;          // желаемое расстояние до предыдущего
    this.springStrength = 0.48;        // жёсткость пружины
    this.damping = 0.94;               // затухание

    // Позиция и скорость (для независимого движения)
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };

    // Визуальные элементы
    this.glowEffect = null;
    this.trailEmitter = null;
    this.multiplierIndicator = null;

    // Создание элементов интерфейса
    this.createMultiplierIndicator();
    this.createTrail();
    this.applyWorldVisuals();
    this.animateSpawn();
    this.playSpawnSound();
    this.addDecorativeElements();
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ МИРОВ
  // =========================================================================
  getWorldConfig() {
    const configs = {
      0: { // Космос
        color: 0x4a8cff,
        glowColor: 0x6aacff,
        textureSet: 'space',
        particleColor: 0x4a8cff,
        drag: 0.95,
        lightIntensity: 0.4,
        trailColor: [0x4a8cff, 0x8abaff]
      },
      1: { // Киберпанк
        color: 0xff44ff,
        glowColor: 0xff88ff,
        textureSet: 'neon',
        particleColor: 0xff44ff,
        drag: 0.92,
        lightIntensity: 0.7,
        trailColor: [0xff44ff, 0xff88ff, 0xffaaff]
      },
      2: { // Подземелье
        color: 0xcc8866,
        glowColor: 0xffaa88,
        textureSet: 'dark',
        particleColor: 0xff6600,
        drag: 0.98,
        lightIntensity: 0.3,
        trailColor: [0xcc8866, 0xffaa88]
      },
      3: { // Астероиды
        color: 0xffaa66,
        glowColor: 0xffcc88,
        textureSet: 'rocky',
        particleColor: 0xffaa44,
        drag: 0.96,
        lightIntensity: 0.5,
        trailColor: [0xffaa66, 0xffcc88]
      },
      4: { // Чёрная дыра
        color: 0xaa88ff,
        glowColor: 0xcc88ff,
        textureSet: 'void',
        particleColor: 0xaa88ff,
        drag: 0.9,
        lightIntensity: 0.6,
        trailColor: [0xaa88ff, 0xcc88ff, 0xeeaaff]
      }
    };
    return configs[this.worldType] || configs[0];
  }

  // =========================================================================
  // ВЫБОР ТЕКСТУРЫ (разнообразие)
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
    const defaultTexture = `wagon_${this.index % 10}`;
    return this.scene.textures.exists(textures[texIndex]) ? textures[texIndex] : defaultTexture;
  }

  // =========================================================================
  // ФИЗИКА (ручное управление)
  // =========================================================================
  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.enable = false;   // отключаем стандартную физику
    this.sprite.setCircle(18);         // радиус коллизии
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================
  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);

    // Добавляем свечение для каждого чётного вагона
    if (this.index % 2 === 0) {
      this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 32, this.worldConfig.glowColor, 0.35);
      this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
      this.glowEffect.setDepth(4);
    }
  }

  createTrail() {
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 12, max: 28 },
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 260,
      quantity: 1,
      frequency: 36,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldConfig.trailColor,
      follow: this.sprite,
      followOffset: { x: -22, y: 0 }
    });
  }

  createMultiplierIndicator() {
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 48,
      `x${this.coinMultiplier.toFixed(1)}`,
      {
        fontSize: '15px',
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
    this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 48);
    const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
    this.multiplierIndicator.setAlpha(intensity);
  }

  applyWorldVisuals() {
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.6 },
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
    // Добавляем маленькую антенну для каждого третьего вагона
    if (this.index % 3 === 0 && this.scene.textures.exists('antenna')) {
      const antenna = this.scene.add.image(this.sprite.x, this.sprite.y - 14, 'antenna')
        .setScale(0.45).setDepth(this.sprite.depth + 1);
      antenna.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: antenna,
        alpha: { from: 0.5, to: 1 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (antenna.active) antenna.setPosition(this.sprite.x, this.sprite.y - 14);
        }
      });
    }
  }

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 450,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 48);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
      },
      onComplete: () => {
        if (this.trailEmitter) this.trailEmitter.start();
        this.createSpawnFlash();
      }
    });
  }

  createSpawnFlash() {
    const flash = this.scene.add.circle(this.sprite.x, this.sprite.y, 25, this.worldConfig.color, 0.8);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });
  }

  playSpawnSound() {
    try { audioManager.playSound(this.scene, 'wagon_spawn', 0.45); } catch(e) {}
  }

  playDamageSound() {
    try { audioManager.playSound(this.scene, 'hit_sound', 0.3); } catch(e) {}
  }

  playDetachSound() {
    try { audioManager.playSound(this.scene, 'wagon_destroy', 0.55); } catch(e) {}
  }

  // =========================================================================
  // ЗДОРОВЬЕ И ПОВРЕЖДЕНИЯ
  // =========================================================================
  getMaxHealth() {
    let baseHealth = 1;
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    // Дальние вагоны получают дополнительное здоровье
    baseHealth += Math.floor(this.index / 5);
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

    for (let i = 0; i < 10; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-25, 25),
        this.sprite.y + Phaser.Math.Between(-25, 25),
        Phaser.Math.Between(2, 5),
        this.worldConfig.particleColor,
        0.9
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-70, 70),
        y: spark.y + Phaser.Math.Between(-70, 70),
        duration: 450,
        onComplete: () => spark.destroy()
      });
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОЗИЦИИ (ФИЗИКА ПОЕЗДА) – ПЛАВНОЕ СЛЕДОВАНИЕ
  // =========================================================================
  update(prevX, prevY, gap, delta) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }

    this.followDistance = gap;

    // Защитные кадры (мигание) – без прозрачности, только мигание цвета
    if (this.protectionFrames > 0) {
      this.protectionFrames -= delta;
      if (this.protectionFrames % 100 < 50) {
        this.sprite.setTint(0xff8888);
      } else {
        this.sprite.setTint(this.worldConfig.color);
      }
    } else {
      this.sprite.setTint(this.worldConfig.color);
      this.sprite.setAlpha(1);
    }

    // Целевая позиция: позади предыдущего на заданное расстояние
    const targetX = prevX - this.followDistance;
    const targetY = prevY;

    const dx = targetX - this.pos.x;
    const dy = targetY - this.pos.y;

    // Пружинная сила с учётом дельты времени
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

    // Небольшое визуальное покачивание (чисто эстетика, не влияет на коллизию)
    const wobble = Math.sin(Date.now() * 0.004 + this.index) * 0.4;
    this.sprite.y += wobble;

    // Поворот в зависимости от скорости (плавно)
    const speed = Math.hypot(this.vel.x, this.vel.y);
    if (speed > 0.5) {
      const moveAngle = Math.atan2(this.vel.y, this.vel.x);
      this.sprite.rotation += (moveAngle * 0.3 - this.sprite.rotation) * 0.12;
    } else {
      this.sprite.rotation *= 0.98;
    }

    this.updateMultiplierIndicator();
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  // =========================================================================
  // ОБНОВЛЕНИЕ ПОСЛЕ ОТЦЕПЛЕНИЯ
  // =========================================================================
  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    if (this.multiplierIndicator) {
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

    // Отбрасываем вагон в сторону
    this.vel.x = -280;
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

    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { audioManager.playSound(this.scene, 'wagon_destroy', 0.65); } catch(e) {}
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