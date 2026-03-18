import Phaser from 'phaser';
import { COLORS, SKINS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class SkinShopScene extends Phaser.Scene {
  constructor() {
    super('skinShop');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Фон
    const gradient = this.make.graphics({ x: 0, y: 0, add: false });
    gradient.fillGradientStyle(0x030712, 0x030712, 0x0a0a1a, 0x0a0a1a, 1);
    gradient.fillRect(0, 0, w, h);
    gradient.generateTexture('skin_shop_bg', w, h);
    gradient.destroy();
    this.add.image(0, 0, 'skin_shop_bg').setOrigin(0);

    // Звёзды
    this.createStars();

    // Заголовок
    this.add.text(w / 2, 30, 'МАГАЗИН СКИНОВ', {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс
    this.balanceText = this.add.text(w / 2, 70, `💎 ${gameManager.data.crystals}`, {
      fontSize: '20px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    let y = 120;
    const spacing = 95;

    SKINS.forEach(skin => {
      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      let borderColor = COLORS.text_muted;
      if (selected) borderColor = COLORS.success;
      else if (owned) borderColor = COLORS.primary;
      else if (canAfford) borderColor = COLORS.accent;

      // Карточка скина
      const bg = this.add.rectangle(w / 2, y, w - 40, 85, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, borderColor)
        .setInteractive();

      // Превью скина
      this.createSkinPreview(w, y, skin);

      // Название
      this.add.text(95, y - 20, skin.name, {
        fontSize: '16px',
        fontFamily: "'Orbitron', sans-serif",
        color: borderColor
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(95, y, skin.description, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Редкость
      const rarityColors = {
        'Обычный': '#cbd5e1',
        'Редкий': '#00ffff',
        'Эпический': '#ff00ff',
        'Легендарный': '#ffaa00'
      };
      this.add.text(95, y + 18, skin.rarity, {
        fontSize: '9px',
        fontFamily: "'Space Mono', monospace",
        color: rarityColors[skin.rarity] || '#cbd5e1'
      }).setOrigin(0, 0.5);

      // Статус
      let statusText = '';
      let statusColor = COLORS.text_muted;
      if (selected) { statusText = 'ВЫБРАН'; statusColor = COLORS.success; }
      else if (owned) { statusText = 'КУПЛЕНО'; statusColor = COLORS.primary; }
      else { statusText = `${skin.price} 💎`; statusColor = canAfford ? COLORS.accent : COLORS.danger; }

      this.add.text(w - 20, y, statusText, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: statusColor
      }).setOrigin(1, 0.5);

      // Кнопка действия
      if (!owned && canAfford) {
        const buyBtn = this.add.text(w - 20, y + 20, 'КУПИТЬ', {
          fontSize: '10px',
          fontFamily: "'Orbitron', sans-serif",
          color: '#00ff00',
          backgroundColor: '#1a1a3a',
          padding: { x: 6, y: 2 }
        }).setInteractive().setOrigin(0.5, 0.5);

        buyBtn.on('pointerdown', () => this.confirmPurchase(skin));
      } else if (owned && !selected) {
        const selectBtn = this.add.text(w - 20, y + 20, 'ВЫБРАТЬ', {
          fontSize: '10px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.primary,
          backgroundColor: '#1a1a3a',
          padding: { x: 6, y: 2 }
        }).setInteractive().setOrigin(0.5, 0.5);

        selectBtn.on('pointerdown', () => {
          if (gameManager.selectSkin(skin.id)) {
            try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
            this.scene.restart();
          }
        });
      }

      y += spacing;
    });

    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  createSkinPreview(w, y, skin) {
    // Создаём миниатюру скина
    const preview = this.add.image(45, y, skin.texture)
      .setScale(0.6)
      .setOrigin(0.5, 0.5);

    // Добавляем эффект свечения для легендарных
    if (skin.rarity === 'Легендарный') {
      this.tweens.add({
        targets: preview,
        scaleX: 0.65,
        scaleY: 0.65,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50).setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 280, 180, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.primary).setDepth(51).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 40, `Купить ${skin.name}?`, {
      fontSize: '16px', fontFamily: "'Orbitron', sans-serif", color: COLORS.primary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 10, `${skin.price} 💎`, {
      fontSize: '20px', fontFamily: "'Space Mono', monospace", color: COLORS.accent
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const yesBtn = this.add.text(w / 2 - 70, h / 2 + 40, 'КУПИТЬ', {
      fontSize: '14px', fontFamily: "'Orbitron', sans-serif",
      color: '#00ff00', backgroundColor: '#1a1a3a', padding: { x: 12, y: 5 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    const noBtn = this.add.text(w / 2 + 70, h / 2 + 40, 'ОТМЕНА', {
      fontSize: '14px', fontFamily: "'Orbitron', sans-serif",
      color: '#ff0000', backgroundColor: '#1a1a3a', padding: { x: 12, y: 5 }
    }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0);

    yesBtn.on('pointerdown', () => {
      if (gameManager.purchaseSkin(skin.id)) {
        try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
        this.balanceText.setText(`💎 ${gameManager.data.crystals}`);
        this.scene.restart();
      }
      overlay.destroy(); panel.destroy();
    });

    noBtn.on('pointerdown', () => {
      overlay.destroy(); panel.destroy();
    });
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