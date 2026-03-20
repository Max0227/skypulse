import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    // Получаем конфигурацию для текущего мира
    this.worldConfig = this.getWorldConfig();
    
    // Выбираем текстуру в зависимости от мира и индекса
    this.texture = this.getTextureForWorld();
    
    // Создаём спрайт с учётом мира
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.75)
      .setDepth(5 + index);
    
    // Настройка физики
    this.setupPhysics();
    
    // Визуальные эффекты в зависимости от мира
    this.setupVisuals();
    
    // Ссылка на объект вагона
    this.sprite.wagonRef = this;
    
    // Характеристики с учётом мира и улучшений
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500; // мс защиты после получения урона
    
    // Специальные эффекты для вагона
    this.specialEffects = this.getSpecialEffects();
    this.buffs = [];
    this.auraEffect = null;
    
    // Полоска здоровья
    this.healthBar = null;
    if (this.maxHp > 1) {
      this.createHealthBar();
    }
    
    // Эффекты в зависимости от мира
    this.applyWorldVisuals();
    
    // Анимация появления
    this.animateSpawn();
    
    // Звук появления
    this.playSpawnSound();
  }

  // =========================================================================
  // КОНФИГУРАЦИЯ В ЗАВИСИМОСТИ ОТ МИРА
  // =========================================================================

  getWorldConfig() {
    const configs = {
      0: { // Космос
        color: 0x88aaff,
        glowColor: 0x44aaff,
        textureSet: 'space',
        healthMultiplier: 1.0,
        speedMultiplier: 1.0,
        effect: 'normal',
        particleColor: 0x44aaff,
      },
      1: { // Киберпанк
        color: 0xff44ff,
        glowColor: 0xff88ff,
        textureSet: 'neon',
        healthMultiplier: 0.9,
        speedMultiplier: 1.2,
        effect: 'neon',
        particleColor: 0xff44ff,
      },
      2: { // Подземелье
        color: 0xaa6644,
        glowColor: 0xcc8866,
        textureSet: 'dark',
        healthMultiplier: 1.2,
        speedMultiplier: 0.8,
        effect: 'dark',
        particleColor: 0xff6600,
      },
      3: { // Астероиды
        color: 0xffaa66,
        glowColor: 0xffcc88,
        textureSet: 'rocky',
        healthMultiplier: 1.1,
        speedMultiplier: 1.1,
        effect: 'rocky',
        particleColor: 0xffaa44,
      },
      4: { // Чёрная дыра
        color: 0xaa88ff,
        glowColor: 0xcc88ff,
        textureSet: 'void',
        healthMultiplier: 1.3,
        speedMultiplier: 0.7,
        effect: 'void',
        particleColor: 0xaa88ff,
      },
    };
    return configs[this.worldType] || configs[0];
  }

  getTextureForWorld() {
    // Разные текстуры для разных миров
    const textureMaps = {
      space: ['wagon_0', 'wagon_1', 'wagon_2', 'wagon_3', 'wagon_4', 'wagon_5', 'wagon_6', 'wagon_7', 'wagon_8', 'wagon_9'],
      neon: ['wagon_neon_0', 'wagon_neon_1', 'wagon_neon_2', 'wagon_neon_3', 'wagon_neon_4'],
      dark: ['wagon_dark_0', 'wagon_dark_1', 'wagon_dark_2', 'wagon_dark_3'],
      rocky: ['wagon_rock_0', 'wagon_rock_1', 'wagon_rock_2', 'wagon_rock_3'],
      void: ['wagon_void_0', 'wagon_void_1', 'wagon_void_2', 'wagon_void_3'],
    };
    
    const textures = textureMaps[this.worldConfig.textureSet] || textureMaps.space;
    const texIndex = this.index % textures.length;
    const texture = textures[texIndex];
    
    // Если текстура не существует, используем стандартную
    if (this.scene.textures.exists(texture)) {
      return texture;
    }
    return `wagon_${this.index % 10}`;
  }

  setupPhysics() {
    // Базовая настройка физики
    this.sprite.body.setCircle(12, 8, 6);
    this.sprite.body.setAllowGravity(true);
    this.sprite.body.setMass(0.5);
    this.sprite.body.setDrag(0.9);
    
    // Модификации физики в зависимости от мира
    if (this.worldType === 1) { // Киберпанк - легче
      this.sprite.body.setMass(0.3);
      this.sprite.body.setDrag(0.7);
    } else if (this.worldType === 2) { // Подземелье - тяжелее
      this.sprite.body.setMass(0.8);
      this.sprite.body.setDrag(1.2);
    } else if (this.worldType === 4) { // Чёрная дыра - странная физика
      this.sprite.body.setMass(0.4);
      this.sprite.body.setDrag(0.5);
    }
  }

  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Дополнительное свечение для редких вагонов
    if (this.index % 3 === 0 && this.worldType === 1) {
      this.createGlowEffect();
    }
  }

  getMaxHealth() {
    let baseHealth = 1;
    
    // Бонус от улучшений
    if (gameManager.getUpgradeLevel('wagonHP')) {
      baseHealth += gameManager.getUpgradeLevel('wagonHP');
    }
    
    // Модификатор мира
    baseHealth = Math.floor(baseHealth * this.worldConfig.healthMultiplier);
    
    // Бонус от выбранного скина
    const skinStats = gameManager.getCurrentSkinStats();
    if (skinStats && skinStats.armorBonus) {
      baseHealth += Math.floor(skinStats.armorBonus / 10);
    }
    
    return Math.max(1, baseHealth);
  }

  getSpecialEffects() {
    const effects = [];
    
    // Эффекты в зависимости от мира
    if (this.worldType === 1 && this.index % 2 === 0) {
      effects.push('glow');
    }
    if (this.worldType === 2 && this.index % 3 === 0) {
      effects.push('shadow');
    }
    if (this.worldType === 3 && this.index % 4 === 0) {
      effects.push('rock_armor');
    }
    if (this.worldType === 4 && this.index % 5 === 0) {
      effects.push('void_energy');
    }
    
    return effects;
  }

  // =========================================================================
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
  // =========================================================================

  createGlowEffect() {
    this.glowEffect = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      20,
      this.worldConfig.glowColor,
      0.3
    );
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
    this.glowEffect.setDepth(4);
  }

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    // Цвет полоски зависит от мира
    let barColor = 0x00ff00;
    if (this.worldType === 1) barColor = 0xff44ff;
    if (this.worldType === 2) barColor = 0xff6600;
    if (this.worldType === 3) barColor = 0xffaa44;
    if (this.worldType === 4) barColor = 0xaa88ff;
    
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('wagon_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 18, 'wagon_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.hp / this.maxHp;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 18);
    
    if (healthPercent > 0.6) {
      this.healthBar.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0xff0000);
    }
  }

  applyWorldVisuals() {
    // Киберпанк - мерцание
    if (this.worldType === 1) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.8, to: 1.0 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      
      if (this.glowEffect) {
        this.scene.tweens.add({
          targets: this.glowEffect,
          alpha: { from: 0.2, to: 0.5 },
          scale: { from: 1, to: 1.2 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
      }
    }
    
    // Подземелье - тёмная аура
    if (this.worldType === 2) {
      this.sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
      
      const darkAura = this.scene.add.circle(this.sprite.x, this.sprite.y, 15, 0x000000, 0.2);
      darkAura.setBlendMode(Phaser.BlendModes.MULTIPLY);
      darkAura.setDepth(4);
      
      this.scene.tweens.add({
        targets: darkAura,
        alpha: { from: 0.1, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        onComplete: () => darkAura.destroy()
      });
    }
    
    // Астероиды - каменная текстура
    if (this.worldType === 3) {
      this.sprite.setTint(0xffaa66);
    }
    
    // Чёрная дыра - искажение
    if (this.worldType === 4) {
      this.sprite.setBlendMode(Phaser.BlendModes.SCREEN);
      
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: { from: 0.75, to: 0.8 },
        scaleY: { from: 0.75, to: 0.8 },
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.75,
      scaleY: 0.75,
      duration: 400,
      ease: 'Back.out',
      onComplete: () => {
        if (this.glowEffect) {
          this.scene.tweens.add({
            targets: this.glowEffect,
            alpha: 0.3,
            duration: 300,
          });
        }
      }
    });
  }

  playSpawnSound() {
    try {
      const volume = 0.3 + (this.index % 5 === 0 ? 0.2 : 0);
      audioManager.playSound(this.scene, 'wagon_spawn', volume);
    } catch (e) {
      try {
        audioManager.playSound(this.scene, 'wagon_sound', 0.3);
      } catch (e2) {}
    }
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
    this.sprite.setData('hp', hp);
    this.sprite.setData('maxHP', maxHp);
    
    if (maxHp > 1 && !this.healthBar) {
      this.createHealthBar();
    }
  }

  takeDamage(amount = 1, source = null) {
    // Проверка защиты
    if (this.protectionFrames > 0) return false;
    
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    // Активируем защитные кадры
    this.protectionFrames = this.protectionDuration;
    
    // Визуальный эффект урона в зависимости от мира
    this.showDamageEffect();
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Звук урона
    this.playDamageSound();
    
    return false;
  }

  showDamageEffect() {
    // Эффект вспышки
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setTint(this.worldConfig.color);
      }
    });
    
    // Эффект частиц в зависимости от мира
    if (this.scene.particleManager) {
      let particleColor = this.worldConfig.particleColor;
      if (this.worldType === 1) particleColor = 0xff44ff;
      if (this.worldType === 2) particleColor = 0xff6600;
      if (this.worldType === 3) particleColor = 0xffaa44;
      if (this.worldType === 4) particleColor = 0xaa88ff;
      
      for (let i = 0; i < 3; i++) {
        const spark = this.scene.add.circle(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          2,
          particleColor,
          0.7
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          x: spark.x + Phaser.Math.Between(-30, 30),
          y: spark.y + Phaser.Math.Between(-30, 30),
          duration: 300,
          onComplete: () => spark.destroy()
        });
      }
    }
    
    // Тряска камеры для сильного урона
    if (amount >= 2) {
      this.scene.cameras.main.shake(100, 0.002);
    }
  }

  playDamageSound() {
    try {
      const volume = 0.2 + (this.hp / this.maxHp) * 0.2;
      audioManager.playSound(this.scene, 'wagon_hit', volume);
    } catch (e) {
      try {
        audioManager.playSound(this.scene, 'hit_sound', 0.2);
      } catch (e2) {}
    }
  }

  addBuff(type, duration) {
    this.buffs.push({ type, duration, startTime: Date.now() });
    
    // Визуальный эффект баффа
    if (type === 'shield') {
      const shield = this.scene.add.circle(this.sprite.x, this.sprite.y, 18, 0x00ffff, 0.3);
      shield.setBlendMode(Phaser.BlendModes.ADD);
      shield.setDepth(6);
      
      this.scene.tweens.add({
        targets: shield,
        alpha: 0,
        duration: duration,
        onComplete: () => shield.destroy()
      });
    }
  }

  updateBuffs() {
    const now = Date.now();
    this.buffs = this.buffs.filter(buff => {
      const elapsed = now - buff.startTime;
      return elapsed < buff.duration;
    });
  }

  update(prevX, prevY, gap, spring) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return;
    }
    
    // Обновляем защитные кадры
    if (this.protectionFrames > 0) {
      this.protectionFrames -= 16; // приблизительно кадр
      if (this.protectionFrames < 0) this.protectionFrames = 0;
      
      // Визуальный эффект защиты (мерцание)
      if (this.protectionFrames % 100 < 50) {
        this.sprite.setAlpha(0.6);
      } else {
        this.sprite.setAlpha(1);
      }
    } else {
      this.sprite.setAlpha(1);
    }
    
    // Обновляем баффы
    this.updateBuffs();
    
    // Расчёт позиции
    const targetX = prevX - gap;
    const targetY = prevY;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    
    // Пружинная физика с учётом мира
    let springFactor = spring;
    if (this.worldType === 1) springFactor = spring * 1.2;
    if (this.worldType === 2) springFactor = spring * 0.8;
    if (this.worldType === 4) springFactor = spring * 1.1;
    
    this.sprite.x += dx * springFactor;
    this.sprite.y += dy * springFactor;
    
    if (this.sprite.body) {
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Обновляем полоску здоровья
    this.updateHealthBar();
    
    // Обновляем эффект свечения
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
    
    // Специальные эффекты для чёрной дыры
    if (this.worldType === 4) {
      const centerX = this.scene.scale.width / 2;
      const centerY = this.scene.scale.height / 2;
      const dxToCenter = centerX - this.sprite.x;
      const dyToCenter = centerY - this.sprite.y;
      const distance = Math.hypot(dxToCenter, dyToCenter);
      
      if (distance < 200) {
        const angle = Math.atan2(dyToCenter, dxToCenter);
        const pull = (1 - distance / 200) * 0.5;
        this.sprite.x += Math.cos(angle) * pull;
        this.sprite.y += Math.sin(angle) * pull;
      }
    }
  }

  destroy() {
    // Удаляем эффекты
    if (this.glowEffect) {
      this.glowEffect.destroy();
    }
    
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    if (this.sprite && this.sprite.active) {
      // Эффект разрушения в зависимости от мира
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      
      // Дополнительные частицы для разных миров
      if (this.worldType === 1) {
        // Киберпанк - цифровые осколки
        for (let i = 0; i < 8; i++) {
          const debris = this.scene.add.text(
            this.sprite.x + Phaser.Math.Between(-20, 20),
            this.sprite.y + Phaser.Math.Between(-20, 20),
            ['0','1'][Math.floor(Math.random() * 2)],
            { fontSize: `${Phaser.Math.Between(8, 16)}px`, fontFamily: 'monospace', color: '#ff44ff' }
          );
          this.scene.tweens.add({
            targets: debris,
            alpha: 0,
            y: debris.y - 50,
            x: debris.x + Phaser.Math.Between(-50, 50),
            duration: 500,
            onComplete: () => debris.destroy()
          });
        }
      }
      
      if (this.worldType === 4) {
        // Чёрная дыра - гравитационный коллапс
        const collapse = this.scene.add.circle(this.sprite.x, this.sprite.y, 15, 0xaa88ff, 0.6);
        this.scene.tweens.add({
          targets: collapse,
          scale: 0,
          alpha: 0,
          duration: 300,
          onComplete: () => collapse.destroy()
        });
      }
      
      // Звук разрушения
      try {
        audioManager.playSound(this.scene, 'wagon_destroy', 0.5);
      } catch (e) {
        try {
          audioManager.playSound(this.scene, 'hit_sound', 0.4);
        } catch (e2) {}
      }
      
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

  getHealthPercent() {
    return this.hp / this.maxHp;
  }

  getIndex() {
    return this.index;
  }

  getWorldType() {
    return this.worldType;
  }

  hasShield() {
    return this.buffs.some(b => b.type === 'shield');
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }
}