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

    // Баланс кристаллов
    this.balanceText = this.add.text(w / 2, 70, `💎 ${gameManager.data.crystals}`, {
      fontSize: '20px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5);

    // Контейнер для скинов
    let y = 120;
    const spacing = 100;

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
      const bg = this.add.rectangle(w / 2, y, w - 40, 90, 0x1a1a3a, 0.8)
        .setStrokeStyle(2, borderColor)
        .setInteractive();

      // Превью скина - СОЗДАЁМ ВИЗУАЛЬНОЕ ПРЕДСТАВЛЕНИЕ
      this.createSkinPreview(w, y, skin);

      // Название
      this.add.text(100, y - 25, skin.name, {
        fontSize: '18px',
        fontFamily: "'Orbitron', sans-serif",
        color: borderColor
      }).setOrigin(0, 0.5);

      // Описание
      this.add.text(100, y, skin.description, {
        fontSize: '12px',
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
      const rarityColor = rarityColors[skin.rarity] || '#cbd5e1';
      
      this.add.text(100, y + 20, skin.rarity, {
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: rarityColor
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

      this.add.text(w - 30, y - 15, statusText, {
        fontSize: '14px',
        fontFamily: "'Space Mono', monospace",
        color: statusColor
      }).setOrigin(1, 0.5);

      // Кнопка действия
      if (!owned && skin.price > 0 && canAfford) {
        const buyBtn = this.add.text(w - 30, y + 15, 'КУПИТЬ', {
          fontSize: '12px',
          fontFamily: "'Orbitron', sans-serif",
          color: '#00ff00',
          backgroundColor: '#1a1a3a',
          padding: { x: 8, y: 3 }
        }).setInteractive().setOrigin(0.5, 0.5);

        buyBtn.on('pointerover', () => {
          buyBtn.setStyle({ color: '#ffffff', backgroundColor: '#00aa00' });
        });

        buyBtn.on('pointerout', () => {
          buyBtn.setStyle({ color: '#00ff00', backgroundColor: '#1a1a3a' });
        });

        buyBtn.on('pointerdown', () => {
          this.confirmPurchase(skin);
        });
      } else if (owned && !selected) {
        const selectBtn = this.add.text(w - 30, y + 15, 'ВЫБРАТЬ', {
          fontSize: '12px',
          fontFamily: "'Orbitron', sans-serif",
          color: COLORS.primary,
          backgroundColor: '#1a1a3a',
          padding: { x: 8, y: 3 }
        }).setInteractive().setOrigin(0.5, 0.5);

        selectBtn.on('pointerover', () => {
          selectBtn.setStyle({ color: COLORS.text_primary, backgroundColor: COLORS.primary });
        });

        selectBtn.on('pointerout', () => {
          selectBtn.setStyle({ color: COLORS.primary, backgroundColor: '#1a1a3a' });
        });

        selectBtn.on('pointerdown', () => {
          if (gameManager.selectSkin(skin.id)) {
            try { audioManager.playSound(this, 'tap_sound', 0.3); } catch (e) {}
            this.scene.restart();
          }
        });
      }

      // Эффекты наведения на карточку
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a2a4a);
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a1a3a, 0.8);
      });

      y += spacing;
    });

    // Кнопка назад
    this.createButton(w / 2, h - 40, 'НАЗАД', () => this.scene.start('menu'));
  }

  /**
   * Создать визуальное представление скина
   */
  createSkinPreview(w, y, skin) {
    const colors = {
      'default': 0xffaa00,
      'neon': 0x00ffff,
      'cyber': 0xff00ff,
      'gold': 0xffaa00,
      'rainbow': 0xff44ff,
      'crystal': 0x88aaff,
      'stealth': 0x444444,
      'fire': 0xff4400,
      'ice': 0x44aaff,
      'void': 0x220066
    };
    
    const color = colors[skin.id] || 0xffaa00;
    
    // Рисуем такси
    const graphics = this.add.graphics();
    
    // Основной корпус
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(20, y - 25, 50, 25, 6);
    
    // Кабина
    graphics.fillStyle(0x88aaff, 1);
    graphics.fillRect(25, y - 30, 15, 8);
    
    // Фары
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(65, y - 15, 3);
    
    // Колёса
    graphics.fillStyle(0x333333, 1);
    graphics.fillCircle(30, y - 5, 4);
    graphics.fillCircle(55, y - 5, 4);
    
    // Дополнительные детали для разных скинов
    if (skin.id === 'neon') {
      graphics.fillStyle(0x00ffff, 0.5);
      graphics.fillCircle(40, y - 17, 8);
    } else if (skin.id === 'fire') {
      graphics.fillStyle(0xff8800, 0.7);
      graphics.fillTriangle(70, y - 20, 75, y - 15, 70, y - 10);
    } else if (skin.id === 'ice') {
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(40, y - 17, 5);
    }
    
    graphics.setDepth(10);
  }

  createStars() {
    const w = this.scale.width;
    const h = this.scale.height;

    for (let i = 0; i < 100; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        'star'
      );
      star.setScale(Phaser.Math.FloatBetween(0.2, 1.0));
      star.setTint(Phaser.Math.Between(0x4444ff, 0xff44ff));
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      star.setDepth(-5);
    }
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

    this.add.text(w / 2, h / 2 - 20, `${skin.price} 💎`, {
      fontSize: '24px',
      fontFamily: "'Space Mono', monospace",
      color: COLORS.accent
    }).setOrigin(0.5).setDepth(52).setScrollFactor(0);

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
        try { audioManager.playSound(this, 'purchase_sound', 0.5); } catch (e) {}
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