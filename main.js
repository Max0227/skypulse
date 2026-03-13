import './styles.css';
import './game.js';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();