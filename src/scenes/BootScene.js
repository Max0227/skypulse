import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    audioManager.preloadSounds(this);
    console.log('BootScene: preload started');
    
    this.createLoadingBar();
  }

  createLoadingBar() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    const bg = this.add.rectangle(w / 2, h / 2, 300, 30, 0x333333)
      .setStrokeStyle(2, 0x00ffff);
    
    const progressBar = this.add.rectangle(w / 2 - 150, h / 2, 0, 20, 0x00ffff)
      .setOrigin(0, 0.5);
    
    const loadingText = this.add.text(w / 2, h / 2 - 40, 'ЗАГРУЗКА...', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ffff'
    }).setOrigin(0.5);
    
    this.load.on('progress', (value) => {
      progressBar.width = 300 * value;
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      bg.destroy();
      loadingText.destroy();
    });
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

    // ===== БАЗОВЫЕ ТЕКСТУРЫ =====
    this.createBaseTextures(g);
    
    // ===== КРУТЫЕ СКИНЫ ТАКСИ =====
    this.createSkinTextures(g);

    g.destroy();
    console.log('BootScene: all textures created');
  }

  createBaseTextures(g) {
    // ЗВЕЗДА
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);

    // ЧАСТИЦЫ
    g.clear();
    g.fillStyle(0x00ffff, 0.9);
    g.fillCircle(4, 4, 4);
    g.generateTexture('flare', 8, 8);

    // СЕРДЦЕ
    g.clear();
    g.fillStyle(0xff4444);
    g.fillTriangle(8, 6, 16, 18, 24, 6);
    g.fillStyle(0xff8888);
    g.fillTriangle(8, 6, 16, 2, 24, 6);
    g.generateTexture('heart', 32, 24);

    // ВАГОНЧИКИ
    const wagonColors = [0xffaa00, 0x44aa88, 0xaa44aa, 0x88aa44, 0xaa8844];
    for (let i = 0; i < 5; i++) {
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

    // ВОРОТА
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

    // МОНЕТЫ
    const coinTypes = [
      { color: 0xffaa00, line: 0xffdd44, name: 'coin_gold' },
      { color: 0xff4444, line: 0xffaa00, name: 'coin_red' },
      { color: 0x4444ff, line: 0xffffff, name: 'coin_blue' },
      { color: 0x44ff44, line: 0xffffff, name: 'coin_green' },
      { color: 0xff44ff, line: 0xffffff, name: 'coin_purple' }
    ];

    coinTypes.forEach(coin => {
      g.clear();
      g.fillStyle(coin.color);
      g.fillCircle(16, 16, 14);
      g.lineStyle(4, coin.line);
      g.strokeCircle(16, 16, 9);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(10, 10, 4);
      g.generateTexture(coin.name, 32, 32);
    });

    // ПЛАНЕТЫ
    for (let i = 1; i <= 3; i++) {
      g.clear();
      const hue = (i * 120) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.8, 0.5).color;
      g.fillStyle(color);
      g.fillCircle(32, 32, 28);
      g.fillStyle(0x000000, 0.3);
      g.fillCircle(20, 20, 6);
      g.generateTexture(`planet_${i}`, 64, 64);
    }

    // КНОПКИ
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
  }

  createSkinTextures(g) {
    // ===== 1. КЛАССИКА (жёлтое такси) =====
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
    g.generateTexture('skin_default', 80, 60);

    // ===== 2. ПОЛИЦИЯ (синяя с мигалками) =====
    g.clear();
    g.fillStyle(0x2244aa);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0x112266);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillStyle(0xff0000);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0x0000ff);
    g.fillCircle(30, 28, 4);
    g.fillStyle(0xffffff);
    g.fillRect(40, 20, 4, 8);
    g.fillRect(48, 20, 4, 8);
    g.fillStyle(0xffff00);
    g.fillRect(22, 16, 8, 4);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.generateTexture('skin_police', 80, 60);

    // ===== 3. НЬЮ-ЙОРК ТАКСИ (жёлтый с шашечками) =====
    g.clear();
    g.fillStyle(0xffcc00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0x000000);
    g.fillRect(22, 20, 8, 4);
    g.fillRect(32, 20, 8, 4);
    g.fillRect(42, 20, 8, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0x000000);
    g.fillCircle(18, 28, 2);
    g.fillStyle(0xffff00);
    g.fillRect(56, 16, 8, 20);
    g.generateTexture('skin_taxi', 80, 60);

    // ===== 4. КИБЕРПАНК (неоновый) =====
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xff00ff);
    g.fillRect(20, 8, 40, 4);
    g.fillStyle(0xffff00);
    g.fillRect(20, 20, 40, 2);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.generateTexture('skin_cyber', 80, 60);

    // ===== 5. КИБЕРПОЛИЦИЯ =====
    g.clear();
    g.fillStyle(0x00ffff);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xff0000);
    g.fillCircle(18, 28, 4);
    g.fillStyle(0x0000ff);
    g.fillCircle(30, 28, 4);
    g.fillStyle(0xffff00);
    g.fillRect(40, 16, 16, 4);
    g.fillRect(40, 24, 16, 4);
    g.generateTexture('skin_police_cyber', 80, 60);

    // ===== 6. СКОРАЯ ПОМОЩЬ =====
    g.clear();
    g.fillStyle(0xff4444);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xffffff);
    g.fillRect(22, 16, 8, 8);
    g.fillRect(40, 16, 8, 8);
    g.fillStyle(0xff0000);
    g.fillRect(30, 28, 20, 6);
    g.fillStyle(0xffffff);
    g.fillRect(35, 28, 10, 6);
    g.generateTexture('skin_ambulance', 80, 60);

    // ===== 7. ПОЖАРНАЯ МАШИНА =====
    g.clear();
    g.fillStyle(0xff4400);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xffff00);
    g.fillRect(56, 16, 8, 20);
    g.fillStyle(0xffffff);
    g.fillRect(22, 20, 30, 4);
    g.fillStyle(0xff0000);
    g.fillCircle(18, 28, 4);
    g.generateTexture('skin_fire', 80, 60);

    // ===== 8. СТЕЛС (невидимка) =====
    g.clear();
    g.fillStyle(0x444444);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0x666666);
    g.fillRoundedRect(20, 8, 40, 10, 4);
    g.fillStyle(0x888888);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.fillStyle(0x222222);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.generateTexture('skin_stealth', 80, 60);

    // ===== 9. ЗОЛОТОЕ =====
    g.clear();
    g.fillStyle(0xffaa00);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xffdd44);
    g.fillRoundedRect(16, 8, 48, 8, 4);
    g.fillStyle(0xffff88);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.fillStyle(0xffdd44);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.lineStyle(2, 0xffdd44);
    g.strokeRoundedRect(12, 12, 56, 32, 8);
    g.generateTexture('skin_gold', 80, 60);

    // ===== 10. РАДУЖНОЕ =====
    g.clear();
    for (let i = 0; i < 8; i++) {
      const hue = (i * 45) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5).color;
      g.fillStyle(color);
      g.fillRect(12 + i * 7, 12, 6, 32);
    }
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.generateTexture('skin_rainbow', 80, 60);

    // ===== 11. КРИСТАЛЛ =====
    g.clear();
    g.fillStyle(0x88aaff);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0xaaccff);
    g.fillTriangle(20, 8, 40, 20, 60, 8);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.lineStyle(2, 0xffffff);
    g.strokeRoundedRect(12, 12, 56, 32, 8);
    g.generateTexture('skin_crystal', 80, 60);

    // ===== 12. БЕЗДНА =====
    g.clear();
    g.fillStyle(0x220066);
    g.fillRoundedRect(12, 12, 56, 32, 8);
    g.fillStyle(0x4400aa);
    g.fillRoundedRect(16, 8, 48, 8, 4);
    g.fillStyle(0xaa00ff);
    g.fillCircle(18, 28, 4);
    g.fillCircle(58, 28, 4);
    g.fillStyle(0x6600cc);
    g.fillRect(40, 30, 6, 4);
    g.fillRect(48, 30, 6, 4);
    g.generateTexture('skin_void', 80, 60);
  }
}