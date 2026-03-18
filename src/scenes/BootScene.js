import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Загружаем звуки через AudioManager (с защитой от отсутствующих файлов)
    audioManager.preloadSounds(this);
    
    // Можно также добавить индикатор загрузки, но для простоты пропустим
    console.log('BootScene: preload started');
  }

  create() {
    console.log('BootScene: create started');
    this.createTextures();
    
    // Небольшая задержка перед переходом в меню, чтобы все текстуры точно создались
    this.time.delayedCall(100, () => {
      this.scene.start('menu');
    });
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ===== ТАКСИ (ИГРОК) =====
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

    // ===== ВАГОНЧИКИ (10 разных цветов) =====
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

    // ===== ВОРОТА =====
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

    // ===== МОНЕТЫ =====
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

    // ===== ПЛАНЕТЫ (5 штук) =====
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

    // ===== КОРАБЛИ =====
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

    // ===== ВРАГИ =====
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

    // ===== БОССЫ =====
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

    // ===== ЛАЗЕРЫ =====
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRect(0, 0, 12, 3);
    g.generateTexture('laser_enemy', 12, 3);
    
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillRect(0, 0, 12, 3);
    g.generateTexture('laser_player', 12, 3);

    // ===== ЧАСТИЦЫ =====
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

    // ===== СЕРДЦЕ =====
    g.clear();
    g.fillStyle(0xff4444);
    g.fillTriangle(8, 6, 16, 18, 24, 6);
    g.fillStyle(0xff8888);
    g.fillTriangle(8, 6, 16, 2, 24, 6);
    g.lineStyle(1, 0xff00ff, 0.5);
    g.strokeTriangle(8, 6, 16, 18, 24, 6);
    g.generateTexture('heart', 32, 24);

    // ===== СТАНЦИЯ =====
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

    // ===== АСТЕРОИДЫ =====
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

    // ===== ЭФФЕКТЫ =====
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

    // ===== КНОПКИ =====
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0xff0000);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffff00);
    g.fillTriangle(15, 10, 25, 30, 35, 10);
    g.fillRect(20, 30, 10, 15);
    g.generateTexture('attack_button', 50, 50);

    g.clear();
    g.fillStyle(0x1a1a3a);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0x00ffff);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 20);
    g.fillRect(27, 15, 8, 20);
    g.generateTexture('pause_button', 50, 50);

    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0xffaa00);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xcc8800);
    g.fillRect(15, 8, 20, 5);
    g.fillStyle(0xffcc00);
    g.fillRoundedRect(10, 13, 30, 25, 5);
    g.fillStyle(0xffaa00);
    g.fillRect(15, 18, 8, 12);
    g.fillRect(27, 18, 8, 12);
    g.fillStyle(0xffffaa);
    g.fillCircle(15, 15, 2);
    g.fillCircle(35, 25, 2);
    g.generateTexture('shop_button', 50, 50);

    g.clear();
    g.fillStyle(0xff00ff);
    g.fillRoundedRect(0, 0, 50, 50, 8);
    g.lineStyle(2, 0xff00ff);
    g.strokeRoundedRect(0, 0, 50, 50, 8);
    g.fillStyle(0xffffff);
    g.fillRect(15, 15, 8, 8);
    g.fillRect(27, 15, 8, 8);
    g.fillRect(15, 27, 20, 8);
    g.generateTexture('menu_button', 50, 50);

    g.destroy();
    
    console.log('BootScene: all textures created');
  }
}