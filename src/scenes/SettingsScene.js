import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('settings_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'settings_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 40, 'НАСТРОЙКИ', {
      fontSize: '32px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    let y = 130;

    // ===== ЗВУК =====
    this.add.text(30, y, '🔊 Звук', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    this.createToggle(w - 60, y, gameManager.data.soundEnabled, (value) => {
      gameManager.data.soundEnabled = value;
      gameManager.save();
    });
    y += 50;

    // ===== МУЗЫКА =====
    this.add.text(30, y, '🎵 Музыка', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    this.createToggle(w - 60, y, gameManager.data.musicEnabled, (value) => {
      gameManager.data.musicEnabled = value;
      gameManager.save();
      if (value) {
        audioManager.playMusic(this, 0.5);
      } else {
        audioManager.stopMusic();
      }
    });
    y += 50;

    // ===== ВИБРАЦИЯ =====
    this.add.text(30, y, '📳 Вибрация', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    this.createToggle(w - 60, y, gameManager.data.vibrationEnabled, (value) => {
      gameManager.data.vibrationEnabled = value;
      gameManager.save();
    });
    y += 70;

    // ===== СЛОЖНОСТЬ =====
    this.add.text(30, y, '⚡ Сложность', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    const difficulty = gameManager.data.difficulty || 'normal';
    this.difficultyText = this.add.text(w - 60, y, this.getDifficultyName(difficulty), {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5, 0.5);

    const difficultyLeft = this.add.text(w - 120, y, '◀', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setInteractive().setOrigin(0.5, 0.5);

    const difficultyRight = this.add.text(w - 0, y, '▶', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setInteractive().setOrigin(0.5, 0.5);

    difficultyLeft.on('pointerdown', () => this.changeDifficulty(-1));
    difficultyRight.on('pointerdown', () => this.changeDifficulty(1));
    y += 60;

    // ===== ЯЗЫК (только английский) =====
    this.add.text(30, y, '🌐 Язык', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.text_primary
    }).setOrigin(0, 0.5);

    this.add.text(w - 60, y, 'English', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.accent
    }).setOrigin(0.5, 0.5);
    
    y += 70;

    // Кнопка очистки данных
    this.createButton(w / 2, y, 'ОЧИСТИТЬ ДАННЫЕ', () => this.confirmClearData(), 'danger');
    y += 50;

    // Кнопка экспорта
    this.createButton(w / 2, y, 'ЭКСПОРТ ДАННЫХ', () => this.exportData(), 'normal');
    y += 50;

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));

    // Версия
    this.add.text(w / 2, h - 80, 'v3.5.0', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.text_muted
    }).setOrigin(0.5);
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 80; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));
      star.setDepth(-5);
    }
  }

  createToggle(x, y, initValue, callback) {
    const toggleBg = this.add.rectangle(x, y, 40, 20, initValue ? 0x00aa00 : 0xaa0000)
      .setStrokeStyle(1, COLORS.primary)
      .setInteractive();

    const toggleCircle = this.add.circle(
      x + (initValue ? 10 : -10),
      y,
      8,
      0xffffff
    );

    toggleBg.on('pointerdown', () => {
      const newValue = !initValue;
      toggleBg.setFillStyle(newValue ? 0x00aa00 : 0xaa0000);
      toggleCircle.x = x + (newValue ? 10 : -10);
      callback(newValue);
    });

    return { toggleBg, toggleCircle };
  }

  changeDifficulty(direction) {
    const difficulties = ['easy', 'normal', 'hard', 'insane'];
    let current = gameManager.data.difficulty || 'normal';
    let index = difficulties.indexOf(current);
    
    index = (index + direction + difficulties.length) % difficulties.length;
    const newDifficulty = difficulties[index];
    
    gameManager.data.difficulty = newDifficulty;
    gameManager.save();
    
    this.difficultyText.setText(this.getDifficultyName(newDifficulty));
  }

  getDifficultyName(diff) {
    const names = {
      easy: 'Лёгкая',
      normal: 'Нормальная',
      hard: 'Сложная',
      insane: 'Безумная'
    };
    return names[diff] || diff;
  }

  confirmClearData() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 260, 160, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 40, 'Очистить все данные?', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 10, 'Это действие нельзя отменить!', {
      fontSize: '10px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.warning
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 70, h / 2 + 40, 'ДА', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 5 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 70, h / 2 + 40, 'НЕТ', {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 5 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    yesBtn.on('pointerdown', () => {
      localStorage.clear();
      location.reload();
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  exportData() {
    const data = {
      gameManager: gameManager.data,
      timestamp: new Date().toISOString(),
      version: '3.5.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skypulse_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('✅ Данные экспортированы', 1500);
  }

  showNotification(text, duration) {
    const w = this.scale.width;
    
    const notification = this.add.text(w / 2, 100, text, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.success
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => notification.destroy()
    });
  }

  createButton(x, y, text, callback, type = 'normal') {
    const colors = {
      normal: { bg: '#1a1a3a', text: COLORS.primary },
      danger: { bg: '#3a1a1a', text: '#ff4444' }
    };
    const col = colors[type];

    const btn = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: "'Orbitron', sans-serif",
      color: col.text,
      backgroundColor: col.bg,
      padding: { x: 15, y: 6 },
      stroke: col.text,
      strokeThickness: 1
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: '#ffffff', backgroundColor: col.text });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: col.text, backgroundColor: col.bg });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}