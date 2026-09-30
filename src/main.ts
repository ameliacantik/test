import './ui/styles.css';
import { App } from './ui/app';

const appEl = document.getElementById('app');
if (!appEl) throw new Error('No #app');

new App(appEl);

// Register service worker for future offline? Not needed for MVP
console.log('%c AETHER VOYAGER ', 'background:#5aa0ff;color:white;padding:4px 8px;border-radius:4px;font-weight:bold;');
console.log('Deep space exploration vessel online. Galaxy seed:', localStorage.getItem('aether_voyager_galaxy_v1') ? 'LOADED' : 'NEW');
