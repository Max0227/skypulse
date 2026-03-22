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
    
    // Выбираем текстуру
    this.texture = this.getTextureForWorld();
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.7)
      .setDepth(5 + index);
    
    // Настройка физики
    this.setupPhysics();
    
    // Визуальные эффекты
    this.setupVisuals();
    
    // Ссылка на объект вагона
    this.sprite.wagonRef = this;
    
    // Характеристики
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500;
    
    // Множитель монет (от индекса вагона)
    this.coinMultiplier = 1 + (this.index + 1) * 0.5; // 1.5, 2.0, 2.5, 3.0...
    this.isConnected = true;
    
    // Физика верёвочки
    this.springConstant = 0.15;      // жёсткость пружины
    this.damping = 0.85;             // затухание
    this.maxDistance = 28;            // максимальное расстояние до предыдущего
    this.minDistance = 18;            // минимальное расстояние
    this.velocity = { x: 0, y: 0 };   // текущая скорость
    
    // Специальные эффекты
    this.specialEffects = this.getSpecialEffects();
    this.buffs = [];
    this.glowEffect = null;
    
    // Визуальные элементы
    this.multiplierIndicator = null;
    this.armorIndicator = null;
    this.connectionLine = null;       // визуальная линия связи
    
    // Создаём визуальные элементы
    this.createMultiplierIndicator();
    if (this.maxHp > 1) {
      this.createArmorIndicator();
    }
    
    // Эффекты мира
    this.applyWorldVisuals();
    
    // Анимация появления
    this.animateSpawn();
    
    // Звук появления
    this.playSpawnSound();
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ
  // =========================================================================

  getWorldConfig() {
    const configs = {
      0: { color: 0x88aaff, glowColor: 0x44aaff, textureSet: 'space', effect: 'normal', particleColor: 0x44aaff, spring: 0.15 },
      1: { color: 0xff44ff, glowColor: 0xff88ff, textureSet: 'neon', effect: 'neon', particleColor: 0xff44ff, spring: 0.18 },
      2: { color: 0xaa6644, glowColor: 0xcc8866, textureSet: 'dark', effect: 'dark', particleColor: 0xff6600, spring: 0.12 },
      3: { color: 0xffaa66, glowColor: 0xffcc88, textureSet: 'rocky', effect: 'rocky', particleColor: 0xffaa44, spring: 0.14 },
      4: { color: 0xaa88ff, glowColor: 0xcc88ff, textureSet: 'void', effect: 'void', particleColor: 0xaa88ff, spring: 0.2 },
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

  setupPhysics() {
    this.sprite.body.setCircle(12, 8, 6);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setMass(0.5);
    this.sprite.body.setDrag(0.98);
    this.sprite.body.setBounce(0.1);
    this.springConstant = this.worldConfig.spring || 0.15;
  }

  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Создаём свечение для некоторых вагонов
    if (this.index % 3 === 0 && this.worldType === 1) {
      this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, this.worldConfig.glowColor, 0.3);
      this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
      this.glowEffect.setDepth(4);
    }
  }

  getMaxHealth() {
    let baseHealth = 1;
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    
    const skinStats = gameManager.getCurrentSkinStats?.();
    if (skinStats?.armorBonus) {
      baseHealth += Math.floor(skinStats.armorBonus / 10);
    }
    
    return Math.max(1, baseHealth);
  }

  getSpecialEffects() {
    const effects = [];
    if (this.worldType === 1 && this.index % 2 === 0) effects.push('glow');
    if (this.worldType === 2 && this.index % 3 === 0) effects.push('shadow');
    if (this.worldType === 3 && this.index % 4 === 0) effects.push('rock_armor');
    if (this.worldType === 4 && this.index % 5 === 0) effects.push('void_energy');
    return effects;
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createMultiplierIndicator() {
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y - 28, 
      `x${this.coinMultiplier.toFixed(1)}`, {
        fontSize: '11px',
        fontFamily: "'Audiowide', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { blur: 4, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(20);
  }

  createArmorIndicator() {
    const barWidth = 30, barHeight = 3;
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffaa44, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('wagon_armor_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.armorIndicator = this.scene.add.image(this.sprite.x, this.sprite.y - 22, 'wagon_armor_bar')
      .setScale(1, 0.5).setDepth(20);
  }

  updateArmorIndicator() {
    if (!this.armorIndicator) return;
    const percent = this.hp / this.maxHp;
    this.armorIndicator.setScale(percent, 0.5);
    this.armorIndicator.setPosition(this.sprite.x, this.sprite.y - 22);
    this.armorIndicator.setTint(percent > 0.6 ? 0x00ff00 : (percent > 0.3 ? 0xffaa00 : 0xff0000));
  }

  updateMultiplierIndicator() {
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 28);
      const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
      this.multiplierIndicator.setAlpha(intensity);
    }
  }

  createConnectionLine(prevX, prevY) {
    if (!this.connectionLine) {
      this.connectionLine = this.scene.add.graphics();
      this.connectionLine.setDepth(4);
    }
    this.connectionLine.clear();
    this.connectionLine.lineStyle(1, this.worldConfig.color, 0.3);
    this.connectionLine.beginPath();
    this.connectionLine.moveTo(prevX, prevY);
    this.connectionLine.lineTo(this.sprite.x, this.sprite.y);
    this.connectionLine.strokePath();
  }

  applyWorldVisuals() {
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.5 },
        scale: { from: 1, to: 1.2 },
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

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    if (this.armorIndicator) this.armorIndicator.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 400,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 28);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
        if (this.armorIndicator) {
          this.armorIndicator.setPosition(this.sprite.x, this.sprite.y - 22);
          this.armorIndicator.setAlpha(this.sprite.alpha);
        }
      }
    });
  }

  playSpawnSound() {
    try {
      audioManager.playSound(this.scene, 'wagon_spawn', 0.3);
    } catch (e) {}
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite.setData('hp', hp);
    this.sprite.setData('maxHP', maxHp);
    if (maxHp > 1 && !this.armorIndicator) this.createArmorIndicator();
  }

  takeDamage(amount = 1, source = null) {
    if (this.protectionFrames > 0 || !this.isConnected) return false;
    
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    this.protectionFrames = this.protectionDuration;
    this.showDamageEffect();
    this.updateArmorIndicator();
    this.playDamageSound();
    
    return false;
  }

  showDamageEffect() {
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) this.sprite.setTint(this.worldConfig.color);
    });
    
    for (let i = 0; i < 3; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-15, 15),
        this.sprite.y + Phaser.Math.Between(-15, 15),
        2,
        this.worldConfig.particleColor,
        0.7
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }
  }

  playDamageSound() {
    try { audioManager.playSound(this.scene, 'hit_sound', 0.2); } catch(e) {}
  }

  update(prevX, prevY, gap, spring) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }
    
    // Защитные кадры
    if (this.protectionFrames > 0) {
      this.protectionFrames -= 16;
      this.sprite.setAlpha(this.protectionFrames % 100 < 50 ? 0.6 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    // ===== ФИЗИКА "НА ВЕРЁВОЧКЕ" =====
    // Целевая позиция (куда должен стремиться вагон)
    const targetX = prevX - gap;
    const targetY = prevY;
    
    // Вычисляем смещение от текущей позиции до целевой
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    
    // Применяем силу пружины только если расстояние больше минимального
    if (distance > this.minDistance) {
      // Сила = смещение * жёсткость
      const force = Math.min(1, (distance - this.minDistance) / this.maxDistance) * this.springConstant;
      const angle = Math.atan2(dy, dx);
      
      // Добавляем ускорение к скорости
      this.velocity.x += Math.cos(angle) * force * 2;
      this.velocity.y += Math.sin(angle) * force * 2;
    }
    
    // Применяем затухание
    this.velocity.x *= this.damping;
    this.velocity.y *= this.damping;
    
    // Обновляем позицию
    this.sprite.x += this.velocity.x;
    this.sprite.y += this.velocity.y;
    
    // Добавляем небольшое "болтание" для реалистичности
    this.sprite.y += Math.sin(Date.now() * 0.003 + this.index) * 0.5;
    
    // Обновляем физическое тело
    if (this.sprite.body) {
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Рисуем линию связи (визуальный трос)
    this.createConnectionLine(prevX, prevY);
    
    // Обновляем индикаторы
    this.updateMultiplierIndicator();
    if (this.armorIndicator) this.updateArmorIndicator();
    if (this.glowEffect) this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
  }

  // Обновление множителя при отцеплении вагона
  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setText(`x${this.coinMultiplier.toFixed(1)}`);
    }
  }

  // Получить текущий множитель для сбора монет
  getCurrentMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
  }

  // Отцепление вагона (при разрушении)
  detach() {
    this.isConnected = false;
    this.sprite.setTint(0x666666);
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setColor('#888888');
      this.multiplierIndicator.setText(`x1.0`);
    }
    this.playDetachSound();
  }

  playDetachSound() {
    try { audioManager.playSound(this.scene, 'wagon_destroy', 0.4); } catch(e) {}
  }

  destroy() {
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.armorIndicator) this.armorIndicator.destroy();
    if (this.multiplierIndicator) this.multiplierIndicator.destroy();
    if (this.connectionLine) this.connectionLine.destroy();
    
    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { audioManager.playSound(this.scene, 'wagon_destroy', 0.5); } catch(e) {}
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