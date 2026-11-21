// js/generator.js
import { DestructibleBarrel } from './decorations.js';

const TILE = 32;
const BIOMES_LIST = ["factory", "industrial", "seaport", "exclusion", "power"];

export function generateLevelData(levelNumber, options = {}) {
  const safeLevelNumber = Math.max(1, parseInt(levelNumber, 10) || 1);
  const levelTier = Math.floor((safeLevelNumber - 1) / 5);
  const cols = 225 + levelTier * 25;
  const rows = 18;

  const biomeIndex = levelTier % BIOMES_LIST.length;
  const requestedBiome = typeof options?.biome === 'string' ? options.biome.toLowerCase() : null;
  const biome = (requestedBiome && BIOMES_LIST.includes(requestedBiome))
    ? requestedBiome
    : BIOMES_LIST[biomeIndex];
  const isStation = safeLevelNumber % 5 === 0;

  let grid = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  for (let c = 0; c < cols; c++) {
    grid[rows - 1][c] = 2;
    grid[rows - 2][c] = 2;
    grid[rows - 3][c] = 1;
  }

  if (!isStation) {
    const pitFrequency = safeLevelNumber === 1 ? 0.015 : Math.max(0, Math.min(0.25, 0.02 + safeLevelNumber * 0.002));
    for (let c = 10; c < cols - 10; c++) {
      if (Math.random() < pitFrequency) {
        let pitWidth = safeLevelNumber === 1 ? 2 : Math.min(4, Math.floor(2 + safeLevelNumber / 30));
        for (let w = 0; w < pitWidth && c < cols - 10; w++) {
          grid[rows - 3][c] = 0;
          grid[rows - 2][c] = 6;
          grid[rows - 1][c] = 7;
          c++;
        }
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let foundTop = false;
    for (let r = 0; r < rows; r++) {
      let currentId = grid[r][c];
      if (currentId === 1 || currentId === 2) {
        if (!foundTop) {
          grid[r][c] = 1;
          foundTop = true;
        } else {
          grid[r][c] = 2;
        }
      } else {
        foundTop = false;
      }
    }
  }

  const platforms = [];
  const platformRows = [rows - 6, rows - 10, rows - 14];

  platformRows.forEach((r, rIndex) => {
    let c = 8;
    while (c < cols - 12) {
      if (Math.random() < (isStation ? 0.5 : 0.35)) {
        let pLength = Math.max(3, 7 - rIndex);
        if (pLength === 2) {
          grid[r][c] = 3;
          grid[r][c + 1] = 5;
        } else {
          grid[r][c] = 3;
          for (let p = 1; p < pLength - 1; p++) {
            grid[r][c + p] = 4;
          }
          grid[r][c + pLength - 1] = 5;
        }
        platforms.push({ x: c * 32, y: r * 32, width: pLength * 32, height: 32, offsetY: 0, velocity: 0 });
        c += pLength + Math.floor(Math.random() * 6) + 4;
      } else {
        c += 5;
      }
    }
  });

  if (isStation) {
    let midC = Math.floor(cols / 2);
    grid[rows - 6][midC - 2] = 3;
    grid[rows - 6][midC - 1] = 4;
    grid[rows - 6][midC] = 4;
    grid[rows - 6][midC + 1] = 5;
    platforms.push({ x: (midC - 2) * 32, y: (rows - 6) * 32, width: 4 * 32, height: 32, offsetY: 0, velocity: 0 });
  }

  const grassList = [];
  const barrels = [];
  for (let c = 5; c < cols - 5; c++) {
    for (let r = 0; r < rows - 1; r++) {
      let currentId = grid[r][c];
      let belowId = grid[r + 1][c];
      if (currentId === 0 && (belowId === 1 || (belowId >= 3 && belowId <= 5))) {
        if (Math.random() < 0.12) {
          barrels.push(new DestructibleBarrel(c * TILE, r * TILE, 32, 32));
        } else if (Math.random() < 0.18) {
          const randomType = 1 + Math.floor(Math.random() * 3);
          grassList.push({ x: c * TILE + 8, y: (r + 1) * TILE, type: randomType });
        }
        break;
      }
    }
  }

  const poles = [];
  const poleSpacing = 16;
  for (let c = 8; c < cols - 10; c += poleSpacing) {
    poles.push({ x: c * TILE, groundY: (rows - 3) * TILE });
  }

  const cables = [];
  for (let i = 0; i < poles.length - 1; i++) {
    const currentPole = poles[i];
    const nextPole = poles[i + 1];
    cables.push({
      startX: currentPole.x,
      startY: currentPole.groundY - 170,
      endX: nextPole.x,
      endY: nextPole.groundY - 170,
      slack: 45
    });
  }

  const playerStart = { x: 2, y: rows - 5 };
  const levelFinish = { x: cols - 4, y: rows - 5 };

  const consoleCol = playerStart.x + 6;
  let consoleY = (rows - 4) * TILE;
  for (let r = 0; r < rows; r++) {
    if (grid[r][consoleCol] === 1) {
      consoleY = (r - 1) * TILE;
      break;
    }
  }

  const consoles = [
    { x: consoleCol * TILE, y: consoleY, width: 40, height: 56 }
  ];

  return {
    levelNumber: safeLevelNumber,
    biome,
    isStation,
    grid,
    platforms,
    grassList,
    cables,
    poles,
    barrels,
    consoles,
    collectibles: [],
    playerStart,
    finish: levelFinish,
  };
}