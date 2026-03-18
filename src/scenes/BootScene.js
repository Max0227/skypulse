import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    audioManager.preloadSounds(this);
    console.log('BootScene: preload started');
  }

  create() {
    console.log('BootScene: create started');
    this.createTextures();
    this.time.delayedCall(100, () => {
      this.scene.start('menu');
    });
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // ===== БАЗОВОЕ ТАКСИ =====
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
    g.generateTexture('default', 80, 60);
    g.generateTexture('player', 80, 60);

    // ===== СКИНЫ ТАКСИ =====
    const skinColors = {
      neon: 0x00ffff,
      cyber: 0xff00ff,
      gold: 0xffaa00,
      rainbow: 0xff44ff,
      crystal: 0x88aaff
    };

    for (let [id, color] of Object.entries(skinColors)) {
      g.clear();
      g.fillStyle(color);
      g.fillRoundedRect(12, 12, 56, 32, 8);
      g.generateTexture(id, 80, 60);
    }

    // ===== ВАГОНЧИКИ =====
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
      g.generateTexture(`wagon_${i}`, 48, 34);
    }

    // ===== ВОРОТА =====
    const gateColors = [
      { color: 0x0a0a2a, light: 0x00ffff, name: 'gate_blue' },
      { color: 0x0a2a0a, light: 0x00ffaa, name: 'gate_green' },
      { color: 0x2a2a0a, light: 0xffff00, name: 'gate_yellow' },
      { color: 0x2a0a0a, light: 0xff00aa, name: 'gate_red' },
      { color: 0x2a0a2a, light: 0xff00ff, name: 'gate_purple' }
    ];

    gateColors.forEach(gate => {
      g.clear();
      g.fillStyle(gate.color);
      g.fillRoundedRect(0, 0, 100, 400, 20);
      g.fillStyle(gate.light);
      g.fillRoundedRect(10, 0, 15, 400, 8);
      g.lineStyle(3, 0x00ffff, 0.8);
      g.strokeRoundedRect(0, 0, 100, 400, 20);
      g.generateTexture(gate.name, 100, 400);
    });

    // ===== МОНЕТЫ =====
    const coins = [
      { color: 0xffaa00, line: 0xffdd44, name: 'coin_gold' },
      { color: 0xff4444, line: 0xffaa00, name: 'coin_red' },
      { color: 0x4444ff, line: 0xffffff, name: 'coin_blue' },
      { color: 0x44ff44, line: 0xffffff, name: 'coin_green' },
      { color: 0xff44ff, line: 0xffffff, name: 'coin_purple' }
    ];

    coins.forEach(coin => {
      g.clear();
      g.fillStyle(coin.color);
      g.fillCircle(16, 16, 14);
      g.lineStyle(4, coin.line);
      g.strokeCircle(16, 16, 9);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.generateTexture(coin.name, 32, 32);
    });

    // ===== ПЛАНЕТЫ =====
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
    g.generateTexture('bg_ship_2', 120, 60);

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

    // ===== УСИЛИТЕЛИ =====
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
    g.generateTexture('heart', 32, 24);

    // ===== КНОПКИ =====
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