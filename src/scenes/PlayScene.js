import Phaser from 'phaser';
import { COLORS, DIFFICULTY_CURVE, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { Player } from '../entities/Player';
import { Asteroid } from '../entities/Asteroid';
import { PowerUp } from '../entities/PowerUp';
import { ParticleEffectManager } from '../systems/ParticleEffectManager';
import { ComboSystem } from '../systems/ComboSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('play');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Текущий мир и уровень
    this.world = gameManager.getCurrentWorld();
    this.level = gameManager.getCurrentLevel();
    this.worldConfig = LEVEL_CONFIG[this.world];

    // Основные параметры
    this.score = 0;
    this.crystals = gameManager.data.crystals;
    this.meters = 0;
    this.started = false;
    this.dead = false;
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseText = null;

    // Скорость игры
    this.baseSpeed = 240;
    this.currentSpeed = this.baseSpeed;

    // Группы объектов
    this.gateGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    this.wagons = [];

    // Массивы для хранения объектов
    this.coins = [];
    this.asteroids = [];
    this.powerUps = [];
    this.scoreZones = [];
    this.stars = [];
    this.planets = [];
    this.ships = [];

    // Параметры вагонов
    this.collectedCoins = 0;
    this.coinsForWagon = 15;
    this.maxWagons = 5 + gameManager.getUpgradeLevel('maxWagons') * 2;
    this.wagonGap = 28 - gameManager.getUpgradeLevel('wagonGap') * 2;
    this.wagonSpring = 0.25;
    this.wagonBaseHP = 1 + gameManager.getUpgradeLevel('wagonHP');

    // Параметры игрока
    this.jumpPower = 300 + gameManager.getUpgradeLevel('jumpPower') * 25;
    this.maxHeadHP = 3 + gameManager.getUpgradeLevel('headHP');
    this.headHP = this.maxHeadHP;
    this.shieldActive = false;
    this.magnetActive = false;
    this.magnetRange = 220 + gameManager.getUpgradeLevel('magnetRange') * 40;
    this.shieldDuration = 5 + gameManager.getUpgradeLevel('shieldDuration') * 1.5;

    // Системы
    this.particleManager = new ParticleEffectManager(this);
    this.comboSystem = new ComboSystem(this);
    this.upgradeSystem = new UpgradeSystem(this);

    // Создание игрока
    this.player = new Player(this, 100, h / 2);

    // Применяем улучшения к игроку
    this.player.maxHP = this.maxHeadHP;
    this.player.hp = this.maxHeadHP;
    this.player.jumpPower = this.jumpPower;

    // Фон
    this.createBackground();

    // Интерфейс
    this.createUI();

    // Таймер спавна
    this.spawnTimer = null;

    // Установка цвета фона мира
    this.cameras.main.setBackgroundColor(this.worldConfig.bgColor);

    // Обработчик нажатия
    this.input.on('pointerdown', (pointer) => {
      if (pointer.targetObject || this.dead || this.isPaused) return;
      if (!this.started) this.startRun();
      this.player.flap();
      try { audioManager.playSound(this, 'tap_sound', 0.2); } catch (e) {}
    });

    // Обработчик потери фокуса (пауза при сворачивании)
    window.addEventListener('blur', () => {
      if (this.started && !this.dead && !this.isPaused) {
        this.togglePause();
      }
    });

    // Музыка
    try { audioManager.playMusic(this, 0.2); } catch (e) {}
  }

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Звёзды (мерцающие разноцветные - как в оригинале)
    for (let i = 0; i < 200; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.8));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-25);
      this.stars.push({
        sprite: star,
        speed: Phaser.Math.Between(3, 20),
        flicker: Phaser.Math.FloatBetween(0.01, 0.03)
      });
    }

    // Планеты (5 штук)
    for (let i = 1; i <= 5; i++) {
      const x = Phaser.Math.Between(w, w * 15);
      const y = Phaser.Math.Between(50, h - 50);
      const planet = this.add.image(x, y, `planet_${i}`)
        .setScale(Phaser.Math.FloatBetween(2.0, 4.0))
        .setTint(0x8888ff)
        .setAlpha(0.6 + Math.random() * 0.3)
        .setDepth(-15)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.planets.push({
        sprite: planet,
        speed: Phaser.Math.Between(2, 12),
        flicker: Phaser.Math.FloatBetween(0.005, 0.01)
      });
    }

    // Корабли (8 штук)
    const shipTextures = ['bg_ship_1', 'bg_ship_2'];
    for (let i = 0; i < 8; i++) {
      const tex = shipTextures[Math.floor(Math.random() * shipTextures.length)];
      const ship = this.add.image(
        Phaser.Math.Between(w, w * 12),
        Phaser.Math.Between(50, h - 50),
        tex
      ).setScale(Phaser.Math.FloatBetween(0.5, 1.5))
       .setTint(0x00ffff)
       .setAlpha(0.7)
       .setDepth(-10)
       .setBlendMode(Phaser.BlendModes.ADD);
      this.ships.push({
        sprite: ship,
        speed: Phaser.Math.Between(3, 10)
      });
    }
  }

  createUI() {
    const w = this.scale.width;
    const h = this.scale.height;
    const fontFamily = "'Orbitron', monospace";

    // Счёт
    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '48px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 6,
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // Лучший счёт
    this.bestText = this.add.text(10, 10, `🏆 ${gameManager.data.stats.maxScore}`, {
      fontSize: '14px',
      fontFamily: "'Space Mono', monospace",
      color: '#7dd3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    // Кристаллы
    this.crystalText = this.add.text(w - 10, 10, `💎 ${this.crystals}`, {
      fontSize: '16px',
      fontFamily: "'Space Mono', monospace",
      color: '#fde047',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0);

    // Метраж
    this.meterText = this.add.text(10, h - 80, `📏 0 м`, {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#a5f3fc',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    // Вагоны
    this.wagonCountText = this.add.text(w - 100, h - 30, `🚃 0/${this.maxWagons}`, {
      fontSize: '14px',
      fontFamily: "'Space Mono', monospace",
      color: '#88ccff',
      stroke: '#0f172a',
      strokeThickness: 2
    }).setDepth(10).setScrollFactor(0);

    // Здоровье
    this.heartContainer = this.add.container(10, 30).setDepth(10).setScrollFactor(0);
    this.updateHearts();

    // Текст бонуса
    this.bonusText = this.add.text(w - 10, 40, '', {
      fontSize: '12px',
      fontFamily: "'Space Mono', monospace",
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 2,
      align: 'right'
    }).setOrigin(1, 0).setDepth(10).setScrollFactor(0).setVisible(false);

    // Кнопка паузы
    this.pauseButton = this.add.image(w - 35, h - 35, 'pause_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => this.pauseButton.setScale(1.1))
      .on('pointerout', () => this.pauseButton.setScale(1));

    // Кнопка меню
    this.menuButton = this.add.image(w - 90, h - 35, 'menu_button')
      .setInteractive()
      .setDepth(20)
      .setScrollFactor(0)
      .on('pointerdown', () => this.confirmExit())
      .on('pointerover', () => this.menuButton.setScale(1.1))
      .on('pointerout', () => this.menuButton.setScale(1));

    // Интро текст
    this.introText = this.add.text(w / 2, h / 2, 'НАЖМИ НА ЭКРАН, ЧТОБЫ ЛЕТЕТЬ', {
      fontSize: '18px',
      fontFamily,
      color: '#ffffff',
      stroke: '#00ffff',
      strokeThickness: 2,
      align: 'center',
      backgroundColor: '#0a0a1a',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  updateHearts() {
    this.heartContainer.removeAll(true);
    for (let i = 0; i < this.maxHeadHP; i++) {
      const heart = this.add.image(i * 18, 0, 'heart').setScale(0.5);
      if (i >= this.headHP) {
        heart.setTint(0x666666).setAlpha(0.5);
      } else {
        heart.setTint(0xff88ff);
      }
      this.heartContainer.add(heart);
    }
  }

  startRun() {
    this.started = true;
    this.introText.setVisible(false);
    this.spawnGate();
    this.scheduleNextSpawn();
  }

  spawnGate() {
    if (this.dead) return;

    const w = this.scale.width;
    const h = this.scale.height;
    const difficulty = DIFFICULTY_CURVE[Math.min(this.level, 4)];
    const gateTexture = this.worldConfig.gateColors[Phaser.Math.Between(0, 4)];
    const gap = difficulty.gap + Phaser.Math.Between(-15, 15);
    const centerY = Phaser.Math.Between(120, h - 120);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;
    const x = w;

    // Верхняя труба
    const topPipe = this.physics.add.image(x, topY, gateTexture)
      .setOrigin(0.5, 1)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, topY / 400))
      .setVelocityX(-difficulty.speed);
    topPipe.body.setAllowGravity(false);
    topPipe.setBlendMode(Phaser.BlendModes.ADD);
    this.gateGroup.add(topPipe);

    // Нижняя труба
    const bottomPipe = this.physics.add.image(x, bottomY, gateTexture)
      .setOrigin(0.5, 0)
      .setImmovable(true)
      .setScale(1, Math.max(0.2, (h - bottomY) / 400))
      .setVelocityX(-difficulty.speed);
    bottomPipe.body.setAllowGravity(false);
    bottomPipe.setBlendMode(Phaser.BlendModes.ADD);
    this.gateGroup.add(bottomPipe);

    // Зона счёта
    const zone = this.add.zone(x + 60, h / 2, 12, h);
    this.physics.add.existing(zone);
    zone.body.setAllowGravity(false);
    zone.body.setImmovable(true);
    zone.body.setVelocityX(-difficulty.speed);
    zone.passed = false;
    this.physics.add.overlap(this.player.sprite, zone, (p, z) => {
      if (!z.passed) {
        z.passed = true;
        this.passGate();
      }
    }, null, this);
    this.scoreZones.push(zone);

    // Монета
    if (Math.random() < difficulty.coinChance) {
      this.spawnCoin(x + 50, centerY);
    }

    // Астероид
    if (Math.random() < difficulty.asteroidChance) {
      this.spawnAsteroid();
    }

    // Усилитель
    if (Math.random() < difficulty.powerUpChance) {
      this.spawnPowerUp(x + 100, centerY);
    }
  }

  spawnCoin(x, y) {
    const type = Math.random() < 0.2 ? 'red' : 'gold';
    const coin = this.physics.add.image(x, y, `coin_${type}`)
      .setScale(0.8)
      .setVelocityX(-this.currentSpeed)
      .setAngularVelocity(200);
    coin.body.setAllowGravity(false);
    coin.setDepth(5);
    coin.coinType = type;
    coin.value = type === 'red' ? 2 : 1;
    coin.collected = false;
    this.coinGroup.add(coin);
    this.coins.push(coin);

    this.physics.add.overlap(this.player.sprite, coin, (p, c) => this.collectCoin(c), null, this);
  }

  spawnAsteroid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const speed = 300 + this.level * 30;
    const x = w + 50;
    const y = Phaser.Math.Between(50, h - 50);
    
    const asteroid = new Asteroid(this, x, y, speed);
    this.asteroids.push(asteroid);
    this.asteroidGroup.add(asteroid.sprite);

    this.physics.add.overlap(this.player.sprite, asteroid.sprite, (p, a) => {
      if (!this.player.shieldActive) {
        this.headHP--;
        this.updateHearts();
        this.cameras.main.shake(100, 0.005);
        try { audioManager.playSound(this, 'hit_sound', 0.3); } catch (e) {}
        
        if (this.headHP <= 0) {
          this.gameOver();
        }
        
        a.destroy();
        this.asteroids = this.asteroids.filter(ast => ast.sprite !== a);
        
        // Сброс комбо
        this.comboSystem.reset();
      }
    }, null, this);
  }

  spawnPowerUp(x, y) {
    const types = ['booster', 'shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    this.powerUpGroup.add(powerUp.sprite);

    this.physics.add.overlap(this.player.sprite, powerUp.sprite, (p, pu) => {
      powerUp.collect(this.player);
      this.powerUps = this.powerUps.filter(pw => pw.sprite !== pu);
    }, null, this);
  }

  collectCoin(coinSprite) {
    if (coinSprite.collected) return;
    coinSprite.collected = true;

    const coin = coinSprite;
    const multiplier = this.comboSystem.getMultiplier();
    const value = Math.floor(coin.value * multiplier);

    this.crystals += value;
    this.score += value;
    this.collectedCoins += value;

    this.scoreText.setText(this.score.toString());
    this.crystalText.setText(`💎 ${this.crystals}`);

    this.comboSystem.add();

    // Анимация счёта
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true
    });

    // Вагон
    if (this.collectedCoins >= this.coinsForWagon && this.wagons.length < this.maxWagons) {
      this.addWagon();
      this.collectedCoins -= this.coinsForWagon;
    }

    // Эффект частиц
    this.particleManager.createCoinCollectEffect(coin.x, coin.y, coin.coinType);
    try { audioManager.playSound(this, 'coin_sound', 0.3); } catch (e) {}

    coin.destroy();
    gameManager.addCrystals(value);
  }

  passGate() {
    const multiplier = this.comboSystem.getMultiplier();
    const points = Math.floor(10 * multiplier);
    this.score += points;
    this.scoreText.setText(this.score.toString());
    this.meters += 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true
    });

    this.cameras.main.shake(20, 0.001);

    // Проверка завершения уровня
    if (this.score >= this.worldConfig.goalScore) {
      this.completeLevel();
    }
  }

  addWagon() {
    if (this.wagons.length >= this.maxWagons) return;

    const last = this.wagons.length > 0 ? this.wagons[this.wagons.length - 1] : this.player.sprite;
    const spawnX = last.x - this.wagonGap * 2;
    const spawnY = last.y;
    const texIndex = Phaser.Math.Between(0, 9);

    const wagon = this.physics.add.image(spawnX, spawnY, `wagon_${texIndex}`)
      .setScale(0.8)
      .setDepth(5 + this.wagons.length);
    wagon.body.setCircle(12, 8, 6);
    wagon.body.setAllowGravity(true);
    wagon.body.setMass(0.5);
    wagon.body.setDrag(0.9);
    wagon.setData('hp', this.wagonBaseHP);
    wagon.setData('maxHP', this.wagonBaseHP);
    wagon.setTint(0x88aaff);
    wagon.setBlendMode(Phaser.BlendModes.ADD);

    this.wagons.push(wagon);

    // Анимация появления
    wagon.setAlpha(0);
    this.tweens.add({
      targets: wagon,
      alpha: 1,
      x: spawnX,
      duration: 500,
      ease: 'Sine.easeOut'
    });

    // Коллизия с воротами
    this.physics.add.collider(wagon, this.gateGroup, (w, gate) => {
      const hp = w.getData('hp') - 1;
      if (hp <= 0) {
        this.wagons = this.wagons.filter(wg => wg !== w);
        w.destroy();
      } else {
        w.setData('hp', hp);
        w.setTint(0xff8888);
        this.time.delayedCall(200, () => w.setTint(0x88aaff));
      }
    }, null, this);

    try { audioManager.playSound(this, 'wagon_sound', 0.6); } catch (e) {}
    this.particleManager.createWagonSpawnEffect(wagon);
    this.wagonCountText.setText(`🚃 ${this.wagons.length}/${this.maxWagons}`);
  }

  updateWagons() {
    if (this.wagons.length === 0) return;

    let prev = this.player.sprite;
    for (let i = 0; i < this.wagons.length; i++) {
      const wagon = this.wagons[i];
      const targetX = prev.x - this.wagonGap;
      const targetY = prev.y;

      const dx = targetX - wagon.x;
      const dy = targetY - wagon.y;

      wagon.x += dx * this.wagonSpring;
      wagon.y += dy * this.wagonSpring;

      if (wagon.body) wagon.body.reset(wagon.x, wagon.y);
      prev = wagon;
    }
  }

  scheduleNextSpawn() {
    if (this.dead) return;

    const difficulty = DIFFICULTY_CURVE[Math.min(this.level, 4)];
    this.spawnTimer = this.time.delayedCall(difficulty.spawnDelay, () => {
      if (!this.dead && this.started && !this.isPaused) {
        this.spawnGate();
        this.scheduleNextSpawn();
      }
    });
  }

  completeLevel() {
    // Вычисляем звёзды
    let stars = 1;
    if (this.score >= this.worldConfig.goalScore * 1.5) stars = 2;
    if (this.score >= this.worldConfig.goalScore * 2) stars = 3;
    
    // Бонус за здоровье
    if (this.headHP === this.maxHeadHP) stars = Math.min(3, stars + 1);

    gameManager.setLevelStars(this.world, this.level, stars);

    // Разблокировка следующего уровня
    if (this.level < 4) {
      gameManager.unlockLevel(this.world, this.level + 1);
    }

    // Разблокировка следующего мира
    if (this.level === 4 && this.world < 4) {
      const worlds = gameManager.data.unlockedWorlds;
      if (!worlds.includes(this.world + 1)) {
        worlds.push(this.world + 1);
        gameManager.save();
      }
    }

    // Обновление статистики
    gameManager.updateStats(this.score, this.level + 1, this.wagons.length, this.comboSystem.maxCombo);

    this.scene.start('levelComplete', {
      world: this.world,
      level: this.level,
      score: this.score,
      stars: stars,
      coins: this.collectedCoins,
      wagons: this.wagons.length
    });
  }

  gameOver() {
    if (this.dead) return;
    this.dead = true;

    this.physics.pause();
    if (this.spawnTimer) this.spawnTimer.remove();

    this.cameras.main.shake(300, 0.005);
    this.cameras.main.flash(300, 255, 100, 100);

    this.player.sprite.setTint(0xff0000).setAngle(90);

    // Эффект взрыва
    const emitter = this.add.particles(this.player.sprite.x, this.player.sprite.y, 'flare', {
      speed: 250,
      scale: { start: 1.2, end: 0 },
      lifespan: 600,
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xff0000, 0xff8800, 0xff00ff]
    });
    emitter.explode(50);

    gameManager.updateStats(this.score, this.level + 1, this.wagons.length, this.comboSystem.maxCombo);

    this.time.delayedCall(1000, () => {
      this.scene.start('menu');
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      if (this.spawnTimer) this.spawnTimer.paused = true;

      const w = this.scale.width;
      const h = this.scale.height;

      this.pauseOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
        .setDepth(50)
        .setScrollFactor(0);

      this.pauseText = this.add.text(w / 2, h / 2, 'ПАУЗА', {
        fontSize: '40px',
        fontFamily: "'Orbitron', monospace",
        color: '#ffffff',
        stroke: '#00ffff',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
    } else {
      this.physics.resume();
      if (this.spawnTimer) this.spawnTimer.paused = false;
      if (this.pauseOverlay) this.pauseOverlay.destroy();
      if (this.pauseText) this.pauseText.destroy();
    }
  }

  confirmExit() {
    this.scene.start('menu');
  }

  update(time, delta) {
    if (this.isPaused || this.dead) return;

    // Обновление звёзд (с мерцанием)
    const dt = delta / 1000;
    this.stars.forEach(s => {
      s.sprite.x -= s.speed * (this.started ? 1 : 0.3) * dt;
      if (s.flicker) {
        s.sprite.alpha = 0.5 + Math.sin(time * s.flicker) * 0.3;
      }
      if (s.sprite.x < -10) {
        s.sprite.x = this.scale.width + Phaser.Math.Between(5, 50);
        s.sprite.y = Phaser.Math.Between(0, this.scale.height);
      }
    });

    // Обновление планет
    this.planets.forEach(p => {
      p.sprite.x -= p.speed * (this.started ? 0.2 : 0.05) * dt;
      if (p.flicker) {
        p.sprite.alpha = 0.5 + Math.sin(time * p.flicker) * 0.2;
      }
      if (p.sprite.x < -300) {
        p.sprite.x = this.scale.width + Phaser.Math.Between(400, 2000);
        p.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    });

    // Обновление кораблей
    this.ships.forEach(s => {
      s.sprite.x -= s.speed * (this.started ? 0.3 : 0.1) * dt;
      if (s.sprite.x < -200) {
        s.sprite.x = this.scale.width + Phaser.Math.Between(300, 1500);
        s.sprite.y = Phaser.Math.Between(50, this.scale.height - 50);
      }
    });

    if (!this.started) return;

    // Обновление игрока
    this.player.update();

    // Обновление вагонов
    this.updateWagons();

    // Обновление астероидов
    this.asteroids = this.asteroids.filter(a => a.update());

    // Обновление усилителей
    this.powerUps = this.powerUps.filter(p => {
      if (p.sprite.x < -100) {
        p.sprite.destroy();
        return false;
      }
      return true;
    });

    // Удаление устаревших объектов
    this.coins = this.coins.filter(c => {
      if (c.x < -100) {
        c.destroy();
        return false;
      }
      return true;
    });

    this.gateGroup.getChildren().forEach(g => {
      if (g.x < -150) g.destroy();
    });

    this.scoreZones = this.scoreZones.filter(z => {
      if (z.x < -60) {
        z.destroy();
        return false;
      }
      return true;
    });

    // Обновление метража
    this.meters += this.currentSpeed * dt / 10;
    this.meterText.setText(`📏 ${Math.floor(this.meters)} м`);

    // Обновление комбо
    this.comboSystem.update(delta);
  }
}