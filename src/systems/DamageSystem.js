import { gameManager } from '../managers/GameManager';

export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
  }

  playerHitByEnemy(player, enemy) {
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', enemy.sprite.x, enemy.sprite.y);
      player.body.setVelocityY(-100);
      return;
    }

    player.headHP -= enemy.config.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    this.scene.hitSound.play();
    if (gameManager.data.vibrationEnabled && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  playerHitByBullet(player, bullet) {
    if (player.shieldActive) {
      this.scene.particleManager.createBonusEffect('shield', bullet.x, bullet.y);
      bullet.destroy();
      return;
    }

    player.headHP -= bullet.damage;
    this.scene.updateHearts();
    this.scene.cameras.main.shake(150, 0.005);
    this.scene.hitSound.play();
    bullet.destroy();
    if (player.headHP <= 0) {
      this.scene.handleDeath();
    }
  }

  enemyHitByBullet(enemy, bullet) {
    if (enemy.takeDamage(bullet.damage)) {
        this.scene.crystals += enemy.config.scoreValue;
        this.scene.crystalText.setText('Crystals: ' + this.scene.crystals);
    }
    this.scene.particleManager.createAttackEffect(enemy.sprite.x, enemy.sprite.y);
    bullet.destroy();
  }

  wagonHitByEnemy(wagon, enemy) {
    let hp = wagon.getData('hp') - 1;
    if (hp <= 0) {
      this.scene.wagons = this.scene.wagons.filter(w => w !== wagon);
      this.scene.particleManager.createWagonDestroyEffect(wagon);
      wagon.destroy();
    } else {
      wagon.setData('hp', hp);
      this.scene.tweens.add({
        targets: wagon,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    }
  }

  enemyHitByWagon(enemy, wagon) {
    if (enemy.takeDamage(1)) {}
  }

  enemyAttackPlayer(enemy, playerPos) {
    this.playerHitByEnemy(this.scene.player, enemy);
  }
}