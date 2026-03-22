import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';
import { COIN_TYPES } from '../config';

export class Coin {
  constructor(scene, x, y, type = 'gold', worldType = null) {
    this.scene = scene;
    this.type = type;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    this.config = COIN_TYPES[type] || COIN_TYPES.gold;
    
    // Получаем модификации для текущего мира
    this.worldMod = this.getWorldModifications();
    
    // Создаём спрайт
    this.sprite = scene.physics.add.image(x, y, this.getTextureForWorld())
      .setScale(0.7)
      .setDepth(8);
    
    // ===== НАСТРОЙКА ФИЗИКИ (ОДИН РАЗ) =====
    this.setupPhysics();
    
    // Визуальные эффекты
    this.sprite.setAngularVelocity(200);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    // Применяем цветовую гамму мира
    this.applyWorldTint();
    
    // Ссылка на объект монеты
    this.sprite.coinRef = this;
    
    // Характеристики
    this.baseValue = this.config.value;
    this.value = this.getValueForWorld();
    this.bonus = this.config.bonus || null;
    this.bonusDuration = this.getBonusDuration();
    this.bonusStrength = this.getBonusStrength();
    this.collected = false;
    this.active = true;
    this.pulseDirection = 1;
    this.baseScale = 0.7;
    this.pulseTimer = 0;
    this.rotationSpeed = 200;
    
    // Сохраняем начальную позицию
    this.initialY = y;
    
    // Эффекты
    this.trailEmitter = null;
    this.glowEffect = null;
    this.orbitalParticles = [];
    
    // Создаём дополнительные эффекты для редких монет
    if (this.isRare()) {
      this.createGlowEffect();
      this.createTrailEffect();
      this.createOrbitalParticles();
    }
    
    // Анимация появления
    this.animateSpawn();
    
    // Добавляем в группу монет
    if (scene.coinGroup) {
      scene.coinGroup.add(this.sprite);
    }
  }

  // =========================================================================
  // ФИЗИКА (ПОЛНОСТЬЮ ОТКЛЮЧЕНА)
  // =========================================================================

  setupPhysics() {
    // Полное отключение гравитации
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setGravityY(0);
    this.sprite.body.setGravityX(0);
    
    // Отключаем все внешние силы
    this.sprite.body.setDrag(0);
    this.sprite.body.setDragX(0);
    this.sprite.body.setDragY(0);
    this.sprite.body.acceleration.y = 0;
    this.sprite.body.acceleration.x = 0;
    this.sprite.body.setBounce(0);
    
    // Устанавливаем движение ТОЛЬКО влево
    const currentSpeed = this.scene.currentSpeed || 200;
    this.sprite.body.setVelocityX(-currentSpeed);
    this.sprite.body.setVelocityY(0);
    
    // Делаем монету неподвижной по вертикали
    this.sprite.body.setImmovable(true);
    
    // Отключаем коллизии с другими объектами (кроме игрока)
    this.sprite.body.setCollideWorldBounds(false);
  }

  // =========================================================================
  // ОСНОВНОЙ МЕТОД UPDATE (ИСПРАВЛЕН)
  // =========================================================================

  update(delta) {
    if (!this.sprite || !this.sprite.active) {
      this.active = false;
      return false;
    }
    
    // ===== КОНТРОЛЬ СКОРОСТИ (МИНИМАЛЬНЫЙ) =====
    if (this.scene.currentSpeed && this.sprite.body) {
      // Только проверяем, что скорость НЕ изменилась
      const currentVx = this.sprite.body.velocity.x;
      const targetVx = -this.scene.currentSpeed;
      
      // Если скорость изменилась (например, из-за внешнего воздействия) — восстанавливаем
      if (Math.abs(currentVx - targetVx) > 5) {
        this.sprite.body.setVelocityX(targetVx);
      }
      
      // КРИТИЧЕСКИ ВАЖНО: НЕ ТРОГАЕМ вертикальную скорость!
      // Если вдруг появилась вертикальная скорость — обнуляем её
      if (this.sprite.body.velocity.y !== 0) {
        this.sprite.body.setVelocityY(0);
      }
      
      // Ещё раз убеждаемся, что гравитация отключена
      if (this.sprite.body.gravity.y !== 0) {
        this.sprite.body.setGravityY(0);
      }
    }
    
    // ===== ЭФФЕКТ ПУЛЬСАЦИИ =====
    this.pulseTimer += delta;
    if (this.pulseTimer > 80) {
      this.pulseTimer = 0;
      this.baseScale += 0.04 * this.pulseDirection;
      
      if (this.baseScale > 0.9) {
        this.pulseDirection = -1;
      } else if (this.baseScale < 0.6) {
        this.pulseDirection = 1;
      }
      
      this.sprite.setScale(this.baseScale);
      
      // Обновляем свечение
      if (this.glowEffect) {
        const glowScale = this.baseScale * 1.3;
        this.glowEffect.setScale(glowScale);
        this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
        
        const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        this.glowEffect.setAlpha(alpha);
      }
    }
    
    // Обновляем орбитальные частицы
    if (this.orbitalParticles.length > 0) {
      this.updateOrbitals();
    }
    
    // Специальные эффекты для разных миров
    this.updateWorldVisuals();
    
    // Проверка выхода за экран
    if (this.sprite.x < -100) {
      this.destroy();
      return false;
    }
    
    return true;
  }

  updateWorldVisuals() {
    const time = Date.now() * 0.005;
    
    // Киберпанк - мерцание и цифровой эффект
    if (this.worldType === 1) {
      const intensity = 0.6 + Math.sin(time * 10) * 0.3;
      this.sprite.setAlpha(intensity);
      if (this.glowEffect) this.glowEffect.setAlpha(intensity * 0.5);
      
      // Добавляем цифровой шум для редких монет
      if (this.isRare() && Math.random() < 0.05) {
        this.createDigitalGlitch();
      }
    }
    
    // Подземелье - тёмная аура
    if (this.worldType === 2) {
      const darkPulse = 0.5 + Math.sin(time * 3) * 0.2;
      this.sprite.setAlpha(darkPulse);
    }
    
    // Чёрная дыра - искажение
    if (this.worldType === 4) {
      const distort = 1 + Math.sin(time * 8) * 0.05;
      this.sprite.setScale(this.baseScale * distort);
    }
  }

  createDigitalGlitch() {
    const glitch = this.scene.add.text(
      this.sprite.x + Phaser.Math.Between(-10, 10),
      this.sprite.y + Phaser.Math.Between(-10, 10),
      ['0', '1'][Math.floor(Math.random() * 2)],
      { fontSize: '12px', fontFamily: 'monospace', color: '#ff44ff' }
    );
    glitch.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: glitch,
      alpha: 0,
      y: glitch.y - 20,
      duration: 200,
      onComplete: () => glitch.destroy()
    });
  }

  collect(player) {
    if (this.collected) return;
    this.collected = true;
    
    // Определяем итоговую стоимость
    let finalValue = this.value;
    
    // Учитываем бонус "двойные кристаллы"
    if (player && player.doubleCrystals) {
      finalValue *= 2;
    }
    
    // Учитываем множитель комбо
    if (this.scene.comboSystem) {
      finalValue = Math.floor(finalValue * this.scene.comboSystem.getMultiplier());
    }
    
    // Учитываем множитель мира
    finalValue = Math.floor(finalValue * this.worldMod.valueMultiplier);
    
    // Добавляем кристаллы
    gameManager.addCrystals(finalValue, 'coin');
    this.scene.crystals += finalValue;
    
    if (this.scene.crystalText) {
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
    }
    
    // Обновляем счётчик монет для вагонов
    this.scene.collectedCoins += finalValue;
    
    // Проверка на добавление вагона
    if (this.scene.collectedCoins >= this.scene.coinsForWagon && 
        this.scene.wagons.length < this.scene.maxWagons) {
      this.scene.addWagon();
      this.scene.collectedCoins -= this.scene.coinsForWagon;
    }
    
    // Обновляем прогресс квеста
    if (this.scene.questSystem) {
      this.scene.questSystem.updateProgress('coins', finalValue);
      if (this.bonus) {
        this.scene.questSystem.updateProgress(this.bonus, 1);
      }
    }
    
    // Добавляем комбо
    if (this.scene.comboSystem) {
      this.scene.comboSystem.add(finalValue > 1 ? finalValue : 1);
    }
    
    // Активируем бонус, если есть
    if (this.bonus) {
      this.activateBonus(player);
    }
    
    // Эффект сбора с учётом мира
    this.createCollectEffect();
    
    // Звук сбора
    this.playCollectSound();
    
    // Вибро
    this.triggerVibration();
    
    // Анимация текста кристаллов
    this.animateCrystalText(finalValue);
    
    // Показываем всплывающее значение
    this.showValuePopup(finalValue);
    
    // Уничтожаем монету
    this.destroy();
  }

  activateBonus(player) {
    const duration = this.bonusDuration;
    const strength = this.bonusStrength;
    
    switch(this.bonus) {
      case 'speed':
        player.activateSpeedBoost(duration, strength);
        this.scene.currentSpeed = this.scene.baseSpeed * strength;
        this.scene.time.delayedCall(duration * 1000, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        this.scene.showNotification('🚀 УСКОРЕНИЕ!', 1500, '#ffff00');
        break;
        
      case 'shield':
        player.activateShield(duration);
        this.scene.showNotification('🛡️ ЩИТ!', 1500, '#00ffff');
        break;
        
      case 'magnet':
        const magnetRange = this.scene.magnetRange * strength;
        player.activateMagnet(duration, magnetRange);
        this.scene.showNotification('🧲 МАГНИТ!', 1500, '#ff00ff');
        break;
        
      case 'slow':
        this.scene.currentSpeed = this.scene.baseSpeed * strength;
        this.scene.showNotification('⏳ ЗАМЕДЛЕНИЕ!', 1500, '#ff8800');
        this.scene.time.delayedCall(duration * 1000, () => {
          if (!this.scene.bonusActive) {
            this.scene.currentSpeed = this.scene.baseSpeed;
          }
        });
        break;
    }
  }

  createCollectEffect() {
    if (this.scene.particleManager) {
      const effectType = this.isRare() ? 'rare' : this.type;
      this.scene.particleManager.createCoinCollectEffect(
        this.sprite.x, 
        this.sprite.y, 
        effectType
      );
    }
    
    // Дополнительный эффект для разных миров
    if (this.worldType === 1) {
      // Киберпанк - цифровые искры
      for (let i = 0; i < 8; i++) {
        const spark = this.scene.add.text(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          ['0','1'][Math.floor(Math.random() * 2)],
          { fontSize: '10px', fontFamily: 'monospace', color: '#ff44ff' }
        );
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          y: spark.y - 40,
          duration: 400,
          onComplete: () => spark.destroy()
        });
      }
    } else if (this.worldType === 2) {
      // Подземелье - тёмные искры
      for (let i = 0; i < 6; i++) {
        const spark = this.scene.add.circle(
          this.sprite.x + Phaser.Math.Between(-15, 15),
          this.sprite.y + Phaser.Math.Between(-15, 15),
          2,
          0xff6600,
          0.8
        );
        spark.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0,
          duration: 300,
          onComplete: () => spark.destroy()
        });
      }
    } else if (this.worldType === 4) {
      // Чёрная дыра - гравитационная волна
      const wave = this.scene.add.circle(this.sprite.x, this.sprite.y, 8, 0xaa88ff, 0.6);
      this.scene.tweens.add({
        targets: wave,
        radius: 50,
        alpha: 0,
        duration: 400,
        onComplete: () => wave.destroy()
      });
    }
  }

  playCollectSound() {
    try {
      const volume = 0.3 + (this.isRare() ? 0.2 : 0);
      const soundKey = this.isRare() ? 'rare_coin' : 'coin_sound';
      audioManager.playSound(this.scene, soundKey, volume);
    } catch (e) {
      try {
        audioManager.playSound(this.scene, 'coin_sound', 0.3);
      } catch (e2) {}
    }
  }

  triggerVibration() {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        const intensity = this.isRare() ? 'medium' : 'light';
        window.Telegram.WebApp.HapticFeedback.impactOccurred(intensity);
      }
    } catch (e) {}
  }

  animateCrystalText(value) {
    if (this.scene.crystalText) {
      this.scene.tweens.add({
        targets: this.scene.crystalText,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 100,
        yoyo: true,
        ease: 'Quad.out'
      });
    }
  }

  showValuePopup(value) {
    const popup = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20,
      `+${value}`,
      {
        fontSize: '16px',
        fontFamily: "'Audiowide', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 2,
        shadow: { blur: 5, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(50);
    
    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy()
    });
  }

  // =========================================================================
  // ГЕТТЕРЫ
  // =========================================================================

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getType() {
    return this.type;
  }

  getValue() {
    return this.value;
  }

  getBonus() {
    return this.bonus;
  }

  isActive() {
    return this.active && this.sprite && this.sprite.active;
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  destroy() {
    // Удаляем эффекты
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = null;
    }
    
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }
    
    this.orbitalParticles.forEach(p => {
      if (p && p.destroy) p.destroy();
    });
    this.orbitalParticles = [];
    
    // Удаляем спрайт
    if (this.sprite && this.sprite.active) {
      this.sprite.destroy();
    }
    
    this.active = false;
  }
}