import { gameManager } from '../managers/GameManager';

export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
    this.hitCooldown = 0;
    this.hitCooldownTime = 500; // мс
  }

  playerHitByEnemy(player, enemy) {
    if (player.shieldActive) {
      this.createShieldDeflect(enemy.sprite.x, enemy.sprite.y);
      player.body.setVelocityY(-200);
      return;
    }

    if (this.hitCooldown > 0) return;
    this.hitCooldown = this.hitCooldownTime;

    player.headHP -= enemy.config.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    
    try { this.scene.sound.play('hit_sound', { volume: 0.3 }); } catch (e) {}
    
    if (gameManager.data.vibrationEnabled && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  playerHitByBullet(player, bullet) {
    if (player.shieldActive) {
      this.createShieldDeflect(bullet.x, bullet.y);
      bullet.destroy();
      return;
    }

    if (this.hitCooldown > 0) return;
    this.hitCooldown = this.hitCooldownTime;

    player.headHP -= bullet.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    
    try { this.scene.sound.play('hit_sound', { volume: 0.3 }); } catch (e) {}
    
    bullet.destroy();
    
    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  enemyHitByBullet(enemy, bullet) {
    const killed = enemy.takeDamage(bullet.damage);
    
    this.scene.particleManager.createAttackEffect(enemy.sprite.x, enemy.sprite.y);
    
    if (killed) {
      this.scene.crystals += enemy.config.scoreValue;
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      gameManager.addCrystals(enemy.config.scoreValue);
      
      if (this.scene.levelGoal) {
        this.scene.levelGoal.enemyKilled();
      }
      
      try { this.scene.sound.play('enemy_die_sound', { volume: 0.3 }); } catch (e) {}
    }
    
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    let hp = wagon.getData('hp') - 1;
    
    if (hp <= 0) {
      this.scene.wagons = this.scene.wagons.filter(w => w !== wagon);
      this.scene.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
      
      this.scene.targetPlayerX = Math.max(110, this.scene.targetPlayerX - this.scene.wagonGap * 0.5);
      this.scene.cameras.main.shake(150, 0.008);
      
      try { this.scene.sound.play('hit_sound', { volume: 0.4 }); } catch (e) {}
    } else {
      wagon.setData('hp', hp);
      
      this.scene.tweens.add({
        targets: wagon,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
      
      try { this.scene.sound.play('hit_sound', { volume: 0.2 }); } catch (e) {}
    }
    
    this.scene.wagonCountText.setText(`🚃 ${this.scene.wagons.length}/${this.scene.maxWagons}`);
  }

  enemyHitByWagon(enemy, wagon) {
    if (enemy.takeDamage(1)) {
      this.scene.crystals += enemy.config.scoreValue;
      this.scene.crystalText.setText(`💎 ${this.scene.crystals}`);
      gameManager.addCrystals(enemy.config.scoreValue);
      
      if (this.scene.levelGoal) {
        this.scene.levelGoal.enemyKilled();
      }
    }
  }

  createShieldDeflect(x, y) {
    this.scene.particleManager.createBonusEffect('shield', x, y);
    
    try { this.scene.sound.play('shield_sound', { volume: 0.3 }); } catch (e) {}
  }

  update(delta) {
    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
  }
}