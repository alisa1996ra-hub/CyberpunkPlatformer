// js/inventoryUI.js

import { SHOP_CONFIG } from './shopConfig.js';

const MATERIAL_META = {
    copper_wire: { name: 'Медный провод',       icon: 'Icon14_38.png', color: '#f97316' },
    microchip:   { name: 'Корпоративная плата', icon: 'Icon14_32.png', color: '#22c55e' },
    power_cell:  { name: 'Энерго-элемент',      icon: 'Icon14_39.png', color: '#fbbf24' },
    rare_alloy:  { name: 'Редкий сплав',        icon: 'Icon14_09.png', color: '#38bdf8' }
};

function getMaxBackpackCapacity() {
    const cfg = SHOP_CONFIG?.upgrades?.backpack;
    const baseVal = Number(cfg?.baseValue) || 4;
    const stepVal = Number(cfg?.stepValue) || 2;
    const lvl = Math.max(0, Number(window.playerData?.upgrades?.backpack) || 0);
    return baseVal + lvl * stepVal;
}

let modalEl = null;
let isOpen = false;
let onDropCallback = null;

function resolveMaterialIconSrc(iconFile) {
    const baseKey = iconFile.replace(/\.png$/i, '');
    const cached =
        window.assetsCache?.common?.[iconFile] ||
        window.assetsCache?.common?.[baseKey] ||
        window.assetsCache?.[iconFile] ||
        window.assetsCache?.[baseKey];

    if (cached && cached.src) {
        return cached.src;
    }
    return `./assets/common/${iconFile}`;
}

function ensureStyles() {
    if (document.getElementById('neon-backpack-styles')) return;

    const style = document.createElement('style');
    style.id = 'neon-backpack-styles';
    style.textContent = `
        #neon-backpack-btn {
            position: fixed;
            top: 15px;
            left: 415px;
            z-index: 9500;
            background: rgba(3, 7, 18, 0.9);
            color: #00ffcc;
            border: 2px solid #00ffcc;
            box-shadow: 0 0 12px rgba(0, 255, 204, 0.45);
            font-family: monospace;
            font-weight: bold;
            font-size: 13px;
            padding: 8px 14px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: transform 0.12s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        #neon-backpack-btn:hover {
            background: rgba(0, 255, 204, 0.15);
            box-shadow: 0 0 18px rgba(0, 255, 204, 0.8);
            transform: translateY(-1px);
        }
        #neon-backpack-btn.full {
            color: #ff2a6d;
            border-color: #ff2a6d;
            box-shadow: 0 0 14px rgba(255, 42, 109, 0.6);
        }

        #neon-backpack-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 10000;
            background: rgba(2, 6, 23, 0.72);
            backdrop-filter: blur(3px);
            align-items: center;
            justify-content: center;
            font-family: monospace;
        }
        #neon-backpack-modal.open {
            display: flex;
        }
        .neon-bp-panel {
            width: 440px;
            max-width: 92vw;
            background: rgba(9, 14, 30, 0.96);
            border: 2px solid #00ffcc;
            box-shadow: 0 0 25px rgba(0, 255, 204, 0.35), inset 0 0 20px rgba(56, 189, 248, 0.08);
            padding: 18px 20px;
            color: #e2e8f0;
        }
        .neon-bp-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(0, 255, 204, 0.35);
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .neon-bp-title {
            color: #00ffcc;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
        }
        .neon-bp-capacity {
            font-size: 13px;
            padding: 3px 8px;
            border: 1px solid #38bdf8;
            color: #38bdf8;
        }
        .neon-bp-capacity.full {
            border-color: #ff2a6d;
            color: #ff2a6d;
        }
        .neon-bp-close {
            background: transparent;
            border: 1px solid #64748b;
            color: #cbd5e1;
            font-family: monospace;
            font-weight: bold;
            padding: 4px 9px;
            cursor: pointer;
        }
        .neon-bp-close:hover {
            border-color: #ff2a6d;
            color: #ff2a6d;
        }
        .neon-bp-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 14px;
        }
        .neon-bp-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.25);
            padding: 8px 12px;
        }
        .neon-bp-item-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .neon-bp-icon-box {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(2, 6, 23, 0.95);
            border: 1px solid rgba(148, 163, 184, 0.35);
            padding: 3px;
            box-sizing: border-box;
        }
        .neon-bp-icon-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
        }
        .neon-bp-name {
            font-size: 13px;
            font-weight: bold;
            color: #f8fafc;
        }
        .neon-bp-count {
            font-size: 12px;
            color: #94a3b8;
        }
        .neon-bp-drop-btn {
            background: rgba(255, 42, 109, 0.12);
            border: 1px solid #ff2a6d;
            color: #ff6b9d;
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
            padding: 6px 10px;
            cursor: pointer;
            transition: background 0.15s ease, color 0.15s ease;
        }
        .neon-bp-drop-btn:hover:not(:disabled) {
            background: #ff2a6d;
            color: #ffffff;
        }
        .neon-bp-drop-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            border-color: #475569;
            color: #64748b;
        }
        .neon-bp-hint {
            font-size: 11px;
            color: #94a3b8;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);
}

function getInventory() {
    if (!window.playerData) return {};
    if (!window.playerData.inventory) window.playerData.inventory = {};
    return window.playerData.inventory;
}

export function getTotalBackpackCount() {
    const inv = getInventory();
    return Object.values(inv).reduce((sum, val) => sum + (Number(val) || 0), 0);
}

export function isBackpackFull() {
    return getTotalBackpackCount() >= getMaxBackpackCapacity();
}

export function renderBackpackUI() {
    const inv = getInventory();
    const total = getTotalBackpackCount();
    const maxCap = getMaxBackpackCapacity();
    const full = total >= maxCap;

    const btn = document.getElementById('neon-backpack-btn');
    if (btn) {
        btn.textContent = `🎒 РЮКЗАК ${total}/${maxCap} [I]`;
        btn.classList.toggle('full', full);
    }

    if (!modalEl) return;

    const capEl = modalEl.querySelector('.neon-bp-capacity');
    if (capEl) {
        capEl.textContent = `${total} / ${maxCap}`;
        capEl.classList.toggle('full', full);
    }

    const hintEl = modalEl.querySelector('.neon-bp-hint');
    if (hintEl) {
        hintEl.innerHTML = `
            • Лимит: не более ${maxCap} любых материалов суммарно.<br>
            • «НА ПОЛ» роняет 1 шт. рядом с персонажем — предмет остаётся лежать и его можно снова подобрать клавишей [F].
        `;
    }

    const listEl = modalEl.querySelector('.neon-bp-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    Object.entries(MATERIAL_META).forEach(([matId, meta]) => {
        const count = Number(inv[matId]) || 0;

        const row = document.createElement('div');
        row.className = 'neon-bp-row';

        const left = document.createElement('div');
        left.className = 'neon-bp-item-left';

        const iconBox = document.createElement('div');
        iconBox.className = 'neon-bp-icon-box';
        iconBox.style.borderColor = meta.color;
        iconBox.style.boxShadow = `0 0 8px ${meta.color}55`;

        const img = document.createElement('img');
        img.className = 'neon-bp-icon-img';
        img.src = resolveMaterialIconSrc(meta.icon);
        img.alt = meta.name;
        iconBox.appendChild(img);

        const info = document.createElement('div');
        info.innerHTML = `
            <div class="neon-bp-name">${meta.name}</div>
            <div class="neon-bp-count">В рюкзаке: ${count} шт.</div>
        `;

        left.appendChild(iconBox);
        left.appendChild(info);

        const dropBtn = document.createElement('button');
        dropBtn.className = 'neon-bp-drop-btn';
        dropBtn.textContent = 'НА ПОЛ';
        dropBtn.disabled = count <= 0;
        dropBtn.addEventListener('click', () => {
            if (typeof onDropCallback === 'function') {
                onDropCallback(matId);
            }
            renderBackpackUI();
        });

        row.appendChild(left);
        row.appendChild(dropBtn);
        listEl.appendChild(row);
    });
}

export function openBackpackUI() {
    if (!modalEl) return;
    isOpen = true;
    renderBackpackUI();
    modalEl.classList.add('open');
}

export function closeBackpackUI() {
    if (!modalEl) return;
    isOpen = false;
    modalEl.classList.remove('open');
}

export function toggleBackpackUI() {
    if (isOpen) {
        closeBackpackUI();
    } else {
        openBackpackUI();
    }
}

export function initBackpackUI(dropHandler) {
    onDropCallback = dropHandler;
    ensureStyles();
    const maxCap = getMaxBackpackCapacity();

    if (!document.getElementById('neon-backpack-btn')) {
        const btn = document.createElement('button');
        btn.id = 'neon-backpack-btn';
        btn.type = 'button';
        btn.textContent = `🎒 РЮКЗАК 0/${maxCap} [I]`;
        btn.addEventListener('click', () => toggleBackpackUI());
        document.body.appendChild(btn);
    }

    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'neon-backpack-modal';
        modalEl.innerHTML = `
            <div class="neon-bp-panel">
                <div class="neon-bp-header">
                    <span class="neon-bp-title">// НЕОНОВЫЙ РЮКЗАК</span>
                    <span class="neon-bp-capacity">0 / ${maxCap}</span>
                    <button class="neon-bp-close" type="button">ESC / I</button>
                </div>
                <div class="neon-bp-list"></div>
                <div class="neon-bp-hint">
                    • Лимит: не более ${maxCap} любых материалов суммарно.<br>
                    • «НА ПОЛ» роняет 1 шт. рядом с персонажем — предмет остаётся лежать и его можно снова подобрать клавишей [F].
                </div>
            </div>
        `;

        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) closeBackpackUI();
        });

        modalEl.querySelector('.neon-bp-close').addEventListener('click', () => closeBackpackUI());

        document.body.appendChild(modalEl);
    }

    window.toggleInventoryUI = toggleBackpackUI;
    window.closeInventoryUI = closeBackpackUI;
    window.refreshInventoryUI = renderBackpackUI;
    renderBackpackUI();
}