// js/platforms.js

export class PlatformManager {
  constructor() {
    this.platforms = [
      { x: 250, y: 400, width: 180, height: 24, offsetY: 0 },
      { x: 520, y: 300, width: 220, height: 24, offsetY: 0 },
      { x: 830, y: 360, width: 190, height: 24, offsetY: 0 },
      { x: 1080, y: 230, width: 160, height: 24, offsetY: 0 }
    ];
  }

  update() {
    for (const p of this.platforms) {
      p.offsetY += (0 - p.offsetY) * 0.25;
    }
  }

  draw(ctx, biomeName, assetsCache) {
    ctx.save();
    const biomeAssets = assetsCache[biomeName];

    for (const p of this.platforms) {
      const drawY = p.y + p.offsetY;
      
      const leftImg = biomeAssets?.plat_left;
      const centerImg = biomeAssets?.plat_center;
      const rightImg = biomeAssets?.plat_right;

      // Если растровые тайлы загружены — собираем платформу из кусочков
      if (leftImg && centerImg && rightImg && leftImg.complete && leftImg.naturalWidth > 0) {
        const tileSize = p.height;
        // Левый край
        ctx.drawImage(leftImg, p.x, drawY, tileSize, tileSize);
        // Центр (растягиваем)
        ctx.drawImage(centerImg, p.x + tileSize, drawY, p.width - (tileSize * 2), tileSize);
        // Правый край
        ctx.drawImage(rightImg, p.x + p.width - tileSize, drawY, tileSize, tileSize);
      } else {
        // Фоллбэк (если картинки не подгрузились)
        ctx.fillStyle = '#0b0f19';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, drawY, p.width, p.height);
        ctx.strokeRect(p.x, drawY, p.width, p.height);
      }
    }
    ctx.restore();
  }
}