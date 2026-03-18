export class ParticleEffectManager {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 100;
    this.activeEmitters = [];
  }

  cleanup() {
    this.activeEmitters = this.activeEmitters.filter(e => e && e.alive);
    if (this.activeEmitters.length > this.maxParticles) {
      const toRemove = this.activeEmitters[0];
      if (toRemove && toRemove.stop) toRemove.stop();
      this.activeEmitters.shift();
    }
  }

  createCoinCollectEffect(x, y, coinType) {
    this.cleanup();
    const colors = {
      gold: 0xffaa00,
      red: 0xff6666,
      blue: 0x6688ff,
      green: 0x66ff66,
      purple: 0xff66ff
    };
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 400,
        quantity: 12,
        blendMode: Phaser.BlendModes.ADD,
        tint: colors[coinType] || 0xffffff
      });
      emitter.explode(12);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createWagonSpawnEffect(wagon) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(wagon.x, wagon.y, 'spark', {
        speed: { min: 40, max: 100 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 300,
        quantity: 10,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x00ffff, 0x88ccff]
      });
      emitter.explode(10);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createWagonDestroyEffect(wagon) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(wagon.x, wagon.y, 'flare', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        quantity: 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0xff4444, 0xffaa00]
      });
      emitter.explode(20);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createShieldEffect(target) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(target.x, target.y, 'flare', {
        speed: 80,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 600,
        quantity: 2,
        frequency: 50,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0x00ffff,
        follow: target
      });
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createBonusEffect(type, x, y) {
    this.cleanup();
    const colors = {
      speed: [0x00ffff, 0x88ccff],
      magnet: [0xff00ff, 0xff88ff],
      slow: [0xff8800, 0xffaa44],
      shield: [0x00ffff, 0x88ccff]
    };
    try {
      const emitter = this.scene.add.particles(x, y, 'flare', {
        speed: { min: -150, max: 150 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 500,
        quantity: 30,
        blendMode: Phaser.BlendModes.ADD,
        tint: colors[type] || [0xffffff]
      });
      emitter.explode(30);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createEnemyDeathEffect(x, y) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 80, max: 160 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 15,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xffaa00
      });
      emitter.explode(15);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  createAttackEffect(x, y) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 150, max: 250 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 300,
        quantity: 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xff0000
      });
      emitter.explode(20);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  // 👇 НОВЫЙ МЕТОД
  createExplosion(x, y, color = 0xff4444) {
    this.cleanup();
    try {
      const emitter = this.scene.add.particles(x, y, 'spark', {
        speed: { min: 100, max: 250 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        quantity: 25,
        blendMode: Phaser.BlendModes.ADD,
        tint: color
      });
      emitter.explode(25);
      this.activeEmitters.push(emitter);
    } catch (e) {
      console.warn('Particle effect error:', e);
    }
  }

  clearAll() {
    this.activeEmitters.forEach(e => { if (e && e.stop) e.stop(); });
    this.activeEmitters = [];
  }
}