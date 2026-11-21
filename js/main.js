// js/main.js

import { assetsCache, loadAllAssets } from './assets.js';
import { WaterWave } from './water.js';
import { LightSystem } from './lighting.js';
import { ParticleSystem } from './particles.js';
import { PlatformManager } from './platforms.js';
import { Cable, Grass, PowerLinePole, Generator } from './decorations.js';
import { Player } from './player.js';
import { ProjectileManager } from './projectiles.js';
import { generateLevelData } from './generator.js';
import { BiomeManager } from './biomes.js';
import { WeatherSystem } from './weather.js';
import { SpriteAnimator } from './animation.js';
import { Collectable } from './collectible.js';
import { initShopUI, openShop, closeShop } from './ui.js';
import { SHOP_CONFIG } from './shopConfig.js';
import { openRepairPrompt, closeRepairPrompt, isRepairPromptOpen } from './repairPromptUI.js';

console.log('🚀 MAIN.JS CONTROLS RESTORED');

window.assetsCache = assetsCache;

const MATERIAL_KEYS = ['copper_wire', 'microchip', 'power_cell', 'rare_alloy'];

const MATERIAL_LABELS = {
    copper_wire: 'Медный провод',
    microchip: 'Плата',
    power_cell: 'Энерго-ячейка',
    rare_alloy: 'Редкий сплав'
};

const MATERIAL_SHORT = {
    copper_wire: { code: 'CW', color: '#f97316', icon: 'Icon14_38.png' },
    microchip:   { code: 'MC', color: '#22c55e', icon: 'Icon14_32.png' },
    power_cell:  { code: 'PC', color: '#fbbf24', icon: 'Icon14_39.png' },
    rare_alloy:  { code: 'RA', color: '#38bdf8', icon: 'Icon14_09.png' }
};

let lastDropTime = 0;
let lastPickupTime = 0;

let playerData = {
    credits: 1500,
    upgrades: {
        maxHp: 0,
        backpack: 0,
        attack: 0,
        maxEnergy: 0,
        tradeSkill: 0
    },
    inventory: {
        copper_wire: 0,
        microchip: 0,
        power_cell: 0,
        rare_alloy: 0
    }
};
window.playerData = playerData;

let canvasBackpackOpen = false;
let lastBackpackHitboxes = [];

function hideExternalBackpackDom() {
    const ids = ['backpack-ui', 'inventory-ui', 'backpack-modal', 'inventory-panel'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
        }
    });
}

function toggleBackpackUI() {
    canvasBackpackOpen = !canvasBackpackOpen;
    hideExternalBackpackDom();
}

function closeCanvasBackpack() {
    canvasBackpackOpen = false;
    hideExternalBackpackDom();
}

window.toggleBackpackUI = toggleBackpackUI;
window.closeInventoryUI = closeCanvasBackpack;
window.renderBackpackUI = () => {
    hideExternalBackpackDom();
};

function getInventoryState() {
    if (!window.playerData) {
        window.playerData = playerData;
    }
    if (!window.playerData.inventory || typeof window.playerData.inventory !== 'object') {
        window.playerData.inventory = {
            copper_wire: 0,
            microchip: 0,
            power_cell: 0,
            rare_alloy: 0
        };
    }
    playerData = window.playerData;
    return playerData.inventory;
}

function getTotalInventoryCount() {
    const inv = getInventoryState();
    return MATERIAL_KEYS.reduce((acc, k) => acc + Math.max(0, Number(inv[k]) || 0), 0);
}

function getMaterialCount(materialId) {
    const inv = getInventoryState();
    return Math.max(0, Number(inv[materialId]) || 0);
}

function hasMaterial(materialId, amount = 1) {
    return getMaterialCount(materialId) >= amount;
}

function spendMaterial(materialId, amount = 1) {
    const inv = getInventoryState();
    const current = Math.max(0, Number(inv[materialId]) || 0);
    if (current < amount) {
        console.warn(`⚠️ Недостаточно ресурса ${materialId}: есть ${current}, нужно ${amount}`);
        return false;
    }

    const nextVal = Math.max(0, current - amount);
    inv[materialId] = nextVal;

    console.log(`🔧 Списано ${materialId}: -${amount}, осталось: ${nextVal}`);
    hideExternalBackpackDom();
    return true;
}

function findMaterialIconImage(iconName) {
    if (!iconName || !window.assetsCache) return null;
    const baseName = iconName.replace(/\.png$/i, '');
    const candidates = [
        window.assetsCache?.common?.[iconName],
        window.assetsCache?.common?.[baseName],
        window.assetsCache?.icons?.[iconName],
        window.assetsCache?.icons?.[baseName],
        window.assetsCache?.[iconName],
        window.assetsCache?.[baseName]
    ];
    for (const img of candidates) {
        if (img && img.complete && img.naturalWidth > 0) {
            return img;
        }
    }
    return null;
}

function createCleanCollectible(x, y, materialId) {
    const item = new Collectable(x, y, 'material', materialId);
    item.x = Math.round(x);
    item.y = Math.round(y);
    item.width = 32;
    item.height = 32;
    item.type = 'material';
    item.materialId = materialId;
    item.id = materialId;
    item.isCollected = false;
    item.spawnTime = performance.now();
    return item;
}

window.openShopUI = () => {
    openShop();
};

function rollSingleMaterial() {
    const materials = Object.values(SHOP_CONFIG.materials);
    let totalWeight = 0;
    const weightedPool = materials.map(mat => {
        const weight = 1000 / mat.buyPrice;
        totalWeight += weight;
        return { id: mat.id, weight: totalWeight };
    });

    const roll = Math.random() * totalWeight;
    for (const item of weightedPool) {
        if (roll <= item.weight) {
            return item.id;
        }
    }
    return materials[0].id;
}

export function spawnLootFromBarrel(x, y) {
    const materialId = rollSingleMaterial();
    console.log("🎲 Выпал материал (1 шт):", materialId);

    const lootItem = createCleanCollectible(x, y - 24, materialId);
    if (currentLevelData) {
        if (!currentLevelData.collectibles) {
            currentLevelData.collectibles = [];
        }
        currentLevelData.collectibles.push(lootItem);
    }
}
window.spawnLootFromBarrel = spawnLootFromBarrel;

export function dropMaterialToFloor(materialId) {
    const now = performance.now();
    if (now - lastDropTime < 140) return;

    const inv = getInventoryState();
    const currentCount = Math.max(0, Number(inv[materialId]) || 0);
    if (currentCount <= 0) return;
    if (!player || !currentLevelData) return;

    lastDropTime = now;
    if (!spendMaterial(materialId, 1)) return;

    if (!currentLevelData.collectibles) {
        currentLevelData.collectibles = [];
    }

    const dir = getPlayerFacingDir(player);
    const activeCount = currentLevelData.collectibles.filter(c => c && !c.isCollected).length;
    const stepX = ((activeCount % 4) - 1) * 14;
    const dropX = Math.round(player.x + dir * 32 + stepX);
    const dropY = Math.round(getSafePlayerY(player) + (player.height || 32) - 32);

    const droppedItem = createCleanCollectible(dropX, dropY, materialId);
    currentLevelData.collectibles.push(droppedItem);

    console.log(`🗑️ Выброшен ${materialId} в (${dropX}, ${dropY}). Всего на карте: ${currentLevelData.collectibles.filter(c => c && !c.isCollected).length}`);
}
window.dropMaterialToFloor = dropMaterialToFloor;

function handleBuyUpgrade(upgradeId, cost) {
    if (playerData.credits >= cost) {
        playerData.credits -= cost;
        playerData.upgrades[upgradeId] = (playerData.upgrades[upgradeId] || 0) + 1;
        console.log(`🚀 Улучшение ${upgradeId} прокачано до уровня ${playerData.upgrades[upgradeId]}`);

        if (upgradeId === 'maxHp' && player) {
            player.maxHp += 10;
            player.hp = player.maxHp;
        }
    } else {
        console.log("⚠️ Не хватает кредитов!");
    }
}

function handleTradeMaterial(materialId, action, price) {
    const inv = getInventoryState();
    if (action === 'buy') {
        const total = getTotalInventoryCount();
        if (total >= 10) {
            console.log("⚠️ Рюкзак полон (10/10)!");
            return;
        }
        if (playerData.credits >= price) {
            playerData.credits -= price;
            inv[materialId] = (Number(inv[materialId]) || 0) + 1;
            console.log(`📦 Куплен материал: ${materialId}`);
        }
    } else if (action === 'sell') {
        if ((Number(inv[materialId]) || 0) > 0) {
            inv[materialId] = Math.max(0, (Number(inv[materialId]) || 0) - 1);
            playerData.credits += price;
            console.log(`💵 Продан материал: ${materialId} за ${price} CR`);
        }
    }
}

initShopUI(playerData, handleBuyUpgrade, handleTradeMaterial);

let player = null;
let gameStarted = false;
let assetsLoaded = false;
const keys = {};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay-fullscreen');

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 580;

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
window.platformManager = platformManager;
const weatherSystem = new WeatherSystem();
const biomeManager = new BiomeManager();

player = new Player(100, 300, 'Alisa');

let currentLevelData = null;
let alloyPlatformsList = [];
const camera = { x: 0 };
const TILE = 32;

const BIOMES = [
    { id: 'factory',    label: 'FACTORY (L1)',    level: 1 },
    { id: 'industrial', label: 'INDUSTRIAL (L6)', level: 6 },
    { id: 'seaport',    label: 'SEAPORT (L11)',   level: 11 },
    { id: 'exclusion',  label: 'EXCLUSION (L16)', level: 16 },
    { id: 'power',      label: 'POWER (L21)',     level: 21 }
];

window.__menuChoice = {
    biome: 'factory',
    level: 1,
    isNight: false
};

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;
    hideExternalBackpackDom();
}

function getLogicalCanvasCoords(clientX, clientY) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return {
        x: ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
        y: ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT
    };
}

function getPlayerFacingDir(p) {
    if (!p) return 1;
    if (typeof p.facingLeft === 'boolean') return p.facingLeft ? -1 : 1;
    if (typeof p.facing === 'string') {
        if (p.facing.toLowerCase().includes('left')) return -1;
        if (p.facing.toLowerCase().includes('right')) return 1;
    }
    if (typeof p.dir === 'number' && p.dir !== 0) return p.dir < 0 ? -1 : 1;
    if (typeof p.direction === 'number' && p.direction !== 0) return p.direction < 0 ? -1 : 1;
    if (typeof p.scaleX === 'number' && p.scaleX !== 0) return p.scaleX < 0 ? -1 : 1;
    return 1;
}

function getSafePlayerY(p) {
    const y = Number(p?.y);
    if (!Number.isFinite(y) || y < -200 || y > LOGICAL_HEIGHT + 200) {
        return 416;
    }
    return y;
}

function syncAlloyArrays() {
    if (currentLevelData) {
        currentLevelData.alloyPlatforms = alloyPlatformsList;
    }
    window.alloyPlatforms = alloyPlatformsList;
}

function computeFrontAlloySlot(p) {
    if (!p) return null;
    const pWidth = p.width || 32;
    const platWidth = TILE * 2;
    const platHeight = TILE;
    const dir = getPlayerFacingDir(p);

    const safeY = getSafePlayerY(p);
    const candidateY = Math.max(
        TILE * 2,
        Math.min(LOGICAL_HEIGHT - TILE * 3, Math.floor(safeY / TILE) * TILE)
    );
    const candidateX = dir === -1
        ? Math.round(p.x - platWidth - 10)
        : Math.round(p.x + pWidth + 10);

    return {
        x: candidateX,
        y: candidateY,
        width: platWidth,
        height: platHeight,
        dir,
        valid: true
    };
}

function placeAlloyPlatformForPlayer(p) {
    if (!p) return false;
    if (!hasMaterial('rare_alloy', 1)) {
        console.warn('⚠️ Нет Редкого сплава в рюкзаке.');
        return false;
    }

    const slot = computeFrontAlloySlot(p);
    if (!slot) return false;

    if (!spendMaterial('rare_alloy', 1)) return false;

    const platObj = {
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        dir: slot.dir,
        isAlloy: true,
        visualType: 'plat_center',
        createdBy: p?.name || 'player'
    };

    alloyPlatformsList.push(platObj);
    syncAlloyArrays();

    console.log(
        `✅ ПЛАТФОРМА СОЗДАНА [${slot.dir === -1 ? 'СЛЕВА' : 'СПРАВА'}]: plat=(${platObj.x}, ${platObj.y}, ${platObj.width}x${platObj.height}) | player=(${Math.round(p.x)}, ${Math.round(getSafePlayerY(p))}) | camX=${Math.round(camera.x)} | всего=${alloyPlatformsList.length}`
    );
    return true;
}

function applyAlloyPlatformCollision(p, alloyList) {
    if (!p || !Array.isArray(alloyList) || alloyList.length === 0) return;

    const pWidth = p.width || 32;
    const pHeight = p.height || 32;
    const pLeft = p.x + 2;
    const pRight = p.x + pWidth - 2;
    const safeY = getSafePlayerY(p);
    const pBottom = safeY + pHeight;
    const vy = p.vy ?? p.velocityY ?? 0;

    if (vy < -1 || keys['ArrowDown'] || keys['KeyS']) return;

    for (const plat of alloyList) {
        if (!plat) continue;
        const withinX = pRight >= plat.x && pLeft <= plat.x + plat.width;
        const touchingTop = pBottom >= plat.y - 8 && pBottom <= plat.y + 28;

        if (withinX && touchingTop) {
            p.y = plat.y - pHeight;
            if (typeof p.vy === 'number') p.vy = 0;
            if (typeof p.velocityY === 'number') p.velocityY = 0;
            p.onGround = true;
            p.isGrounded = true;
            p.canJump = true;
            break;
        }
    }
}

function drawAlloyPlatformsWorld(targetCtx, alloyList, biomeAssets = {}) {
    if (!targetCtx || !Array.isArray(alloyList) || alloyList.length === 0) return;
    const centerImg = biomeAssets?.plat_center;

    targetCtx.save();
    for (const plat of alloyList) {
        if (!plat) continue;
        const drawX = Math.round(plat.x);
        const drawY = Math.round(plat.y);
        const drawW = plat.width || TILE * 2;
        const drawH = plat.height || TILE;

        for (let px = drawX; px < drawX + drawW; px += TILE) {
            if (centerImg && centerImg.complete && centerImg.naturalWidth > 0) {
                targetCtx.drawImage(centerImg, px, drawY, TILE, drawH);
            } else {
                targetCtx.fillStyle = '#0f766e';
                targetCtx.fillRect(px, drawY, TILE, drawH);
            }
        }

        targetCtx.fillStyle = 'rgba(0, 255, 204, 0.35)';
        targetCtx.fillRect(drawX, drawY, drawW, drawH);

        targetCtx.strokeStyle = '#00ffcc';
        targetCtx.lineWidth = 3;
        targetCtx.shadowColor = '#00ffcc';
        targetCtx.shadowBlur = 12;
        targetCtx.strokeRect(drawX, drawY, drawW, drawH);

        targetCtx.shadowBlur = 0;
        targetCtx.fillStyle = '#ffffff';
        targetCtx.font = 'bold 11px monospace';
        targetCtx.fillText('ALLOY', drawX + 6, drawY + 14);
    }
    targetCtx.restore();
}

function drawCollectibleClean(targetCtx, item, sheetImg) {
    if (!item || item.isCollected) return;

    const matId = item.materialId || item.id || '';
    const w = item.width || 32;
    const h = item.height || 32;
    const x = Math.round(item.x);
    const y = Math.round(item.y);

    if (item.type === 'material' && matId) {
        const meta = MATERIAL_SHORT[matId];
        const iconImg = meta ? findMaterialIconImage(meta.icon) : null;

        targetCtx.save();
        targetCtx.fillStyle = '#0f172a';
        targetCtx.strokeStyle = meta ? meta.color : '#00ffcc';
        targetCtx.lineWidth = 2.5;
        targetCtx.shadowColor = meta ? meta.color : '#00ffcc';
        targetCtx.shadowBlur = 8;
        targetCtx.fillRect(x, y, w, h);
        targetCtx.strokeRect(x, y, w, h);
        targetCtx.shadowBlur = 0;

        if (iconImg) {
            targetCtx.drawImage(iconImg, x + 3, y + 3, w - 6, h - 6);
        } else {
            targetCtx.fillStyle = meta ? meta.color : '#00ffcc';
            targetCtx.font = 'bold 13px monospace';
            targetCtx.textAlign = 'center';
            targetCtx.textBaseline = 'middle';
            targetCtx.fillText(meta ? meta.code : 'MAT', x + w / 2, y + h / 2);
        }
        targetCtx.restore();
        return;
    }

    if (typeof item.draw === 'function') {
        item.draw(targetCtx, sheetImg);
    }
}

function drawCanvasHudAndBackpack(targetCtx) {
    const inv = getInventoryState();
    const totalItems = getTotalInventoryCount();
    lastBackpackHitboxes = [];

    const badgeW = 220;
    const badgeH = 38;
    const badgeX = Math.round((LOGICAL_WIDTH - badgeW) / 2);
    const badgeY = 14;

    targetCtx.save();
    targetCtx.fillStyle = canvasBackpackOpen ? 'rgba(15, 118, 110, 0.92)' : 'rgba(127, 29, 29, 0.92)';
    targetCtx.strokeStyle = canvasBackpackOpen ? '#00ffcc' : '#fb7185';
    targetCtx.lineWidth = 2;
    targetCtx.fillRect(badgeX, badgeY, badgeW, badgeH);
    targetCtx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    targetCtx.fillStyle = '#ffffff';
    targetCtx.font = 'bold 13px monospace';
    targetCtx.textAlign = 'center';
    targetCtx.fillText(`🎒 РЮКЗАК ${totalItems}/10 [I]`, badgeX + badgeW / 2, badgeY + 24);
    targetCtx.textAlign = 'left';

    lastBackpackHitboxes.push({
        x: badgeX,
        y: badgeY,
        w: badgeW,
        h: badgeH,
        action: 'toggle'
    });

    if (canvasBackpackOpen) {
        const panelW = 540;
        const panelH = 190;
        const panelX = Math.round((LOGICAL_WIDTH - panelW) / 2);
        const panelY = 62;

        targetCtx.fillStyle = 'rgba(3, 7, 18, 0.95)';
        targetCtx.strokeStyle = '#00ffcc';
        targetCtx.lineWidth = 2;
        targetCtx.fillRect(panelX, panelY, panelW, panelH);
        targetCtx.strokeRect(panelX, panelY, panelW, panelH);

        targetCtx.fillStyle = '#00ffcc';
        targetCtx.font = 'bold 14px monospace';
        targetCtx.fillText('ИНВЕНТАРЬ ИНЖЕНЕРА (КЛИК — ВЫБРОСИТЬ 1 ШТ)', panelX + 16, panelY + 24);

        const closeBox = { x: panelX + panelW - 38, y: panelY + 8, w: 28, h: 24, action: 'close' };
        targetCtx.fillStyle = '#1e293b';
        targetCtx.strokeStyle = '#f43f5e';
        targetCtx.fillRect(closeBox.x, closeBox.y, closeBox.w, closeBox.h);
        targetCtx.strokeRect(closeBox.x, closeBox.y, closeBox.w, closeBox.h);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.font = 'bold 13px monospace';
        targetCtx.fillText('X', closeBox.x + 10, closeBox.y + 16);
        lastBackpackHitboxes.push(closeBox);

        MATERIAL_KEYS.forEach((matId, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const slotX = panelX + 16 + col * 256;
            const slotY = panelY + 42 + row * 66;
            const slotW = 248;
            const slotH = 54;
            const count = getMaterialCount(matId);

            targetCtx.fillStyle = count > 0 ? '#0f172a' : '#090d16';
            targetCtx.strokeStyle = count > 0 ? '#38bdf8' : '#334155';
            targetCtx.lineWidth = 1.5;
            targetCtx.fillRect(slotX, slotY, slotW, slotH);
            targetCtx.strokeRect(slotX, slotY, slotW, slotH);

            targetCtx.fillStyle = count > 0 ? '#f8fafc' : '#64748b';
            targetCtx.font = 'bold 12px monospace';
            targetCtx.fillText(`${MATERIAL_LABELS[matId]}: ${count} шт`, slotX + 10, slotY + 21);

            targetCtx.fillStyle = count > 0 ? '#fbbf24' : '#475569';
            targetCtx.font = '11px monospace';
            targetCtx.fillText(count > 0 ? 'Клик: выбросить на пол' : 'Пусто', slotX + 10, slotY + 41);

            if (count > 0) {
                lastBackpackHitboxes.push({
                    x: slotX,
                    y: slotY,
                    w: slotW,
                    h: slotH,
                    action: 'drop',
                    materialId: matId
                });
            }
        });
    }

    targetCtx.restore();
}

function updatePowerGrid(levelData) {
    if (!levelData) return;

    const poles = levelData.poles || [];
    const cables = levelData.cables || [];
    const generators = levelData.generators || [];

    poles.forEach(p => {
        p.isPowered = false;
        p.hasPower = false;
        if (typeof p.setPowerState === 'function') p.setPowerState(false);
    });

    cables.forEach(c => {
        c.isPowered = false;
        c.hasPower = false;
        if (typeof c.setPowerState === 'function') c.setPowerState(false);
    });

    const poweredPoles = new Set();
    const poweredCables = new Set();
    const queue = [];

    generators.forEach(gen => {
        if (!gen || !gen.isPowered) return;
        const gPt = typeof gen.getConnectionPoint === 'function'
            ? gen.getConnectionPoint()
            : { x: gen.x + (gen.width || 44) / 2, y: gen.y };

        cables.forEach(cable => {
            if (!cable || cable.isBroken || (typeof cable.hp === 'number' && cable.hp <= 0)) return;
            const linkedFromGen = Array.isArray(gen.linkedCables) && gen.linkedCables.includes(cable);
            const nearGenStart = Math.hypot((cable.startX || 0) - gPt.x, (cable.startY || 0) - gPt.y) < 48;

            if ((linkedFromGen || nearGenStart) && !poweredCables.has(cable)) {
                poweredCables.add(cable);
                if (cable.rightPole && !cable.rightPole.isDestroyed) {
                    if (!poweredPoles.has(cable.rightPole)) {
                        poweredPoles.add(cable.rightPole);
                        queue.push(cable.rightPole);
                    }
                }
                if (cable.leftPole && !cable.leftPole.isDestroyed) {
                    if (!poweredPoles.has(cable.leftPole)) {
                        poweredPoles.add(cable.leftPole);
                        queue.push(cable.leftPole);
                    }
                }
            }
        });
    });

    while (queue.length > 0) {
        const currentPole = queue.shift();
        if (!currentPole || currentPole.isDestroyed) continue;

        cables.forEach(cable => {
            if (!cable || cable.isBroken || (typeof cable.hp === 'number' && cable.hp <= 0)) return;
            const touchesPole = cable.leftPole === currentPole || cable.rightPole === currentPole;
            if (!touchesPole) return;

            poweredCables.add(cable);

            const nextPole = cable.leftPole === currentPole ? cable.rightPole : cable.leftPole;
            if (nextPole && !nextPole.isDestroyed && !poweredPoles.has(nextPole)) {
                poweredPoles.add(nextPole);
                queue.push(nextPole);
            }
        });
    }

    poweredPoles.forEach(p => {
        p.isPowered = true;
        p.hasPower = true;
        if (typeof p.setPowerState === 'function') p.setPowerState(true);
    });

    poweredCables.forEach(c => {
        c.isPowered = true;
        c.hasPower = true;
        if (typeof c.setPowerState === 'function') c.setPowerState(true);
    });
}

function getGeneratorAttachPoint(gen) {
    if (gen && typeof gen.getConnectionPoint === 'function') {
        const pt = gen.getConnectionPoint();
        if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            return pt;
        }
    }
    return {
        x: (gen.x || 0) + (gen.width || 44) / 2,
        y: (gen.y || 0) + 6
    };
}

function getPoleAttachPoint(pole) {
    if (pole && typeof pole.getCableAttachmentPoint === 'function') {
        const pt = pole.getCableAttachmentPoint();
        if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
            return pt;
        }
    }
    const groundY = pole?.groundY ?? 400;
    const height = pole?.height ?? 180;
    return {
        x: pole?.x ?? 0,
        y: groundY - height + 24
    };
}

function findNearestTargetForGenerator(gen) {
    if (!currentLevelData || !gen) return null;
    const gPt = getGeneratorAttachPoint(gen);
    let best = null;
    let bestDist = 520;

    (currentLevelData.poles || []).forEach(pole => {
        if (!pole || pole.isDestroyed) return;
        const pPt = getPoleAttachPoint(pole);
        const d = Math.hypot(pPt.x - gPt.x, pPt.y - gPt.y);
        if (d < bestDist) {
            bestDist = d;
            best = {
                type: 'pole',
                pole,
                x: pPt.x,
                y: pPt.y,
                label: `Крестовина столба (X:${Math.round(pole.x)})`
            };
        }
    });

    return best;
}

function attachGeneratorCableToPole(gen, poleTarget) {
    if (!currentLevelData || !gen || !poleTarget || !poleTarget.pole) return null;

    const startPt = getGeneratorAttachPoint(gen);
    const endPt = getPoleAttachPoint(poleTarget.pole);
    const line = new Cable(
        startPt.x,
        startPt.y,
        endPt.x,
        endPt.y,
        55,
        null,
        poleTarget.pole
    );

    line.startX = startPt.x;
    line.startY = startPt.y;
    line.endX = endPt.x;
    line.endY = endPt.y;
    line.x1 = startPt.x;
    line.y1 = startPt.y;
    line.x2 = endPt.x;
    line.y2 = endPt.y;
    line.sourceGenerator = gen;
    line.generator = gen;
    line.targetPole = poleTarget.pole;
    line.rightPole = poleTarget.pole;
    line.isBroken = false;
    line.broken = false;
    line.isPowered = Boolean(gen.isPowered);
    line.hasPower = Boolean(gen.isPowered);
    if (typeof line.maxHp === 'number') {
        line.hp = line.maxHp;
    }

    currentLevelData.cables = currentLevelData.cables || [];
    currentLevelData.cables.push(line);

    if (!Array.isArray(gen.linkedCables)) {
        gen.linkedCables = [];
    }
    gen.linkedCables.push(line);

    if (!Array.isArray(poleTarget.pole.cables)) {
        poleTarget.pole.cables = [];
    }
    poleTarget.pole.cables.push(line);

    updatePowerGrid(currentLevelData);
    return line;
}

function handleEngineeringInteract() {
    if (!gameStarted || !player || !currentLevelData) return;
    if (isRepairPromptOpen()) return;

    const pCenterX = player.x + (player.width || 32) / 2;
    const pCenterY = getSafePlayerY(player) + (player.height || 32) / 2;

    let nearPole = null;
    let bestPoleDist = 85;

    (currentLevelData.poles || []).forEach(pole => {
        const dx = Math.abs(pCenterX - pole.x);
        const poleTop = pole.groundY - (pole.height || 200);
        const withinVertical = pCenterY >= poleTop - 30 && pCenterY <= pole.groundY + 40;
        if (withinVertical && dx < bestPoleDist) {
            bestPoleDist = dx;
            nearPole = pole;
        }
    });

    if (nearPole) {
        if (nearPole.isDestroyed) {
            const chipCount = getMaterialCount('microchip');
            const hasChip = chipCount >= 1;
            openRepairPrompt({
                title: `// ОПОРА ЛЭП РАЗРУШЕНА (X: ${Math.round(nearPole.x)})`,
                subtitle: 'Сначала необходимо поднять и восстановить саму опору, затем проверять линии.',
                options: [
                    {
                        label: 'Восстановить столб',
                        description: `В рюкзаке корпоративных плат: ${chipCount}`,
                        costs: [{ materialId: 'microchip', amount: 1 }],
                        canAfford: hasChip,
                        onConfirm: () => {
                            if (spendMaterial('microchip', 1)) {
                                if (typeof nearPole.repairPole === 'function') {
                                    nearPole.repairPole();
                                } else {
                                    nearPole.isDestroyed = false;
                                    if (typeof nearPole.maxHp === 'number') {
                                        nearPole.hp = nearPole.maxHp;
                                    }
                                }
                                updatePowerGrid(currentLevelData);
                            }
                        }
                    }
                ]
            });
            return;
        }

        const poleCables = (currentLevelData.cables || []).filter(
            c => (c.leftPole === nearPole || c.rightPole === nearPole) && (c.isBroken || c.broken || (typeof c.hp === 'number' && c.hp < c.maxHp))
        );

        const leftCable = poleCables.find(c => c.rightPole === nearPole);
        const rightCable = poleCables.find(c => c.leftPole === nearPole);
        const wireCount = getMaterialCount('copper_wire');
        const hasWire = wireCount >= 1;
        const options = [];

        const repairCableObj = (cab) => {
            if (!cab) return;
            if (typeof cab.repair === 'function') {
                cab.repair();
            }
            cab.isBroken = false;
            cab.broken = false;
            if (typeof cab.maxHp === 'number') {
                cab.hp = cab.maxHp;
            }
            updatePowerGrid(currentLevelData);
        };

        if (leftCable && rightCable) {
            options.push({
                label: 'Починить кабель СЛЕВА',
                description: `В рюкзаке медного провода: ${wireCount}`,
                costs: [{ materialId: 'copper_wire', amount: 1 }],
                canAfford: hasWire,
                onConfirm: () => {
                    if (spendMaterial('copper_wire', 1)) {
                        repairCableObj(leftCable);
                    }
                }
            });
            options.push({
                label: 'Починить кабель СПРАВА',
                description: `В рюкзаке медного провода: ${wireCount}`,
                costs: [{ materialId: 'copper_wire', amount: 1 }],
                canAfford: hasWire,
                onConfirm: () => {
                    if (spendMaterial('copper_wire', 1)) {
                        repairCableObj(rightCable);
                    }
                }
            });
        } else if (poleCables.length > 0) {
            const singleCable = poleCables[0];
            const sideText = singleCable.rightPole === nearPole ? 'СЛЕВА' : 'СПРАВА';
            options.push({
                label: `Починить кабель (${sideText})`,
                description: `В рюкзаке медного провода: ${wireCount}`,
                costs: [{ materialId: 'copper_wire', amount: 1 }],
                canAfford: hasWire,
                onConfirm: () => {
                    if (spendMaterial('copper_wire', 1)) {
                        repairCableObj(singleCable);
                    }
                }
            });
        }

        if (options.length > 0) {
            openRepairPrompt({
                title: `// УЗЕЛ ЛЭП (X: ${Math.round(nearPole.x)})`,
                subtitle: 'Выберите сторону и подтвердите расход медного провода.',
                options
            });
            return;
        }
    }

    const nearGen = (currentLevelData.generators || []).find(gen => {
        const gCenterX = gen.x + gen.width / 2;
        const gCenterY = gen.y + gen.height / 2;
        return Math.hypot(pCenterX - gCenterX, pCenterY - gCenterY) < 80;
    });

    if (nearGen) {
        const targetObj = findNearestTargetForGenerator(nearGen);
        const options = [];
        const cellCount = getMaterialCount('power_cell');
        const wireCount = getMaterialCount('copper_wire');
        const hasCell = cellCount >= 1;
        const hasWire = wireCount >= 1;

        if (!nearGen.isPowered) {
            options.push({
                label: `Запустить генератор [${nearGen.label}]`,
                description: `В рюкзаке энерго-элементов: ${cellCount}`,
                costs: [{ materialId: 'power_cell', amount: 1 }],
                canAfford: hasCell,
                onConfirm: () => {
                    if (spendMaterial('power_cell', 1)) {
                        nearGen.powerOn();
                        updatePowerGrid(currentLevelData);
                    }
                }
            });
        }

        if (targetObj) {
            if (!nearGen.isPowered) {
                options.push({
                    label: `Запустить и протянуть провод к крестовине`,
                    description: `${targetObj.label} • Энерго-элементов: ${cellCount}, проводов: ${wireCount}`,
                    costs: [
                        { materialId: 'power_cell', amount: 1 },
                        { materialId: 'copper_wire', amount: 1 }
                    ],
                    canAfford: hasCell && hasWire,
                    onConfirm: () => {
                        if (hasMaterial('power_cell', 1) && hasMaterial('copper_wire', 1)) {
                            spendMaterial('power_cell', 1);
                            spendMaterial('copper_wire', 1);
                            nearGen.powerOn();
                            attachGeneratorCableToPole(nearGen, targetObj);
                        }
                    }
                });
            } else {
                options.push({
                    label: `Протянуть провод к крестовине`,
                    description: `${targetObj.label} • В рюкзаке проводов: ${wireCount}`,
                    costs: [{ materialId: 'copper_wire', amount: 1 }],
                    canAfford: hasWire,
                    onConfirm: () => {
                        if (spendMaterial('copper_wire', 1)) {
                            attachGeneratorCableToPole(nearGen, targetObj);
                        }
                    }
                });
            }
        }

        if (options.length > 0) {
            openRepairPrompt({
                title: `// ГЕНЕРАТОР [${nearGen.label}]`,
                subtitle: targetObj
                    ? `Линия пойдёт от генератора к крестовине: ${targetObj.label}.`
                    : 'Поблизости нет столбов для подключения к крестовине.',
                options
            });
            return;
        }
    }

    const alloyCount = getMaterialCount('rare_alloy');
    if (alloyCount >= 1) {
        openRepairPrompt({
            title: 'Потратить Редкий сплав на установку платформы?',
            subtitle: `В рюкзаке редкого сплава: ${alloyCount} • Слева или справа перед героем по взгляду`,
            options: [
                {
                    label: 'Подтвердить и установить платформу',
                    description: 'Расход: 1 Редкий сплав',
                    costs: [{ materialId: 'rare_alloy', amount: 1 }],
                    canAfford: true,
                    onConfirm: () => {
                        placeAlloyPlatformForPlayer(player);
                    }
                }
            ]
        });
    }
}

function getWorldObjects() {
    if (!currentLevelData) return [];
    return [
        ...(currentLevelData.poles || []),
        ...(currentLevelData.cables || []),
        ...(currentLevelData.barrels || []),
        ...(currentLevelData.generators || [])
    ];
}

function onCanvasClick(e) {
    if (!gameStarted || isRepairPromptOpen()) return;
    const now = performance.now();
    if (now - lastDropTime < 140) return;

    const pt = getLogicalCanvasCoords(e.clientX, e.clientY);

    for (const box of lastBackpackHitboxes) {
        if (pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h) {
            if (box.action === 'toggle') {
                lastDropTime = now;
                toggleBackpackUI();
                return;
            }
            if (box.action === 'close') {
                lastDropTime = now;
                closeCanvasBackpack();
                return;
            }
            if (box.action === 'drop' && box.materialId) {
                dropMaterialToFloor(box.materialId);
                return;
            }
        }
    }
}

function onWindowKeyDown(e) {
    keys[e.code] = true;

    if (!e.repeat && (e.code === 'KeyI' || e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'ш')) {
        e.preventDefault();
        toggleBackpackUI();
        return;
    }

    if (e.code === 'Escape') {
        if (isRepairPromptOpen()) {
            closeRepairPrompt();
            return;
        }
        if (canvasBackpackOpen) {
            closeCanvasBackpack();
        }
    }

    if (!e.repeat && e.code === 'KeyR') {
        e.preventDefault();
        handleEngineeringInteract();
        return;
    }

    if (e.code === 'KeyF') {
        const now = performance.now();
        if (!e.repeat && (now - lastPickupTime) >= 140 && player && currentLevelData && Array.isArray(currentLevelData.collectibles)) {
            const pCenterX = player.x + (player.width || 32) / 2;
            const pCenterY = getSafePlayerY(player) + (player.height || 32) / 2;

            let nearestItem = null;
            let bestDist = 110;

            for (const item of currentLevelData.collectibles) {
                if (!item || item.isCollected) continue;
                const itemCenterX = item.x + (item.width || 32) / 2;
                const itemCenterY = item.y + (item.height || 32) / 2;
                const d = Math.hypot(pCenterX - itemCenterX, pCenterY - itemCenterY);
                if (d < bestDist) {
                    bestDist = d;
                    nearestItem = item;
                }
            }

            if (nearestItem && typeof nearestItem.collect === 'function') {
                lastPickupTime = now;
                const pickedOk = nearestItem.collect(player);
                if (pickedOk || nearestItem.isCollected) {
                    nearestItem.isCollected = true;
                    currentLevelData.collectibles = currentLevelData.collectibles.filter(c => c !== nearestItem && !c.isCollected);
                }
                return;
            }
        }

        if (player && typeof player.triggerAttack === 'function') {
            player.triggerAttack(projectileManager, getWorldObjects());
        }
    }

    if (e.code === 'KeyE') {
        if (player && typeof player.toggleTurbo === 'function') {
            player.toggleTurbo();
        }
    }

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (player && typeof player.jump === 'function') {
            player.jump();
        }
    }

    if (e.code === 'KeyC') {
        if (player && currentLevelData && currentLevelData.consoles) {
            const nearConsole = currentLevelData.consoles.find(con =>
                Math.hypot(player.x - con.x, getSafePlayerY(player) - con.y) < 60
            );

            if (nearConsole) {
                if (typeof window.openShopUI === 'function') {
                    window.openShopUI();
                } else {
                    console.log("🛠️ Интерфейс магазина вызывается у консоли!");
                }
            }
        }
    }
}

function onWindowKeyUp(e) {
    keys[e.code] = false;
}

if (canvas) {
    if (window.__prevCanvasClickHandler) {
        canvas.removeEventListener('click', window.__prevCanvasClickHandler);
    }
    window.__prevCanvasClickHandler = onCanvasClick;
    canvas.addEventListener('click', onCanvasClick);
}

if (window.__prevMainKeyDownHandler) {
    window.removeEventListener('keydown', window.__prevMainKeyDownHandler);
}
if (window.__prevMainKeyUpHandler) {
    window.removeEventListener('keyup', window.__prevMainKeyUpHandler);
}
window.__prevMainKeyDownHandler = onWindowKeyDown;
window.__prevMainKeyUpHandler = onWindowKeyUp;
window.addEventListener('keydown', onWindowKeyDown);
window.addEventListener('keyup', onWindowKeyUp);

function setupMobileControls() {
    if (document.getElementById('mobile-controls')) return;

    const mobileContainer = document.createElement('div');
    mobileContainer.id = 'mobile-controls';
    mobileContainer.innerHTML = `
      <div style="display:flex; gap:15px; pointer-events:auto;">
        <div id="btn-left" style="width:65px; height:65px; background:rgba(56,189,248,0.27); border:2px solid #38bdf8; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">◀</div>
        <div id="btn-right" style="width:65px; height:65px; background:rgba(56,189,248,0.27); border:2px solid #38bdf8; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">▶</div>
      </div>
      <div style="display:flex; gap:12px; pointer-events:auto;">
        <div id="btn-bag" style="width:55px; height:55px; background:rgba(0,255,204,0.22); border:2px solid #00ffcc; border-radius:50%; color:#00ffcc; font-size:20px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">🎒</div>
        <div id="btn-repair" style="width:55px; height:55px; background:rgba(251,191,36,0.25); border:2px solid #fbbf24; border-radius:50%; color:#fbbf24; font-size:20px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">🔧</div>
        <div id="btn-turbo" style="width:55px; height:55px; background:rgba(15,23,42,0.6); border:2px solid #64748b; border-radius:50%; color:#64748b; font-size:20px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none; opacity:0.85;">⚡</div>
        <div id="btn-attack" style="width:65px; height:65px; background:rgba(236,72,153,0.3); border:2px solid #ec4899; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">👊</div>
        <div id="btn-jump" style="width:65px; height:65px; background:rgba(56,189,248,0.3); border:2px solid #38bdf8; border-radius:50%; color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; touch-action:none;">▲</div>
      </div>
    `;

    mobileContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
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

    const attachPress = (id, onPress, onRelease) => {
        const el = document.getElementById(id);
        if (!el) return;

        let active = false;

        const handleStart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (active) return;
            active = true;
            el.style.transform = 'scale(0.92)';
            if (onPress) onPress();
        };

        const handleEnd = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!active) return;
            active = false;
            el.style.transform = 'scale(1)';
            if (onRelease) onRelease();
        };

        el.addEventListener('pointerdown', handleStart, { passive: false });
        el.addEventListener('pointerup', handleEnd, { passive: false });
        el.addEventListener('pointercancel', handleEnd, { passive: false });
        el.addEventListener('pointerleave', handleEnd, { passive: false });

        el.addEventListener('touchstart', handleStart, { passive: false });
        el.addEventListener('touchend', handleEnd, { passive: false });
        el.addEventListener('touchcancel', handleEnd, { passive: false });
    };

    const forceJump = () => {
        if (!gameStarted || !player) return;
        if (typeof player.jump === 'function') {
            player.jump();
        }
        const vyNow = player.vy ?? player.velocityY ?? 0;
        if (vyNow >= 0) {
            const jumpImpulse = player.jumpForce ?? player.jumpPower ?? player.jumpSpeed ?? -11;
            const targetVy = jumpImpulse < 0 ? jumpImpulse : -Math.abs(jumpImpulse || 11);
            if (typeof player.vy === 'number') player.vy = targetVy;
            if (typeof player.velocityY === 'number') player.velocityY = targetVy;
            player.onGround = false;
            player.isGrounded = false;
        }
    };

    const tryMobilePickupOrAttack = () => {
        if (!gameStarted || !player) return;

        const now = performance.now();
        if ((now - lastPickupTime) >= 140 && currentLevelData && Array.isArray(currentLevelData.collectibles)) {
            const pCenterX = player.x + (player.width || 32) / 2;
            const pCenterY = getSafePlayerY(player) + (player.height || 32) / 2;

            let nearestItem = null;
            let bestDist = 110;

            for (const item of currentLevelData.collectibles) {
                if (!item || item.isCollected) continue;
                const itemCenterX = item.x + (item.width || 32) / 2;
                const itemCenterY = item.y + (item.height || 32) / 2;
                const d = Math.hypot(pCenterX - itemCenterX, pCenterY - itemCenterY);
                if (d < bestDist) {
                    bestDist = d;
                    nearestItem = item;
                }
            }

            if (nearestItem && typeof nearestItem.collect === 'function') {
                lastPickupTime = now;
                const pickedOk = nearestItem.collect(player);
                if (pickedOk || nearestItem.isCollected) {
                    nearestItem.isCollected = true;
                    currentLevelData.collectibles = currentLevelData.collectibles.filter(c => c !== nearestItem && !c.isCollected);
                }
                return;
            }
        }

        if (typeof player.triggerAttack === 'function') {
            player.triggerAttack(projectileManager, getWorldObjects());
        } else if (typeof player.attack === 'function') {
            player.attack(projectileManager, getWorldObjects());
        }
    };

    attachPress(
        'btn-left',
        () => {
            keys['ArrowLeft'] = true;
            if (player && typeof player.moveLeft === 'function') player.moveLeft();
        },
        () => {
            keys['ArrowLeft'] = false;
            if (!keys['ArrowRight'] && !keys['KeyD'] && player && typeof player.stop === 'function') {
                player.stop();
            }
        }
    );

    attachPress(
        'btn-right',
        () => {
            keys['ArrowRight'] = true;
            if (player && typeof player.moveRight === 'function') player.moveRight();
        },
        () => {
            keys['ArrowRight'] = false;
            if (!keys['ArrowLeft'] && !keys['KeyA'] && player && typeof player.stop === 'function') {
                player.stop();
            }
        }
    );

    attachPress('btn-jump', forceJump);
    attachPress('btn-attack', tryMobilePickupOrAttack);
    attachPress('btn-repair', () => {
        if (gameStarted) handleEngineeringInteract();
    });
    attachPress('btn-turbo', () => {
        if (gameStarted && player && typeof player.toggleTurbo === 'function') {
            player.toggleTurbo();
        }
    });
    attachPress('btn-bag', () => {
        if (gameStarted) toggleBackpackUI();
    });
}

function startGameWithChar(selectedChar) {
    try {
        const choice = window.__menuChoice || { biome: 'factory', level: 1, isNight: false };
        const chosenBiome = choice.biome || 'factory';
        const chosenLevel = Math.max(1, parseInt(choice.level, 10) || 1);
        const chosenNight = Boolean(choice.isNight);

        player = new Player(100, 100, selectedChar || 'Alisa');
        alloyPlatformsList = [];
        canvasBackpackOpen = false;
        hideExternalBackpackDom();

        const generated = generateLevelData(chosenLevel, {
            biome: chosenBiome,
            isNight: chosenNight
        });

        const polesList = (generated.poles || []).map(p => new PowerLinePole(p.x, p.groundY));

        const cablesList = (generated.cables || []).map(c => {
            const leftPole = polesList.find(p => Math.abs(p.x - c.startX) < 40) || null;
            const rightPole = polesList.find(p => Math.abs(p.x - c.endX) < 40) || null;

            const cable = new Cable(c.startX, c.startY, c.endX, c.endY, c.slack, leftPole, rightPole);

            if (leftPole) leftPole.cables.push(cable);
            if (rightPole) rightPole.cables.push(cable);

            return cable;
        });

        const generatorsList = (generated.generators || []).map(
            (g, idx) => {
                const genObj = new Generator(g.x, g.y, g.width || 44, g.height || 40, g.label || `GEN-${idx + 1}`);
                if (g.isPowered || g.powered) {
                    genObj.powerOn();
                }
                return genObj;
            }
        );

        if (generatorsList.length === 0 && polesList.length > 0) {
            const firstPole = polesList[0];
            generatorsList.push(new Generator(firstPole.x - 75, firstPole.groundY - 40, 44, 40, 'GEN-1'));
        }

        const collectiblesList = [
            new Collectable(300, 380, 'coin'),
            new Collectable(450, 380, 'coin'),
            new Collectable(600, 320, 'heart'),
            new Collectable(850, 380, 'plasma'),
            new Collectable(1100, 320, 'coin'),
            ...(generated.collectibles || [])
        ];

        currentLevelData = {
            ...generated,
            levelNumber: chosenLevel,
            biome: chosenBiome,
            isNight: chosenNight,
            grassList: (generated.grassList || []).map(g => new Grass(g.x, g.y, g.type || 1)),
            poles: polesList,
            cables: cablesList,
            generators: generatorsList,
            alloyPlatforms: alloyPlatformsList,
            barrels: generated.barrels || [],
            collectibles: collectiblesList,
            consoles: generated.consoles || []
        };

        window.currentLevelData = currentLevelData;
        syncAlloyArrays();

        if (window.platformManager) {
            window.platformManager.initFromGrid(generated.grid, TILE);
        }

        player.x = generated.playerStart.x * TILE;
        player.y = (generated.playerStart.y - 2) * TILE;
        player.prevY = player.y;
        camera.x = Math.max(0, player.x - LOGICAL_WIDTH / 2);

        const charSelectMenu = document.getElementById('character-select');
        if (charSelectMenu) charSelectMenu.style.display = 'none';

        gameStarted = true;
    } catch (err) {
        console.error('❌ Ошибка старта сессии:', err);
    }
}

function mountBiomeBar() {
    const charSelectMenu = document.getElementById('character-select');
    if (!charSelectMenu || document.getElementById('biome-select-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'biome-select-bar';
    bar.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 14px;
        padding: 10px 14px;
        background: rgba(3, 7, 18, 0.9);
        border: 1px solid #38bdf8;
        font-family: monospace;
        font-size: 12px;
        color: #e2e8f0;
        position: relative;
        z-index: 100;
    `;

    const lvlLabel = document.createElement('span');
    lvlLabel.style.color = '#fbbf24';
    lvlLabel.textContent = 'LVL:';

    const lvlInput = document.createElement('input');
    lvlInput.type = 'number';
    lvlInput.min = '1';
    lvlInput.max = '999';
    lvlInput.value = String(window.__menuChoice.level);
    lvlInput.style.cssText = 'width:58px; padding:3px 5px; background:#020617; border:1px solid #38bdf8; color:#fff; font-family:monospace;';
    lvlInput.addEventListener('input', () => {
        window.__menuChoice.level = Math.max(1, parseInt(lvlInput.value, 10) || 1);
    });

    const dayNightBtn = document.createElement('button');
    dayNightBtn.type = 'button';
    dayNightBtn.textContent = '☀ ДЕНЬ';
    dayNightBtn.style.cssText = 'padding:5px 9px; background:#1e293b; border:1px solid #a855f7; color:#e9d5ff; cursor:pointer; font-family:monospace; font-size:12px;';
    dayNightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.__menuChoice.isNight = !window.__menuChoice.isNight;
        dayNightBtn.textContent = window.__menuChoice.isNight ? '🌙 НОЧЬ' : '☀ ДЕНЬ';
    });

    bar.appendChild(lvlLabel);
    bar.appendChild(lvlInput);
    bar.appendChild(dayNightBtn);

    const biomeButtons = [];
    const refreshBiomeStyles = () => {
        biomeButtons.forEach(({ btn, id }) => {
            const active = window.__menuChoice.biome === id;
            btn.style.background = active ? '#164e63' : '#1e293b';
            btn.style.borderColor = active ? '#00ffcc' : '#475569';
            btn.style.color = active ? '#00ffcc' : '#e2e8f0';
        });
    };

    BIOMES.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = b.label;
        btn.style.cssText = 'padding:5px 9px; border:1px solid #475569; cursor:pointer; font-family:monospace; font-size:12px;';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.__menuChoice.biome = b.id;
            window.__menuChoice.level = b.level;
            lvlInput.value = String(b.level);
            refreshBiomeStyles();
        });
        biomeButtons.push({ btn, id: b.id });
        bar.appendChild(btn);
    });

    refreshBiomeStyles();
    charSelectMenu.appendChild(bar);
}

mountBiomeBar();

document.querySelectorAll('.char-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const chosenChar = e.currentTarget.getAttribute('data-char') || 'Alisa';
        const lvlEl = document.querySelector('#biome-select-bar input[type="number"]');
        if (lvlEl) {
            window.__menuChoice.level = Math.max(1, parseInt(lvlEl.value, 10) || 1);
        }
        startGameWithChar(chosenChar);
    });
});

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupMobileControls();

    loadAllAssets(() => {
        assetsLoaded = true;
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.4s';
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 400);
        }

        const loaderFill = document.getElementById('loader-fill');
        const loaderText = document.getElementById('loader-text');
        if (loaderFill) loaderFill.style.width = '100%';
        if (loaderText) loaderText.innerText = `СИСТЕМЫ ГОТОВЫ! 100%`;
    });

    if (overlay) {
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
    }

    requestAnimationFrame(gameLoop);
}

function handleInput() {
    if (!player || !gameStarted) return;

    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.facingLeft = true;
        if (typeof player.moveLeft === 'function') player.moveLeft();
        const speed = Math.abs(player.speed ?? player.moveSpeed ?? 4) || 4;
        if (typeof player.vx === 'number') player.vx = -speed;
        if (typeof player.velocityX === 'number') player.velocityX = -speed;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.facingLeft = false;
        if (typeof player.moveRight === 'function') player.moveRight();
        const speed = Math.abs(player.speed ?? player.moveSpeed ?? 4) || 4;
        if (typeof player.vx === 'number') player.vx = speed;
        if (typeof player.velocityX === 'number') player.velocityX = speed;
    } else if (typeof player.stop === 'function') {
        player.stop();
    }
}

let lastTime = performance.now();

function gameLoop(timestamp) {
    try {
        const rawDelta = (timestamp - lastTime) / 1000;
        const deltaTime = Math.min(rawDelta, 0.05);
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleInput();

        if (gameStarted && player && currentLevelData) {
            player.prevY = player.y;

            if (typeof player.update === 'function') {
                player.update(currentLevelData.grid, TILE, deltaTime, particleSystem);
            }
            if (window.platformManager) {
                platformManager.update(player, deltaTime);
            }
            applyAlloyPlatformCollision(player, alloyPlatformsList);

            if (window.projectileManager) {
                window.projectileManager.update(deltaTime);

                if (projectileManager.projectiles && projectileManager.projectiles.length > 0 && currentLevelData.poles) {
                    projectileManager.projectiles.forEach(proj => {
                        if (!proj.active) return;
                        currentLevelData.poles.forEach(pole => {
                            const poleTopY = pole.groundY - pole.height;
                            if (proj.x >= pole.x - 20 && proj.x <= pole.x + 20 &&
                                proj.y >= poleTopY && proj.y <= pole.groundY) {

                                pole.takeDamage(20);
                                proj.active = false;
                                if (window.triggerScreenShake) window.triggerScreenShake(4, 15);
                            }
                        });
                    });
                }
            }

            if (currentLevelData.cables) {
                currentLevelData.cables.forEach(cableObj => cableObj.update(player, deltaTime));
            }
            if (currentLevelData.generators) {
                currentLevelData.generators.forEach(genObj => genObj.update(deltaTime));
            }
            if (currentLevelData.grassList) {
                currentLevelData.grassList.forEach(grassObj => grassObj.update(player, deltaTime));
            }
            if (currentLevelData.barrels) {
                currentLevelData.barrels.forEach(barrel => barrel.update(deltaTime));
            }
            if (currentLevelData.collectibles) {
                currentLevelData.collectibles.forEach(item => item.update(deltaTime, player));
            }

            updatePowerGrid(currentLevelData);
        }

        if (currentLevelData && currentLevelData.grid) {
            const grid = currentLevelData.grid;
            const biome = currentLevelData.biome || 'seaport';
            const biomeAssets = assetsCache[biome] || {};

            const tileMapping = {
                1: "ground_top",
                2: "ground_sub",
                3: "plat_left",
                4: "plat_center",
                5: "plat_right",
                6: "liquid_top",
                7: "liquid_body",
                8: "decor_1",
                9: "decor_2",
                10: "decor_3"
            };

            ctx.fillStyle = '#030712';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const isNightTime = currentLevelData.isNight || false;
            const bgStatic = isNightTime ? biomeAssets.bg_background_night : biomeAssets.bg_background_day;

            if (bgStatic && bgStatic.complete && bgStatic.naturalWidth > 0) {
                ctx.drawImage(bgStatic, 0, 0, canvas.width, canvas.height);
            }

            const backImg = isNightTime ? biomeAssets.bg_back_night : biomeAssets.bg_back_day;
            const midImg = isNightTime ? biomeAssets.bg_mid_night : biomeAssets.bg_mid_day;
            const frontImg = isNightTime ? biomeAssets.bg_front_night : biomeAssets.bg_front_day;

            if (backImg && backImg.complete && backImg.naturalWidth > 0) {
                const x1 = -(camera.x * 0.27) % canvas.width;
                ctx.drawImage(backImg, x1, 0, canvas.width, canvas.height);
                ctx.drawImage(backImg, x1 + canvas.width, 0, canvas.width, canvas.height);
            }

            if (midImg && midImg.complete && midImg.naturalWidth > 0) {
                const x2 = -(camera.x * 0.5) % canvas.width;
                ctx.drawImage(midImg, x2, 0, canvas.width, canvas.height);
                ctx.drawImage(midImg, x2 + canvas.width, 0, canvas.width, canvas.height);
            }

            if (frontImg && frontImg.complete && frontImg.naturalWidth > 0) {
                const x3 = -(camera.x * 0.75) % canvas.width;
                ctx.drawImage(frontImg, x3, 0, canvas.width, canvas.height);
                ctx.drawImage(frontImg, x3 + canvas.width, 0, canvas.width, canvas.height);
            }

            ctx.save();
            ctx.translate(-Math.floor(camera.x), 0);

            if (currentLevelData.consoles) {
                const playerX = player ? player.x : 0;
                const playerY = player ? getSafePlayerY(player) : 0;

                currentLevelData.consoles.forEach(con => {
                    const dist = Math.hypot(playerX - con.x, playerY - con.y);
                    const isNear = dist < 60;

                    ctx.save();
                    ctx.fillStyle = '#0f172a';
                    ctx.strokeStyle = isNear ? '#00ffcc' : '#38bdf8';
                    ctx.lineWidth = isNear ? 3 : 2;
                    ctx.shadowColor = isNear ? '#00ffcc' : '#38bdf8';
                    ctx.shadowBlur = isNear ? 16 : 8;

                    ctx.fillRect(con.x, con.y - 16, 40, 56);
                    ctx.strokeRect(con.x, con.y - 16, 40, 56);

                    const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
                    ctx.fillStyle = isNear ? `rgba(0, 255, 204, 0.9)` : `rgba(0, 255, 204, ${pulse})`;
                    ctx.fillRect(con.x + 6, con.y - 10, 28, 20);

                    ctx.fillStyle = isNear ? '#00ffcc' : '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(con.x + 20, con.y + 24, 4, 0, Math.PI * 2);
                    ctx.fill();

                    if (isNear) {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 10px monospace';
                        ctx.shadowColor = '#00ffcc';
                        ctx.shadowBlur = 6;
                        ctx.fillText('[C] МАГАЗИН', con.x - 12, con.y - 28);
                    }
                    ctx.restore();
                });
            }

            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    let tileId = grid[r][c];
                    if (tileId === 0 || (tileId >= 3 && tileId <= 5)) continue;

                    if (tileId === 6 || tileId === 7) {
                        if (water) {
                            water.drawAt(ctx, c * TILE, r * TILE, TILE, TILE, tileId === 6);
                        }
                    } else {
                        let textureName = tileMapping[tileId];
                        let img = textureName ? biomeAssets[textureName] : null;

                        if (img && img.complete && img.naturalWidth > 0) {
                            ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
                        } else {
                            ctx.fillStyle = tileId === 1 ? '#0ea5e9' : '#1e293b';
                            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
                        }
                    }
                }
            }

            if (currentLevelData.poles) {
                currentLevelData.poles.forEach(poleObj => poleObj.draw(ctx));
            }
            if (currentLevelData.cables) {
                currentLevelData.cables.forEach(cableObj => {
                    if (typeof cableObj.draw === 'function') {
                        cableObj.draw(ctx);
                    }
                    if (cableObj.sourceGenerator && !cableObj.isBroken && !cableObj.broken) {
                        const sx = cableObj.startX ?? cableObj.x1;
                        const sy = cableObj.startY ?? cableObj.y1;
                        const ex = cableObj.endX ?? cableObj.x2;
                        const ey = cableObj.endY ?? cableObj.y2;
                        if (
                            Number.isFinite(sx) && Number.isFinite(sy) &&
                            Number.isFinite(ex) && Number.isFinite(ey)
                        ) {
                            ctx.save();
                            ctx.beginPath();
                            const cx = (sx + ex) / 2;
                            const cy = Math.max(sy, ey) + (cableObj.slack || 45);
                            ctx.moveTo(sx, sy);
                            ctx.quadraticCurveTo(cx, cy, ex, ey);
                            ctx.strokeStyle = cableObj.isPowered ? '#00ffcc' : '#f59e0b';
                            ctx.lineWidth = 2.5;
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                });
            }
            if (currentLevelData.generators) {
                currentLevelData.generators.forEach(genObj => genObj.draw(ctx, player));
            }
            if (currentLevelData.grassList) {
                currentLevelData.grassList.forEach(grassObj => grassObj.draw(ctx));
            }
            if (currentLevelData.barrels) {
                currentLevelData.barrels.forEach(barrel => barrel.draw(ctx, biomeAssets));
            }

            if (window.platformManager) {
                platformManager.draw(ctx, currentLevelData.biome, assetsCache);
            }

            drawAlloyPlatformsWorld(ctx, alloyPlatformsList, biomeAssets);

            if (window.projectileManager) {
                window.projectileManager.draw(ctx);
            }
            if (particleSystem && typeof particleSystem.updateAndDraw === 'function') {
                particleSystem.updateAndDraw(ctx, deltaTime);
            }

            if (player && typeof player.draw === 'function') {
                player.draw(ctx);
            }

            if (currentLevelData.collectibles) {
                const commonAssets = assetsCache['common'] || {};
                const sheetImg = commonAssets.spritesheet || commonAssets.sheet || commonAssets.items || null;
                currentLevelData.collectibles.forEach(item => drawCollectibleClean(ctx, item, sheetImg));
            }

            ctx.restore();

            if (weatherSystem && typeof weatherSystem.draw === 'function') {
                weatherSystem.draw(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT, isNightTime);
            }

            if (player) {
                const targetCamX = player.x - LOGICAL_WIDTH / 3;
                camera.x += (targetCamX - camera.x) * 0.1;
                const maxCamX = grid[0].length * TILE - LOGICAL_WIDTH;
                camera.x = Math.max(0, Math.min(camera.x, maxCamX));
                window.currentCameraX = camera.x;
            }

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.fillRect(20, 15, 380, 60);
            ctx.strokeRect(20, 15, 380, 60);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 14px monospace';
            const currentTierTag = (currentLevelData.biome || 'seaport').substring(0, 3).toUpperCase();
            ctx.fillText(`L:${currentLevelData.levelNumber || 1} [${currentTierTag}]`, 30, 35);

            const hpPercent = player ? Math.max(0, player.hp / player.maxHp) : 1;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(110, 24, 160, 12);
            ctx.fillStyle = '#ec4899';
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 8;
            ctx.fillRect(110, 24, 160 * hpPercent, 12);

            const energyPercent = player ? Math.max(0, player.energy / player.maxEnergy) : 0;
            ctx.fillStyle = '#1e293b';
            ctx.shadowBlur = 0;
            ctx.fillRect(110, 44, 160, 10);
            ctx.fillStyle = player && player.isTurboActive ? '#00ffcc' : '#38bdf8';
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = player && player.isTurboActive ? 10 : 4;
            ctx.fillRect(110, 44, 160 * energyPercent, 10);

            ctx.fillStyle = '#ffffff';
            ctx.font = '11px monospace';
            ctx.shadowBlur = 0;
            ctx.fillText(`HP ${player ? player.hp : 100}`, 280, 34);
            ctx.fillText(`EN ${player ? player.energy : 0}%`, 280, 53);

            if (player && player.isTurboActive) {
                ctx.fillStyle = '#00ffcc';
                ctx.font = 'bold 12px monospace';
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 6;
                ctx.fillText('⚡ TURBO', 330, 44);
            }

            ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
            ctx.strokeStyle = '#fbbf24';
            ctx.fillRect(LOGICAL_WIDTH - 200, 15, 180, 45);
            ctx.strokeRect(LOGICAL_WIDTH - 200, 15, 180, 45);

            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 16px monospace';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 8;
            ctx.fillText(`SCORE: 1700`, LOGICAL_WIDTH - 180, 43);

            drawCanvasHudAndBackpack(ctx);

            ctx.restore();
        }
    } catch (err) {
        console.error('❌ LOOP ERR:', err);
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', init);