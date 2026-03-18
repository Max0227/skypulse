import Phaser from 'phaser';
import { COLORS } from '../config';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('gameover'); }

  init(data) { this.resultData = data; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('gameover_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'gameover_bg').setOrigin(0);
    this.add.text(w/2, h*0.15, 'ИГРА ОКОНЧЕНА', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.danger, stroke:COLORS.secondary, strokeThickness:3, align:'center' }).setOrigin(0.5);
    const stats = `\n🎯 Счёт: ${this.resultData.score}\n⭐ Уровень: ${this.resultData.level}\n🚃 Вагонов: ${this.resultData.wagons}\n💎 Кристаллов: ${this.resultData.crystals}\n`;
    this.add.text(w/2, h*0.40, stats, { fontSize:'18px', fontFamily:"'Space Mono', monospace", color:COLORS.text_primary, align:'center', lineSpacing:10 }).setOrigin(0.5);
    this.createButton(w/2, h*0.65, 'ГЛАВНОЕ МЕНЮ', () => this.scene.start('menu'));
  }

  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'18px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:30,y:10}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}