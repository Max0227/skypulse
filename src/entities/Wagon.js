import Phaser from 'phaser';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class Wagon {
  constructor(scene, x, y, index, worldType = null) {
    this.scene = scene;
    this.index = index;
    this.worldType = worldType || (scene.levelManager?.currentWorld ?? 0);
    
    this.worldConfig = this.getWorldConfig();
    this.texture = this.getTextureForWorld();
    
    this.sprite = scene.physics.add.image(x, y, this.texture)
      .setScale(0.92)
      .setDepth(5 + index);
    
    this.setupPhysics();
    this.setupVisuals();
    
    this.sprite.wagonRef = this;
    
    this.hp = this.getMaxHealth();
    this.maxHp = this.hp;
    this.active = true;
    this.isConnected = true;
    this.protectionFrames = 0;
    this.protectionDuration = 500;
    
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    
    this.followDistance = 45;
    this.springStrength = 0.25;
    this.damping = 0.92;
    
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };
    
    this.glowEffect = null;
    this.trailEmitter = null;
    this.multiplierIndicator = null;
    
    this.createMultiplierIndicator();
    this.createTrail();
    this.applyWorldVisuals();
    this.animateSpawn();
    this.playSpawnSound();
  }

  getWorldConfig() {
    return {
      0: { color: 0x88aaff, glowColor: 0x44aaff, textureSet: 'space', particleColor: 0x44aaff, drag: 0.95 },
      1: { color: 0xff44ff, glowColor: 0xff88ff, textureSet: 'neon', particleColor: 0xff44ff, drag: 0.92 },
      2: { color: 0xaa6644, glowColor: 0xcc8866, textureSet: 'dark', particleColor: 0xff6600, drag: 0.98 },
      3: { color: 0xffaa66, glowColor: 0xffcc88, textureSet: 'rocky', particleColor: 0xffaa44, drag: 0.96 },
      4: { color: 0xaa88ff, glowColor: 0xcc88ff, textureSet: 'void', particleColor: 0xaa88ff, drag: 0.9 },
    }[this.worldType] || { color: 0x88aaff, glowColor: 0x44aaff, textureSet: 'space', particleColor: 0x44aaff, drag: 0.95 };
  }

  getTextureForWorld() {
    const textureMaps = {
      space: ['wagon_0', 'wagon_1', 'wagon_2', 'wagon_3', 'wagon_4', 'wagon_5', 'wagon_6', 'wagon_7', 'wagon_8', 'wagon_9'],
      neon: ['wagon_neon_0', 'wagon_neon_1', 'wagon_neon_2', 'wagon_neon_3', 'wagon_neon_4'],
      dark: ['wagon_dark_0', 'wagon_dark_1', 'wagon_dark_2', 'wagon_dark_3'],
      rocky: ['wagon_rock_0', 'wagon_rock_1', 'wagon_rock_2', 'wagon_rock_3'],
      void: ['wagon_void_0', 'wagon_void_1', 'wagon_void_2', 'wagon_void_3'],
    };
    const textures = textureMaps[this.worldConfig.textureSet] || textureMaps.space;
    const texIndex = this.index % textures.length;
    return this.scene.textures.exists(textures[texIndex]) ? textures[texIndex] : `wagon_${this.index % 10}`;
  }

  setupPhysics() {
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.enable = false;
    this.sprite.setCircle(16);
  }

  setupVisuals() {
    this.sprite.setTint(this.worldConfig.color);
    this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    
    if (this.index % 3 === 0 && this.worldType === 1) {
      this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 28, this.worldConfig.glowColor, 0.35);
      this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
      this.glowEffect.setDepth(4);
    }
  }

  createTrail() {
    this.trailEmitter = this.scene.add.particles(0, 0, 'flare', {
      speed: { min: 12, max: 28 },
      scale: { start: 0.22, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 250,
      quantity: 1,
      frequency: 40,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.worldConfig.color,
      follow: this.sprite,
      followOffset: { x: -18, y: 0 }
    });
  }

  getMaxHealth() {
    let baseHealth = 1;
    const upgradeLevel = gameManager.getUpgradeLevel?.('wagonHP') || 0;
    baseHealth += upgradeLevel;
    return Math.max(1, baseHealth);
  }

  createMultiplierIndicator() {
    this.multiplierIndicator = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 38,
      `x${this.coinMultiplier.toFixed(1)}`,
      {
        fontSize: '13px',
        fontFamily: "'Audiowide', sans-serif",
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { blur: 6, color: '#ffaa00', fill: true }
      }
    ).setOrigin(0.5).setDepth(21);
  }

  updateMultiplierIndicator() {
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 38);
      const intensity = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
      this.multiplierIndicator.setAlpha(intensity);
    }
  }

  applyWorldVisuals() {
    if (this.worldType === 1 && this.glowEffect) {
      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.6 },
        scale: { from: 1, to: 1.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        onUpdate: () => {
          if (this.glowEffect && this.sprite?.active) {
            this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
          }
        }
      });
    }
  }

  animateSpawn() {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0);
    if (this.multiplierIndicator) this.multiplierIndicator.setAlpha(0);
    
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scaleX: 0.92,
      scaleY: 0.92,
      duration: 400,
      ease: 'Back.out',
      onUpdate: () => {
        if (this.multiplierIndicator) {
          this.multiplierIndicator.setPosition(this.sprite.x, this.sprite.y - 38);
          this.multiplierIndicator.setAlpha(this.sprite.alpha);
        }
      },
      onComplete: () => {
        if (this.trailEmitter) this.trailEmitter.start();
      }
    });
  }

  playSpawnSound() {
    try { audioManager.playSound(this.scene, 'wagon_spawn', 0.35); } catch(e) {}
  }

  setHP(hp, maxHp) {
    this.hp = hp;
    this.maxHp = maxHp;
  }

  takeDamage(amount = 1) {
    if (this.protectionFrames > 0 || !this.isConnected || this.hp <= 0) return false;
    
    this.hp -= amount;
    
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    
    this.protectionFrames = this.protectionDuration;
    this.showDamageEffect();
    this.playDamageSound();
    return false;
  }

  showDamageEffect() {
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite?.active) this.sprite.setTint(this.worldConfig.color);
    });
    
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.circle(
        this.sprite.x + Phaser.Math.Between(-20, 20),
        this.sprite.y + Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(2, 4),
        this.worldConfig.particleColor,
        0.8
      );
      spark.setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0,
        x: spark.x + Phaser.Math.Between(-50, 50),
        y: spark.y + Phaser.Math.Between(-50, 50),
        duration: 400,
        onComplete: () => spark.destroy()
      });
    }
  }

  playDamageSound() {
    try { audioManager.playSound(this.scene, 'hit_sound', 0.25); } catch(e) {}
  }

  update(prevX, prevY, gap) {
    if (!this.sprite?.active) {
      this.active = false;
      return;
    }
    
    this.followDistance = gap;
    
    if (this.protectionFrames > 0) {
      this.protectionFrames -= 16;
      this.sprite.setAlpha(this.protectionFrames % 100 < 50 ? 0.6 : 1);
    } else {
      this.sprite.setAlpha(1);
    }
    
    const targetX = prevX - this.followDistance;
    const targetY = prevY;
    
    const dx = targetX - this.pos.x;
    const dy = targetY - this.pos.y;
    
    this.vel.x += dx * this.springStrength;
    this.vel.y += dy * this.springStrength;
    
    this.vel.x *= this.damping;
    this.vel.y *= this.damping;
    
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    
    this.sprite.x = this.pos.x;
    this.sprite.y = this.pos.y;
    
    const wobble = Math.sin(Date.now() * 0.005 + this.index) * 1.2;
    this.sprite.y += wobble;
    
    if (Math.abs(this.vel.x) > 0.2 || Math.abs(this.vel.y) > 0.2) {
      const moveAngle = Math.atan2(this.vel.y, this.vel.x);
      this.sprite.rotation += (moveAngle * 0.3 - this.sprite.rotation) * 0.1;
    } else {
      this.sprite.rotation *= 0.98;
    }
    
    this.updateMultiplierIndicator();
    
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  updateMultiplierAfterDetach(newIndex) {
    this.index = newIndex;
    this.coinMultiplier = 1 + (this.index + 1) * 0.5;
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setText(`x${this.coinMultiplier.toFixed(1)}`);
    }
  }

  getCurrentMultiplier() {
    return this.isConnected ? this.coinMultiplier : 1;
  }

  detach() {
    this.isConnected = false;
    this.sprite.setTint(0x666666);
    if (this.multiplierIndicator) {
      this.multiplierIndicator.setColor('#888888');
      this.multiplierIndicator.setText(`x1.0`);
    }
    this.playDetachSound();
    
    this.vel.x = -200;
    this.vel.y = Phaser.Math.Between(-80, 80);
  }

  playDetachSound() {
    try { audioManager.playSound(this.scene, 'wagon_destroy', 0.45); } catch(e) {}
  }

  destroy() {
    if (this.trailEmitter) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      if (this._isDestroying) return;
      this._isDestroying = true;
    }
    if (this.glowEffect) this.glowEffect.destroy();
    if (this.multiplierIndicator) this.multiplierIndicator.destroy();
    
    if (this.sprite?.active) {
      if (this.scene.particleManager) {
        this.scene.particleManager.createWagonDestroyEffect(this.sprite);
      }
      try { audioManager.playSound(this.scene, 'wagon_destroy', 0.55); } catch(e) {}
      this.sprite.destroy();
    }
    this.active = false;
  }

  getPosition() { return { x: this.sprite.x, y: this.sprite.y }; }
  getHealth() { return this.hp; }
  getMaxHealth() { return this.maxHp; }
  getMultiplier() { return this.getCurrentMultiplier(); }
  getIndex() { return this.index; }
  isActive() { return this.active && this.sprite?.active && this.isConnected; }
  isConnected() { return this.isConnected; }
}