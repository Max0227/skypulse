import Phaser from 'phaser';
import { COLORS, SHOP_UPGRADES } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('shop');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('shop_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'shop_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'МАГАЗИН УЛУЧШЕНИЙ', {
      fontSize: '26px', fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary, stroke: COLORS.secondary, strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс
    this.balanceText = this.add.text(w / 2, 70, `💎 ${gameManager.data.crystals}`, {
      fontSize: '20px', fontFamily: "'Space Mono', monospace", color: COLORS.accent
    }).setOrigin(0.5);

    let y = 120;
    const spacing = 60;

    SHOP_UPGRADES.forEach(upgrade => {
      const level = gameManager.getUpgradeLevel(upgrade.key);
      const maxLevel = upgrade.maxLevel;
      const cost = gameManager.getUpgradeCost(upgrade.key);
      const canAfford = gameManager.data.crystals >= cost && level < maxLevel;

      // Карточка
      const bg = this.add.rectangle(w / 2, y, w - 40, 50, 0x1a1a3a)
        .setStrokeStyle(2, canAfford ? COLORS.primary : COLORS.text_muted)
        .setInteractive();

      // Название
      this.add.text(20, y - 12, `${upgrade.icon} ${upgrade.name}`, {
        fontSize: '14px', fontFamily: "'Orbitron', sans-serif", color: COLORS.text_primary
      }).setOrigin(0, 0.5);

      // Уровень
      this.add.text(20, y + 10, `Ур. ${level}/${maxLevel}`, {
        fontSize: '10px', fontFamily: "'Space Mono', monospace", color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Цена
      if (level < maxLevel) {
        this.add.text(w - 20, y, `${cost} 💎`, {
          fontSize: '14px', fontFamily: "'Space Mono', monospace",
          color: canAfford ? COLORS.accent : COLORS.text_muted
        }).setOrigin(1, 0.5);
      } else {
        this.add.text(w - 20, y, 'MAX', {
          fontSize: '14px', fontFamily: "'Orbitron', sans-serif", color: COLORS.success
        }).setOrigin(1, 0.5);
      }

      if (canAfford) {
        bg.on('pointerover', () => bg.setFillStyle(0x2a2a4a));
        bg.on('pointerout', () => bg.setFillStyle(0x1a1a3a));
        bg.on('pointerdown', () => {
          if (gameManager.upgrade(upgrade.key)) {
            try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
            this.balanceText.setText(`💎 ${gameManager.data.crystals}`);
            this.scene.restart();
          }
        });
      }

      y += spacing;
    });

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;
    for (let i = 0; i < 80; i++) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'star');
      star.setScale(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.5));
      star.setDepth(-5);
    }
  }

  createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '18px', fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary, backgroundColor: '#1a1a3a',
      padding: { x: 30, y: 10 }, stroke: COLORS.primary, strokeThickness: 2
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