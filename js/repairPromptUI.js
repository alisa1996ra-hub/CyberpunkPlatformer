// js/repairPromptUI.js

const RESOURCE_LABELS = {
    copper_wire:  'Медный провод',
    microchip:    'Корпоративная плата',
    power_cell:   'Энерго-элемент',
    rare_alloy:   'Редкий сплав'
};

let promptBackdrop = null;
let isPromptOpen = false;
let currentOptions = [];
let selectedOptionIndex = 0;
let onAdjustPlacementCallback = null;

function ensurePromptStyles() {
    if (document.getElementById('neon-repair-prompt-styles')) return;

    const style = document.createElement('style');
    style.id = 'neon-repair-prompt-styles';
    style.textContent = `
        #neon-repair-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 10500;
            background: rgba(2, 6, 23, 0.76);
            backdrop-filter: blur(2px);
            align-items: center;
            justify-content: center;
            font-family: monospace;
        }
        #neon-repair-backdrop.open {
            display: flex;
        }
        .neon-rp-box {
            width: 470px;
            max-width: 92vw;
            background: rgba(9, 14, 30, 0.97);
            border: 2px solid #fbbf24;
            box-shadow: 0 0 24px rgba(251, 191, 36, 0.35), inset 0 0 18px rgba(56, 189, 248, 0.08);
            padding: 18px 20px;
            color: #e2e8f0;
        }
        .neon-rp-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(251, 191, 36, 0.35);
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .neon-rp-title {
            color: #fbbf24;
            font-size: 15px;
            font-weight: bold;
            text-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
        }
        .neon-rp-sub {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        .neon-rp-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 14px;
        }
        .neon-rp-opt {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 9px 12px;
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.3);
            cursor: pointer;
            transition: border-color 0.12s ease, background 0.12s ease;
        }
        .neon-rp-opt.selected {
            border-color: #00ffcc;
            background: rgba(0, 255, 204, 0.12);
            box-shadow: 0 0 10px rgba(0, 255, 204, 0.25);
        }
        .neon-rp-opt-title {
            font-size: 13px;
            font-weight: bold;
            color: #f8fafc;
        }
        .neon-rp-opt-desc {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
        }
        .neon-rp-cost {
            font-size: 11px;
            padding: 3px 7px;
            border: 1px solid #38bdf8;
            color: #38bdf8;
            white-space: nowrap;
            margin-left: 10px;
        }
        .neon-rp-cost.missing {
            border-color: #ff2a6d;
            color: #ff6b9d;
        }
        .neon-rp-nudge {
            display: none;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 14px;
            padding: 8px 10px;
            background: rgba(15, 23, 42, 0.7);
            border: 1px dashed rgba(56, 189, 248, 0.45);
            align-items: center;
            justify-content: space-between;
        }
        .neon-rp-nudge.visible {
            display: flex;
        }
        .neon-rp-nudge-label {
            font-size: 11px;
            color: #38bdf8;
        }
        .neon-rp-nudge-btns {
            display: flex;
            gap: 5px;
        }
        .neon-rp-nudge-btn {
            background: rgba(30, 41, 59, 0.9);
            border: 1px solid #38bdf8;
            color: #e2e8f0;
            font-family: monospace;
            font-size: 11px;
            padding: 4px 7px;
            cursor: pointer;
        }
        .neon-rp-nudge-btn:hover {
            background: rgba(56, 189, 248, 0.25);
        }
        .neon-rp-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .neon-rp-btn {
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
            padding: 8px 14px;
            cursor: pointer;
            text-transform: uppercase;
        }
        .neon-rp-cancel {
            background: transparent;
            border: 1px solid #64748b;
            color: #cbd5e1;
        }
        .neon-rp-cancel:hover {
            border-color: #ff2a6d;
            color: #ff6b9d;
        }
        .neon-rp-confirm {
            background: rgba(0, 255, 204, 0.16);
            border: 2px solid #00ffcc;
            color: #00ffcc;
            box-shadow: 0 0 12px rgba(0, 255, 204, 0.35);
        }
        .neon-rp-confirm:hover:not(:disabled) {
            background: #00ffcc;
            color: #030712;
        }
        .neon-rp-confirm:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

function createPromptDom() {
    ensurePromptStyles();
    if (promptBackdrop) return;

    promptBackdrop = document.createElement('div');
    promptBackdrop.id = 'neon-repair-backdrop';
    promptBackdrop.innerHTML = `
        <div class="neon-rp-box">
            <div class="neon-rp-header">
                <span class="neon-rp-title">// ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ</span>
            </div>
            <div class="neon-rp-sub"></div>
            <div class="neon-rp-options"></div>
            <div class="neon-rp-nudge">
                <span class="neon-rp-nudge-label">Позиция платформы:</span>
                <div class="neon-rp-nudge-btns">
                    <button type="button" class="neon-rp-nudge-btn" data-dx="-24" data-dy="0">◀ -24</button>
                    <button type="button" class="neon-rp-nudge-btn" data-dx="24" data-dy="0">+24 ▶</button>
                    <button type="button" class="neon-rp-nudge-btn" data-dx="0" data-dy="-24">▲ -24</button>
                    <button type="button" class="neon-rp-nudge-btn" data-dx="0" data-dy="24">+24 ▼</button>
                </div>
            </div>
            <div class="neon-rp-footer">
                <button type="button" class="neon-rp-btn neon-rp-cancel">ОТМЕНА [ESC]</button>
                <button type="button" class="neon-rp-btn neon-rp-confirm">ПОДТВЕРДИТЬ</button>
            </div>
        </div>
    `;

    promptBackdrop.addEventListener('click', (e) => {
        if (e.target === promptBackdrop) closeRepairPrompt();
    });

    promptBackdrop.querySelector('.neon-rp-cancel').addEventListener('click', () => {
        closeRepairPrompt();
    });

    promptBackdrop.querySelector('.neon-rp-confirm').addEventListener('click', () => {
        const opt = currentOptions[selectedOptionIndex];
        if (!opt || !opt.canAfford || typeof opt.onConfirm !== 'function') return;
        const callback = opt.onConfirm;
        closeRepairPrompt();
        callback();
    });

    promptBackdrop.querySelectorAll('.neon-rp-nudge-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dx = Number(btn.getAttribute('data-dx')) || 0;
            const dy = Number(btn.getAttribute('data-dy')) || 0;
            if (typeof onAdjustPlacementCallback === 'function') {
                onAdjustPlacementCallback(dx, dy);
            }
        });
    });

    document.body.appendChild(promptBackdrop);
}

function renderPromptOptions() {
    if (!promptBackdrop) return;
    const listEl = promptBackdrop.querySelector('.neon-rp-options');
    const confirmBtn = promptBackdrop.querySelector('.neon-rp-confirm');
    const nudgeEl = promptBackdrop.querySelector('.neon-rp-nudge');
    listEl.innerHTML = '';

    currentOptions.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'neon-rp-opt' + (idx === selectedOptionIndex ? ' selected' : '');

        const costText = (opt.costs || [])
            .map(c => `${RESOURCE_LABELS[c.materialId] || c.materialId}: -${c.amount}`)
            .join(' + ') || 'Без затрат';

        row.innerHTML = `
            <div>
                <div class="neon-rp-opt-title">${opt.label}</div>
                ${opt.description ? `<div class="neon-rp-opt-desc">${opt.description}</div>` : ''}
            </div>
            <span class="neon-rp-cost ${opt.canAfford ? '' : 'missing'}">${costText}</span>
        `;

        row.addEventListener('click', () => {
            selectedOptionIndex = idx;
            renderPromptOptions();
        });

        listEl.appendChild(row);
    });

    const activeOpt = currentOptions[selectedOptionIndex];
    confirmBtn.disabled = !activeOpt || !activeOpt.canAfford;
    if (nudgeEl) {
        nudgeEl.classList.toggle('visible', Boolean(activeOpt && activeOpt.showPlacementNudge));
    }
}

export function openRepairPrompt({ title = '// ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ', subtitle = '', options = [], onAdjustPlacement = null }) {
    createPromptDom();
    currentOptions = options;
    selectedOptionIndex = 0;
    onAdjustPlacementCallback = onAdjustPlacement;

    promptBackdrop.querySelector('.neon-rp-title').textContent = title;
    promptBackdrop.querySelector('.neon-rp-sub').textContent = subtitle;
    renderPromptOptions();

    isPromptOpen = true;
    promptBackdrop.classList.add('open');
}

export function closeRepairPrompt() {
    if (!promptBackdrop) return;
    isPromptOpen = false;
    onAdjustPlacementCallback = null;
    promptBackdrop.classList.remove('open');
}

export function isRepairPromptOpen() {
    return isPromptOpen;
}
