import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { QuestSystem } from '../systems/QuestSystem';

export class QuestsScene extends Phaser.Scene {
  constructor() { super('quests'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('quests_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'quests_bg').setOrigin(0);
    this.add.text(w/2,30,'ЕЖЕДНЕВНЫЕ КВЕСТЫ', { fontSize:'32px', fontFamily, color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);

    const questSystem = new QuestSystem();
    let y = 100;
    questSystem.quests.forEach(q => {
      const isCompleted = q.progress >= q.target;
      const isClaimed = q.progress === -1;
      const color = isClaimed ? COLORS.text_muted : (isCompleted ? COLORS.success : COLORS.text_primary);
      const bg = this.add.rectangle(w/2, y, w-40, 50, 0x1a1a3a).setStrokeStyle(2, color);
      this.add.text(20, y-15, `${q.name}`, { fontSize:'14px', fontFamily, color: color }).setOrigin(0,0.5);
      this.add.text(20, y+10, `${q.progress < 0 ? 'Выполнено' : q.progress + '/' + q.target}`, { fontSize:'12px', fontFamily, color: color }).setOrigin(0,0.5);
      this.add.text(w-80, y, `${q.reward} 💎`, { fontSize:'14px', fontFamily, color: color }).setOrigin(0,0.5);
      
      if (isCompleted && !isClaimed) {
        const claimBtn = this.add.text(w-40, y, '[ВЗЯТЬ]', { fontSize:'12px', fontFamily, color:'#00ff00', backgroundColor:'#1a1a3a', padding:{x:5,y:2} }).setInteractive().setOrigin(0.5,0.5).on('pointerdown', () => {
          if (questSystem.claimReward(q.id)) {
            this.scene.restart();
          }
        });
      }
      y += 60;
    });

    this.createButton(w/2, h-40, 'НАЗАД', ()=>this.scene.start('menu'));
  }

  createButton(x,y,t,c) {
    const btn = this.add.text(x,y,t, { fontSize:'16px', fontFamily:"'Orbitron', sans-serif", color:COLORS.primary, backgroundColor:'#1a1a3a', padding:{x:20,y:8}, stroke:COLORS.primary, strokeThickness:2 }).setOrigin(0.5).setInteractive().on('pointerover',function(){this.setStyle({color:COLORS.text_primary, backgroundColor:COLORS.primary}); this.setScale(1.05);}).on('pointerout',function(){this.setStyle({color:COLORS.primary, backgroundColor:'#1a1a3a'}); this.setScale(1);}).on('pointerdown',c);
    return btn;
  }
}