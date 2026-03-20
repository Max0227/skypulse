import { gameManager } from './GameManager';

export class AudioManager {
  constructor() {
    this.music = null;
    this.sounds = {};
    this.musicVolume = 0.3;
    this.soundVolume = 0.5;
    this.context = null;
    this.musicKey = 'bg_music';
    this.currentMusic = null;
    this.isMuted = false;
    this.loadedSounds = new Set();
    this.pendingSounds = new Map();
    this.fadeTimers = [];
    this.soundCategories = {
      ui: ['tap_sound', 'purchase_sound', 'level_up_sound'],
      gameplay: ['coin_sound', 'item_sound', 'wagon_sound', 'hit_sound', 'revive_sound'],
      powerups: ['powerup_sound', 'shield_sound', 'magnet_sound', 'slow_sound', 'speed_sound'],
      combat: ['shoot_sound', 'explosion_sound', 'enemy_die_sound'],
      ambient: ['bg_music'],
      events: ['gameover_sound', 'win_sound']
    };
    
    // Маппинг файлов к ключам (на основе скриншота)
    this.soundFiles = [
      { key: 'coin_sound', file: 'sounds/coin.mp3', category: 'gameplay', description: 'Монета' },
      { key: 'item_sound', file: 'sounds/item.mp3', category: 'gameplay', description: 'Предмет' },
      { key: 'tap_sound', file: 'sounds/tap.mp3', category: 'ui', description: 'Нажатие' },
      { key: 'wagon_sound', file: 'sounds/wagon.mp3', category: 'gameplay', description: 'Вагон' },
      { key: 'level_up_sound', file: 'sounds/level_up.mp3', category: 'ui', description: 'Уровень' },
      { key: 'purchase_sound', file: 'sounds/purchase.mp3', category: 'ui', description: 'Покупка' },
      { key: 'revive_sound', file: 'sounds/revive.mp3', category: 'gameplay', description: 'Воскрешение' },
      { key: 'bg_music', file: 'sounds/fifth_element_theme.mp3', category: 'ambient', description: 'Фоновая музыка' },
      { key: 'shoot_sound', file: 'sounds/shoot.mp3', category: 'combat', description: 'Выстрел' },
      { key: 'explosion_sound', file: 'sounds/explosion.mp3', category: 'combat', description: 'Взрыв' },
      { key: 'hit_sound', file: 'sounds/hit.mp3', category: 'gameplay', description: 'Удар' },
      { key: 'powerup_sound', file: 'sounds/powerup.mp3', category: 'powerups', description: 'Усилитель' },
      { key: 'shield_sound', file: 'sounds/shield.mp3', category: 'powerups', description: 'Щит' },
      { key: 'magnet_sound', file: 'sounds/magnet.mp3', category: 'powerups', description: 'Магнит' },
      { key: 'slow_sound', file: 'sounds/slow.mp3', category: 'powerups', description: 'Замедление' },
      { key: 'speed_sound', file: 'sounds/speed.mp3', category: 'powerups', description: 'Скорость' },
      { key: 'gameover_sound', file: 'sounds/gameover.mp3', category: 'events', description: 'Поражение' },
      { key: 'win_sound', file: 'sounds/win.mp3', category: 'events', description: 'Победа' },
      { key: 'enemy_die_sound', file: 'sounds/enemy_die.mp3', category: 'combat', description: 'Смерть врага' },
    ];
    
    // Создаем карту для быстрого доступа
    this.soundMap = new Map(this.soundFiles.map(s => [s.key, s]));
  }

  init(scene) {
    this.context = scene.sound.context;
    console.log('🎧 AudioManager initialized');
    
    // Восстанавливаем состояние
    if (gameManager.data.musicEnabled) {
      this.playMusic(scene);
    }
  }

  // =========================================================================
  // ЗАГРУЗКА ЗВУКОВ
  // =========================================================================

  preloadSounds(scene) {
    console.log('🎧 Preloading sounds...');
    
    this.soundFiles.forEach(sound => {
      try {
        scene.load.audio(sound.key, sound.file);
        console.log(`  📦 ${sound.key} -> ${sound.file}`);
      } catch (e) {
        console.warn(`⚠️ Failed to load sound ${sound.key}:`, e);
      }
    });
  }

  getLoadedCount() {
    return this.loadedSounds.size;
  }

  getTotalCount() {
    return this.soundFiles.length;
  }

  isFullyLoaded() {
    return this.loadedSounds.size === this.soundFiles.length;
  }

  // =========================================================================
  // МУЗЫКА
  // =========================================================================

  playMusic(scene, key = 'bg_music', volume = 0.4) {
    if (!gameManager.data.musicEnabled || this.isMuted) return;
    
    try {
      if (!scene.cache.audio.has(key)) {
        console.warn(`⚠️ Music file "${key}" not found in cache`);
        return;
      }
      
      this.musicKey = key;
      
      // Если музыка уже играет, плавно меняем
      if (this.music && this.music.isPlaying) {
        this.fadeOutMusic(() => {
          this.playNewMusic(scene, key, volume);
        });
      } else {
        this.playNewMusic(scene, key, volume);
      }
    } catch (e) {
      console.warn('⚠️ Music playback error:', e);
    }
  }

  playNewMusic(scene, key, volume) {
    try {
      this.music = scene.sound.add(key, { 
        loop: true, 
        volume: 0 
      });
      
      this.currentMusic = key;
      
      this.resumeAudioContext(scene, () => {
        this.music.play();
        this.fadeInMusic(volume, 1000);
      });
    } catch (e) {
      console.warn('Failed to play new music:', e);
    }
  }

  fadeInMusic(targetVolume = 0.4, duration = 1000) {
    if (!this.music) return;
    
    this.music.setVolume(0);
    
    const timer = setInterval(() => {
      const currentVol = this.music.volume;
      const step = targetVolume / (duration / 50);
      
      if (currentVol < targetVolume) {
        this.music.setVolume(Math.min(currentVol + step, targetVolume));
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    this.fadeTimers.push(timer);
  }

  fadeOutMusic(callback, duration = 1000) {
    if (!this.music) {
      if (callback) callback();
      return;
    }
    
    const startVol = this.music.volume;
    const timer = setInterval(() => {
      const currentVol = this.music.volume;
      const step = startVol / (duration / 50);
      
      if (currentVol > 0) {
        this.music.setVolume(Math.max(currentVol - step, 0));
      } else {
        clearInterval(timer);
        this.music.stop();
        if (callback) callback();
      }
    }, 50);
    
    this.fadeTimers.push(timer);
  }

  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  pauseMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }

  resumeMusic(scene) {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    } else {
      this.playMusic(scene, this.musicKey);
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.setVolume(this.musicVolume);
    }
  }

  // =========================================================================
  // ЗВУКОВЫЕ ЭФФЕКТЫ
  // =========================================================================

  playSound(scene, key, volume = 0.5, options = {}) {
    if (!gameManager.data.soundEnabled || this.isMuted) return;
    
    const soundInfo = this.soundMap.get(key);
    
    try {
      if (!scene.cache.audio.has(key)) {
        if (options.required) {
          console.warn(`⚠️ Required sound "${key}" not loaded`);
        }
        return;
      }
      
      this.resumeAudioContext(scene, () => {
        let sound;
        
        if (options.loop) {
          sound = scene.sound.add(key, { 
            volume: volume * this.soundVolume,
            loop: true
          });
        } else {
          if (!this.sounds[key] || options.forceNew) {
            this.sounds[key] = scene.sound.add(key, { 
              volume: volume * this.soundVolume 
            });
          }
          sound = this.sounds[key];
        }
        
        if (options.delay) {
          scene.time.delayedCall(options.delay * 1000, () => {
            sound.play();
          });
        } else {
          sound.play();
        }
        
        // Логирование для отладки
        if (options.debug) {
          console.log(`🔊 Playing: ${key} (${soundInfo?.description || 'unknown'})`);
        }
      });
    } catch (e) {
      // Игнорируем ошибки звука в production
    }
  }

  playRandomSound(scene, keys, volume = 0.5, options = {}) {
    if (!keys || keys.length === 0) return;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.playSound(scene, randomKey, volume, options);
  }

  playCategorySound(scene, category, volume = 0.5) {
    const keys = this.soundCategories[category];
    if (keys && keys.length > 0) {
      this.playRandomSound(scene, keys, volume);
    }
  }

  stopSound(key) {
    if (this.sounds[key] && this.sounds[key].isPlaying) {
      this.sounds[key].stop();
    }
  }

  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    });
  }

  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    
    for (let key in this.sounds) {
      if (this.sounds[key]) {
        this.sounds[key].setVolume(this.soundVolume);
      }
    }
  }

  // =========================================================================
  // КАТЕГОРИИ ЗВУКОВ
  // =========================================================================

  playUISound(scene, key = 'tap_sound') {
    this.playSound(scene, key, 0.3);
  }

  playGameplaySound(scene, key = 'coin_sound') {
    this.playSound(scene, key, 0.5);
  }

  playPowerupSound(scene, type) {
    const powerupSounds = {
      shield: 'shield_sound',
      magnet: 'magnet_sound',
      slow: 'slow_sound',
      speed: 'speed_sound'
    };
    const key = powerupSounds[type] || 'powerup_sound';
    this.playSound(scene, key, 0.6);
  }

  playCombatSound(scene, type = 'shoot') {
    const combatSounds = {
      shoot: 'shoot_sound',
      explosion: 'explosion_sound',
      enemyDie: 'enemy_die_sound',
      hit: 'hit_sound'
    };
    const key = combatSounds[type] || 'shoot_sound';
    this.playSound(scene, key, 0.5);
  }

  // =========================================================================
  // УПРАВЛЕНИЕ
  // =========================================================================

  mute() {
    this.isMuted = true;
    this.stopMusic();
    this.stopAllSounds();
    console.log('🔇 Audio muted');
  }

  unmute(scene) {
    this.isMuted = false;
    if (gameManager.data.musicEnabled) {
      this.playMusic(scene);
    }
    console.log('🔊 Audio unmuted');
  }

  toggleMute(scene) {
    if (this.isMuted) {
      this.unmute(scene);
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  resumeAudioContext(scene, callback) {
    if (scene.sound.context.state === 'suspended') {
      scene.sound.context.resume().then(() => {
        if (callback) callback();
      }).catch(e => console.warn('Failed to resume audio context:', e));
    } else {
      if (callback) callback();
    }
  }

  // =========================================================================
  // ИНФОРМАЦИЯ
  // =========================================================================

  getSoundInfo(key) {
    return this.soundMap.get(key);
  }

  listSounds() {
    console.log('🎧 Available sounds:');
    this.soundFiles.forEach(sound => {
      const status = this.loadedSounds.has(sound.key) ? '✅' : '⏳';
      console.log(`  ${status} ${sound.key} - ${sound.description} (${sound.category})`);
    });
  }

  getStats() {
    return {
      loaded: this.loadedSounds.size,
      total: this.soundFiles.length,
      musicPlaying: this.music?.isPlaying || false,
      currentMusic: this.currentMusic,
      muted: this.isMuted,
      musicEnabled: gameManager.data.musicEnabled,
      soundEnabled: gameManager.data.soundEnabled
    };
  }

  // =========================================================================
  // ОЧИСТКА
  // =========================================================================

  cleanup() {
    this.fadeTimers.forEach(timer => clearInterval(timer));
    this.fadeTimers = [];
    this.stopAllSounds();
    this.stopMusic();
    this.sounds = {};
    this.loadedSounds.clear();
    this.pendingSounds.clear();
    console.log('🧹 AudioManager cleaned up');
  }

  destroy() {
    this.cleanup();
    this.soundMap.clear();
    console.log('💥 AudioManager destroyed');
  }
}

export const audioManager = new AudioManager();
window.audioManager = audioManager;

// Автоматическая инициализация при загрузке страницы
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('🎧 AudioManager ready');
  });
}