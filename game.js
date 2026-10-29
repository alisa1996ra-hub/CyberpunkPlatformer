const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const TILE = 32;

let gameStats = {
  lives: 5,
  maxLives: 5,
  score: 0,
  level: 1,
};

let currentLevelData = {
  grid: [],
  hazards: [],
  coins: [],
  hearts: [],
  finishLine: { x: 1800, y: 320, w: 32, h: 64 },
  biome: "exclusion",
  isNight: false,
};

const biomesAvailable = [
  "exclusion",
  "factory",
  "industrial",
  "power",
  "seaport",
];

const player = {
  x: 50,
  y: 200,
  w: 26,
  h: 38,
  vx: 0,
  vy: 0,
  speed: 4.5,
  jumpForce: -13, // Увеличенная сила прыжка
  gravity: 0.48, // Плавная гравитация
  grounded: false,
};

const camera = { x: 0 };
// Добавили флаг jump в объект управления
const keys = { left: false, right: false, jump: false };

// 🔍 Сюда вставляем переменные режима инспектора трассы:
let freeCameraMode = {
  active: false,
  x: 0,
  y: 0,
  speed: 15,
};

// Сенсорное управление для мобилок
const touchControls = {
  leftBtn: { x: 40, y: 520, w: 90, h: 90, active: false },
  rightBtn: { x: 150, y: 520, w: 90, h: 90, active: false },
  jumpBtn: { x: 1150, y: 520, w: 90, h: 90, active: false },
};

// 1. ИСПРАВЛЕННЫЙ ОБРАБОТЧИК КЛАВИАТУРЫ (с e.preventDefault() для Пробела)
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    e.preventDefault(); // Запрещаем странице скроллиться от пробела
    keys.jump = true;
  }
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  // 🔍 Управление инспектором и уровнями:
  if (e.code === "KeyM") {
    freeCameraMode.active = !freeCameraMode.active;
    freeCameraMode.x = camera.x;
    console.log("🔍 Режим инспектора:", freeCameraMode.active ? "ВКЛ" : "ВЫКЛ");
  }
  if (e.code === "BracketRight") {
    // Клавиша ']' — следующий уровень
    gameStats.level++;
    loadLevel(gameStats.level);
  }
  if (e.code === "BracketLeft") {
    // Клавиша '[' — предыдущий уровень
    gameStats.level = Math.max(1, gameStats.level - 1);
    loadLevel(gameStats.level);
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")
    keys.jump = false;
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
});

canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });

// 2. ИСПРАВЛЕННЫЙ СЕНСОРНЫЙ ОБРАБОТЧИК
function handleTouch(e) {
  e.preventDefault();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  touchControls.leftBtn.active = false;
  touchControls.rightBtn.active = false;
  touchControls.jumpBtn.active = false;
  keys.jump = false; // Сбрасываем прыжок при отпускании

  for (let i = 0; i < e.touches.length; i++) {
    const touchX = (e.touches[i].clientX - rect.left) * scaleX;
    const touchY = (e.touches[i].clientY - rect.top) * scaleY;

    let lb = touchControls.leftBtn;
    if (
      touchX >= lb.x &&
      touchX <= lb.x + lb.w &&
      touchY >= lb.y &&
      touchY <= lb.y + lb.h
    ) {
      touchControls.leftBtn.active = true;
    }
    let rb = touchControls.rightBtn;
    if (
      touchX >= rb.x &&
      touchX <= rb.x + rb.w &&
      touchY >= rb.y &&
      touchY <= rb.y + rb.h
    ) {
      touchControls.rightBtn.active = true;
    }
    let jb = touchControls.jumpBtn;
    if (
      touchX >= jb.x &&
      touchX <= jb.x + jb.w &&
      touchY >= jb.y &&
      touchY <= jb.y + jb.h
    ) {
      touchControls.jumpBtn.active = true;
      keys.jump = true; // Активируем прыжок от сенсора
    }
  }
}

function loadLevel(lvlNum) {
  const generated = generateLevelData(lvlNum);

  currentLevelData.grid = generated.grid;
  currentLevelData.isLockdown = generated.isLockdown;
  currentLevelData.isStation = generated.isStation;

  let biomeIndex = Math.floor((lvlNum - 1) / 5) % biomesAvailable.length;
  currentLevelData.biome = biomesAvailable[biomeIndex];
  currentLevelData.isNight = Math.floor((lvlNum - 1) / 5) % 2 === 1;

  const finishCol = generated.grid[0].length - 4;
  const finishRow = generated.grid.length - 5;

  currentLevelData.finishLine = {
    x: finishCol * TILE,
    y: finishRow * TILE,
    w: TILE,
    h: 64,
  };

  player.x = 50;
  player.y = 100;
  player.vx = 0;
  player.vy = 0;
}

// 3. ИСПРАВЛЕННАЯ ФИЗИКА С БУФЕРИЗАЦИЕЙ ПРЫЖКА
function updatePlayerPhysics() {
  const movingLeft = keys.left || touchControls.leftBtn.active;
  const movingRight = keys.right || touchControls.rightBtn.active;
  const wantsJump = keys.jump || touchControls.jumpBtn.active;

  if (movingLeft) player.vx = -player.speed;
  else if (movingRight) player.vx = player.speed;
  else player.vx = 0;

  player.x += player.vx;
  checkGridCollisions("x");

  // Прыжок сработает мгновенно, как только персонаж окажется на земле
  if (wantsJump && player.grounded) {
    player.vy = player.jumpForce;
    player.grounded = false;
    keys.jump = false; // Сбрасываем триггер
  }

  player.vy += player.gravity;
  player.y += player.vy;
  player.grounded = false;
  checkGridCollisions("y");
}

function checkGridCollisions(axis) {
  const grid = currentLevelData.grid;
  const rows = grid.length;
  const cols = grid[0].length;

  const leftTile = Math.floor(player.x / TILE);
  const rightTile = Math.floor((player.x + player.w - 1) / TILE);
  const topTile = Math.floor(player.y / TILE);
  const bottomTile = Math.floor((player.y + player.h - 1) / TILE);

  for (let r = Math.max(0, topTile); r <= Math.min(rows - 1, bottomTile); r++) {
    for (
      let c = Math.max(0, leftTile);
      c <= Math.min(cols - 1, rightTile);
      c++
    ) {
      let tileId = grid[r][c];

      // Игнорируем декор (8-10) и воду (6, 7) для физики
      if (tileId > 0 && !(tileId >= 6 && tileId <= 10)) {
        let tileBox = { x: c * TILE, y: r * TILE, w: TILE, h: TILE };
        if (checkCollision(player, tileBox)) {
          if (axis === "x") {
            if (player.vx > 0) player.x = tileBox.x - player.w;
            else if (player.vx < 0) player.x = tileBox.x + tileBox.w;
          } else if (axis === "y") {
            if (player.vy > 0) {
              player.y = tileBox.y - player.h;
              player.vy = 0;
              player.grounded = true;
            } else if (player.vy < 0) {
              player.y = tileBox.y + tileBox.h;
              player.vy = 0;
            }
          }
        }
      }
    }
  }
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
  );
}

function playerHurt() {
  gameStats.lives--;
  if (gameStats.lives <= 0) {
    alert("⚠️ Критический сбой систем! Возврат на Уровень 1.");
    gameStats.level = 1;
    gameStats.lives = 5;
    gameStats.score = 0;
    loadLevel(gameStats.level);
  }
  player.x = 50;
  player.y = 100;
  player.vy = 0;
}

// Зацикленная отрисовка движущихся слоев параллакса с вертикальным смещением
function drawParallaxLayer(ctx, img, speedFactor, camX, yOffset) {
  if (!img || !img.complete || img.naturalWidth === 0) return;
  let w = img.naturalWidth;
  let h = canvas.height;
  let offsetX = (camX * speedFactor) % w;

  for (let x = -offsetX; x < canvas.width; x += w) {
    ctx.drawImage(img, x, yOffset, w, h);
  }
}

// Рендеринг фона: статичный задник -> заливка низа -> поднятый параллакс
function drawParallaxBackground(camX) {
  const biome = currentLevelData.biome || "exclusion";
  const isNight = currentLevelData.isNight;
  const assets = assetsCache[biome] || {};

  // 1. Статический фон (неподвижный, на весь экран)
  let staticBgKey = isNight ? "bg_background_night" : "bg_background_day";
  let staticBg = assets[staticBgKey];

  if (staticBg && staticBg.complete && staticBg.naturalWidth > 0) {
    ctx.drawImage(staticBg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = isNight ? "#020408" : "#080c14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. ЗАЛИВКА НИЖНЕЙ ЗОНЫ ПОД ЗЕМЛЕЙ И В ЯМАХ
  // Закрашиваем всё пространство под уровнем земли глубоким темным цветом
  ctx.fillStyle = isNight ? "#292330" : "#33446e";
  ctx.fillStyle = biome === "industrial" && isNight ? "#1e1b2e" : "#37446e";
  ctx.fillRect(0, canvas.height - 96, canvas.width, 180);

  // 3. ПОДНИМАЕМ ПАРАЛЛАКС ВВЕРХ
  // Изменяй значение yOffset (например, -120 или -150), чтобы точно откалибровать высоту зданий
  let yOffset = -64;

  let backImg, midImg, frontImg;

  if (biome === "industrial") {
    backImg = assets["bg_back"];
    midImg = assets["bg_mid"];
    frontImg = assets["bg_front"];
  } else {
    let suffix = isNight ? "_night" : "_day";
    backImg = assets["bg_back" + suffix];
    midImg = assets["bg_mid" + suffix];
    frontImg = assets["bg_front" + suffix];
  }

  drawParallaxLayer(ctx, backImg, 0.15, camX, yOffset);
  drawParallaxLayer(ctx, midImg, 0.4, camX, yOffset);
  drawParallaxLayer(ctx, frontImg, 0.7, camX, yOffset);
}

function drawInGameHUD(ctx) {
  ctx.save();
  ctx.font = "bold 15px 'Courier New', monospace";

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(15, 15, 195, 42, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.fillText(
    `L:${gameStats.level} [${currentLevelData.biome.toUpperCase().slice(0, 3)}]`,
    22,
    41,
  );

  for (let i = 0; i < gameStats.maxLives; i++) {
    ctx.fillStyle = i < gameStats.lives ? "#ef4444" : "#334155";
    ctx.beginPath();
    ctx.arc(115 + i * 15, 36, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(canvas.width - 165, 15, 150, 42, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(canvas.width - 145, 36, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText(`SCORE: ${gameStats.score}`, canvas.width - 128, 41);

  const drawTouchBtn = (btn, text, active) => {
    ctx.fillStyle = active
      ? "rgba(56, 189, 248, 0.4)"
      : "rgba(30, 27, 75, 0.6)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, btn.x + btn.w / 2, btn.y + btn.h / 2);
  };

  drawTouchBtn(touchControls.leftBtn, "◀", touchControls.leftBtn.active);
  drawTouchBtn(touchControls.rightBtn, "▶", touchControls.rightBtn.active);
  drawTouchBtn(touchControls.jumpBtn, "▲", touchControls.jumpBtn.active);

  ctx.restore();
}

function drawPlayerSprite(ctx, p) {
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(p.x + 4, p.y + 12, p.w - 8, p.h - 12);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(p.x + 2, p.y + 20, 4, 8);
  ctx.fillRect(p.x + p.w - 6, p.y + 20, 4, 8);
  ctx.fillStyle = "#fed7aa";
  ctx.fillRect(p.x + 6, p.y + 4, 14, 10);
  ctx.fillStyle = "#facc15";
  ctx.fillRect(p.x + 2, p.y + 2, 18, 8);
  let hairOffset = p.vx > 0 ? -4 : p.vx < 0 ? 4 : 0;
  ctx.fillRect(p.x + 2 + hairOffset, p.y + 6, 6, 22);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(p.x + 10, p.y + 6, 8, 3);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawParallaxBackground(camera.x);

  ctx.save();
  ctx.translate(-Math.floor(camera.x), 0);

  const grid = currentLevelData.grid;
  const biome = currentLevelData.biome || "exclusion";
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
    10: "decor_3",
  };

  if (grid && grid.length > 0) {
    // СЛОЙ 0: ДЕКОР
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        let tileId = grid[r][c];
        if (tileId >= 8 && tileId <= 10) {
          let img = biomeAssets[tileMapping[tileId]];
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
          }
        }
      }
    }

    // СЛОЙ 1: ОСНОВНЫЕ ТАЙЛЫ
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        let tileId = grid[r][c];
        if (tileId === 0 || (tileId >= 8 && tileId <= 10) || tileId === 6)
          continue;

        let img = biomeAssets[tileMapping[tileId]];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
        } else {
          ctx.fillStyle = tileId === 1 ? "#0ea5e9" : "#0369a1";
          ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }
    }
  }

  // СЛОЙ 2: ПОРТАЛ
  let f = currentLevelData.finishLine;
  if (f) {
    let portalImg = assetsCache.common ? assetsCache.common.portal : null;
    if (portalImg && portalImg.complete && portalImg.naturalWidth > 0) {
      ctx.drawImage(portalImg, f.x, f.y, f.w, f.h);
    } else {
      let pulse = Math.sin(Date.now() / 150) * 4;
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      ctx.beginPath();
      ctx.roundRect(
        f.x - pulse / 2,
        f.y - pulse / 2,
        f.w + pulse,
        f.h + pulse,
        12,
      );
      ctx.fill();
      ctx.stroke();
    }
  }

  // СЛОЙ 3: ИГРОК
  let playerImg = assetsCache.common ? assetsCache.common.player : null;
  if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    drawPlayerSprite(ctx, player);
  }

  // СЛОЙ 4: ВЕРХ ВОДЫ СПЕРЕДИ
  if (grid && grid.length > 0) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 6) {
          let img = biomeAssets["liquid_top"];
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
          } else {
            ctx.fillStyle = "rgba(14, 165, 233, 0.7)";
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
          }
        }
      }
    }
  }

  ctx.restore();
  drawInGameHUD(ctx);
}

function update() {
  // 🔍 Если включен режим инспектора — двигаем камеру стрелками и не трогаем физику игрока
  if (freeCameraMode.active) {
    if (keys.left || touchControls.leftBtn.active)
      freeCameraMode.x -= freeCameraMode.speed;
    if (keys.right || touchControls.rightBtn.active)
      freeCameraMode.x += freeCameraMode.speed;

    const maxCamX = currentLevelData.grid[0].length * TILE - canvas.width;
    camera.x = Math.max(0, Math.min(freeCameraMode.x, maxCamX));
    return;
  }

  // Обычная игровая логика
  updatePlayerPhysics();

  if (player.y > canvas.height) playerHurt();

  let f = currentLevelData.finishLine;
  if (checkCollision(player, f)) {
    gameStats.score += 100;
    alert(`🎉 Уровень ${gameStats.level} пройден! +100 очков.`);
    gameStats.level++;
    loadLevel(gameStats.level);
  }

  camera.x = Math.max(0, player.x - 300);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loadAllAssets(() => {
  console.log("🎮 Движок запущен!");
  const loader = document.getElementById("loader-screen");
  if (loader) loader.remove();

  loadLevel(gameStats.level);
  loop();
});
