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
    this.protectionDuration = 500;
    
    // Множитель монет (увеличенный множитель для каждого вагона)
    this.coinMultiplier = 1 + (this.index + 1) * 0.6; // 1.6, 2.2, 2.8, 3.4...
    this.isConnected = true;
    
    // Специальные эффекты для вагона
    this.specialEffects = this.getSpecialEffects();
    this.buffs = [];
    this.auraEffect = null;
    this.glowEffect = null;
    this.particleTrail = null;
    this.connectionLine = null;
    
    // Полоска здоровья (для вагонов с повышенной прочностью)
    this.healthBar = null;
    if (this.maxHp > 1) {
      this.createHealthBar();
    }
    
    // Индикатор множителя
    this.multiplierIndicator = null;
    this.createMultiplierIndicator();
    
    // Создаём след для вагона
    this.createTrailEffect();
    
    // Эффекты в зависимости от мира
    this.applyWorldVisuals();
    
    // Анимация появления
    this.animateSpawn();
    
    // Звук появления
    this.playSpawnSound();
    
    // Таймер для пульсации индикатора
    this.pulseTimer = 0;
    this.glowIntensity = 0.3;
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
        trailColor: [0x44aaff, 0x88ccff],
        auraRadius: 18,
        glowIntensity: 0.3,
      },
      1: { // Киберпанк
        color: 0xff44ff,
        glowColor: 0xff88ff,
        textureSet: 'neon',
        healthMultiplier: 0.9,
        speedMultiplier: 1.2,
        effect: 'neon',
        particleColor: 0xff44ff,
        trailColor: [0xff44ff, 0xff88ff],
        auraRadius: 22,
        glowIntensity: 0.5,
      },
      2: { // Подземелье
        color: 0xaa6644,
        glowColor: 0xcc8866,
        textureSet: 'dark',
        healthMultiplier: 1.2,
        speedMultiplier: 0.8,
        effect: 'dark',
        particleColor: 0xff6600,
        trailColor: [0xff6600, 0xcc8844],
        auraRadius: 16,
        glowIntensity: 0.25,
      },
      3: { // Астероиды
        color: 0xffaa66,
        glowColor: 0xffcc88,
        textureSet: 'rocky',
        healthMultiplier: 1.1,
        speedMultiplier: 1.1,
        effect: 'rocky',
        particleColor: 0xffaa44,
        trailColor: [0xffaa44, 0xffcc88],
        auraRadius: 18,
        glowIntensity: 0.35,
      },
      4: { // Чёрная дыра
        color: 0xaa88ff,
        glowColor: 0xcc88ff,
        textureSet: 'void',
        healthMultiplier: 1.3,
        speedMultiplier: 0.7,
        effect: 'void',
        particleColor: 0xaa88ff,
        trailColor: [0xaa88ff, 0xcc88ff],
        auraRadius: 20,
        glowIntensity: 0.45,
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
    const texture = textures[texIndex];
    
    if (this.scene.textures.exists(texture)) {
      return texture;
    }
    return `wagon_${this.index % 10}`;
  }

  setupPhysics() {
    this.sprite.body.setCircle(12, 8, 6);
    this.sprite.body.setAllowGravity(true);
    this.sprite.body.setMass(0.5);
    this.sprite.body.setDrag(0.9);
    
    if (this.worldType === 1) {
      this.sprite.body.setMass(0.3);
      this.sprite.body.setDrag(0.7);
    } else if (this.worldType === 2) {
      this.sprite.body.setMass(0.8);
      this.sprite.body.setDrag(1.2);
    } else if (this.worldType === 4) {
      this.sprite.body.setMass(0.4);
      this.sprite.body.setDrag(0.5);
    }
  }

  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    if (this.index % 3 === 0 && this.worldType === 1) {
      this.createGlowEffect();
    }
    
    // Добавляем маленькую неоновую точку в центр
    this.neonCore = this.scene.add.circle(this.sprite.x, this.sprite.y, 4, this.worldConfig.color, 0.6);
    this.neonCore.setBlendMode(Phaser.BlendModes.ADD);
    this.neonCore.setDepth(6);
  }

  getMaxHealth() {
    let baseHealth = 1;
    
    if (gameManager && gameManager.getUpgradeLevel) {
      const upgradeLevel = gameManager.getUpgradeLevel('wagonHP');
      if (upgradeLevel) {
        baseHealth += upgradeLevel;
      }
    }
    
    baseHealth = Math.floor(baseHealth * this.worldConfig.healthMultiplier);
    
    if (gameManager && gameManager.getCurrentSkinStats) {
      const skinStats = gameManager.getCurrentSkinStats();
      if (skinStats && skinStats.armorBonus) {
        baseHealth += Math.floor(skinStats.armorBonus / 10);
      }
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
  // ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (РАСШИРЕННЫЕ)
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

  createMultiplierIndicator() {
    const multiplierValue = this.coinMultiplier.toFixed(1);
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 32,
      `x${multiplierValue}`,
      {
        fontSize: '12px',
        fontFamily: "'Audiowide', 'Orbitron', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { blur: 6, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(21);
    
    // Добавляем маленький кристалл рядом с множителем
    this.multiplierIcon = this.scene.add.text(
      this.sprite.x - 18,
      this.sprite.y - 32,
      '💎',
      {
        fontSize: '12px',
        fontFamily: 'sans-serif',
        color: '#ffaa00'
      }
    ).setOrigin(0.5).setDepth(21);
  }

  createTrailEffect() {
    if (this.worldType === 1 || this.worldType === 4) {
      this.particleTrail = this.scene.add.particles(0, 0, 'flare', {
        speed: { min: 10, max: 25 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 250,
        quantity: 1,
        frequency: 40,
        blendMode: Phaser.BlendModes.ADD,
        tint: this.worldConfig.trailColor,
        follow: this.sprite,
        followOffset: { x: -12, y: 0 }
      });
    }
  }

  createConnectionLine(prevX, prevY) {
    if (!this.connectionLine) {
      this.connectionLine = this.scene.add.graphics();
      this.connectionLine.setDepth(3);
    }
    this.connectionLine.clear();
    this.connectionLine.lineStyle(1, this.worldConfig.color, 0.25);
    this.connectionLine.beginPath();
    this.connectionLine.moveTo(prevX, prevY);
    this.connectionLine.lineTo(this.sprite.x, this.sprite.y);
    this.connectionLine.strokePath();
  }

  createHealthBar() {
    const barWidth = 35;
    const barHeight = 4;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    let barColor = 0x00ff00;
    if (this.worldType === 1) barColor = 0xff44ff;
    if (this.worldType === 2) barColor = 0xff6600;
    if (this.worldType === 3) barColor = 0xffaa44;
    if (this.worldType === 4) barColor = 0xaa88ff;
    
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(0, 0, barWidth, barHeight);
    graphics.generateTexture('wagon_health_bar', barWidth, barHeight);
    graphics.destroy();
    
    this.healthBar = this.scene.add.image(this.sprite.x, this.sprite.y - 22, 'wagon_health_bar')
      .setScale(1, 0.5)
      .setDepth(20);
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.hp / this.maxHp;
    this.healthBar.setScale(healthPercent, 0.5);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y - 22);
    
    if (healthPercent > 0.6) {
      this.healthBar.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      this.healthBar.setTint(0xffaa00);
    } else {
      this.healthBar.setTint(0xff0000);
    }
  }

  updateMultiplierIndicator() {
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 32);
      const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
      this.multiplierIndicator.setAlpha(intensity);
      
      // Пульсация цвета
      if (this.coinMultiplier > 3) {
        this.multiplierIndicator.setColor('#ff88ff');
      } else if (this.coinMultiplier > 2) {
        this.multiplierIndicator.setColor('#ffff88');
      } else {
        this.multiplierIndicator.setColor('#ffaa00');
      }
    }
    if (this.multiplierIcon) {
      this.multiplierIcon.setPosition(this.sprite.x - 18, this.sprite.y - 32);
    }
  }

  applyWorldVisuals() {
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
    
    if (this.worldType === 3) {
      this.sprite.setTint(0xffaa66);
      // Добавляем эффект "каменной крошки"
      this.rockDust = this.scene.add.particles(0, 0, 'flare', {
        speed: { min: 5, max: 15 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 400,
        quantity: 1,
        frequency: 60,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xccaa88,
        follow: this.sprite,
        followOffset: { x: -8, y: 2 }
      });
    }
    
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
      
      // Эффект гравитационного искажения
      this.gravityRings = [];
      for (let i = 0; i < 3; i++) {
        const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 12 + i * 4, 0xaa88ff, 0);
        ring.setStrokeStyle(1, 0xaa88ff, 0.2 - i * 0.05);
        ring.setDepth(3);
        this.gravityRings.push(ring);
        
        this.scene.tweens.add({
          targets: ring,
          alpha: { from: 0.1, to: 0.3 },
          scale: { from: 1, to: 1.2 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          delay: i * 200
        });
      }
    }
  }

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    if (this.multiplierIcon) this.multiplierIcon.setAlpha(0);
    if (this.neonCore) this.neonCore.setAlpha(0);
    
    // Эффект появления с частицами
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-20, 20),
        this.sprite.y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(2, 4),
        this.worldConfig.color,
        0.7
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.75,
      scaleY: 0.75,
      duration: 500,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 32);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
        if (this.multiplierIcon) {
          this.multiplierIcon.setPosition(this.sprite.x - 18, this.sprite.y - 32);
          this.multiplierIcon.setAlpha(this.sprite.alpha);
        }
        if (this.neonCore) {
          this.neonCore.setPosition(this.sprite.x, this.sprite.y);
          this.neonCore.setAlpha(this.sprite.alpha);
        }
      },
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
      if (audioManager && audioManager.playSound) {
        audioManager.playSound(this.scene, 'wagon_spawn', volume);
      }
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
    
    if (maxHp > 1 && !this.healthBar) {
      this.createHealthBar();
    }
  }

  takeDamage(amount = 1, source = null) {
    if (this.protectionFrames > 0) return false;
    
    const actualDamage = Math.min(amount, this.hp);
    this.hp -= actualDamage;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    this.protectionFrames = this.protectionDuration;
    this.showDamageEffect(actualDamage);
    this.updateHealthBar();
    this.playDamageSound(actualDamage);
    
    return false;
  }

  showDamageEffect(damage) {
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.setTint(this.worldConfig.color);
      }
    });
    
    if (this.scene.particleManager) {
      let particleColor = this.worldConfig.particleColor;
      if (this.worldType === 1) particleColor = 0xff44ff;
      if (this.worldType === 2) particleColor = 0xff6600;
      if (this.worldType === 3) particleColor = 0xffaa44;
      if (this.worldType === 4) particleColor = 0xaa88ff;
      
      const sparkCount = Math.min(8, 3 + damage);
      for (let i = 0; i < sparkCount; i++) {
        const spark = this.scene.add.circle(
          this.sprite.x + Phaser.Math.Between(-18, 18),
          this.sprite.y + Phaser.Math.Between(-18, 18),
          Phaser.Math.Between(2, 4),
          particleColor,
          0.8
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          x: spark.x + Phaser.Math.Between(-40, 40),
          y: spark.y + Phaser.Math.Between(-40, 40),
          duration: 350,
          onComplete: () => spark.destroy()
        });
      }
    }
    
    if (damage >= 2) {
      this.scene.cameras.main.shake(100, 0.002);
    }
  }

  playDamageSound(damage) {
    try {
      const volume = 0.2 + (damage / this.maxHp) * 0.2;
      if (audioManager && audioManager.playSound) {
        audioManager.playSound(this.scene, 'wagon_hit', Math.min(0.5, volume));
      }
    } catch (e) {}
  }

  addBuff(type, duration) {
    this.buffs.push({ type, duration, startTime: Date.now() });
    
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
    
    // Обновление защиты
    if (this.protectionFrames > 0) {
      this.protectionFrames -= 16;
      if (this.protectionFrames < 0) this.protectionFrames = 0;
      
      const blink = Math.floor(Date.now() / 50) % 2;
      this.sprite.setAlpha(blink ? 0.6 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    this.updateBuffs();
    
    // Позиционирование
    const targetX = prevX - gap;
    const targetY = prevY;
    
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    
    let springFactor = spring;
    if (this.worldType === 1) springFactor = spring * 1.2;
    if (this.worldType === 2) springFactor = spring * 0.8;
    if (this.worldType === 4) springFactor = spring * 1.1;
    
    this.sprite.x += dx * springFactor;
    this.sprite.y += dy * springFactor;
    
    // Добавляем лёгкое болтание
    this.sprite.y += Math.sin(Date.now() * 0.004 + this.index) * 0.8;
    
    // Поворот в зависимости от скорости
    if (this.sprite.body) {
      const speed = Math.abs(this.sprite.body.velocity.x) + Math.abs(this.sprite.body.velocity.y);
      const angle = Math.atan2(this.sprite.body.velocity.y, this.sprite.body.velocity.x);
      this.sprite.rotation = angle * 0.3;
      this.sprite.body.reset(this.sprite.x, this.sprite.y);
    }
    
    // Обновление всех визуальных элементов
    this.updateHealthBar();
    this.updateMultiplierIndicator();
    
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
      const pulse = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
      this.glowEffect.setAlpha(pulse);
    }
    
    if (this.neonCore) {
      this.neonCore.setPosition(this.sprite.x, this.sprite.y);
    }
    
    if (this.gravityRings) {
      this.gravityRings.forEach(ring => {
        ring.setPosition(this.sprite.x, this.sprite.y);
      });
    }
    
    // Линия связи с предыдущим вагоном
    this.createConnectionLine(prevX, prevY);
    
    // Эффект чёрной дыры
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
    
    // Пульсация множителя для высоких значений
    if (this.coinMultiplier > 3 && this.multiplierIndicator) {
      this.pulseTimer += 16;
      if (this.pulseTimer > 500) {
        this.pulseTimer = 0;
        this.multiplierIndicator.setScale(1.1);
        this.scene.time.delayedCall(150, () => {
          if (this.multiplierIndicator) this.multiplierIndicator.setScale(1);
        });
      }
    }
  }

  // =========================================================================
  // МЕТОДЫ ДЛЯ МНОЖИТЕЛЯ И ОТЦЕПЛЕНИЯ
  // =========================================================================
  
  getMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
  }
  
  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.6;
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setText(`x${this.coinMultiplier.toFixed(1)}`);
    }
  }
  
  detach() {
    this.isConnected = false;
    this.sprite.setTint(0x666666);
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setColor('#888888');
      this.multiplierIndicator.setText(`x1.0`);
    }
    if (this.multiplierIcon) {
      this.multiplierIcon.setColor('#888888');
    }
    this.playDetachSound();
  }
  
  playDetachSound() {
    try {
      if (audioManager && audioManager.playSound) {
        audioManager.playSound(this.scene, 'wagon_destroy', 0.5);
      }
    } catch (e) {}
  }

  destroy() {
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.healthBar) this.healthBar.destroy();
    if (this.multiplierIndicator) this.multiplierIndicator.destroy();
    if (this.multiplierIcon) this.multiplierIcon.destroy();
    if (this.neonCore) this.neonCore.destroy();
    if (this.connectionLine) this.connectionLine.destroy();
    if (this.particleTrail) {
      this.particleTrail.stop();
      this.particleTrail.destroy();
    }
    if (this.rockDust) {
      this.rockDust.stop();
      this.rockDust.destroy();
    }
    if (this.gravityRings) {
      this.gravityRings.forEach(ring => ring.destroy());
    }
    
    if (this.sprite && this.sprite.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      
      // Дополнительные эффекты разрушения в зависимости от мира
      if (this.worldType === 1) {
        for (let i = 0; i < 12; i++) {
          const debris = this.scene.add.text(
            this.sprite.x + Phaser.Math.Between(-25, 25),
            this.sprite.y + Phaser.Math.Between(-25, 25),
            ['0','1'][Math.floor(Math.random() * 2)],
            { fontSize: `${Phaser.Math.Between(8, 16)}px`, fontFamily: 'monospace', color: '#ff44ff' }
          );
          debris.setBlendMode(Phaser.BlendModes.ADD);
          this.scene.tweens.add({
            targets: debris,
            alpha: 0,
            y: debris.y - 60,
            x: debris.x + Phaser.Math.Between(-60, 60),
            duration: 600,
            onComplete: () => debris.destroy()
          });
        }
      }
      
      if (this.worldType === 2) {
        for (let i = 0; i < 8; i++) {
          const shadow = this.scene.add.circle(
            this.sprite.x + Phaser.Math.Between(-20, 20),
            this.sprite.y + Phaser.Math.Between(-20, 20),
            Phaser.Math.Between(3, 6),
            0x442200,
            0.6
          );
          this.scene.tweens.add({
            targets: shadow,
            alpha: 0,
            scale: 0,
            duration: 400,
            onComplete: () => shadow.destroy()
          });
        }
      }
      
      if (this.worldType === 4) {
        const collapse = this.scene.add.circle(this.sprite.x, this.sprite.y, 18, 0xaa88ff, 0.7);
        this.scene.tweens.add({
          targets: collapse,
          scale: 0,
          alpha: 0,
          duration: 350,
          onComplete: () => collapse.destroy()
        });
        
        for (let i = 0; i < 6; i++) {
          const particle = this.scene.add.circle(
            this.sprite.x + Phaser.Math.Between(-15, 15),
            this.sprite.y + Phaser.Math.Between(-15, 15),
            Phaser.Math.Between(2, 4),
            0xaa88ff,
            0.8
          );
          particle.setBlendMode(Phaser.BlendModes.ADD);
          this.scene.tweens.add({
            targets: particle,
            x: this.scene.scale.width / 2,
            y: this.scene.scale.height / 2,
            alpha: 0,
            duration: 500,
            onComplete: () => particle.destroy()
          });
        }
      }
      
      try {
        if (audioManager && audioManager.playSound) {
          audioManager.playSound(this.scene, 'wagon_destroy', 0.55);
        }
      } catch (e) {}
      
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
  
  isConnected() {
    return this.isConnected;
  }
}