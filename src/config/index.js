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
  0: { speed: 240, gap: 240, spawnDelay: 1500, coinChance: 0.8 },
  3: { speed: 280, gap: 230, spawnDelay: 1400, coinChance: 0.75 },
  6: { speed: 320, gap: 220, spawnDelay: 1300, coinChance: 0.70 },
  9: { speed: 360, gap: 210, spawnDelay: 1200, coinChance: 0.65 },
  12: { speed: 400, gap: 200, spawnDelay: 1100, coinChance: 0.60 },
  15: { speed: 440, gap: 190, spawnDelay: 1000, coinChance: 0.55 },
  20: { speed: 500, gap: 180, spawnDelay: 900, coinChance: 0.50 },
  25: { speed: 560, gap: 170, spawnDelay: 800, coinChance: 0.45 },
  30: { speed: 620, gap: 160, spawnDelay: 700, coinChance: 0.40 },
  35: { speed: 680, gap: 150, spawnDelay: 600, coinChance: 0.35 },
  40: { speed: 750, gap: 140, spawnDelay: 500, coinChance: 0.30 },
  45: { speed: 820, gap: 130, spawnDelay: 400, coinChance: 0.25 },
  50: { speed: 900, gap: 120, spawnDelay: 300, coinChance: 0.20 }
};

export const SHOP_UPGRADES = [
  { key: 'jumpPower', name: 'Сила прыжка', icon: '🚀', cost: 10, maxLevel: 10 },
  { key: 'gravity', name: 'Гравитация', icon: '⬇️', cost: 15, maxLevel: 10 },
  { key: 'shieldDuration', name: 'Длительность щита', icon: '🛡️', cost: 20, maxLevel: 10 },
  { key: 'magnetRange', name: 'Радиус магнита', icon: '🧲', cost: 20, maxLevel: 10 },
  { key: 'wagonHP', name: 'Прочность вагонов', icon: '💪', cost: 25, maxLevel: 10 },
  { key: 'maxWagons', name: 'Макс. вагонов', icon: '🚃', cost: 30, maxLevel: 10 },
  { key: 'wagonGap', name: 'Дистанция вагонов', icon: '📏', cost: 30, maxLevel: 10 },
  { key: 'headHP', name: 'Макс. здоровье', icon: '❤️', cost: 40, maxLevel: 10 },
  { key: 'revival', name: 'Воскрешение', icon: '🔄', cost: 50, maxLevel: 5 },
  { key: 'weaponDamage', name: 'Урон оружия', icon: '💥', cost: 20, maxLevel: 10 },
  { key: 'weaponSpeed', name: 'Скорость пуль', icon: '⚡', cost: 15, maxLevel: 10 },
  { key: 'weaponFireRate', name: 'Скорострельность', icon: '🔫', cost: 25, maxLevel: 10 },
];

export const ACHIEVEMENTS = {
  first_wagon: { id: 'first_wagon', name: 'Первый вагон', icon: '🚃', reward: 10 },
  five_wagons: { id: 'five_wagons', name: '5 вагонов', icon: '🚃🚃', reward: 25 },
  ten_wagons: { id: 'ten_wagons', name: '10 вагонов', icon: '🚃🚃🚃', reward: 50 },
  level_5: { id: 'level_5', name: 'Уровень 5', icon: '⭐', reward: 30 },
  level_10: { id: 'level_10', name: 'Уровень 10', icon: '⭐⭐', reward: 75 },
  score_100: { id: 'score_100', name: '100 очков', icon: '🏆', reward: 40 },
  score_500: { id: 'score_500', name: '500 очков', icon: '🏆🏆', reward: 100 },
  no_damage: { id: 'no_damage', name: 'Безопасный полёт', icon: '❤️', reward: 50 },
  all_bonuses: { id: 'all_bonuses', name: 'Все бонусы', icon: '✨', reward: 75 },
};

export const UPGRADE_COSTS = {
  jumpPower: { base: 10, multiplier: 1.15 },
  gravity: { base: 15, multiplier: 1.15 },
  shieldDuration: { base: 20, multiplier: 1.2 },
  magnetRange: { base: 20, multiplier: 1.2 },
  wagonHP: { base: 25, multiplier: 1.15 },
  maxWagons: { base: 30, multiplier: 1.25 },
  wagonGap: { base: 30, multiplier: 1.2 },
  headHP: { base: 40, multiplier: 1.2 },
  revival: { base: 50, multiplier: 1.5 },
  weaponDamage: { base: 20, multiplier: 1.2 },
  weaponSpeed: { base: 15, multiplier: 1.15 },
  weaponFireRate: { base: 25, multiplier: 1.25 },
};

export const LEVEL_CONFIG = {
  0: {
    name: 'КОСМОС',
    theme: 'space',
    bgColor: 0x0a0a1a,
    gateColors: ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'],
    enemyTypes: [],
    description: 'Начни свой путь в открытом космосе'
  },
  1: {
    name: 'КИБЕРПАНК ГОРОД',
    theme: 'cyberpunk',
    bgColor: 0x1a0a2a,
    gateColors: ['gate_purple', 'gate_blue', 'gate_green', 'gate_yellow', 'gate_red'],
    enemyTypes: ['drone'],
    description: 'Неоновые огни и летающие враги'
  },
  2: {
    name: 'ПОДЗЕМЕЛЬЕ',
    theme: 'dungeon',
    bgColor: 0x2a1a0a,
    gateColors: ['gate_red', 'gate_yellow', 'gate_green', 'gate_blue', 'gate_purple'],
    enemyTypes: ['skeleton'],
    description: 'Тёмные коридоры и древние ловушки'
  },
  3: {
    name: 'АСТЕРОИДНОЕ ПОЛЕ',
    theme: 'asteroids',
    bgColor: 0x0a2a2a,
    gateColors: ['gate_blue', 'gate_purple', 'gate_yellow', 'gate_green', 'gate_red'],
    enemyTypes: ['drone', 'skeleton'],
    description: 'Опасное путешествие через метеориты'
  },
  4: {
    name: 'КИБЕРПАНК СТАНЦИЯ',
    theme: 'station',
    bgColor: 0x2a0a2a,
    gateColors: ['gate_purple', 'gate_red', 'gate_blue', 'gate_yellow', 'gate_green'],
    enemyTypes: ['sentinel', 'drone'],
    description: 'Заброшенная космическая станция'
  },
  5: {
    name: 'ЧЁРНАЯ ДЫРА',
    theme: 'blackhole',
    bgColor: 0x000000,
    gateColors: ['gate_red', 'gate_purple', 'gate_blue', 'gate_green', 'gate_yellow'],
    enemyTypes: ['sentinel', 'drone', 'skeleton'],
    description: 'Финальное испытание у края вселенной'
  }
};

export const ENEMY_CONFIG = {
  drone: {
    health: 2,
    speed: 150,
    attackRange: 300,
    detectionRange: 400,
    damage: 1,
    scoreValue: 5,
    fireDelay: 800,
    bulletSpeed: 400,
    bulletDamage: 1
  },
  sentinel: {
    health: 3,
    speed: 200,
    attackRange: 350,
    detectionRange: 450,
    damage: 1.5,
    scoreValue: 10,
    fireDelay: 600,
    bulletSpeed: 500,
    bulletDamage: 1
  },
  skeleton: {
    health: 1,
    speed: 120,
    attackRange: 250,
    detectionRange: 350,
    damage: 1,
    scoreValue: 3,
    fireDelay: 1000,
    bulletSpeed: 300,
    bulletDamage: 1
  }
};

export const WAVE_CONFIG = {
  space: [
    { wave: 0, count: 0, type: 'drone' },
  ],
  cyberpunk: [
    { wave: 0, count: 2, type: 'drone' },
    { wave: 1, count: 3, type: 'drone' },
    { wave: 2, count: 2, type: 'sentinel' },
    { wave: 3, count: 3, type: 'sentinel' },
  ],
  dungeon: [
    { wave: 0, count: 2, type: 'skeleton' },
    { wave: 1, count: 3, type: 'skeleton' },
    { wave: 2, count: 4, type: 'skeleton' },
    { wave: 3, count: 5, type: 'skeleton' },
  ],
  asteroids: [
    { wave: 0, count: 3, type: 'drone' },
    { wave: 1, count: 2, type: 'sentinel' },
    { wave: 2, count: 4, type: 'drone' },
  ],
  station: [
    { wave: 0, count: 2, type: 'sentinel' },
    { wave: 1, count: 3, type: 'sentinel' },
    { wave: 2, count: 2, type: 'drone' },
    { wave: 3, count: 4, type: 'sentinel' },
  ],
  blackhole: [
    { wave: 0, count: 4, type: 'sentinel' },
    { wave: 1, count: 5, type: 'drone' },
    { wave: 2, count: 3, type: 'skeleton' },
    { wave: 3, count: 6, type: 'sentinel' },
  ]
};