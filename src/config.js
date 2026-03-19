// =========================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// =========================================================================

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

export const GAME_CONFIG = {
  WIDTH: 390,
  HEIGHT: 844,
  FPS: 60,
  GRAVITY: 1300,
  COINS_FOR_WAGON: 15,
  MAX_WAGONS_BASE: 12,
  WAGON_GAP_BASE: 28,
  WAGON_SPRING: 0.25,
  PLAYER_JUMP_BASE: 300,
  PLAYER_HEALTH_BASE: 3,
  SHIELD_DURATION_BASE: 5,
  MAGNET_RANGE_BASE: 220,
  BASE_SPEED: 240,
  SPAWN_DELAY_BASE: 1500,
};

export const DIFFICULTY_CURVE = {
  0: { speed: 240, gap: 240, spawnDelay: 1500, coinChance: 0.8, asteroidChance: 0.3, powerUpChance: 0.1 },
  1: { speed: 264, gap: 235, spawnDelay: 1450, coinChance: 0.8, asteroidChance: 0.32, powerUpChance: 0.11 }, // +10%
  2: { speed: 290, gap: 230, spawnDelay: 1400, coinChance: 0.8, asteroidChance: 0.34, powerUpChance: 0.12 }, // +10%
  3: { speed: 319, gap: 225, spawnDelay: 1350, coinChance: 0.8, asteroidChance: 0.36, powerUpChance: 0.13 }, // +10%
  4: { speed: 351, gap: 220, spawnDelay: 1300, coinChance: 0.8, asteroidChance: 0.38, powerUpChance: 0.14 }, // +10%
  5: { speed: 386, gap: 215, spawnDelay: 1250, coinChance: 0.8, asteroidChance: 0.4, powerUpChance: 0.15 },  // +10%
  6: { speed: 425, gap: 210, spawnDelay: 1200, coinChance: 0.8, asteroidChance: 0.42, powerUpChance: 0.16 }, // +10%
  7: { speed: 468, gap: 205, spawnDelay: 1150, coinChance: 0.8, asteroidChance: 0.44, powerUpChance: 0.17 }, // +10%
  8: { speed: 515, gap: 200, spawnDelay: 1100, coinChance: 0.8, asteroidChance: 0.46, powerUpChance: 0.18 }, // +10%
  9: { speed: 567, gap: 195, spawnDelay: 1050, coinChance: 0.8, asteroidChance: 0.48, powerUpChance: 0.19 }, // +10%
  10: { speed: 624, gap: 190, spawnDelay: 1000, coinChance: 0.8, asteroidChance: 0.5, powerUpChance: 0.2 },  // +10%
  11: { speed: 686, gap: 185, spawnDelay: 950, coinChance: 0.8, asteroidChance: 0.52, powerUpChance: 0.21 }, // +10%
  12: { speed: 755, gap: 180, spawnDelay: 900, coinChance: 0.8, asteroidChance: 0.54, powerUpChance: 0.22 }, // +10%
  13: { speed: 831, gap: 175, spawnDelay: 850, coinChance: 0.8, asteroidChance: 0.56, powerUpChance: 0.23 }, // +10%
  14: { speed: 914, gap: 170, spawnDelay: 800, coinChance: 0.8, asteroidChance: 0.58, powerUpChance: 0.24 }, // +10%
  15: { speed: 1005, gap: 165, spawnDelay: 750, coinChance: 0.8, asteroidChance: 0.6, powerUpChance: 0.25 }, // +10%
  16: { speed: 1106, gap: 160, spawnDelay: 700, coinChance: 0.8, asteroidChance: 0.62, powerUpChance: 0.26 }, // +10%
  17: { speed: 1217, gap: 155, spawnDelay: 650, coinChance: 0.8, asteroidChance: 0.64, powerUpChance: 0.27 }, // +10%
  18: { speed: 1339, gap: 150, spawnDelay: 600, coinChance: 0.8, asteroidChance: 0.66, powerUpChance: 0.28 }, // +10%
  19: { speed: 1473, gap: 145, spawnDelay: 550, coinChance: 0.8, asteroidChance: 0.68, powerUpChance: 0.29 }, // +10%
  20: { speed: 1620, gap: 140, spawnDelay: 500, coinChance: 0.8, asteroidChance: 0.7, powerUpChance: 0.3 },   // +10%
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
  { key: 'weaponDamage', name: 'Урон оружия', icon: '💥', maxLevel: 15 },
  { key: 'weaponSpeed', name: 'Скорость пуль', icon: '⚡', maxLevel: 15 },
  { key: 'weaponFireRate', name: 'Скорострельность', icon: '🔫', maxLevel: 15 },
];

export const ACHIEVEMENTS = {
  first_coin: { id: 'first_coin', name: 'Первая монета', icon: '🪙', reward: 5 },
  first_wagon: { id: 'first_wagon', name: 'Первый вагон', icon: '🚃', reward: 10 },
  five_wagons: { id: 'five_wagons', name: '5 вагонов', icon: '🚃🚃', reward: 25 },
  ten_wagons: { id: 'ten_wagons', name: '10 вагонов', icon: '🚃🚃🚃', reward: 50 },
  level_5: { id: 'level_5', name: 'Уровень 5', icon: '⭐', reward: 30 },
  level_10: { id: 'level_10', name: 'Уровень 10', icon: '⭐⭐', reward: 75 },
  level_20: { id: 'level_20', name: 'Уровень 20', icon: '⭐⭐⭐', reward: 150 },
  score_100: { id: 'score_100', name: '100 очков', icon: '🏆', reward: 40 },
  score_500: { id: 'score_500', name: '500 очков', icon: '🏆🏆', reward: 100 },
  score_1000: { id: 'score_1000', name: '1000 очков', icon: '🏆🏆🏆', reward: 200 },
  no_damage: { id: 'no_damage', name: 'Безопасный полёт', icon: '❤️', reward: 50 },
  all_bonuses: { id: 'all_bonuses', name: 'Все бонусы', icon: '✨', reward: 75 },
  combo_master: { id: 'combo_master', name: 'Мастер комбо', icon: '⚡', reward: 60 },
  world_1_complete: { id: 'world_1_complete', name: 'Покоритель космоса', icon: '🌌', reward: 100 },
  world_2_complete: { id: 'world_2_complete', name: 'Кибер-самурай', icon: '👾', reward: 200 },
  world_3_complete: { id: 'world_3_complete', name: 'Хозяин подземелий', icon: '🗝️', reward: 300 },
  world_4_complete: { id: 'world_4_complete', name: 'Астероидный рейнджер', icon: '☄️', reward: 400 },
  world_5_complete: { id: 'world_5_complete', name: 'Повелитель бездны', icon: '⚫', reward: 500 },
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
  weaponDamage: { base: 20, multiplier: 1.25 },
  weaponSpeed: { base: 15, multiplier: 1.2 },
  weaponFireRate: { base: 25, multiplier: 1.3 },
};

export const LEVEL_CONFIG = {
  0: {
    name: 'КОСМОС',
    bgColor: 0x0a0a1a,
    gateColors: ['gate_blue', 'gate_green', 'gate_yellow', 'gate_red', 'gate_purple'],
    enemyTypes: [],
    description: 'Начни свой путь в открытом космосе',
    goalScore: 500,
    unlockPrice: 100,
    specialEvent: 'none',
  },
  1: {
    name: 'КИБЕРПАНК',
    bgColor: 0x1a0a2a,
    gateColors: ['gate_purple', 'gate_blue', 'gate_green', 'gate_yellow', 'gate_red'],
    enemyTypes: ['drone'],
    description: 'Неоновые огни и летающие враги',
    goalScore: 800,
    unlockPrice: 200,
    specialEvent: 'neon',
  },
  2: {
    name: 'ПОДЗЕМЕЛЬЕ',
    bgColor: 0x2a1a0a,
    gateColors: ['gate_red', 'gate_yellow', 'gate_green', 'gate_blue', 'gate_purple'],
    enemyTypes: ['skeleton'],
    description: 'Тёмные коридоры и древние ловушки',
    goalScore: 1200,
    unlockPrice: 400,
    specialEvent: 'dungeon',
  },
  3: {
    name: 'АСТЕРОИДЫ',
    bgColor: 0x0a2a2a,
    gateColors: ['gate_blue', 'gate_purple', 'gate_yellow', 'gate_green', 'gate_red'],
    enemyTypes: ['drone', 'skeleton'],
    description: 'Опасное путешествие через метеориты',
    goalScore: 1600,
    unlockPrice: 600,
    specialEvent: 'asteroids',
  },
  4: {
    name: 'ЧЁРНАЯ ДЫРА',
    bgColor: 0x000000,
    gateColors: ['gate_red', 'gate_purple', 'gate_blue', 'gate_green', 'gate_yellow'],
    enemyTypes: ['sentinel', 'drone', 'skeleton'],
    description: 'Финальное испытание у края вселенной',
    goalScore: 2000,
    unlockPrice: 800,
    specialEvent: 'blackhole',
  },
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
    bulletDamage: 1,
    texture: 'enemy_drone',
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
    bulletDamage: 1,
    texture: 'enemy_sentinel',
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
    bulletDamage: 1,
    texture: 'enemy_skeleton',
  },
};

export const BOSS_CONFIG = {
  boss_cyber: {
    health: 50,
    speed: 80,
    attackRange: 400,
    damage: 2,
    scoreValue: 100,
    fireDelay: 500,
    bulletSpeed: 600,
    bulletDamage: 2,
    texture: 'boss_cyber',
  },
  boss_dungeon: {
    health: 60,
    speed: 70,
    attackRange: 380,
    damage: 2,
    scoreValue: 120,
    fireDelay: 600,
    bulletSpeed: 550,
    bulletDamage: 2,
    texture: 'boss_dungeon',
  },
  boss_asteroid: {
    health: 70,
    speed: 90,
    attackRange: 450,
    damage: 3,
    scoreValue: 150,
    fireDelay: 400,
    bulletSpeed: 700,
    bulletDamage: 3,
    texture: 'boss_asteroid',
  },
  boss_final: {
    health: 100,
    speed: 100,
    attackRange: 500,
    damage: 4,
    scoreValue: 200,
    fireDelay: 300,
    bulletSpeed: 800,
    bulletDamage: 4,
    texture: 'boss_final',
  },
};

export const COIN_TYPES = {
  gold: { value: 1, color: 0xffaa00, texture: 'coin_gold' },
  red: { value: 2, color: 0xff4444, texture: 'coin_red', bonus: 'speed' },
  blue: { value: 1, color: 0x4444ff, texture: 'coin_blue', bonus: 'shield' },
  green: { value: 1, color: 0x44ff44, texture: 'coin_green', bonus: 'magnet' },
  purple: { value: 1, color: 0xff44ff, texture: 'coin_purple', bonus: 'slow' },
};

export const POWERUP_TYPES = {
  booster: { name: 'Ускорение', color: 0x00ffff, duration: 5000, effect: 'speed', icon: '🚀' },
  shield: { name: 'Щит', color: 0x00ff00, duration: 5000, effect: 'shield', icon: '🛡️' },
  magnet: { name: 'Магнит', color: 0xff00ff, duration: 7000, effect: 'magnet', icon: '🧲' },
  slowmo: { name: 'Замедление', color: 0xffaa00, duration: 4000, effect: 'slow', icon: '⏳' },
  double: { name: 'Двойные кристаллы', color: 0xffff00, duration: 8000, effect: 'double', icon: '💎' },
  invincible: { name: 'Неуязвимость', color: 0x00ffff, duration: 5000, effect: 'invincible', icon: '✨' },
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
  ],
};

export const SKINS = [
  { id: 'default', name: 'Классика', price: 0, texture: 'player', description: 'Стандартное такси' },
  { id: 'neon', name: 'Неоновое', price: 100, texture: 'player_neon', description: 'Светится в темноте' },
  { id: 'cyber', name: 'Киберпанк', price: 250, texture: 'player_cyber', description: 'Стиль будущего' },
  { id: 'gold', name: 'Золотое', price: 500, texture: 'player_gold', description: 'Для коллекционеров' },
  { id: 'rainbow', name: 'Радужное', price: 1000, texture: 'player_rainbow', description: 'Переливается цветами' },
  { id: 'crystal', name: 'Кристальное', price: 1500, texture: 'player_crystal', description: 'Сверкает как алмаз' },
  { id: 'stealth', name: 'Стелс', price: 750, texture: 'player_stealth', description: 'Почти невидимое' },
  { id: 'fire', name: 'Огненное', price: 2000, texture: 'player_fire', description: 'Оставляет огненный след' },
  { id: 'ice', name: 'Ледяное', price: 2000, texture: 'player_ice', description: 'Холодный стиль' },
  { id: 'void', name: 'Бездна', price: 3000, texture: 'player_void', description: 'Поглощает свет' },
];