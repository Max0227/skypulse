import Phaser from 'phaser';
import { COLORS, SHOP_UPGRADES } from '../config';
import { gameManager } from '../managers/GameManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';

export class ShopScene extends Phaser.Scene {
  constructor() { super('shop'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('shop_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'shop_bg').setOrigin(0);
    this.add.text(w/2,30,'МАГАЗИН', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);
    this.add.text(w/2,80,`💎 ${gameManager.data.crystals}`, { fontSize:'20px', fontFamily:"'Space Mono', monospace", color:COLORS.accent, stroke:'#0f172a', strokeThickness:2 }).setOrigin(0.5);

    let y = 130;
    for (let up of SHOP_UPGRADES) {
      const level = gameManager.data.upgrades[up.key] || 0;
      const cost = Math.floor(up.cost * Math.pow(1.15, level));
      const canAfford = gameManager.data.crystals >= cost && level < up.maxLevel;
      const bg = this.add.rectangle(w/2, y, w-20, 50, 0x1a1a3a).setStrokeStyle(2, canAfford ? COLORS.primary : COLORS.text_muted);
      this.add.text(20, y-15, `${up.icon} ${up.name}`, { fontSize:'14px', fontFamily:"'Orbitron', sans-serif", color:COLORS.text_primary }).setOrigin(0,0.5);
      this.add.text(20, y+10, `Уровень: ${level}/${up.maxLevel}`, { fontSize:'10px', fontFamily:"'Space Mono', monospace", color:COLORS.text_secondary }).setOrigin(0,0.5);
      this.add.text(w-20, y, `${cost} 💎`, { fontSize:'14px', fontFamily:"'Space Mono', monospace", color:canAfford?COLORS.accent:COLORS.text_muted }).setOrigin(1,0.5);
      if (canAfford) {
        bg.setInteractive().on('pointerover',()=>bg.setFillStyle(0x2a2a4a)).on('pointerout',()=>bg.setFillStyle(0x1a1a3a)).on('pointerdown',()=>{
          gameManager.data.crystals -= cost;
          gameManager.data.upgrades[up.key] = (gameManager.data.upgrades[up.key] || 0) + 1;
          gameManager.save();
          this.scene.restart();
        });
      }
      y += 60;
    }
    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }

  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}