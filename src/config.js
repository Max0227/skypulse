export const COLORS = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#ffaa00',
  success: '#00ff00',
  danger: '#ff0000',
  warning: '#ffaa00',
  bg_dark: '#0a0a1a',
  bg_darker: '#030712',
  text_primary: '#ffffff',
  text_secondary: '#cbd5e1',
  text_muted: '#64748b',
};

export const DIFFICULTY_CURVE = {
  0: { speed: 240, gap: 240, spawnDelay: 1500, coinChance: 0.8, asteroidChance: 0.3, powerUpChance: 0.1 },
  1: { speed: 260, gap: 235, spawnDelay: 1450, coinChance: 0.8, asteroidChance: 0.32, powerUpChance: 0.11 },
  2: { speed: 280, gap: 230, spawnDelay: 1400, coinChance: 0.8, asteroidChance: 0.34, powerUpChance: 0.12 },
  3: { speed: 300, gap: 225, spawnDelay: 1350, coinChance: 0.8, asteroidChance: 0.36, powerUpChance: 0.13 },
  4: { speed: 320, gap: 220, spawnDelay: 1300, coinChance: 0.8, asteroidChance: 0.38, powerUpChance: 0.14 },
  5: { speed: 340, gap: 215, spawnDelay: 1250, coinChance: 0.8, asteroidChance: 0.4, powerUpChance: 0.15 },
  6: { speed: 360, gap: 210, spawnDelay: 1200, coinChance: 0.8, asteroidChance: 0.42, powerUpChance: 0.16 },
  7: { speed: 380, gap: 205, spawnDelay: 1150, coinChance: 0.8, asteroidChance: 0.44, powerUpChance: 0.17 },
  8: { speed: 400, gap: 200, spawnDelay: 1100, coinChance: 0.8, asteroidChance: 0.46, powerUpChance: 0.18 },
  9: { speed: 420, gap: 195, spawnDelay: 1050, coinChance: 0.8, asteroidChance: 0.48, powerUpChance: 0.19 },
  10: { speed: 440, gap: 190, spawnDelay: 1000, coinChance: 0.8, asteroidChance: 0.5, powerUpChance: 0.2 },
};

export const SHOP_UPGRADES = [
  { key: 'jumpPower', name: 'Сила прыжка', icon: '🚀', maxLevel: 20 },
  { key: 'gravity', name: 'Гравитация', icon: '⬇️', maxLevel: 20 },
  { key: 'shieldDuration', name: 'Длительность щита', icon: '🛡️', maxLevel: 15 },
  { key: 'magnetRange', name: 'Радиус магнита', icon: '🧲', maxLevel: 15 },
  { key: 'wagonHP', name: 'Прочность вагонов', icon: '💪', maxLevel: 20 },
  { key: 'maxWagons', name: 'Макс. вагонов', icon: '🚃', maxLevel: 15 },
  { key: 'wagonGap', name: 'Дистанция вагонов', icon: '📏', maxLevel: 15 },
  { key: 'headHP', name: 'Макс. здоровье', icon: '❤️', maxLevel: 15 },
  { key: 'revival', name: 'Воскрешение', icon: '🔄', maxLevel: 5 },
];

export const ACHIEVEMENTS = {
  first_wagon: { id: 'first_wagon', name: 'Первый вагон', icon: '🚃', reward: 10 },
  five_wagons: { id: 'five_wagons', name: '5 вагонов', icon: '🚃🚃', reward: 25 },
  ten_wagons: { id: 'ten_wagons', name: '10 вагонов', icon: '🚃🚃🚃', reward: 50 },
  world_1_complete: { id: 'world_1_complete', name: 'Покоритель космоса', icon: '🌌', reward: 100 },
  world_2_complete: { id: 'world_2_complete', name: 'Кибер-самурай', icon: '👾', reward: 200 },
  world_3_complete: { id: 'world_3_complete', name: 'Хозяин подземелий', icon: '🗝️', reward: 300 },
  score_1000: { id: 'score_1000', name: '1000 очков', icon: '🏆', reward: 100 },
  no_damage: { id: 'no_damage', name: 'Безопасный полёт', icon: '❤️', reward: 50 },
};

export const UPGRADE_COSTS = {
  jumpPower: { base: 10, multiplier: 1.2 },
  gravity: { base: 15, multiplier: 1.2 },
  shieldDuration: { base: 20, multiplier: 1.25 },
  magnetRange: { base: 20, multiplier: 1.25 },
  wagonHP: { base: 25, multiplier: 1.2 },
  maxWagons: { base: 30, multiplier: 1.3 },
  wagonGap: { base: 30, multiplier: 1.25 },
  headHP: { base: 40, multiplier: 1.25 },
  revival: { base: 50, multiplier: 1.5 },
};

export const LEVEL_CONFIG = {
  0: {
    name: 'КОСМОС',
    bgColor: 0x0a0a1a,
    gateColors: ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'],
    description: 'Начни свой путь в открытом космосе',
    goalScore: 500,
    unlockPrice: 0,
  },
  1: {
    name: 'КИБЕРПАНК',
    bgColor: 0x1a0a2a,
    gateColors: ['gate_purple', 'gate_blue', 'gate_green', 'gate_yellow', 'gate_red'],
    description: 'Неоновые огни киберпанка',
    goalScore: 800,
    unlockPrice: 200,
  },
  2: {
    name: 'ПОДЗЕМЕЛЬЕ',
    bgColor: 0x2a1a0a,
    gateColors: ['gate_red', 'gate_yellow', 'gate_green', 'gate_blue', 'gate_purple'],
    description: 'Тёмные коридоры подземелья',
    goalScore: 1200,
    unlockPrice: 400,
  },
};

// ===== КРУТЫЕ СКИНЫ С УНИКАЛЬНЫМ ДИЗАЙНОМ =====
export const SKINS = [
  { 
    id: 'default', 
    name: 'КЛАССИКА', 
    price: 0, 
    texture: 'skin_default', 
    description: 'Стандартное жёлтое такси',
    rarity: 'Обычный',
    color: 0xffaa00,
    shape: 'classic'
  },
  { 
    id: 'police', 
    name: 'ПОЛИЦИЯ', 
    price: 200, 
    texture: 'skin_police', 
    description: 'Полицейская машина с мигалками',
    rarity: 'Редкий',
    color: 0x2244aa,
    shape: 'police'
  },
  { 
    id: 'taxi', 
    name: 'НЬЮ-ЙОРК', 
    price: 150, 
    texture: 'skin_taxi', 
    description: 'Классическое жёлтое такси США',
    rarity: 'Обычный',
    color: 0xffcc00,
    shape: 'taxi'
  },
  { 
    id: 'cyber', 
    name: 'КИБЕРПАНК', 
    price: 500, 
    texture: 'skin_cyber', 
    description: 'Футуристическое неоновое такси',
    rarity: 'Эпический',
    color: 0xff00ff,
    shape: 'cyber'
  },
  { 
    id: 'police_cyber', 
    name: 'КИБЕРПОЛИЦИЯ', 
    price: 800, 
    texture: 'skin_police_cyber', 
    description: 'Полицейская машина будущего',
    rarity: 'Эпический',
    color: 0x00ffff,
    shape: 'police_cyber'
  },
  { 
    id: 'ambulance', 
    name: 'СКОРАЯ', 
    price: 300, 
    texture: 'skin_ambulance', 
    description: 'Машина скорой помощи',
    rarity: 'Редкий',
    color: 0xff4444,
    shape: 'ambulance'
  },
  { 
    id: 'fire', 
    name: 'ПОЖАРНАЯ', 
    price: 350, 
    texture: 'skin_fire', 
    description: 'Пожарная машина',
    rarity: 'Редкий',
    color: 0xff4400,
    shape: 'fire'
  },
  { 
    id: 'stealth', 
    name: 'СТЕЛС', 
    price: 600, 
    texture: 'skin_stealth', 
    description: 'Невидимое такси-невидимка',
    rarity: 'Эпический',
    color: 0x444444,
    shape: 'stealth'
  },
  { 
    id: 'gold', 
    name: 'ЗОЛОТОЕ', 
    price: 1000, 
    texture: 'skin_gold', 
    description: 'Роскошное золотое такси',
    rarity: 'Легендарный',
    color: 0xffaa00,
    shape: 'gold'
  },
  { 
    id: 'rainbow', 
    name: 'РАДУЖНОЕ', 
    price: 1500, 
    texture: 'skin_rainbow', 
    description: 'Переливается всеми цветами',
    rarity: 'Легендарный',
    color: 0xff44ff,
    shape: 'rainbow'
  },
  { 
    id: 'crystal', 
    name: 'КРИСТАЛЛ', 
    price: 2000, 
    texture: 'skin_crystal', 
    description: 'Сверкает как алмаз',
    rarity: 'Легендарный',
    color: 0x88aaff,
    shape: 'crystal'
  },
  { 
    id: 'void', 
    name: 'БЕЗДНА', 
    price: 3000, 
    texture: 'skin_void', 
    description: 'Поглощает свет вокруг',
    rarity: 'Легендарный',
    color: 0x220066,
    shape: 'void'
  },
];