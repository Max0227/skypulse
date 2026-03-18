import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Загрузка звуков (если есть)
    try {
      this.load.audio('coin_sound', 'sounds/coin.mp3');
      this.load.audio('wagon_sound', 'sounds/wagon.mp3');
      this.load.audio('tap_sound', 'sounds/tap.mp3');
      this.load.audio('level_up_sound', 'sounds/level_up.mp3');
      this.load.audio('purchase_sound', 'sounds/purchase.mp3');
      this.load.audio('revive_sound', 'sounds/revive.mp3');
      this.load.audio('bg_music', 'sounds/fifth_element_theme.mp3');
    } catch (e) {
      console.warn('Audio files not found');
    }
  }

  create() {
    this.createTextures();
    this.scene.start('menu');
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ИГРОК
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

    // ВАГОНЫ
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

    // ВОРОТА (универсальные)
    const createGate = (color, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(10, 10, 80, 380, 15);
      g.lineStyle(3, 0x00ffff, 0.8);
      g.strokeRoundedRect(0, 0, 100, 400, 20);
      g.generateTexture(name, 100, 400);
    };
    createGate(0x0a0a2a, 'gate_blue');
    createGate(0x2a0a3a, 'gate_purple');
    createGate(0x3a2a0a, 'gate_red');
    // Можно добавить другие цвета для новых миров

    // МОНЕТЫ
    const createCoin = (color, name) => {
      g.clear();
      g.fillStyle(color);
      g.fillCircle(16, 16, 14);
      g.lineStyle(4, 0xffffff, 0.8);
      g.strokeCircle(16, 16, 9);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.generateTexture(name, 32, 32);
    };
    createCoin(0xffaa00, 'coin_gold');
    createCoin(0xff4444, 'coin_red');
    createCoin(0x4444ff, 'coin_blue');
    createCoin(0x44ff44, 'coin_green');
    createCoin(0xff44ff, 'coin_purple');

    // ЭЛЕМЕНТЫ ФОНА
    // Звёзды (дальние)
    g.clear();
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 64);
      const y = Phaser.Math.Between(0, 64);
      g.fillCircle(x, y, Phaser.Math.Between(1, 2));
    }
    g.generateTexture('stars_far', 64, 64);

    // Звёзды (ближние)
    g.clear();
    g.fillStyle(0xaaccff, 0.9);
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 64);
      const y = Phaser.Math.Between(0, 64);
      g.fillCircle(x, y, Phaser.Math.Between(2, 3));
    }
    g.generateTexture('stars_mid', 64, 64);

    // Планета
    g.clear();
    g.fillStyle(0x8844aa);
    g.fillCircle(32, 32, 28);
    g.fillStyle(0xaa66cc);
    g.fillCircle(20, 20, 10);
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(45, 45, 8);
    g.generateTexture('planet', 64, 64);

    // Городской фон (небоскрёбы)
    g.clear();
    g.fillStyle(0x224466);
    for (let i = 0; i < 10; i++) {
      const x = i * 20;
      const h = Phaser.Math.Between(30, 80);
      g.fillRect(x, 64 - h, 10, h);
    }
    g.fillStyle(0xffff00, 0.3);
    for (let i = 0; i < 10; i++) {
      g.fillCircle(i * 20 + 5, 64 - Phaser.Math.Between(10, 40), 2);
    }
    g.generateTexture('city_bg', 200, 64);

    // Здания (параллакс)
    g.clear();
    g.fillStyle(0x335577);
    for (let i = 0; i < 15; i++) {
      const x = i * 15;
      const h = Phaser.Math.Between(20, 50);
      g.fillRect(x, 64 - h, 8, h);
    }
    g.generateTexture('buildings', 200, 64);

    // Машины (силуэты)
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRect(0, 10, 15, 5);
    g.fillCircle(3, 15, 2);
    g.fillCircle(12, 15, 2);
    g.fillStyle(0xff00ff, 0.5);
    g.fillRect(3, 8, 8, 2);
    g.generateTexture('car', 16, 16);

    // Люди (силуэты)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 2);
    g.fillRect(3, 6, 2, 5);
    g.generateTexture('people', 8, 12);

    // Подземелье – стена
    g.clear();
    g.fillStyle(0x553322);
    g.fillRect(0, 0, 200, 64);
    g.fillStyle(0x332211);
    for (let i = 0; i < 10; i++) {
      g.fillRect(i * 20, 0, 2, 64);
    }
    g.generateTexture('dungeon_wall', 200, 64);

    // Факелы
    g.clear();
    g.fillStyle(0xaa5522);
    g.fillRect(2, 0, 4, 10);
    g.fillStyle(0xff8800);
    g.fillCircle(4, 10, 3);
    g.generateTexture('torch', 8, 16);

    // Цепи
    g.clear();
    g.fillStyle(0x886644);
    for (let i = 0; i < 3; i++) {
      g.fillCircle(i * 4 + 2, 2, 2);
      g.fillCircle(i * 4 + 2, 6, 2);
    }
    g.generateTexture('chain', 12, 12);

    // КНОПКИ
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffff00);
    g.fillTriangle(15, 10, 25, 30, 35, 10);
    g.fillRect(20, 30, 10, 15);
    g.generateTexture('attack_button', 50, 50);

    g.clear();
    g.fillStyle(0x1a1a3a);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 20);
    g.fillRect(27, 15, 8, 20);
    g.generateTexture('pause_button', 50, 50);

    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffdd44);
    g.fillRoundedRect(10, 10, 30, 30, 5);
    g.generateTexture('shop_button', 50, 50);

    g.clear();
    g.fillStyle(0xff00ff);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 8);
    g.fillRect(27, 15, 8, 8);
    g.fillRect(15, 27, 20, 8);
    g.generateTexture('menu_button', 50, 50);

    // СЕРДЦЕ
    g.clear();
    g.fillStyle(0xff4444);
    g.fillTriangle(8, 6, 16, 18, 24, 6);
    g.fillStyle(0xff8888);
    g.fillTriangle(8, 6, 16, 2, 24, 6);
    g.generateTexture('heart', 32, 24);

    // ЧАСТИЦЫ
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

    g.destroy();
  }
}