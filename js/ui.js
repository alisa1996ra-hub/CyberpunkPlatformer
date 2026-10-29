// js/ui.js

// Кешируем DOM-элементы интерфейса
const scoreValEl = document.getElementById('score-val');
const hpValEl = document.getElementById('hp-val');

/**
 * Обновляет отображение очков в HTML-интерфейсе
 * @param {number} score - текущее количество очков
 */
export function updateScoreUI(score) {
  if (scoreValEl) {
    scoreValEl.textContent = String(score).padStart(6, '0');
  }
}

/**
 * Обновляет отображение жизней в HTML-интерфейсе
 * @param {number} currentHp - текущее здоровье
 */
export function updateHealthUI(currentHp) {
  if (hpValEl) {
    const hearts = '❤'.repeat(Math.max(0, currentHp));
    hpValEl.textContent = hearts || 'DEAD';
  }
}
