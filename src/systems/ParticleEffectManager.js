export class ParticleEffectManager {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 300; // Увеличил лимит
    this.activeEmitters = [];
    this.particleCount = 0;
    this.particlePools = {}; // Пулы для переиспользования частиц
    this.isLowPerformance = false;
    
    // Проверка производительности
    this.checkPerformance();
    
    // Кэш цветов для быстрого доступа
    this.colorCache = {
      gold: 0xffaa00,
      red: 0xff6666,
      blue: 0x6688ff,
      green: 0x66ff66,
      purple: 0xff66ff,
      speed: [0x00ffff, 0x88ccff],
      magnet: [0xff00ff, 0xff88ff],
      slow: [0xff8800, 0xffaa44],
      shield: [0x00ffff, 0x88ccff],
      double: [0xffff00, 0xffaa00],
      invincible: [0xffffff, 0x00ffff]
    };
  }

  checkPerformance() {
    // Определяем, слабое ли устройство
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const lowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
    this.isLowPerformance = isMobile || lowMemory;
    
    if (this.isLowPerformance) {
      this.maxParticles = 100; // Уменьшаем для слабых устройств
    }
  }

  cleanup() {
    // Фильтруем только активные эмиттеры
    this.activeEmitters = this.activeEmitters.filter(e => e && e.active);
    
    // Если слишком много эмиттеров, удаляем самые старые
    if (this.activeEmitters.length > this.maxParticles / 10) {
      const removeCount = Math.floor(this.activeEmitters.length - this.maxParticles / 10);
      for (let i = 0; i < removeCount; i++) {
        const toRemove = this.activeEmitters[i];
        if (toRemove && toRemove.destroy) {
          toRemove.destroy();
        }
      }
      this.activeEmitters.splice(0, removeCount);
    }
  }

  /**
   * Создает эффект сбора монеты
   */
  createCoinCollectEffect(x, y, coinType) {
    if (this.isLowPerformance) return; // Пропускаем на слабых устройствах
    
    this.cleanup();
    const color = this.colorCache[coinType] || 0xffffff;
    
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 400,
        quantity: this.isLowPerformance ? 6 : 12,
        blendMode: Phaser.BlendModes.ADD,
        tint: color
      });
      
      emitter.explode(this.isLowPerformance ? 6 : 12);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(500, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект появления вагона
   */
  createWagonSpawnEffect(wagon) {
    if (this.isLowPerformance) return;
    
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(wagon.x, wagon.y, 'spark', {
        speed: { min: 40, max: 100 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        quantity: this.isLowPerformance ? 5 : 10,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x00ffff, 0x88ccff]
      });
      
      emitter.explode(this.isLowPerformance ? 5 : 10);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(400, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект уничтожения вагона
   */
  createWagonDestroyEffect(wagon) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(wagon.x, wagon.y, 'flare', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        quantity: this.isLowPerformance ? 10 : 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0xff4444, 0xffaa00]
      });
      
      emitter.explode(this.isLowPerformance ? 10 : 20);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(600, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект щита (длительный)
   */
  createShieldEffect(target) {
    this.cleanup();
    try {
      // Основной эмиттер щита
      const emitter = this.scene.add.particles(target.x, target.y, 'flare', {
        speed: 60,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 600,
        quantity: 3,
        frequency: 40,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0x00ffff,
        follow: target,
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 45),
          quantity: 6
        }
      });
      
      // Дополнительные вращающиеся частицы
      const rotator = this.scene.add.particles(target.x, target.y, 'spark', {
        speed: 30,
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 800,
        quantity: 2,
        frequency: 50,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0x00ffff,
        follow: target,
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Circle(0, 0, 50)
        },
        rotate: { min: -90, max: 90 }
      });
      
      this.activeEmitters.push(emitter, rotator);
      
      // Автоматическое удаление через 6 секунд
      this.scene.time.delayedCall(6000, () => {
        if (emitter && emitter.stop) emitter.stop();
        if (rotator && rotator.stop) rotator.stop();
        
        this.scene.time.delayedCall(500, () => {
          if (emitter && emitter.destroy) emitter.destroy();
          if (rotator && rotator.destroy) rotator.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter && e !== rotator);
        });
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект бонуса
   */
  createBonusEffect(type, x, y) {
    this.cleanup();
    const colors = this.colorCache[type] || [0xffffff];
    
    try {
      const quantity = this.isLowPerformance ? 15 : 30;
      
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: -150, max: 150 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 500,
        quantity: quantity,
        blendMode: Phaser.BlendModes.ADD,
        tint: colors
      });
      
      emitter.explode(quantity);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(600, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
      
      // Добавляем эффект "волны" для мощных бонусов
      if (type === 'invincible' || type === 'double') {
        this.createShockwave(x, y, colors[0] || 0xffffff);
      }
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект ударной волны
   */
  createShockwave(x, y, color) {
    const shockwave = this.scene.add.graphics();
    shockwave.setDepth(25);
    
    let radius = 10;
    let alpha = 0.8;
    
    const tween = this.scene.tweens.add({
      targets: { r: radius, a: alpha },
      r: 150,
      a: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        shockwave.clear();
        shockwave.lineStyle(4, color, tween.getValue('a'));
        shockwave.strokeCircle(x, y, tween.getValue('r'));
      },
      onComplete: () => {
        shockwave.destroy();
      }
    });
  }

  /**
   * Создает эффект смерти врага
   */
  createEnemyDeathEffect(x, y) {
    this.cleanup();
    try {
      const quantity = this.isLowPerformance ? 8 : 15;
      
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 80, max: 160 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: quantity,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xffaa00
      });
      
      emitter.explode(quantity);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(500, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект атаки
   */
  createAttackEffect(x, y) {
    this.cleanup();
    try {
      const quantity = this.isLowPerformance ? 10 : 20;
      
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 150, max: 250 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 300,
        quantity: quantity,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xff0000
      });
      
      emitter.explode(quantity);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(400, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект взрыва
   */
  createExplosion(x, y, color = 0xff4444, size = 'medium') {
    this.cleanup();
    
    const sizes = {
      small: { quantity: 10, speed: 150, lifespan: 300 },
      medium: { quantity: 25, speed: 200, lifespan: 500 },
      large: { quantity: 40, speed: 300, lifespan: 700 }
    };
    
    const config = sizes[size] || sizes.medium;
    
    try {
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 100, max: config.speed },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: config.lifespan,
        quantity: config.quantity,
        blendMode: Phaser.BlendModes.ADD,
        tint: color
      });
      
      emitter.explode(config.quantity);
      this.activeEmitters.push(emitter);
      
      // Добавляем ударную волну для больших взрывов
      if (size === 'large') {
        this.createShockwave(x, y, color);
      }
      
      this.scene.time.delayedCall(config.lifespan + 100, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект повышения уровня
   */
  createLevelUpEffect(x, y) {
    this.cleanup();
    try {
      const quantity = this.isLowPerformance ? 15 : 30;
      
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: -200, max: 200 },
        scale: { start: 1.5, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 600,
        quantity: quantity,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00]
      });
      
      emitter.explode(quantity);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(700, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает след (trail) - возвращает эмиттер для использования
   */
  createTrail(x, y) {
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: 40,
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 200,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x00ffff, 0xff00ff, 0xffff00]
      });
      
      return emitter;
    } catch (e) {
      console.warn('Trail effect error:', e);
      return null;
    }
  }

  /**
   * Создает эффект прохождения ворот
   */
  createGatePassEffect(x, y) {
    if (this.isLowPerformance) return;
    
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: 50, max: 150 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        quantity: 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0x00ffff
      });
      
      emitter.explode(20);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(400, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект исцеления
   */
  createHealEffect(x, y) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: 30, max: 80 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        quantity: 15,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0x00ff00
      });
      
      emitter.explode(15);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(500, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект телепортации
   */
  createTeleportEffect(x, y, color = 0x00ffff) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: 100, max: 200 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 400,
        quantity: 30,
        blendMode: Phaser.BlendModes.ADD,
        tint: color
      });
      
      emitter.explode(30);
      this.activeEmitters.push(emitter);
      
      this.scene.time.delayedCall(500, () => {
        if (emitter && emitter.destroy) {
          emitter.destroy();
          this.activeEmitters = this.activeEmitters.filter(e => e !== emitter);
        }
      });
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  /**
   * Создает эффект снега/звезд
   */
  createWeatherEffect(type = 'stars', x, y, width, height) {
    const configs = {
      stars: { speed: 50, scale: 0.3, tint: 0xffffff, quantity: 1 },
      snow: { speed: 30, scale: 0.2, tint: 0xaaccff, quantity: 2 },
      rain: { speed: 200, scale: 0.1, tint: 0x6688ff, quantity: 3 }
    };
    
    const cfg = configs[type] || configs.stars;
    
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: cfg.speed,
        scale: cfg.scale,
        alpha: { start: 0.6, end: 0 },
        lifespan: 2000,
        quantity: cfg.quantity,
        frequency: 100,
        blendMode: Phaser.BlendModes.ADD,
        tint: cfg.tint,
        emitZone: {
          source: new Phaser.Geom.Rectangle(0, 0, width, height),
          type: 'random',
          quantity: 1
        }
      });
      
      return emitter;
    } catch (e) {
      console.warn('Weather effect error:', e);
      return null;
    }
  }

  /**
   * Очищает все активные эмиттеры
   */
  clearAll() {
    this.activeEmitters.forEach(e => {
      if (e && e.stop) e.stop();
      if (e && e.destroy) e.destroy();
    });
    this.activeEmitters = [];
  }
}