// js/platforms.js

export class PlatformManager {
  constructor() {
    this.platforms = [];
  }

  // Абсолютно надежный сканер сгенерированной сетки уровня
  initFromGrid(grid, tileSize = 32) {
    this.platforms = [];
    if (!grid) return;

    for (let r = 0; r < grid.length; r++) {
      let startC = -1;
      let widthInTiles = 0;

      for (let c = 0; c < grid[r].length; c++) {
        let tileId = grid[r][c];

        // Если это любой тайл платформы (3 - левый, 4 - центр, 5 - правый)
        if (tileId >= 3 && tileId <= 5) {
          if (startC === -1) {
            startC = c;
            widthInTiles = 1;
          } else {
            widthInTiles++;
          }
        } else {
          // Если встретили пустоту или другой тайл, а платформа уже собиралась — закрываем её
          if (startC !== -1) {
            this.platforms.push({
              x: startC * tileSize,
              y: r * tileSize,
              width: widthInTiles * tileSize,
              height: tileSize,
              offsetY: 0,
              velocity: 0
            });
            startC = -1;
            widthInTiles = 0;
          }
        }
      }

      // Если строка закончилась прямо на платформе
      if (startC !== -1) {
        this.platforms.push({
          x: startC * tileSize,
          y: r * tileSize,
          width: widthInTiles * tileSize,
          height: tileSize,
          offsetY: 0,
          velocity: 0
        });
      }
    }

    console.log("🛠️ PlatformManager успешно просканировал сетку! Найдено платформ:", this.platforms.length);
  }

  hitAt(player) {
    for (const p of this.platforms) {
      const px = player.x + player.width / 2;
      const py = player.y;

      // Срабатывает СТРОГО при ударе снизу головой (когда игрок летит вверх)
      if (px >= p.x && px <= p.x + p.width && Math.abs(py - (p.y + p.height + p.offsetY)) < 8 && player.vy < 0) {
        p.velocity -= 4; // Пружинный импульс вниз
      }
    }
  }

  update(player) {
    if (player) {
      this.hitAt(player);
    }

    for (const p of this.platforms) {
      const force = -0.2 * p.offsetY;
      const damping = 0.85;
      
      p.velocity += force;
      p.velocity *= damping;
      p.offsetY += p.velocity;
    }
  }

  draw(ctx, biomeName, assetsCache) {
    ctx.save();
    const biomeAssets = assetsCache[biomeName] || {};

    for (const p of this.platforms) {
      const drawY = p.y + p.offsetY;
      
      const leftImg = biomeAssets.plat_left;
      const centerImg = biomeAssets.plat_center;
      const rightImg = biomeAssets.plat_right;

      if (leftImg && centerImg && rightImg && leftImg.complete && leftImg.naturalWidth > 0) {
        const tileSize = p.height;
        ctx.drawImage(leftImg, p.x, drawY, tileSize, tileSize);
        ctx.drawImage(centerImg, p.x + tileSize, drawY, p.width - (tileSize * 2), tileSize);
        ctx.drawImage(rightImg, p.x + p.width - tileSize, drawY, tileSize, tileSize);
      } else {
        // Кибернетический фоллбэк с полосками
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, drawY, p.width, p.height);
        ctx.strokeRect(p.x, drawY, p.width, p.height);

        ctx.fillStyle = '#38bdf8';
        for (let i = p.x + 10; i < p.x + p.width - 10; i += 20) {
          ctx.fillRect(i, drawY + 4, 8, p.height - 8);
        }
      }
    }
    ctx.restore();
  }
}