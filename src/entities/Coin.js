import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { COIN_TYPES } from '../config';

export class Coin {
  constructor(scene, x, y, type = 'gold') {
    this.scene = scene;
    this.type = type;
    this.config = COIN_TYPES[type] || COIN_TYPES.gold;
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.config.texture)
      .setScale(0.8)
      .setDepth(8);
    
    // Настройка физики
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setVelocityX(-200);
    
    // Визуальные эффекты
    this.sprite.setAngularVelocity(200);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Ссылка на объект монеты
    this.sprite.coinRef = this;
    
    // Характеристики
    this.value = this.config.value;
    this.bonus = this.config.bonus || null;
    this.collected = false;
    this.active = true;
    this.pulseDirection = 1;
    this.baseScale = 0.8;
    
    // Анимация мерцания
    this.pulseTimer = 0;
    
    // Добавляем в группу монет
    if (scene.coinGroup) {
      scene.coinGroup.add(this.sprite);
    }
  }

  update(delta) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // Эффект пульсации
    this.pulseTimer += delta;
    if (this.pulseTimer > 100) {
      this.pulseTimer = 0;
      this.baseScale += 0.05 * this.pulseDirection;
      
      if (this.baseScale > 0.9) {
        this.pulseDirection = -1;
      } else if (this.baseScale < 0.7) {
        this.pulseDirection = 1;
      }
      
      this.sprite.setScale(this.baseScale);
    }
    
    // Проверка выхода за экран
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Определяем базовую стоимость
    let value = this.value;
    
    // Учитываем бонус "двойные кристаллы"
    if (player && player.doubleCrystals) {
      value *= 2;
    }
    
    // Учитываем множитель комбо
    if (this.scene.comboSystem) {
      value = Math.floor(value * this.scene.comboSystem.getMultiplier());
    }
    
    // Добавляем кристаллы
    gameManager.addCrystals(value);
    this.scene.crystals += value;
    
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    
    // Обновляем счётчик монет для вагонов
    this.scene.collectedCoins += value;
    
    // Проверка на добавление вагона
    if (this.scene.collectedCoins >= this.scene.coinsForWagon && 
        this.scene.wagons.length < this.scene.maxWagons) {
      this.scene.addWagon();
      this.scene.collectedCoins -= this.scene.coinsForWagon;
    }
    
    // Обновляем прогресс квеста
    if (this.scene.questSystem) {
      this.scene.questSystem.updateProgress('coins', value);
    }
    
    // Добавляем комбо
    if (this.scene.comboSystem) {
      this.scene.comboSystem.add();
    }
    
    // Активируем бонус, если есть
    if (this.bonus) {
      this.activateBonus(player);
    }
    
    // Эффект сбора
    this.createCollectEffect();
    
    // Звук
    try { audioManager.playSound(this.scene, 'coin_sound', 0.3); } catch (e) {}
    
    // Вибро
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {}
    
    // Анимация текста кристаллов
    if (this.scene.crystalText) {
      this.scene.tweens.add({
        targets: this.scene.crystalText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Quad.out'
      });
    }
    
    // Уничтожаем монету
    this.destroy();
  }

  activateBonus(player) {
    switch(this.bonus) {
      case 'speed':
        player.activateSpeedBoost(5, 1.5);
        this.scene.showNotification('🚀 УСКОРЕНИЕ!', 1500, '#ffff00');
        break;
      case 'shield':
        player.activateShield(5);
        this.scene.showNotification('🛡️ ЩИТ!', 1500, '#00ffff');
        break;
      case 'magnet':
        player.activateMagnet(7);
        this.scene.showNotification('🧲 МАГНИТ!', 1500, '#ff00ff');
        break;
      case 'slow':
        this.scene.currentSpeed = this.scene.baseSpeed * 0.6;
        this.scene.showNotification('⏳ ЗАМЕДЛЕНИЕ!', 1500, '#ff8800');
        
        this.scene.time.delayedCall(5000, () => {
          this.scene.currentSpeed = this.scene.baseSpeed;
        });
        break;
    }
  }

  createCollectEffect() {
    if (this.scene.particleManager) {
      this.scene.particleManager.createCoinCollectEffect(
        this.sprite.x, 
        this.sprite.y, 
        this.type
      );
    }
  }

  destroy() {
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    this.active = false;
  }
}