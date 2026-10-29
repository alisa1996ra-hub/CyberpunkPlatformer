// js/main.js

import { assetsCache, loadAllAssets } from './assets.js';
import { WaterWave } from './water.js';
import { LightSystem } from './lighting.js';
import { ParticleSystem } from './particles.js';
import { PlatformManager } from './platforms.js';
import { Cable, Grass } from './decorations.js';
import { Player } from './player.js';
import { ProjectileManager } from './projectiles.js';

let player = null;
let gameStarted = false;
let assetsLoaded = false;
const keys = {};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay-fullscreen');

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 580;

const currentBiome = 'seaport';
const isNight = false;

const levelConfig = {
    screenShakeEnabled: true,
    weather: 'clear'
};

let shakeTime = 0;
let shakeIntensity = 0;

window.triggerScreenShake = (intensity, duration = 10) => {
    if (!levelConfig.screenShakeEnabled) return;
    shakeIntensity = intensity;
    shakeTime = duration;
};

const projectileManager = new ProjectileManager();
window.projectileManager = projectileManager;

const water = new WaterWave(LOGICAL_WIDTH, LOGICAL_HEIGHT);
const lightSystem = new LightSystem();
const particleSystem = new ParticleSystem();
const platformManager = new PlatformManager();

// Инициализируем стандартного игрока
player = new Player(100, 300, 'Alisa');

const cables = [
    new Cable(250, 400, 520, 300, 50),
    new Cable(520, 300, 830, 360, 40)
];

const grassList = [
    new Grass(270, 400), new Grass(285, 400), new Grass(300, 400),
    new Grass(550, 300), new Grass(570, 300), new Grass(850, 360)
];

let frameCounter = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
}

// --- КЛАВИАТУРНЫЙ ВВОД (ЧЕТКОЕ РАЗДЕЛЕНИЕ КЛАВИШ) ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Атака СТРОГО на клавишу F
    if (e.code === 'KeyF') {
        if (player) player.triggerAttack(projectileManager);
    }

    // Прыжок на Пробел, Стрелку Вверх или W
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault(); // Запрещаем скролл страницы пробелом
        if (player) player.jump();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// --- СЕНСОРНОЕ УПРАВЛЕНИЕ (МУЛЬТИТАЧ ДЛЯ МОБИЛОК) ---
function setupMobileControls() {
    if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;
    if (document.getElementById('mobile-controls')) return;

    const mobileContainer = document.createElement('div');
    mobileContainer.id = 'mobile-controls';
    mobileContainer.innerHTML = `
      <div style="display:flex; gap:15px; pointer-events:auto;">
        <div id="btn-left" style="width:65px; height:65px; background:rgba(56,189,248,0.3); border:2px solid #38bdf8; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">◀</div>
        <div id="btn-right" style="width:65px; height:65px; background:rgba(56,189,248,0.3); border:2px solid #38bdf8; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">▶</div>
      </div>
      <div style="display:flex; gap:15px; pointer-events:auto;">
        <div id="btn-jump" style="width:65px; height:65px; background:rgba(236,72,153,0.3); border:2px solid #ec4899; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">▲</div>
        <div id="btn-attack" style="width:65px; height:65px; background:rgba(236,72,153,0.3); border:2px solid #ec4899; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">⚡</div>
      </div>
    `;

    mobileContainer.style.cssText = `
      position: fixed;
      bottom: 25px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      box-sizing: border-box;
      z-index: 99999;
      pointer-events: none;
    `;

    document.body.appendChild(mobileContainer);

    const attachTouch = (id, onPress, onRelease) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('touchstart', (e) => { e.preventDefault(); onPress(); }, { passive: false });
        el.addEventListener('touchend', (e) => { e.preventDefault(); if (onRelease) onRelease(); }, { passive: false });
        el.addEventListener('touchcancel', (e) => { e.preventDefault(); if (onRelease) onRelease(); }, { passive: false });
    };

    attachTouch('btn-left',  () => { keys['ArrowLeft'] = true; },  () => { keys['ArrowLeft'] = false; });
    attachTouch('btn-right', () => { keys['ArrowRight'] = true; }, () => { keys['ArrowRight'] = false; });
    attachTouch('btn-jump',  () => { if (player) player.jump(); });
    attachTouch('btn-attack', () => { if (player) player.triggerAttack(projectileManager); });
}

// Выбор персонажа в меню
document.querySelectorAll('.char-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const selectedChar = e.target.getAttribute('data-char');
        player = new Player(100, 100, selectedChar);

        const charSelectMenu = document.getElementById('character-select');
        if (charSelectMenu) charSelectMenu.style.display = 'none';
        gameStarted = true;
    });
});

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupMobileControls();

    loadAllAssets((progress, total, assetName) => {
        const percent = Math.floor((progress / total) * 100);
        const loaderFill = document.getElementById('loader-fill');
        const loaderText = document.getElementById('loader-text');
        
        if (loaderFill) loaderFill.style.width = `${percent}%`;
        if (loaderText) loaderText.innerText = `ЗАГРУЗКА СИСТЕМ... ${percent}%`;
    }, () => {
        assetsLoaded = true;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.4s';
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 400);
        }
    });

    overlay.addEventListener('click', async () => {
        if (!assetsLoaded) return;

        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) await elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();

            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (err) {
            console.log('Fullscreen block:', err);
        }

        overlay.style.display = 'none';
        const charSelect = document.getElementById('character-select');
        if (charSelect) charSelect.style.display = 'flex';

        setTimeout(resizeCanvas, 200); 
    });

    requestAnimationFrame(gameLoop);
}

// Обработка постоянного нажатия клавиш движения (A/D и Стрелки)
function handleInput() {
    if (!player) return;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.moveLeft();
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.moveRight();
    } else {
        player.stop();
    }
}

function gameLoop(timestamp) {
    frameCounter++;

    if (gameStarted && player) {
        handleInput();

        let offsetX = 0;
        let offsetY = 0;
        if (shakeTime > 0) {
            offsetX = (Math.random() - 0.5) * shakeIntensity;
            offsetY = (Math.random() - 0.5) * shakeIntensity;
            shakeTime--;
        }

        platformManager.update();
        player.update(LOGICAL_WIDTH, LOGICAL_HEIGHT, water.y || 500, particleSystem, platformManager);
        cables.forEach(c => c.update(player));
        grassList.forEach(g => g.update(player));
        projectileManager.update();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);

        const bgKey = isNight ? 'bg_background_night' : 'bg_background_day';
        const bgImg = assetsCache[currentBiome] && assetsCache[currentBiome][bgKey];
        
        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
            ctx.drawImage(bgImg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        } else {
            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }

        cables.forEach(c => c.draw(ctx));
        grassList.forEach(g => g.draw(ctx));

        water.update();
        water.draw(ctx);

        lightSystem.update();
        lightSystem.draw(ctx);

        platformManager.draw(ctx, currentBiome, assetsCache);
        player.draw(ctx);
        projectileManager.draw(ctx);
        particleSystem.update();
        particleSystem.draw(ctx);

        ctx.fillStyle = '#00ffcc';
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`// BIOME: ${currentBiome.toUpperCase()} [ACTIVE]`, 30, 40);

        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);