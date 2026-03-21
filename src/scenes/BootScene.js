import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';
import { WORLD_CONFIG } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
    this.loadingProgress = 0;
    this.loadingTexts = [];
    this.particles = [];
  }

  preload() {
    console.log('BootScene: preload started');
    
    // Загружаем звуки
    audioManager.preloadSounds(this);
    
    // Создаём красивую анимацию загрузки
    this.createAdvancedLoadingBar();
    
    // Добавляем фоновые эффекты
    this.createLoadingBackground();
  }

  createAdvancedLoadingBar() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const centerX = w / 2;
    const centerY = h / 2;
    
    const bgCircle = this.add.circle(centerX, centerY, 80, 0x1a1a3a, 0.8)
      .setStrokeStyle(3, 0x00ffff, 0.5);
    
    this.loadingCircle = this.add.circle(centerX, centerY, 70, 0x00ffff, 0);
    this.loadingCircle.setStrokeStyle(4, 0x00ffff, 1);
    
    const innerCircle = this.add.circle(centerX, centerY, 50, 0x00ffff, 0.1)
      .setBlendMode(Phaser.BlendModes.ADD);
    
    this.loadingPercent = this.add.text(centerX, centerY, '0%', {
      fontSize: '28px',
      fontFamily: "'Audiowide', 'Orbitron', sans-serif",
      color: '#00ffff',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    const loadingLabel = this.add.text(centerX, centerY + 80, 'ЗАГРУЗКА АССЕТОВ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#88aaff',
      letterSpacing: 2
    }).setOrigin(0.5);
    
    this.dots = this.add.text(centerX + 100, centerY + 80, '...', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff'
    }).setOrigin(0, 0.5);
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.add.circle(
        centerX + Math.cos(angle) * 95,
        centerY + Math.sin(angle) * 95,
        2,
        0x00ffff,
        0.6
      );
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.particles.push(particle);
    }
    
    this.particleAngle = 0;
    this.time.addEvent({
      delay: 50,
      callback: () => {
        this.particleAngle += 0.05;
        this.particles.forEach((particle, i) => {
          const angle = (i / this.particles.length) * Math.PI * 2 + this.particleAngle;
          particle.x = centerX + Math.cos(angle) * 95;
          particle.y = centerY + Math.sin(angle) * 95;
        });
      },
      loop: true
    });
    
    let dotCount = 0;
    this.time.addEvent({
      delay: 400,
      callback: () => {
        dotCount = (dotCount + 1) % 4;
        this.dots.setText('.'.repeat(dotCount) + ' '.repeat(3 - dotCount));
      },
      loop: true
    });
    
    this.load.on('progress', (value) => {
      this.loadingProgress = value;
      const percent = Math.floor(value * 100);
      this.loadingPercent.setText(`${percent}%`);
      const angle = percent * 3.6;
      this.updateLoadingCircle(angle);
      const scale = 1 + Math.sin(Date.now() * 0.01) * 0.05;
      this.loadingCircle.setScale(scale);
    });
    
    this.load.on('complete', () => {
      this.tweens.add({
        targets: [bgCircle, this.loadingCircle, innerCircle, this.loadingPercent, loadingLabel, this.dots],
        alpha: 0,
        scale: 1.5,
        duration: 500,
        ease: 'Power2.easeIn'
      });
      
      this.tweens.add({
        targets: this.particles,
        alpha: 0,
        scale: 0,
        duration: 400,
        stagger: 50
      });
    });
  }

  updateLoadingCircle(angleDegrees) {
    if (!this.loadingCircle) return;
    
    const w = this.scale.width;
    const h = this.scale.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 70;
    
    if (this.loadingGraphics) {
      this.loadingGraphics.destroy();
    }
    
    this.loadingGraphics = this.add.graphics();
    this.loadingGraphics.lineStyle(4, 0x00ffff, 1);
    
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (angleDegrees * Math.PI / 180);
    
    this.loadingGraphics.beginPath();
    this.loadingGraphics.arc(centerX, centerY, radius, startAngle, endAngle);
    this.loadingGraphics.strokePath();
  }

  createLoadingBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.setDepth(-10);
    
    for (let i = 0; i < 100; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.6)
      );
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        scale: { from: 1, to: 1.5 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
    
    const glowLines = this.add.graphics();
    glowLines.lineStyle(2, 0x00ffff, 0.3);
    glowLines.strokeRect(15, 15, w - 30, h - 30);
    
    this.tweens.add({
      targets: glowLines,
      alpha: { from: 0.2, to: 0.5 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
  }

  create() {
    console.log('BootScene: create started');
    this.createAllTextures();
    this.time.delayedCall(300, () => {
      this.scene.start('menu');
    });
  }

  createAllTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    
    // Основные текстуры
    this.createPlayerTexture(g);
    this.createSkinTextures(g);
    this.createWagonTextures(g);
    this.createWagonVariants(g);
    this.createGateTextures(g);
    this.createCoinTextures(g);
    this.createPlanetTextures(g);
    this.createShipTextures(g);
    this.createEnemyTextures(g);
    this.createBossTextures(g);
    this.createAsteroidTextures(g);
    this.createPowerUpTextures(g);
    this.createPowerUpVariants(g);
    this.createLaserTextures(g);
    this.createParticleTextures(g);
    this.createHeartTexture(g);
    this.createStationTexture(g);
    this.createButtonTextures(g);
    this.createEffectTextures(g);
    this.createWorldTextures(g);
    
    // НОВЫЕ ТЕКСТУРЫ ДЛЯ ПРЕПЯТСТВИЙ МИРОВ
    this.createCyberpunkObstacles(g);
    this.createDungeonObstacles(g);
    this.createAsteroidObstacles(g);
    this.createBlackholeObstacles(g);
    
    g.destroy();
    console.log('BootScene: all textures created');
  }

  createPlayerTexture(g) {
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xff8800);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillRect(56, 16, 8, 20);
    g.fillStyle(0x44aaff);
    g.fillRect(22, 16, 14, 8);
    g.fillRect(40, 16, 14, 8);
    g.fillStyle(0x00ffff);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 2);
    g.fillStyle(0xffff00);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.fillRect(56, 30, 6, 4);
    g.fillStyle(0x333333, 0.5);
    g.fillRect(10, 34, 20, 6);
    g.generateTexture('player', 80, 60);
    g.generateTexture('default', 80, 60);
  }

  createSkinTextures(g) {
    const skinColors = {
      neon: 0x00ffff,
      cyber: 0xff00ff,
      gold: 0xffaa00,
      rainbow: 0xff44ff,
      crystal: 0x88aaff,
      stealth: 0x444444,
      fire: 0xff4400,
      ice: 0x44aaff,
      void: 0x220066
    };
    
    for (let [id, color] of Object.entries(skinColors)) {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(12, 12, 56, 32, 8);
      
      if (id === 'neon') {
        g.fillStyle(0xffffff);
        g.fillCircle(18, 28, 2);
      } else if (id === 'cyber') {
        g.fillStyle(0x00ffff);
        g.fillRect(22, 16, 14, 8);
        g.fillRect(40, 16, 14, 8);
      } else if (id === 'gold') {
        g.fillStyle(0xffdd44);
        g.fillRect(40, 30, 6, 4);
        g.fillRect(48, 30, 6, 4);
      } else if (id === 'fire') {
        g.fillStyle(0xff8800);
        g.fillRect(40, 30, 6, 4);
        g.fillRect(48, 30, 6, 4);
        g.fillRect(56, 30, 6, 4);
      } else if (id === 'ice') {
        g.fillStyle(0x88ccff);
        g.fillCircle(18, 28, 4);
      }
      
      g.generateTexture(id, 80, 60);
    }
  }

  createWagonTextures(g) {
    const wagonColors = [
      0xffaa00, 0x44aa88, 0xaa44aa, 0x88aa44, 0xaa8844,
      0x44aaff, 0xff66aa, 0x66ffaa, 0xaa66ff, 0xffaa66
    ];
    
    for (let i = 0; i < wagonColors.length; i++) {
      g.clear();
      g.fillStyle(wagonColors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0x00ffff);
      g.fillRect(12, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0xffffff);
      g.fillRect(8, 8, 6, 4);
      g.fillRect(20, 8, 6, 4);
      g.fillStyle(0xffaa00);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.fillStyle(0x000000, 0.2);
      g.fillRect(6, 26, 36, 2);
      g.generateTexture(`wagon_${i}`, 48, 34);
    }
  }

  createWagonVariants(g) {
    const neonColors = [0xff44ff, 0xff88ff, 0xaa44ff, 0xdd66ff];
    for (let i = 0; i < neonColors.length; i++) {
      g.clear();
      g.fillStyle(neonColors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0xffffff);
      g.fillRect(8, 8, 6, 4);
      g.fillRect(20, 8, 6, 4);
      g.fillStyle(0xffff00);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.lineStyle(1, 0xffffff, 0.5);
      g.strokeRoundedRect(6, 6, 36, 22, 6);
      g.generateTexture(`wagon_neon_${i}`, 48, 34);
    }
    
    const darkColors = [0x886644, 0xaa6644, 0x664422, 0x442211];
    for (let i = 0; i < darkColors.length; i++) {
      g.clear();
      g.fillStyle(darkColors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0x442200);
      g.fillRect(12, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0xaa8866);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.generateTexture(`wagon_dark_${i}`, 48, 34);
    }
    
    const rockColors = [0xffaa66, 0xcc8866, 0xaa6644, 0x886644];
    for (let i = 0; i < rockColors.length; i++) {
      g.clear();
      g.fillStyle(rockColors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0xaa8866);
      g.fillRect(12, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0xccaa88);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.generateTexture(`wagon_rock_${i}`, 48, 34);
    }
    
    const voidColors = [0xaa88ff, 0x8866cc, 0x6644aa, 0x442288];
    for (let i = 0; i < voidColors.length; i++) {
      g.clear();
      g.fillStyle(voidColors[i]);
      g.fillRoundedRect(6, 6, 36, 22, 6);
      g.fillStyle(0xcc88ff);
      g.fillRect(12, 16, 6, 4);
      g.fillRect(22, 16, 6, 4);
      g.fillStyle(0xff88ff);
      g.fillCircle(12, 24, 3);
      g.fillCircle(28, 24, 3);
      g.generateTexture(`wagon_void_${i}`, 48, 34);
    }
  }

  createGateTextures(g) {
    const createGate = (color, light, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(light);
      g.fillRoundedRect(10, 0, 15, 400, 8);
      g.lineStyle(3, 0x00ffff, 0.8);
      g.strokeRoundedRect(0, 0, 100, 400, 20);
      g.generateTexture(name, 100, 400);
    };
    
    createGate(0x0a0a2a, 0x00ffff, 'gate_blue');
    createGate(0x0a2a0a, 0x00ffaa, 'gate_green');
    createGate(0x2a2a0a, 0xffff00, 'gate_yellow');
    createGate(0x2a0a0a, 0xff00aa, 'gate_red');
    createGate(0x2a0a2a, 0xff00ff, 'gate_purple');
  }

  createCoinTextures(g) {
    const createCoin = (color, lineColor, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillCircle(16, 16, 14);
      g.lineStyle(4, lineColor);
      g.strokeCircle(16, 16, 9);
      g.lineStyle(2, lineColor, 0.5);
      g.strokeCircle(16, 16, 6);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeCircle(16, 16, 15);
      g.generateTexture(name, 32, 32);
    };
    
    createCoin(0xffaa00, 0xffdd44, 'coin_gold');
    createCoin(0xff4444, 0xffaa00, 'coin_red');
    createCoin(0x4444ff, 0xffffff, 'coin_blue');
    createCoin(0x44ff44, 0xffffff, 'coin_green');
    createCoin(0xff44ff, 0xffffff, 'coin_purple');
    
    g.clear();
    g.fillStyle(0xff88ff);
    g.fillCircle(16, 16, 14);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      g.fillStyle(Phaser.Display.Color.HSLToColor(i / 6, 1, 0.6).color);
      g.fillCircle(16 + Math.cos(angle) * 8, 16 + Math.sin(angle) * 8, 3);
    }
    g.generateTexture('coin_rainbow', 32, 32);
    
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xffffff);
    g.fillTriangle(16, 6, 22, 16, 10, 16);
    g.fillTriangle(16, 26, 22, 16, 10, 16);
    g.generateTexture('coin_crystal', 32, 32);
    
    g.clear();
    g.fillStyle(0xaa66ff);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0x442288);
    g.fillCircle(16, 16, 8);
    g.generateTexture('coin_dark', 32, 32);
  }

  createPlanetTextures(g) {
    for (let i = 1; i <= 5; i++) {
      g.clear();
      const hue = (i * 60) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
      g.fillStyle(color);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x000000, 0.3);
      g.fillCircle(20, 20, 6);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(30, 45, 5);
      g.generateTexture(`planet_${i}`, 64, 64);
    }
  }

  createShipTextures(g) {
    g.clear();
    g.fillStyle(0x2244aa);
    g.fillEllipse(40, 30, 70, 20);
    g.fillStyle(0x00aaff);
    g.fillEllipse(40, 20, 40, 12);
    g.fillStyle(0xffaa00);
    g.fillCircle(20, 30, 5);
    g.fillCircle(60, 30, 5);
    g.fillCircle(40, 30, 3);
    g.lineStyle(2, 0x00ffff, 0.5);
    g.strokeEllipse(40, 30, 70, 20);
    g.generateTexture('bg_ship_1', 90, 50);
    
    g.clear();
    g.fillStyle(0xaa2222);
    g.fillRoundedRect(20, 20, 70, 30, 8);
    g.fillStyle(0xff4444);
    g.fillTriangle(90, 25, 90, 45, 110, 35);
    g.fillStyle(0xffaa00);
    g.fillCircle(35, 35, 5);
    g.fillCircle(55, 35, 5);
    g.fillCircle(75, 35, 4);
    g.lineStyle(2, 0xff00aa, 0.5);
    g.strokeRoundedRect(20, 20, 70, 30, 8);
    g.generateTexture('bg_ship_2', 120, 60);
  }

  createEnemyTextures(g) {
    g.clear();
    g.fillStyle(0x00ffaa);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xffffff);
    g.fillCircle(10, 10, 3);
    g.fillCircle(20, 20, 3);
    g.lineStyle(2, 0xffffff);
    g.strokeCircle(15, 15, 15);
    g.generateTexture('enemy_drone', 30, 30);
    
    g.clear();
    g.fillStyle(0xff00aa);
    g.fillRect(5, 5, 30, 30);
    g.fillStyle(0x00ffff);
    g.fillRect(10, 10, 10, 10);
    g.fillRect(20, 20, 10, 10);
    g.generateTexture('enemy_sentinel', 40, 40);
    
    g.clear();
    g.fillStyle(0xcccccc);
    g.fillRect(8, 8, 24, 24);
    g.fillStyle(0x000000);
    g.fillCircle(14, 14, 3);
    g.fillCircle(26, 14, 3);
    g.fillRect(16, 22, 8, 4);
    g.generateTexture('enemy_skeleton', 40, 40);
    
    g.clear();
    g.fillStyle(0xff44ff);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xffffff);
    g.fillCircle(10, 10, 2);
    g.fillCircle(20, 20, 2);
    g.lineStyle(1, 0x00ffff);
    g.strokeCircle(15, 15, 14);
    g.generateTexture('cyber_drone', 30, 30);
    
    g.clear();
    g.fillStyle(0x8866cc);
    g.fillEllipse(20, 20, 16, 20);
    g.fillStyle(0x442288);
    g.fillEllipse(20, 22, 12, 14);
    g.generateTexture('shadow_wraith', 40, 40);
    
    g.clear();
    g.fillStyle(0xaa8866);
    g.fillCircle(20, 20, 15);
    g.fillStyle(0x664422);
    g.fillCircle(12, 12, 4);
    g.fillCircle(28, 12, 4);
    g.generateTexture('rock_spitter', 40, 40);
    
    g.clear();
    g.fillStyle(0xaa88ff);
    g.fillCircle(20, 20, 14);
    g.fillStyle(0x6644aa);
    g.fillCircle(20, 20, 8);
    g.lineStyle(2, 0xffffff);
    g.strokeCircle(20, 20, 16);
    g.generateTexture('void_sentinel', 40, 40);
  }

  createBossTextures(g) {
    g.clear();
    g.fillStyle(0xff0000);
    g.fillCircle(30, 30, 25);
    g.fillStyle(0xffff00);
    g.fillCircle(30, 30, 15);
    g.generateTexture('boss_space', 60, 60);
    
    g.clear();
    g.fillStyle(0x00ff00);
    g.fillCircle(30, 30, 25);
    g.fillStyle(0xff00ff);
    g.fillCircle(30, 30, 15);
    g.generateTexture('boss_cyber', 60, 60);
    
    g.clear();
    g.fillStyle(0x0000ff);
    g.fillCircle(30, 30, 25);
    g.fillStyle(0xffffff);
    g.fillCircle(30, 30, 15);
    g.generateTexture('boss_dungeon', 60, 60);
    
    g.clear();
    g.fillStyle(0x000000);
    g.fillCircle(30, 30, 25);
    g.fillStyle(0xff00ff);
    g.fillCircle(30, 30, 15);
    g.generateTexture('boss_asteroid', 60, 60);
    
    g.clear();
    g.fillStyle(0xff00ff);
    g.fillCircle(30, 30, 25);
    g.fillStyle(0x00ffff);
    g.fillCircle(30, 30, 15);
    g.generateTexture('boss_final', 60, 60);
  }

  createAsteroidTextures(g) {
    g.clear();
    g.fillStyle(0x888888);
    g.fillCircle(20, 20, 15);
    g.fillStyle(0x666666);
    g.fillCircle(12, 12, 8);
    g.fillCircle(28, 28, 7);
    g.lineStyle(2, 0xaaaaaa, 0.5);
    g.strokeCircle(20, 20, 16);
    g.generateTexture('bg_asteroid_1', 40, 40);
    
    g.clear();
    g.fillStyle(0x999999);
    g.fillRect(5, 5, 30, 30);
    g.fillStyle(0x777777);
    g.fillRect(10, 10, 10, 10);
    g.fillRect(20, 20, 8, 8);
    g.lineStyle(2, 0xbbbbbb, 0.4);
    g.strokeRect(5, 5, 30, 30);
    g.generateTexture('bg_asteroid_2', 40, 40);
    
    g.clear();
    g.fillStyle(0x886644);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xaa8866);
    g.fillCircle(10, 10, 6);
    g.generateTexture('bg_asteroid_small', 30, 30);
  }

  createPowerUpTextures(g) {
    g.clear();
    g.fillStyle(0x3366ff);
    g.fillRoundedRect(0, 0, 20, 20, 4);
    g.fillStyle(0x88aaff);
    g.fillRoundedRect(2, 2, 16, 16, 3);
    g.lineStyle(2, 0xffffff);
    g.strokeRoundedRect(0, 0, 20, 20, 4);
    g.generateTexture('modification', 20, 20);
    
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 6, 3);
    g.generateTexture('powerup', 24, 24);
  }

  createPowerUpVariants(g) {
    g.clear();
    g.fillStyle(0xff44ff);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 6, 3);
    g.lineStyle(1, 0x00ffff);
    g.strokeCircle(12, 12, 11);
    g.generateTexture('powerup_neon', 24, 24);
    
    g.clear();
    g.fillStyle(0x8866cc);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0x442288);
    g.fillCircle(6, 6, 3);
    g.generateTexture('powerup_dark', 24, 24);
    
    g.clear();
    g.fillStyle(0xccaa88);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0xaa8866);
    g.fillCircle(6, 6, 3);
    g.generateTexture('powerup_rock', 24, 24);
    
    g.clear();
    g.fillStyle(0xaa88ff);
    g.fillCircle(12, 12, 10);
    g.fillStyle(0x8866cc);
    g.fillCircle(6, 6, 3);
    g.generateTexture('powerup_void', 24, 24);
  }

  createLaserTextures(g) {
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRect(0, 0, 12, 3);
    g.generateTexture('laser_enemy', 12, 3);
    
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillRect(0, 0, 12, 3);
    g.generateTexture('laser_player', 12, 3);
  }

  createParticleTextures(g) {
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    
    g.clear();
    g.fillStyle(0x00ffff, 0.9);
    g.fillCircle(4, 4, 4);
    g.generateTexture('flare', 8, 8);
    
    g.clear();
    g.fillStyle(0xff00ff, 0.8);
    g.fillCircle(3, 3, 3);
    g.generateTexture('spark', 6, 6);
  }

  createHeartTexture(g) {
    g.clear();
    g.fillStyle(0xff4444);
    g.fillTriangle(8, 6, 16, 18, 24, 6);
    g.fillStyle(0xff8888);
    g.fillTriangle(8, 6, 16, 2, 24, 6);
    g.lineStyle(1, 0xff00ff, 0.5);
    g.strokeTriangle(8, 6, 16, 18, 24, 6);
    g.generateTexture('heart', 32, 24);
  }

  createStationTexture(g) {
    g.clear();
    g.fillStyle(0x220066);
    g.fillCircle(48, 48, 40);
    g.fillStyle(0x4400aa);
    g.fillCircle(48, 48, 30);
    g.fillStyle(0xffaa00);
    g.fillCircle(48, 48, 10);
    g.lineStyle(4, 0x00ffff, 0.8);
    g.strokeCircle(48, 48, 45);
    g.generateTexture('station_planet', 96, 96);
  }

  createButtonTextures(g) {
    const buttons = [
      { name: 'pause_button', color: 0x1a1a3a, stroke: 0x00ffff, icon: 'pause' },
      { name: 'menu_button', color: 0xff00ff, stroke: 0xff00ff, icon: 'menu' },
      { name: 'shop_button', color: 0xffaa00, stroke: 0xffaa00, icon: 'shop' },
      { name: 'skin_button', color: 0x00ffff, stroke: 0x00ffff, icon: 'skin' },
      { name: 'attack_button', color: 0xff4444, stroke: 0xff0000, icon: 'attack' }
    ];
    
    buttons.forEach(btn => {
      g.clear();
      g.fillStyle(btn.color);
      g.fillRoundedRect(0, 0, 50, 50, 8);
      g.lineStyle(2, btn.stroke);
      g.strokeRoundedRect(0, 0, 50, 50, 8);
      g.fillStyle(0xffffff);
      
      if (btn.icon === 'pause') {
        g.fillRect(15, 15, 8, 20);
        g.fillRect(27, 15, 8, 20);
      } else if (btn.icon === 'menu') {
        g.fillRect(15, 15, 8, 8);
        g.fillRect(27, 15, 8, 8);
        g.fillRect(15, 27, 20, 8);
      } else if (btn.icon === 'shop') {
        g.fillRect(15, 8, 20, 5);
        g.fillRoundedRect(10, 13, 30, 25, 5);
      } else if (btn.icon === 'skin') {
        g.fillRect(10, 10, 12, 30);
        g.fillRect(28, 10, 12, 30);
      } else if (btn.icon === 'attack') {
        g.fillTriangle(15, 10, 25, 30, 35, 10);
        g.fillRect(20, 30, 10, 15);
      }
      
      g.generateTexture(btn.name, 50, 50);
    });
  }

  createEffectTextures(g) {
    g.clear();
    g.lineStyle(3, 0x00ffff, 0.8);
    g.strokeCircle(32, 32, 28);
    g.lineStyle(2, 0x00ffff, 0.5);
    g.strokeCircle(32, 32, 20);
    g.lineStyle(1, 0x00ffff, 0.3);
    g.strokeCircle(32, 32, 12);
    g.fillStyle(0x00ffff, 0.1);
    g.fillCircle(32, 32, 28);
    g.generateTexture('shield_effect', 64, 64);
    
    g.clear();
    g.fillStyle(0xff00ff);
    g.fillRect(10, 5, 12, 22);
    g.fillRect(20, 5, 12, 22);
    g.fillStyle(0xff88ff);
    g.fillRect(12, 8, 8, 16);
    g.fillRect(22, 8, 8, 16);
    g.lineStyle(2, 0xff00ff);
    g.strokeRect(10, 5, 12, 22);
    g.strokeRect(20, 5, 12, 22);
    g.generateTexture('magnet_effect', 40, 32);
    
    g.clear();
    g.fillStyle(0xffff00);
    g.fillTriangle(16, 8, 24, 16, 16, 24);
    g.fillTriangle(16, 8, 8, 16, 16, 24);
    g.lineStyle(2, 0xffff00);
    g.strokeTriangle(16, 8, 24, 16, 16, 24);
    g.strokeTriangle(16, 8, 8, 16, 16, 24);
    g.generateTexture('speed_effect', 32, 32);
  }

  createWorldTextures(g) {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Киберпанк: здание
    g.clear();
    g.fillStyle(0x222266);
    g.fillRect(0, 0, 40, 100);
    g.fillStyle(0x44aaff);
    g.fillRect(5, 20, 10, 15);
    g.fillRect(20, 20, 10, 15);
    g.fillRect(5, 50, 10, 15);
    g.fillRect(20, 50, 10, 15);
    g.generateTexture('cyber_building', 40, 100);
    
    // Подземелье: тень
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(20, 20, 20);
    g.generateTexture('dungeon_shadow', 40, 40);
    
    // Астероиды: мелкий астероид
    g.clear();
    g.fillStyle(0x886644);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xaa8866);
    g.fillCircle(10, 10, 6);
    g.generateTexture('bg_asteroid_small', 30, 30);
    
    // Чёрная дыра: кольцо
    g.clear();
    g.lineStyle(2, 0x8800ff, 0.8);
    g.strokeCircle(30, 30, 25);
    g.lineStyle(2, 0xff00ff, 0.5);
    g.strokeCircle(30, 30, 20);
    g.generateTexture('blackhole_ring', 60, 60);
    
    // Неоновая вывеска
    g.clear();
    g.fillStyle(0xff00ff);
    g.fillRoundedRect(0, 0, 60, 20, 4);
    g.fillStyle(0xff88ff);
    g.fillRoundedRect(2, 2, 56, 16, 3);
    g.fillStyle(0xffffff);
    g.fillRect(8, 5, 3, 10);
    g.fillRect(8, 5, 8, 3);
    g.fillRect(8, 12, 8, 3);
    g.fillRect(13, 5, 3, 10);
    g.fillRect(18, 5, 3, 10);
    g.fillRect(18, 5, 8, 3);
    g.fillRect(18, 8, 5, 3);
    g.fillRect(18, 12, 8, 3);
    g.fillRect(28, 5, 3, 10);
    g.fillRect(28, 5, 8, 3);
    g.fillRect(28, 12, 8, 3);
    g.fillRect(33, 5, 3, 10);
    g.fillRect(38, 5, 3, 10);
    g.fillRect(38, 5, 8, 3);
    g.fillRect(38, 12, 8, 3);
    g.fillRect(43, 5, 3, 10);
    g.generateTexture('neon_sign', 60, 20);
    
    // Сталактит
    g.clear();
    g.fillStyle(0x886644);
    g.fillTriangle(0, 0, 15, 40, 30, 0);
    g.generateTexture('stalactite', 30, 40);
    
    // Сталагмит
    g.clear();
    g.fillStyle(0x886644);
    g.fillTriangle(0, 40, 15, 0, 30, 40);
    g.generateTexture('stalagmite', 30, 40);
    
    // Неоновая панель
    g.clear();
    g.fillStyle(0xff00ff);
    for (let i = 0; i < 3; i++) {
      g.fillRect(5 + i * 12, 5, 3, 20);
      g.fillRect(5 + i * 12, 25, 3, 5);
    }
    g.generateTexture('cyber_panel', 45, 32);
    
    // Трещина
    g.clear();
    g.lineStyle(2, 0x442200, 0.8);
    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(15, 15);
    g.lineTo(12, 25);
    g.lineTo(18, 35);
    g.lineTo(15, 45);
    g.strokePath();
    g.generateTexture('dungeon_crack', 30, 50);
    
    // Каменная крошка
    g.clear();
    g.fillStyle(0xaa8866);
    g.fillCircle(5, 5, 3);
    g.fillCircle(12, 8, 2);
    g.fillCircle(18, 3, 4);
    g.fillCircle(22, 10, 2);
    g.generateTexture('rock_particle', 30, 15);
    
    // Гравитационная волна
    g.clear();
    g.lineStyle(1, 0xaa88ff, 0.5);
    for (let i = 0; i < 3; i++) {
      g.strokeCircle(15, 15, 8 + i * 5);
    }
    g.generateTexture('gravity_wave', 30, 30);
    
    // Цифровая иконка
    g.clear();
    g.fillStyle(0x00ffff);
    for (let i = 0; i < 4; i++) {
      g.fillRect(8 + i * 6, 8, 2, 14);
      g.fillRect(8 + i * 6, 22, 6, 2);
    }
    g.generateTexture('digital_icon', 32, 26);
  }

  // =========================================================================
  // НОВЫЕ ТЕКСТУРЫ ДЛЯ ПРЕПЯТСТВИЙ МИРОВ
  // =========================================================================

  createCyberpunkObstacles(g) {
    // Лазерная ловушка
    g.clear();
    g.fillStyle(0xff44ff);
    g.fillRoundedRect(0, 0, 30, 30, 8);
    g.fillStyle(0xffffff);
    g.fillRect(12, 5, 6, 20);
    g.fillRect(5, 12, 20, 6);
    g.generateTexture('cyber_trap', 30, 30);
    
    // Неоновая ловушка
    g.clear();
    g.fillStyle(0x00ffff);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      g.fillCircle(15 + Math.cos(angle) * 10, 15 + Math.sin(angle) * 10, 3);
    }
    g.fillCircle(15, 15, 5);
    g.generateTexture('neon_trap', 30, 30);
    
    // Энергетическая сфера
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xffffff);
    g.fillCircle(10, 10, 3);
    g.fillCircle(20, 20, 3);
    g.lineStyle(1, 0x00ffff, 0.8);
    g.strokeCircle(15, 15, 13);
    g.generateTexture('energy_orb', 30, 30);
    
    // Неоновая сфера
    g.clear();
    g.fillStyle(0xff88ff);
    g.fillCircle(15, 15, 12);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      g.fillStyle(Phaser.Display.Color.HSLToColor(i / 6, 1, 0.6).color);
      g.fillCircle(15 + Math.cos(angle) * 8, 15 + Math.sin(angle) * 8, 2);
    }
    g.generateTexture('neon_orb', 30, 30);
    
    // Неоновый кристалл
    g.clear();
    g.fillStyle(0xff44ff);
    g.fillTriangle(15, 5, 22, 25, 8, 25);
    g.fillStyle(0xff88ff);
    g.fillTriangle(15, 12, 19, 22, 11, 22);
    g.fillStyle(0xffffff);
    g.fillCircle(15, 15, 2);
    g.generateTexture('neon_crystal', 30, 30);
  }

  createDungeonObstacles(g) {
    // Шипованная ловушка
    g.clear();
    g.fillStyle(0xaa6644);
    g.fillRoundedRect(5, 5, 20, 20, 4);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(7 + i * 4, 15, 2);
    }
    g.generateTexture('spike_trap', 30, 30);
    
    // Тёмная тень
    g.clear();
    g.fillStyle(0x442211);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0x221100);
    g.fillCircle(15, 15, 8);
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(15, 15, 5);
    g.generateTexture('dark_shadow', 30, 30);
    
    // Падающий камень
    g.clear();
    g.fillStyle(0x886644);
    g.fillRoundedRect(8, 5, 14, 20, 4);
    g.fillStyle(0xaa8866);
    g.fillRoundedRect(10, 3, 10, 22, 4);
    g.fillStyle(0x664422);
    g.fillRoundedRect(12, 8, 6, 14, 2);
    g.generateTexture('falling_rock', 30, 30);
  }

  createAsteroidObstacles(g) {
    // Огненный метеор
    g.clear();
    g.fillStyle(0xff6644);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xffaa44);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      g.fillCircle(15 + Math.cos(angle) * 10, 15 + Math.sin(angle) * 10, 2);
    }
    g.fillStyle(0xff4400);
    g.fillCircle(15, 15, 6);
    g.generateTexture('fire_meteor', 30, 30);
    
    // Осколок породы
    g.clear();
    g.fillStyle(0xccaa88);
    g.fillTriangle(8, 5, 22, 5, 15, 25);
    g.fillStyle(0xaa8866);
    g.fillTriangle(10, 8, 20, 8, 15, 22);
    g.fillStyle(0x886644);
    g.fillTriangle(12, 11, 18, 11, 15, 19);
    g.generateTexture('rock_chunk', 30, 30);
    
    // Пылевое облако
    g.clear();
    g.fillStyle(0xccaa88, 0.5);
    for (let i = 0; i < 10; i++) {
      g.fillCircle(8 + i * 2, 15, 3);
      g.fillCircle(15, 5 + i * 2, 3);
      g.fillCircle(22 - i, 22 - i, 2);
    }
    g.generateTexture('dust_cloud', 30, 30);
  }

  createBlackholeObstacles(g) {
    // Гравитационная аномалия
    g.clear();
    g.fillStyle(0x8866cc);
    g.fillCircle(15, 15, 12);
    g.fillStyle(0xaa88ff);
    for (let i = 0; i < 3; i++) {
      g.strokeCircle(15, 15, 8 + i * 3);
    }
    g.generateTexture('gravity_anomaly', 30, 30);
    
    // Осколок пустоты
    g.clear();
    g.fillStyle(0x6644aa);
    g.fillStar(15, 15, 5, 10, 5);
    g.fillStyle(0x8866cc);
    g.fillStar(15, 15, 4, 8, 5);
    g.generateTexture('void_fragment', 30, 30);
    
    // Тёмная материя
    g.clear();
    g.fillStyle(0x442288);
    g.fillCircle(15, 15, 10);
    g.fillStyle(0x6644aa);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      g.fillCircle(15 + Math.cos(angle) * 8, 15 + Math.sin(angle) * 8, 3);
    }
    g.generateTexture('dark_matter', 30, 30);
  }
}