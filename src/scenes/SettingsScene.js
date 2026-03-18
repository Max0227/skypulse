import Phaser from 'phaser';
import { COLORS } from '../config';
import { gameManager } from '../managers/GameManager';
import { audioManager } from '../managers/AudioManager';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('settings'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const fontFamily = "'Orbitron', 'Audiowide', 'Rajdhani', 'Share Tech Mono', monospace";
    const gradient = this.make.graphics({ x:0,y:0,add:false });
    gradient.fillGradientStyle(0x030712,0x030712,0x0a0a1a,0x0a0a1a,1);
    gradient.fillRect(0,0,w,h);
    gradient.generateTexture('settings_bg',w,h);
    gradient.destroy();
    this.add.image(0,0,'settings_bg').setOrigin(0);
    this.add.text(w/2,40,'НАСТРОЙКИ', { fontSize:'36px', fontFamily, color:COLORS.primary, stroke:COLORS.secondary, strokeThickness:3 }).setOrigin(0.5);

    let y = 120;
    this.createToggle(w/2, y, 'Звук', gameManager.data.soundEnabled, (v) => { gameManager.data.soundEnabled = v; gameManager.save(); }); y+=70;
    this.createToggle(w/2, y, 'Музыка', gameManager.data.musicEnabled, (v) => { gameManager.data.musicEnabled = v; gameManager.save(); }); y+=70;
    this.createToggle(w/2, y, 'Вибрация', gameManager.data.vibrationEnabled, (v) => { gameManager.data.vibrationEnabled = v; gameManager.save(); }); y+=70;
    this.createButton(w/2, y, 'ОЧИСТИТЬ ДАННЫЕ', () => this.confirmClearData(), 'danger'); y+=70;
    this.createButton(w/2, h-50, 'НАЗАД', () => this.scene.start('menu'));
  }

  createToggle(x,y,label,init,cb) {
    const bg = this.add.rectangle(x,y,250,50,0x1a1a3a).setStrokeStyle(2,COLORS.primary);
    this.add.text(x-100,y,label,{ fontSize:'16px', fontFamily:"'Orbitron', monospace", color:COLORS.text_primary }).setOrigin(0,0.5);
    const toggleBg = this.add.rectangle(x+80,y,60,30,init?0x00aa00:0xaa0000).setStrokeStyle(2,COLORS.primary).setInteractive().on('pointerdown',()=>{
      init = !init;
      toggleBg.setFillStyle(init?0x00aa00:0xaa0000);
      toggleText.setText(init?'ВКЛ':'ВЫКЛ');
      cb(init);
    });
    const toggleText = this.add.text(x+80,y,init?'ВКЛ':'ВЫКЛ',{ fontSize:'12px', fontFamily:"'Orbitron', monospace", color:'#ffffff' }).setOrigin(0.5);
  }

  createButton(x,y,t,c,type='normal') {
    const colors = { normal:{bg:'#1a1a3a',text:COLORS.primary}, danger:{bg:'#3a1a1a',text:'#ff4444'} };
    const col = colors[type];
    const btn = this.add.text(x,y,t,{ fontSize:'16px', fontFamily:"'Orbitron', monospace", color:col.text, backgroundColor:col.bg, padding:{x:20,y:10}, stroke:col.text, strokeThickness:2 }).setOrigin(0.5).setInteractive()
      .on('pointerover',function(){this.setStyle({color:'#ffffff',backgroundColor:col.text}); this.setScale(1.05);})
      .on('pointerout',function(){this.setStyle({color:col.text,backgroundColor:col.bg}); this.setScale(1);})
      .on('pointerdown',c);
  }

  confirmClearData() {
    const w=this.scale.width,h=this.scale.height;
    const ov=this.add.rectangle(w/2,h/2,w,h,0x000000,0.7).setDepth(50).setScrollFactor(0);
    const pn=this.add.rectangle(w/2,h/2,280,150,0x0a0a1a,0.95).setStrokeStyle(2,COLORS.danger).setDepth(51).setScrollFactor(0);
    const tx=this.add.text(w/2,h/2-30,'Очистить все данные?',{ fontSize:'16px', fontFamily:"'Orbitron', monospace", color:COLORS.danger }).setOrigin(0.5).setDepth(52).setScrollFactor(0);
    const yes=this.add.text(w/2-60,h/2+30,'ДА',{ fontSize:'14px', fontFamily:"'Orbitron', monospace", color:'#00ff00', backgroundColor:'#1a1a3a', padding:{x:15,y:5} }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0).on('pointerdown',()=>{ localStorage.clear(); location.reload(); });
    const no=this.add.text(w/2+60,h/2+30,'НЕТ',{ fontSize:'14px', fontFamily:"'Orbitron', monospace", color:'#ff0000', backgroundColor:'#1a1a3a', padding:{x:15,y:5} }).setInteractive().setOrigin(0.5).setDepth(52).setScrollFactor(0).on('pointerdown',()=>{ ov.destroy(); pn.destroy(); tx.destroy(); yes.destroy(); no.destroy(); });
  }
}