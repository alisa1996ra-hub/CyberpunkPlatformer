// js/ui.js
import { SHOP_CONFIG } from './shopConfig.js';

// Кешируем DOM-элементы интерфейса
const scoreValEl = document.getElementById('score-val');
const hpValEl = document.getElementById('hp-val');

// Элементы магазина
const shopModal = document.getElementById('shop-modal');
const shopListContainer = document.getElementById('shop-list-container');
const playerCreditsEl = document.getElementById('player-credits');
const tabUpgradesBtn = document.getElementById('tab-upgrades-btn');
const tabMaterialsBtn = document.getElementById('tab-materials-btn');
const closeShopBtn = document.getElementById('close-shop-btn');

// Текущее состояние магазина
let currentTab = 'upgrades'; // 'upgrades' или 'materials'
let currentGameData = null;  // Ссылка на данные игрока/состояние

/**
 * Обновляет отображение очков в HTML-интерфейсе
 */
export function updateScoreUI(score) {
  if (scoreValEl) {
    scoreValEl.textContent = String(score).padStart(6, '0');
  }
}

/**
 * Обновляет отображение жизней в HTML-интерфейсе
 */
export function updateHealthUI(currentHp) {
  if (hpValEl) {
    const hearts = '❤'.repeat(Math.max(0, currentHp));
    hpValEl.textContent = hearts || 'DEAD';
  }
}

/**
 * Инициализация обработчиков событий магазина
 */
export function initShopUI(gameData, onBuyUpgrade, onTradeMaterial) {
  currentGameData = gameData;

  if (closeShopBtn) {
    closeShopBtn.addEventListener('click', closeShop);
  }

  if (tabUpgradesBtn && tabMaterialsBtn) {
    tabUpgradesBtn.addEventListener('click', () => {
      currentTab = 'upgrades';
      updateTabStyles();
      renderShopList(onBuyUpgrade, onTradeMaterial);
    });

    tabMaterialsBtn.addEventListener('click', () => {
      currentTab = 'materials';
      updateTabStyles();
      renderShopList(onBuyUpgrade, onTradeMaterial);
    });
  }
}

/**
 * Открыть окно магазина
 */
export function openShop() {
  if (shopModal) {
    shopModal.style.display = 'flex';
    renderShopList();
  }
}

/**
 * Закрыть окно магазина
 */
export function closeShop() {
  if (shopModal) {
    shopModal.style.display = 'none';
  }
}

/**
 * Обновление внешнего вида активных вкладок
 */
function updateTabStyles() {
  if (currentTab === 'upgrades') {
    tabUpgradesBtn.style.background = '#00f0ff';
    tabUpgradesBtn.style.color = '#030712';
    tabMaterialsBtn.style.background = '#1e293b';
    tabMaterialsBtn.style.color = '#38bdf8';
  } else {
    tabMaterialsBtn.style.background = '#00f0ff';
    tabMaterialsBtn.style.color = '#030712';
    tabUpgradesBtn.style.background = '#1e293b';
    tabUpgradesBtn.style.color = '#38bdf8';
  }
}

/**
 * Отрисовка списка товаров (Улучшения или Материалы)
 */
export function renderShopList(onBuyUpgrade, onTradeMaterial) {
  if (!shopListContainer || !currentGameData) return;

  // Обновляем баланс кредитов
  if (playerCreditsEl) {
    playerCreditsEl.textContent = currentGameData.credits || 0;
  }

  shopListContainer.innerHTML = '';

  if (currentTab === 'upgrades') {
    // --- ВКЛАДКА 1: УЛУЧШЕНИЯ ---
    if (SHOP_CONFIG && SHOP_CONFIG.upgrades) {
      Object.values(SHOP_CONFIG.upgrades).forEach(item => {
        const currentLevel = (currentGameData.upgrades && currentGameData.upgrades[item.id]) || 0;
        const currentPrice = Math.round(item.basePrice * Math.pow(item.priceMultiplier, currentLevel));
        const isMax = currentLevel >= item.maxLevel;
        const canAfford = currentGameData.credits >= currentPrice;

        const card = document.createElement('div');
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #0d0f18; border: 1px solid #38bdf8; padding: 12px; border-radius: 6px;';
        
        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="assets/common/${item.icon}" width="32" height="32" style="border-radius: 4px; object-fit: contain;" alt="icon" onerror="this.style.display='none'">
            <div>
              <div style="font-weight: bold; color: #fff;">${item.name} <span style="color: #00f0ff;">[Ур. ${currentLevel}/${item.maxLevel}]</span></div>
              <div style="font-size: 12px; color: #94a3b8;">Шаг: +${item.stepValue}</div>
            </div>
          </div>
          <button class="buy-btn" ${isMax || !canAfford ? 'disabled' : ''} style="
            background: ${isMax ? '#334155' : canAfford ? '#ec4899' : '#475569'};
            color: #fff; border: none; padding: 8px 14px; font-family: monospace;
            font-weight: bold; border-radius: 4px; cursor: ${isMax || !canAfford ? 'default' : 'pointer'};">
            ${isMax ? 'МАКС' : `${currentPrice} CR`}
          </button>
        `;

        const btn = card.querySelector('.buy-btn');
        if (btn && !isMax && canAfford) {
          btn.addEventListener('click', () => {
            if (onBuyUpgrade) onBuyUpgrade(item.id, currentPrice);
            renderShopList(onBuyUpgrade, onTradeMaterial);
          });
        }

        shopListContainer.appendChild(card);
      });
    }

  } else {
    // --- ВКЛАДКА 2: МАТЕРИАЛЫ И ЗАПЧАСТИ ---
    if (SHOP_CONFIG && SHOP_CONFIG.materials) {
      Object.values(SHOP_CONFIG.materials).forEach(mat => {
        const countInInventory = (currentGameData.inventory && currentGameData.inventory[mat.id]) || 0;
        const canAffordBuy = currentGameData.credits >= mat.buyPrice;

        const card = document.createElement('div');
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: #0d0f18; border: 1px solid #38bdf8; padding: 12px; border-radius: 6px;';

        card.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="assets/common/${mat.icon}" width="32" height="32" style="border-radius: 4px; object-fit: contain;" alt="icon" onerror="this.style.display='none'">
            <div>
              <div style="font-weight: bold; color: #fff;">${mat.name} <span style="color: #00f0ff;">(В наличии: ${countInInventory})</span></div>
              <div style="font-size: 12px; color: #94a3b8;">Купить: ${mat.buyPrice} CR | Продать: ${mat.sellPrice} CR</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="buy-mat-btn" ${!canAffordBuy ? 'disabled' : ''} style="background: ${canAffordBuy ? '#00f0ff' : '#475569'}; color: #030712; border: none; padding: 6px 10px; font-family: monospace; font-weight: bold; border-radius: 4px; cursor: pointer;">
              Купить
            </button>
            <button class="sell-mat-btn" ${countInInventory <= 0 ? 'disabled' : ''} style="background: ${countInInventory > 0 ? '#ec4899' : '#475569'}; color: #fff; border: none; padding: 6px 10px; font-family: monospace; font-weight: bold; border-radius: 4px; cursor: pointer;">
              Продать
            </button>
          </div>
        `;

        const buyBtn = card.querySelector('.buy-mat-btn');
        const sellBtn = card.querySelector('.sell-mat-btn');

        if (buyBtn && canAffordBuy) {
          buyBtn.addEventListener('click', () => {
            if (onTradeMaterial) onTradeMaterial(mat.id, 'buy', mat.buyPrice);
            renderShopList(onBuyUpgrade, onTradeMaterial);
          });
        }

        if (sellBtn && countInInventory > 0) {
          sellBtn.addEventListener('click', () => {
            if (onTradeMaterial) onTradeMaterial(mat.id, 'sell', mat.sellPrice);
            renderShopList(onBuyUpgrade, onTradeMaterial);
          });
        }

        shopListContainer.appendChild(card);
      });
    }
  }
}