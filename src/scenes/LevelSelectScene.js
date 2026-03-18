import Phaser from 'phaser';
import { COLORS, LEVEL_CONFIG } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('levelSelect');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const world = gameManager.getCurrentWorld();
    const worldConfig = LEVEL_CONFIG[world];

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('level_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'level_bg').setOrigin(0);

    // Звёзды
    for (let i = 0; i < 50; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.9));
      star.setDepth(-10);
    }

    // Заголовок с названием мира
    this.add.text(w / 2, 40, worldConfig.name, {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс кристаллов
    this.balanceText = this.add.text(w - 20, 80, `💎 ${gameManager.data.crystals}`, {
      fontSize: '18px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(1, 0.5);

    let y = 130;

    for (let level = 0; level < 5; level++) {
      const unlocked = gameManager.isLevelUnlocked(world, level) || level === 0;
      const stars = gameManager.getLevelStars(world, level);
      const price = gameManager.getLevelPrice(world, level);
      const canBuy = gameManager.data.crystals >= price;

      const bg = this.add.rectangle(w / 2, y, w - 40, 70, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, unlocked ? COLORS.primary : COLORS.text_muted)
        .setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => unlocked && bg.setFillStyle(0x2a2a4a));
      bg.on('pointerout', () => bg.setFillStyle(0x1a1a3a, 0.8));
      bg.on('pointerdown', () => {
        if (unlocked) {
          gameManager.setCurrentLevel(level);
          this.scene.start('play');
        } else if (price > 0 && canBuy) {
          this.confirmPurchase(world, level, price);
        } else if (price > 0 && !canBuy) {
          this.showNoFunds();
        }
      });

      // Номер уровня
      this.add.text(30, y - 20, `${level + 1}`, {
        fontSize: '24px',
        fontFamily: "'Orbitron', sans-serif",
        color: unlocked ? COLORS.text_primary : COLORS.text_muted
      }).setOrigin(0, 0.5);

      // Цель уровня
      this.add.text(30, y + 5, `Цель: ${worldConfig.goalScore}`, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Звёзды
      this.add.text(w - 100, y - 15, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '16px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0, 0.5);

      // Цена или статус
      if (!unlocked && price > 0) {
        this.add.text(w - 100, y + 10, `${price} 💎`, {
          fontSize: '14px',
          fontFamily: "'Space Mono', monospace",
          color: canBuy ? COLORS.accent : COLORS.text_muted
        }).setOrigin(0, 0.5);
      } else if (!unlocked && price === 0) {
        this.add.text(w - 100, y + 10, 'НОВЫЙ', {
          fontSize: '12px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.success
        }).setOrigin(0, 0.5);
      }

      y += 85;
    }

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('worldSelect'));
  }

  confirmPurchase(world, level, price) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 180, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.primary)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 40, 'Открыть уровень?', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 10, `${price} 💎`, {
      fontSize: '24px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 80, h / 2 + 50, 'ОТКРЫТЬ', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 80, h / 2 + 50, 'ОТМЕНА', {
      fontSize: '16px',
      fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000',
      backgroundColor: '#1a1a3a',
      padding: { x: 15, y: 8 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' }));
    yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' }));
    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseLevel(world, level)) {
        audioManager.playSound(this, 'purchase_sound', 0.5);
        this.scene.restart();
      }
      overlay.destroy();
      panel.destroy();
      this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy());
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy());
    });
  }

  showNoFunds() {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 150, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.danger)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2, 'НЕДОСТАТОЧНО\nКРИСТАЛЛОВ!', {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.danger,
      align: 'center'
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.time.delayedCall(1500, () => {
      overlay.destroy();
      panel.destroy();
    });
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 10 },
      stroke: COLORS.primary,
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => {
      btn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
      btn.setScale(1.05);
    });

    btn.on('pointerout', () => {
      btn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
      btn.setScale(1);
    });

    btn.on('pointerdown', callback);
    return btn;
  }
}