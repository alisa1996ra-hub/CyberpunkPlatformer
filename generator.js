const BIOMES_LIST = ["factory", "industrial", "seaport", "exclusion", "power"];

function generateLevelData(levelNumber) {
  // 1. Длина трассы: от 225 тайлов, растет каждые 5 уровней
  const levelTier = Math.floor((levelNumber - 1) / 5);
  const cols = 225 + levelTier * 25;
  const rows = 20;

  let grid = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));

  const biomeIndex = levelTier % BIOMES_LIST.length;
  const biome = BIOMES_LIST[biomeIndex];
  const isStation = levelNumber % 5 === 0;

  // 2. Базовый уровень земли (нижние 3 ряда сплошняком)
  for (let c = 0; c < cols; c++) {
    grid[rows - 1][c] = 2; // ground_sub (1-й снизу)
    grid[rows - 2][c] = 2; // ground_sub (2-й снизу)
    grid[rows - 3][c] = 2; // подложка пола (3-й снизу)
  }

  // 3. Генерация ям: СТРОГО начиная с 10-й колонки и заканчивая за 10 колонок до конца!
  // Первые 10 и последние 10 колонок ГАРАНТИРОВАННО останутся сплошной замкнутой землей!
  if (!isStation) {
    const pitFrequency = Math.max(
      0,
      Math.min(0.25, 0.02 + levelNumber * 0.002),
    );

    for (let c = 10; c < cols - 10; c++) {
      if (Math.random() < pitFrequency) {
        let pitWidth = Math.min(4, Math.floor(2 + levelNumber / 30));
        for (let w = 0; w < pitWidth && c < cols - 10; w++) {
          grid[rows - 3][c] = 0;
          grid[rows - 2][c] = 6; // liquid_top (2-й снизу ряд)
          grid[rows - 1][c] = 7; // liquid_body (1-й снизу ряд)
          c++;
        }
      }
    }
  }

  // 4. Автокоррекция шапки земли (ground_top)
  for (let c = 0; c < cols; c++) {
    let foundTop = false;
    for (let r = 0; r < rows; r++) {
      let currentId = grid[r][c];
      if (currentId === 1 || currentId === 2) {
        if (!foundTop) {
          grid[r][c] = 1; // ground_top
          foundTop = true;
        } else {
          grid[r][c] = 2; // ground_sub
        }
      } else if (currentId === 6 || currentId === 7) {
        foundTop = false;
      } else {
        foundTop = false;
      }
    }
  }

  // 5. Платформы
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

        if (Math.random() < 0.3 && pLength >= 3) {
          const decorId = 8 + Math.floor(Math.random() * 3);
          grid[r - 1][c + Math.floor(pLength / 2)] = decorId;
        }

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
  }

  // Точные позиции старта и финиша
  const playerStart = { x: 2, y: rows - 5 };
  const levelFinish = { x: cols - 4, y: rows - 5 };

  return {
    levelNumber: levelNumber,
    biome: biome,
    isStation: isStation,
    grid: grid,
    playerStart: playerStart,
    finish: levelFinish,
  };
}
