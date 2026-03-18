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

    // Звёзды для красоты
    for (let i = 0; i < 50; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
      star.setDepth(-10);
    }

    // Заголовок
    this.add.text(w / 2, 30, 'МАГАЗИН СКИНОВ', {
      fontSize: '28px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary,
      stroke: COLORS.secondary,
      strokeThickness: 3
    }).setOrigin(0.5);

    // Баланс кристаллов
    this.balanceText = this.add.text(w / 2, 70, `💎 ${gameManager.data.crystals}`, {
      fontSize: '20px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Контейнер для скинов
    const startY = 120;
    const spacing = 100;
    let currentY = startY;

    SKINS.forEach(skin => {
      const owned = gameManager.getOwnedSkins().includes(skin.id);
      const selected = gameManager.getCurrentSkin() === skin.id;
      const canAfford = gameManager.data.crystals >= skin.price;

      // Определяем цвет рамки
      let borderColor = COLORS.text_muted;
      if (selected) borderColor = COLORS.success;
      else if (owned) borderColor = COLORS.primary;
      else if (skin.price === 0) borderColor = COLORS.accent;
      else if (canAfford) borderColor = COLORS.accent;

      // Карточка скина
      const bg = this.add.rectangle(w / 2, currentY, w - 40, 80, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, borderColor)
        .setInteractive();

      // Превью скина (просто цветной квадрат с текстом)
      const preview = this.add.rectangle(40, currentY, 50, 50, this.getSkinColor(skin.id))
        .setStrokeStyle(1, 0xffffff);

      // Название
      this.add.text(100, currentY - 20, skin.name, {
        fontSize: '18px',
        fontFamily: "'Orbitron', sans-serif",
        color: borderColor
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(100, currentY + 5, skin.description, {
        fontSize: '12px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.text_secondary
      }).setOrigin(0, 0.5);

      // Статус (цена или "ВЫБРАН" или "КУПЛЕНО")
      let statusText = '';
      let statusColor = COLORS.text_muted;

      if (selected) {
        statusText = 'ВЫБРАН';
        statusColor = COLORS.success;
      } else if (owned) {
        statusText = 'КУПЛЕНО';
        statusColor = COLORS.primary;
      } else if (skin.price === 0) {
        statusText = 'БЕСПЛАТНО';
        statusColor = COLORS.accent;
      } else {
        statusText = `${skin.price} 💎`;
        statusColor = canAfford ? COLORS.accent : COLORS.danger;
      }

      const status = this.add.text(w - 30, currentY, statusText, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: statusColor
      }).setOrigin(1, 0.5);

      // Эффекты наведения
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a2a4a);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1a3a, 0.8);
      });

      // Обработка клика
      bg.on('pointerdown', () => {
        if (owned && !selected) {
          // Выбрать скин
          if (gameManager.selectSkin(skin.id)) {
            audioManager.playSound(this, 'tap_sound', 0.3);
            this.scene.restart();
          }
        } else if (!owned && (skin.price === 0 || canAfford)) {
          // Купить скин
          this.confirmPurchase(skin);
        } else if (!canAfford && !owned) {
          // Недостаточно средств
          this.showNoFunds();
        }
      });

      currentY += spacing;
    });

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  getSkinColor(skinId) {
    const colors = {
      default: 0xffaa00,
      neon: 0x00ffff,
      cyber: 0xff00ff,
      gold: 0xffaa00,
      rainbow: 0xff44ff,
      crystal: 0x88aaff
    };
    return colors[skinId] || 0xffffff;
  }

  confirmPurchase(skin) {
    const w = this.scale.width;
    const h = this.scale.height;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7)
      .setDepth(50)
      .setScrollFactor(0);

    const panel = this.add.rectangle(w / 2, h / 2, 300, 200, 0x0a0a1a, 0.95)
      .setStrokeStyle(2, COLORS.primary)
      .setDepth(51)
      .setScrollFactor(0);

    this.add.text(w / 2, h / 2 - 50, `Купить ${skin.name}?`, {
      fontSize: '18px',
      fontFamily: "'Orbitron', sans-serif",
      color: COLORS.primary
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

    if (skin.price > 0) {
      this.add.text(w / 2, h / 2 - 20, `${skin.price} 💎`, {
        fontSize: '24px',
        fontFamily: "'Space Mono', monospace",
        color: COLORS.accent
      }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    }

    const yesBtn = this.add.text(w / 2 - 80, h / 2 + 50, 'КУПИТЬ', {
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
      if (gameManager.purchaseSkin(skin.id)) {
        audioManager.playSound(this, 'purchase_sound', 0.5);
        this.balanceText.setText(`💎 ${gameManager.data.crystals}`);
        this.scene.restart();
      }
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });

    noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffffff', backgroundColor: '#aa0000' }));
    noBtn.on('pointerout', () => noBtn.setStyle({ color: '#ff0000', backgroundColor: '#1a1a3a' }));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      yesBtn.destroy();
      noBtn.destroy();
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