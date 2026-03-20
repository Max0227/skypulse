import { LEVEL_CONFIG } from '../config';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.currentLevel = 0;
    this.currentWorld = 0;
    this.levelConfig = LEVEL_CONFIG;
    this.difficultyMultiplier = 1;
    this.worldThemeMultiplier = 1;
    this.atmosphereParticles = [];
    this.worldTweens = [];
    
    // Активные эффекты
    this.activeEffects = {
      lights: [],
      shadows: [],
      blackHoleRings: [],
      particles: [],
      decals: [],
      ambientSounds: [],
      postFX: []
    };

    // Статистика мира
    this.worldStats = {
      enemiesKilled: 0,
      gatesPassed: 0,
      timeSpent: 0,
      bestCombo: 0
    };

    // Цветовые схемы для миров
    this.worldColors = {
      0: { primary: 0x00ffff, secondary: 0xff00ff, accent: 0xffff00, bg: 0x0a0a1a }, // Космос
      1: { primary: 0xff00ff, secondary: 0x00ffff, accent: 0xffaa00, bg: 0x1a0a2a }, // Киберпанк
      2: { primary: 0xff6600, secondary: 0xaa00ff, accent: 0xffaa00, bg: 0x2a1a0a }, // Подземелье
      3: { primary: 0xffaa00, secondary: 0x00ffaa, accent: 0xff5500, bg: 0x0a2a2a }, // Астероиды
      4: { primary: 0xaa00aa, secondary: 0x00aaff, accent: 0xff00aa, bg: 0x000000 }  // Чёрная дыра
    };

    // Специфичные для миров объекты
    this.cityBuildings = [];
    this.dungeonShadows = [];
    this.asteroidDebris = [];
    this.blackHoleRings = [];
    this.blackHoleParticles = [];
    this.spaceStars = [];
  }

  // =========================================================================
  // ОСНОВНЫЕ МЕТОДЫ
  // =========================================================================

  setWorld(world) {
    this.clearWorldEffects();
    this.stopWorldAnimations();
    
    this.currentWorld = world;
    this.worldThemeMultiplier = 1 + (world * 0.2);
    
    this.applyWorldTheme();
    this.createAtmosphere();
    this.startWorldAnimations();
    
    this.scene.events.emit('worldChanged', { 
      world: this.currentWorld, 
      name: this.getWorldName() 
    });
    
    console.log(`🌍 Мир изменён: ${this.getWorldName()}`);
  }

  setLevel(level) {
    const oldLevel = this.currentLevel;
    this.currentLevel = Math.min(level, 9);
    
    if (oldLevel !== this.currentLevel) {
      this.applyLevelDifficulty();
      this.applyLevelEffects();
      
      this.scene.events.emit('levelChanged', { 
        level: this.currentLevel, 
        name: this.getLevelName(),
        isBoss: this.isBossLevel()
      });
      
      console.log(`📊 Уровень изменён: ${this.currentLevel + 1}`);
    }
  }

  updateBackground(delta) {
    const speed = this.scene.currentSpeed || 240;
    const dt = delta / 1000;
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    // МИР 1: Киберпанк - движущиеся здания и неоновые линии
    if (this.currentWorld === 1) {
      this.cityBuildings.forEach(b => {
        b.x -= speed * 0.25 * dt;
        if (b.x + b.displayWidth < 0) {
          b.x = w + Phaser.Math.Between(50, 200);
          b.y = Phaser.Math.Between(80, h - 80);
        }
      });
    }
    
    // МИР 2: Подземелье - дрейфующие тени
    else if (this.currentWorld === 2) {
      this.dungeonShadows.forEach(sh => {
        sh.x -= speed * 0.12 * dt;
        if (sh.x + sh.displayWidth < 0) {
          sh.x = w + Phaser.Math.Between(100, 400);
          sh.y = Phaser.Math.Between(0, h);
        }
      });
    }
    
    // МИР 3: Астероиды - летящие обломки
    else if (this.currentWorld === 3) {
      this.asteroidDebris.forEach(ast => {
        ast.x -= speed * 0.3 * dt;
        ast.angle += 3;
        if (ast.x + ast.displayWidth < 0) {
          ast.x = w + Phaser.Math.Between(50, 200);
          ast.y = Phaser.Math.Between(40, h - 40);
        }
      });
    }
    
    // МИР 4: Чёрная дыра - кольца вращаются, частицы втягиваются
    else if (this.currentWorld === 4) {
      this.blackHoleRings.forEach((ring, idx) => {
        ring.angle += 0.5 + idx * 0.1;
      });
    }
    
    // МИР 0: Космос - мерцающие звёзды
    else {
      this.spaceStars.forEach(star => {
        const time = Date.now() * 0.001;
        star.alpha = 0.3 + Math.sin(time * star.flickerSpeed) * 0.4;
      });
    }
  }

  // =========================================================================
  // ПРИМЕНЕНИЕ ТЕМ МИРОВ
  // =========================================================================

  applyWorldTheme() {
    const config = this.levelConfig[this.currentWorld];
    if (!config) return;
    
    const colors = this.worldColors[this.currentWorld] || this.worldColors[0];
    
    this.scene.cameras.main.setBackgroundColor(config.bgColor || colors.bg);
    this.setupWorldLighting();
    this.scene.gateColors = config.gateColors || [
      'gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'
    ];
    this.scene.currentWorldConfig = config;
    this.applySpecialEffects(config.specialEvent);
    this.setWorldGravity();
    this.setWorldMusic();
    this.addWorldSpecificDecorations();
  }

  setupWorldLighting() {
    if (this.currentWorld === 1) {
      this.scene.lights.enable();
      this.scene.lights.setAmbientColor(0x1a0a2a);
    } else {
      this.scene.lights.disable();
    }
  }

  setWorldGravity() {
    const gravities = {
      0: 1300,  // Космос - нормальная
      1: 1100,  // Киберпанк - легче (парящий)
      2: 1600,  // Подземелье - тяжелее
      3: 1450,  // Астероиды - чуть тяжелее
      4: 700    // Чёрная дыра - очень легкая
    };
    this.scene.physics.world.gravity.y = gravities[this.currentWorld] || 1300;
  }

  setWorldMusic() {
    // Заглушка для музыки - можно добавить позже
  }

  addWorldSpecificDecorations() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // МИР 1: Киберпанк - неоновые вывески и голограммы
    if (this.currentWorld === 1) {
      const neonSigns = ['🔴', '🟢', '🔵', '🟡', '🟣'];
      for (let i = 0; i < 12; i++) {
        const sign = this.scene.add.text(
          Phaser.Math.Between(0, w),
          Phaser.Math.Between(20, h - 20),
          neonSigns[Math.floor(Math.random() * neonSigns.length)],
          { fontSize: `${Phaser.Math.Between(16, 32)}px`, fontFamily: 'monospace' }
        );
        sign.setDepth(-18);
        sign.setAlpha(0.3);
        sign.setBlendMode(Phaser.BlendModes.ADD);
        this.activeEffects.decals.push(sign);
        
        this.scene.tweens.add({
          targets: sign,
          alpha: { from: 0.2, to: 0.6 },
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1
        });
      }
    }
    
    // МИР 2: Подземелье - сталактиты и сталагмиты
    else if (this.currentWorld === 2) {
      for (let i = 0; i < 8; i++) {
        const stalactite = this.scene.add.triangle(
          Phaser.Math.Between(0, w),
          0,
          0, 0,
          15, 40,
          30, 0,
          0x664422,
          0.4
        );
        stalactite.setOrigin(0.5, 0);
        stalactite.setDepth(-22);
        this.activeEffects.decals.push(stalactite);
      }
      
      for (let i = 0; i < 8; i++) {
        const stalagmite = this.scene.add.triangle(
          Phaser.Math.Between(0, w),
          h,
          0, 0,
          15, -40,
          30, 0,
          0x664422,
          0.4
        );
        stalagmite.setOrigin(0.5, 1);
        stalagmite.setDepth(-22);
        this.activeEffects.decals.push(stalagmite);
      }
    }
    
    // МИР 3: Астероиды - туман и пыль
    else if (this.currentWorld === 3) {
      const dustParticles = this.scene.add.particles(0, 0, 'flare', {
        x: { min: 0, max: w },
        y: { min: 0, max: h },
        speed: { min: 10, max: 30 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.2, end: 0 },
        lifespan: 3000,
        quantity: 1,
        frequency: 200,
        blendMode: Phaser.BlendModes.ADD,
        tint: 0xaa8866
      });
      this.activeEffects.particles.push(dustParticles);
    }
    
    // МИР 4: Чёрная дыра - гравитационные линзы
    else if (this.currentWorld === 4) {
      const centerX = w / 2;
      const centerY = h / 2;
      
      for (let i = 0; i < 3; i++) {
        const lens = this.scene.add.graphics();
        lens.lineStyle(2, 0x8800ff, 0.2);
        lens.strokeCircle(centerX, centerY, 60 + i * 30);
        lens.setDepth(-28);
        this.activeEffects.decals.push(lens);
        
        this.scene.tweens.add({
          targets: lens,
          alpha: { from: 0.1, to: 0.4 },
          duration: 2000,
          yoyo: true,
          repeat: -1
        });
      }
    }
  }

  // =========================================================================
  // СПЕЦИАЛЬНЫЕ ЭФФЕКТЫ МИРОВ
  // =========================================================================

  applySpecialEffects(eventType) {
    switch(eventType) {
      case 'neon':
        this.applyNeonEffect();
        break;
      case 'dungeon':
        this.applyDungeonEffect();
        break;
      case 'asteroids':
        this.applyAsteroidEffect();
        break;
      case 'blackhole':
        this.applyBlackHoleEffect();
        break;
      default:
        this.applyDefaultEffect();
        break;
    }
  }

  applyNeonEffect() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Неоновые огни (движущиеся)
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, w - 50);
      const y = Phaser.Math.Between(50, h - 50);
      const light = this.scene.lights.addLight(x, y, 180)
        .setColor(Phaser.Utils.Array.GetRandom([0xff00ff, 0x00ffff, 0xffff00]))
        .setIntensity(1.0);
      this.activeEffects.lights.push(light);
      
      const tween = this.scene.tweens.add({
        targets: light,
        intensity: { from: 0.8, to: 1.8 },
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-60, 60),
        duration: 2000 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
    
    // Здания киберпанка
    for (let i = 0; i < 20; i++) {
      const building = this.scene.add.image(
        Phaser.Math.Between(w, w + 600),
        Phaser.Math.Between(80, h - 80),
        'cyber_building'
      );
      building.setScale(Phaser.Math.FloatBetween(0.8, 1.8));
      building.setDepth(-20);
      building.setBlendMode(Phaser.BlendModes.ADD);
      building.setAlpha(0.6);
      this.cityBuildings.push(building);
      this.activeEffects.decals.push(building);
    }
    
    // Неоновая сетка
    const gridGraphics = this.scene.add.graphics();
    gridGraphics.lineStyle(1, 0x00ffff, 0.2);
    for (let i = 0; i < w; i += 50) {
      gridGraphics.moveTo(i, 0);
      gridGraphics.lineTo(i, h);
      gridGraphics.moveTo(0, i % h);
      gridGraphics.lineTo(w, i % h);
    }
    gridGraphics.strokePath();
    this.activeEffects.decals.push(gridGraphics);
  }

  applyDungeonEffect() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Туман (несколько слоёв)
    for (let layer = 0; layer < 3; layer++) {
      const fog = this.scene.add.graphics();
      fog.fillStyle(0x000000, 0.2 + layer * 0.1);
      fog.fillRect(0, 0, w, h);
      fog.setBlendMode(Phaser.BlendModes.MULTIPLY);
      fog.setDepth(-15 - layer);
      this.activeEffects.decals.push(fog);
    }
    
    // Плавающие тени (призраки)
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(40, 120);
      const shadow = this.scene.add.circle(x, y, size, 0x221100, 0.15);
      shadow.setDepth(-18);
      this.dungeonShadows.push(shadow);
      this.activeEffects.shadows.push(shadow);
      
      const tween = this.scene.tweens.add({
        targets: shadow,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-60, 60),
        alpha: { from: 0.1, to: 0.25 },
        duration: 8000 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
    
    // Стены (тёмные)
    const wallLeft = this.scene.add.rectangle(0, 0, 35, h, 0x332211, 0.7);
    wallLeft.setOrigin(0, 0);
    wallLeft.setDepth(-20);
    const wallRight = this.scene.add.rectangle(w - 35, 0, 35, h, 0x332211, 0.7);
    wallRight.setOrigin(0, 0);
    wallRight.setDepth(-20);
    this.activeEffects.decals.push(wallLeft, wallRight);
    
    // Грибы и растения
    for (let i = 0; i < 15; i++) {
      const mushroom = this.scene.add.circle(
        Phaser.Math.Between(0, w),
        h - Phaser.Math.Between(10, 60),
        Phaser.Math.Between(8, 18),
        0x663322,
        0.5
      );
      mushroom.setDepth(-19);
      this.activeEffects.decals.push(mushroom);
    }
  }

  applyAsteroidEffect() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    this.scene.baseAsteroidChance = 0.8;
    
    // Множество мелких астероидов
    for (let i = 0; i < 40; i++) {
      const ast = this.scene.add.image(
        Phaser.Math.Between(w, w + 1000),
        Phaser.Math.Between(40, h - 40),
        'bg_asteroid_small'
      );
      ast.setScale(Phaser.Math.FloatBetween(0.3, 0.9));
      ast.setAlpha(0.4);
      ast.setDepth(-25);
      ast.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroidDebris.push(ast);
      this.activeEffects.decals.push(ast);
    }
    
    // Крупные астероиды на фоне
    for (let i = 0; i < 8; i++) {
      const bigAst = this.scene.add.image(
        Phaser.Math.Between(w, w + 1500),
        Phaser.Math.Between(60, h - 60),
        Phaser.Math.Between(0, 1) ? 'bg_asteroid_1' : 'bg_asteroid_2'
      );
      bigAst.setScale(Phaser.Math.FloatBetween(1.2, 2.5));
      bigAst.setAlpha(0.2);
      bigAst.setDepth(-28);
      bigAst.setBlendMode(Phaser.BlendModes.ADD);
      this.asteroidDebris.push(bigAst);
      this.activeEffects.decals.push(bigAst);
      
      this.scene.tweens.add({
        targets: bigAst,
        angle: 360,
        duration: 20000 + i * 2000,
        repeat: -1,
        ease: 'Linear'
      });
    }
    
    // Пылевое облако
    const dust = this.scene.add.particles(0, 0, 'flare', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      speed: { min: 5, max: 20 },
      scale: { start: 0.05, end: 0 },
      alpha: { start: 0.15, end: 0 },
      lifespan: 4000,
      quantity: 2,
      frequency: 100,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0xaa8866
    });
    this.activeEffects.particles.push(dust);
  }

  applyBlackHoleEffect() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    this.scene.cameras.main.setBackgroundColor(0x000000);
    
    // Вращающиеся кольца с разными цветами
    const colors = [0x4400aa, 0x6600cc, 0x8800ff, 0xaa44ff, 0xcc88ff];
    for (let i = 0; i < 12; i++) {
      const radius = 40 + i * 25;
      const ring = this.scene.add.ellipse(centerX, centerY, radius * 2, radius * 0.6, 0x000000, 0);
      ring.setStrokeStyle(2 + (i % 3), colors[i % colors.length], 0.5 - i * 0.03);
      ring.setDepth(-30 - i);
      ring.setScrollFactor(0);
      this.blackHoleRings.push(ring);
      this.activeEffects.blackHoleRings.push(ring);
      
      const speed = 6000 + i * 400;
      const tween = this.scene.tweens.add({
        targets: ring,
        angle: 360,
        duration: speed,
        repeat: -1,
        ease: 'Linear'
      });
      this.worldTweens.push(tween);
    }
    
    // Частицы, втягивающиеся в центр
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(150, 450);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const size = Phaser.Math.Between(1, 3);
      const particle = this.scene.add.circle(x, y, size, 0xaa88ff, 0.7);
      particle.setDepth(-25);
      this.blackHoleParticles.push(particle);
      this.activeEffects.particles.push(particle);
      
      const tween = this.scene.tweens.add({
        targets: particle,
        x: centerX,
        y: centerY,
        alpha: 0,
        scale: 0.1,
        duration: 2500 + Math.random() * 2000,
        repeat: -1,
        ease: 'Quad.easeIn',
        onComplete: () => {
          particle.x = x;
          particle.y = y;
          particle.alpha = 0.7;
          particle.scale = 1;
        }
      });
      this.worldTweens.push(tween);
    }
    
    // Гравитационная линза (искажение)
    const lensEffect = this.scene.add.graphics();
    lensEffect.lineStyle(1, 0xaa88ff, 0.1);
    for (let i = 0; i < 30; i++) {
      const radius = 30 + i * 15;
      lensEffect.strokeCircle(centerX, centerY, radius);
    }
    lensEffect.setDepth(-28);
    this.activeEffects.decals.push(lensEffect);
  }

  applyDefaultEffect() {
    this.createSpaceAtmosphere();
  }

  createSpaceAtmosphere() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    
    // Мерцающие звёзды (много)
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(1, 3);
      const star = this.scene.add.circle(x, y, size, 0xffffff, 0.5);
      star.setDepth(-35);
      this.spaceStars.push(star);
      this.activeEffects.particles.push(star);
      
      const flickerSpeed = Phaser.Math.FloatBetween(0.5, 2);
      const tween = this.scene.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.9 },
        scale: { from: 1, to: 1.5 + Math.random() * 0.5 },
        duration: 1500 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    }
    
    // Туманность (цветные облака)
    const nebulaColors = [0x442266, 0x224466, 0x664422];
    for (let i = 0; i < 5; i++) {
      const nebula = this.scene.add.ellipse(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(150, 300),
        Phaser.Math.Between(100, 200),
        nebulaColors[i % nebulaColors.length],
        0.08
      );
      nebula.setBlendMode(Phaser.BlendModes.ADD);
      nebula.setDepth(-40);
      this.activeEffects.decals.push(nebula);
      
      this.scene.tweens.add({
        targets: nebula,
        alpha: { from: 0.05, to: 0.15 },
        duration: 10000 + i * 2000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  createAtmosphere() {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      let particle;
      const x = Phaser.Math.Between(0, this.scene.scale.width);
      const y = Phaser.Math.Between(0, this.scene.scale.height);
      
      switch(this.currentWorld) {
        case 1: // Киберпанк - цифровой дождь
          particle = this.scene.add.text(x, y, 
            ['0','1'][Math.floor(Math.random() * 2)], 
            { fontSize: `${Phaser.Math.Between(8, 14)}px`, fontFamily: 'monospace', color: '#ff00ff' }
          );
          particle.setAlpha(0.2);
          break;
        case 2: // Подземелье - тлеющие искры
          particle = this.scene.add.circle(x, y, 1, 0xff6600, 0.2);
          break;
        case 3: // Астероиды - пыль
          particle = this.scene.add.circle(x, y, 1, 0xccaa88, 0.15);
          break;
        case 4: // Чёрная дыра - гравитационные волны
          particle = this.scene.add.circle(x, y, 2, 0xaa88ff, 0.1);
          break;
        default: // Космос - звёздная пыль
          particle = this.scene.add.circle(x, y, 1, 0xffffff, 0.2);
      }
      
      if (particle) {
        particle.setDepth(-30);
        this.atmosphereParticles.push(particle);
        
        const tween = this.scene.tweens.add({
          targets: particle,
          x: x + Phaser.Math.Between(-150, 150),
          y: y + Phaser.Math.Between(-80, 80),
          alpha: 0,
          duration: 8000 + i * 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.worldTweens.push(tween);
      }
    }
  }

  // =========================================================================
  // УРОВНИ СЛОЖНОСТИ
  // =========================================================================

  applyLevelDifficulty() {
    const worldMultiplier = this.worldThemeMultiplier;
    const levelMultiplier = 1 + (this.currentLevel * 0.12);
    this.difficultyMultiplier = worldMultiplier * levelMultiplier;

    const baseSpeed = 240 * this.difficultyMultiplier;
    const baseDelay = 1500 / this.difficultyMultiplier;
    const baseCoinChance = 0.8 * Math.min(1.2, this.difficultyMultiplier);
    const baseAsteroidChance = 0.3 * this.difficultyMultiplier;
    const basePowerUpChance = 0.1 * this.difficultyMultiplier;

    this.scene.baseSpeed = Math.min(900, baseSpeed);
    this.scene.spawnDelay = Math.max(400, Math.min(1500, baseDelay));
    this.scene.coinChance = Math.min(0.95, baseCoinChance);
    this.scene.asteroidChance = Math.min(0.9, baseAsteroidChance);
    this.scene.powerUpChance = Math.min(0.45, basePowerUpChance);

    if (!this.scene.bonusActive) {
      this.scene.currentSpeed = this.scene.baseSpeed;
    }
    
    if (this.scene.updateExistingObjectsSpeed) {
      this.scene.updateExistingObjectsSpeed();
    }

    console.log(`📈 Сложность мира ${this.getWorldName()}, уровень ${this.currentLevel + 1}: x${this.difficultyMultiplier.toFixed(2)}`);
  }

  applyLevelEffects() {
    if (this.isBossLevel()) {
      this.applyBossEffects();
    }
    if (this.currentLevel % 3 === 0 && this.currentLevel > 0) {
      this.applySpecialLevelEffects();
    }
  }

  applyBossEffects() {
    this.scene.cameras.main.flash(500, 255, 0, 0, true);
    this.scene.time.timeScale = 0.8;
    this.showBossWarning();
    this.scene.time.delayedCall(2000, () => {
      this.scene.time.timeScale = 1;
    });
  }

  applySpecialLevelEffects() {
    this.scene.powerUpChance = Math.min(0.6, this.scene.powerUpChance * 1.5);
    const glow = this.scene.add.graphics();
    glow.lineStyle(5, 0xffff00, 0.3);
    glow.strokeRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    glow.setDepth(90);
    glow.setScrollFactor(0);
    this.scene.time.delayedCall(2000, () => glow.destroy());
  }

  showBossWarning() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const colors = ['#ff0000', '#ff4400', '#ff8800'];
    
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const warning = this.scene.add.text(w / 2, h / 3, '⚠ БОСС УРОВЕНЬ ⚠', {
          fontSize: '36px',
          fontFamily: '"Audiowide", sans-serif',
          color: colors[i],
          stroke: '#000000',
          strokeThickness: 6,
          shadow: { blur: 15, color: colors[i], fill: true }
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
        
        warning.setScale(0.5);
        this.scene.tweens.add({
          targets: warning,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0,
          duration: 600,
          ease: 'Power2.easeOut',
          onComplete: () => warning.destroy()
        });
      });
    }
  }

  // =========================================================================
  // АНИМАЦИИ
  // =========================================================================

  startWorldAnimations() {
    this.activeEffects.lights.forEach((light, index) => {
      const tween = this.scene.tweens.add({
        targets: light,
        intensity: { from: 0.8, to: 1.5 },
        duration: 1500 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.worldTweens.push(tween);
    });
  }

  stopWorldAnimations() {
    this.worldTweens.forEach(tween => {
      if (tween) tween.stop();
    });
    this.worldTweens = [];
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  clearWorldEffects() {
    this.activeEffects.lights.forEach(light => light?.setIntensity?.(0));
    this.activeEffects.lights = [];
    
    this.activeEffects.shadows.forEach(shadow => shadow?.destroy());
    this.activeEffects.shadows = [];
    
    this.activeEffects.blackHoleRings.forEach(ring => ring?.destroy());
    this.activeEffects.blackHoleRings = [];
    
    this.activeEffects.particles.forEach(particle => {
      if (particle?.stop) particle.stop();
      if (particle?.destroy) particle.destroy();
    });
    this.activeEffects.particles = [];
    
    this.activeEffects.decals.forEach(decals => decals?.destroy());
    this.activeEffects.decals = [];
    
    this.atmosphereParticles.forEach(particle => particle?.destroy());
    this.atmosphereParticles = [];
    
    this.cityBuildings.forEach(b => b?.destroy());
    this.cityBuildings = [];
    
    this.dungeonShadows.forEach(s => s?.destroy());
    this.dungeonShadows = [];
    
    this.asteroidDebris.forEach(a => a?.destroy());
    this.asteroidDebris = [];
    
    this.blackHoleRings.forEach(r => r?.destroy());
    this.blackHoleRings = [];
    
    this.blackHoleParticles.forEach(p => p?.destroy());
    this.blackHoleParticles = [];
    
    this.spaceStars.forEach(s => s?.destroy());
    this.spaceStars = [];
    
    this.scene.baseAsteroidChance = undefined;
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getCurrentTheme() {
    return this.levelConfig[this.currentWorld]?.theme || 'space';
  }

  getLevelName() {
    const worldName = this.levelConfig[this.currentWorld]?.name || 'Неизвестный мир';
    return `${worldName} - Уровень ${this.currentLevel + 1}`;
  }

  getWorldName() {
    return this.levelConfig[this.currentWorld]?.name || 'Неизвестный мир';
  }

  getWorldDescription() {
    return this.levelConfig[this.currentWorld]?.description || '';
  }

  getGoalScore() {
    const baseGoal = this.levelConfig[this.currentWorld]?.goalScore || 500;
    return Math.floor(baseGoal * (this.currentLevel + 1) * this.difficultyMultiplier);
  }

  getEnemyTypes() {
    return this.levelConfig[this.currentWorld]?.enemyTypes || [];
  }

  shouldSpawnEnemy() {
    const types = this.getEnemyTypes();
    if (types.length === 0) return false;
    const spawnChance = 0.1 + (this.currentLevel * 0.05) * this.difficultyMultiplier;
    return Math.random() < spawnChance;
  }

  getRandomEnemyType() {
    const types = this.getEnemyTypes();
    if (types.length === 0) return null;
    return types[Math.floor(Math.random() * types.length)];
  }

  getWorldProgress() {
    return this.currentLevel / 9;
  }

  isBossLevel() {
    return this.currentLevel === 9;
  }

  getDifficultyMultiplier() {
    return this.difficultyMultiplier;
  }

  getBaseSpeed() {
    return 240 * this.difficultyMultiplier;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getCurrentWorld() {
    return this.currentWorld;
  }

  getWorldColors() {
    return this.worldColors[this.currentWorld] || this.worldColors[0];
  }

  getWorldGravity() {
    const gravities = { 0: 1300, 1: 1100, 2: 1600, 3: 1450, 4: 700 };
    return gravities[this.currentWorld] || 1300;
  }

  getWorldSpeedMultiplier() {
    const multipliers = { 0: 1.0, 1: 1.15, 2: 0.85, 3: 1.1, 4: 0.7 };
    return multipliers[this.currentWorld] || 1.0;
  }

  getWorldBonus() {
    const bonuses = {
      0: 'Мерцающие звёзды',
      1: 'Неоновые огни и здания',
      2: 'Тени и сталактиты',
      3: 'Астероидный дождь',
      4: 'Гравитационное притяжение'
    };
    return bonuses[this.currentWorld] || 'Нет';
  }

  updateStats(type, value = 1) {
    if (this.worldStats.hasOwnProperty(type)) {
      this.worldStats[type] += value;
    }
  }

  getWorldStats() {
    return { ...this.worldStats };
  }

  resetStats() {
    this.worldStats = {
      enemiesKilled: 0,
      gatesPassed: 0,
      timeSpent: 0,
      bestCombo: 0
    };
  }

  updateTime(delta) {
    this.worldStats.timeSpent += delta / 1000;
  }

  updateBestCombo(combo) {
    if (combo > this.worldStats.bestCombo) {
      this.worldStats.bestCombo = combo;
    }
  }

  getWorldProgressPercent() {
    return Math.floor((this.currentLevel / 9) * 100);
  }

  getNextLevel() {
    return this.currentLevel < 9 ? this.currentLevel + 1 : null;
  }

  hasNextLevel() {
    return this.currentLevel < 9;
  }

  getNextLevelName() {
    if (!this.hasNextLevel()) return null;
    return `${this.getWorldName()} - Уровень ${this.currentLevel + 2}`;
  }

  getDifficultyLabel() {
    const difficulty = this.difficultyMultiplier;
    if (difficulty < 1.2) return 'ЛЕГКО';
    if (difficulty < 1.5) return 'СРЕДНЕ';
    if (difficulty < 2.0) return 'СЛОЖНО';
    if (difficulty < 3.0) return 'ЭКСТРА';
    return 'БЕЗУМНО';
  }

  getDifficultyColor() {
    const difficulty = this.difficultyMultiplier;
    if (difficulty < 1.2) return '#00ff00';
    if (difficulty < 1.5) return '#ffff00';
    if (difficulty < 2.0) return '#ff8800';
    if (difficulty < 3.0) return '#ff4444';
    return '#ff0000';
  }

  destroy() {
    this.stopWorldAnimations();
    this.clearWorldEffects();
    this.resetStats();
    this.worldTweens = [];
    this.atmosphereParticles = [];
    console.log('LevelManager destroyed');
  }
}