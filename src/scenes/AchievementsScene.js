import Phaser from 'phaser';
import { COLORS, ACHIEVEMENTS } from '../config';
import { gameManager } from '../managers/GameManager';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super('achievements'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('achievements_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'achievements_bg').setOrigin(0);
    this.add.text(w/2,30,'ДОСТИЖЕНИЯ', { fontSize:'40px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);
    let y = 100;
    for (let key in ACHIEVEMENTS) {
      const ach = ACHIEVEMENTS[key];
      const unlocked = gameManager.data.achievements[key] !== undefined;
      const color = unlocked ? COLORS.accent : COLORS.text_muted;
      const bg = this.add.rectangle(w/2, y, w-40, 40, 0x1a1a3a).setStrokeStyle(2, color);
      this.add.text(20, y-10, `${ach.icon} ${ach.name}`, { fontSize:'14px', fontFamily:"'Orbitron', sans-serif", color:color }).setOrigin(0,0.5);
      this.add.text(w-20, y-10, `+${ach.reward} 💎`, { fontSize:'12px', fontFamily:"'Space Mono', monospace", color:color }).setOrigin(1,0.5);
      y += 50;
    }

    const stats = gameManager.data.stats;
    const statsText = `\nВсего игр: ${stats.totalGames}\nЛучший счёт: ${stats.maxScore}\nЛучший уровень: ${stats.maxLevel}\nВсего вагонов: ${stats.maxWagons}`;
    this.add.text(w/2, h-130, 'СТАТИСТИКА', { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:2 }).setOrigin(0.5);
    this.add.text(w/2, h-90, statsText, { fontSize:'10px', fontFamily:"'Space Mono', monospace", color:'#cccccc', align:'center' }).setOrigin(0.5);

    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }

  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}