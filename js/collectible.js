// js/collectible.js

const MAX_BACKPACK_ITEMS = 10;

const MATERIAL_VISUALS = {
  copper_wire: { icon: 'Icon14_38.png', glow: '#f97316', label: 'CW' },
  microchip:   { icon: 'Icon14_32.png', glow: '#22c55e', label: 'MC' },
  power_cell:  { icon: 'Icon14_39.png', glow: '#fbbf24', label: 'PC' },
  rare_alloy:  { icon: 'Icon14_09.png', glow: '#38bdf8', label: 'RA' }
};

const materialImgCache = {};

function getMaterialImage(materialId) {
  const meta = MATERIAL_VISUALS[materialId];
  if (!meta) return null;

  const baseKey = meta.icon.replace(/\.png$/i, '');
  const cachedFromAssets =
    window.assetsCache?.common?.[meta.icon] ||
    window.assetsCache?.common?.[baseKey] ||
    window.assetsCache?.[meta.icon] ||
    window.assetsCache?.[baseKey];

  if (cachedFromAssets && cachedFromAssets.complete && cachedFromAssets.naturalWidth > 0) {
    return cachedFromAssets;
  }

  if (!materialImgCache[materialId]) {
    const img = new Image();
    img.src = `./assets/common/${meta.icon}`;
    materialImgCache[materialId] = img;
  }

  const localImg = materialImgCache[materialId];
  if (localImg && localImg.complete && localImg.naturalWidth > 0) {
    return localImg;
  }

  return null;
}

export class Collectable {
  constructor(x, y, type = 'coin', materialId = null) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.type = type; // 'coin', 'heart', 'plasma', 'material'
    this.materialId = materialId; // 'copper_wire', 'microchip', 'power_cell', 'rare_alloy'
    this.isCollected = false;
    this.spawnTime = performance.now();

    // Параметры спрайт-листа (для монет, сердец, плазмы)
    this.currentFrame = 0;
    this.totalFrames = 8;
    this.animTimer = 0;
    this.frameInterval = 100;

    if (type === 'coin') {
      this.sheetRow = 0;
    } else if (type === 'heart') {
      this.sheetRow = 1;
    } else if (type === 'plasma') {
      this.sheetRow = 2;
    }
  }

  update(deltaTime, player) {
    if (this.isCollected) return;

    if (this.type !== 'material') {
      this.animTimer += deltaTime * 1000;
      if (this.animTimer >= this.frameInterval) {
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        this.animTimer = 0;
      }
    }
  }

  collect(player) {
    if (this.isCollected) return false;

    if (this.type === 'material' && this.materialId) {
      if (!window.playerData || !window.playerData.inventory) {
        console.warn("⚠️ Не найден window.playerData.inventory");
        return false;
      }

      const currentTotal = Object.values(window.playerData.inventory)
        .reduce((sum, count) => sum + (Number(count) || 0), 0);

      if (currentTotal >= MAX_BACKPACK_ITEMS) {
        console.log(`🎒 Рюкзак полон (${currentTotal}/${MAX_BACKPACK_ITEMS})! Освободи место через [I].`);
        return false;
      }

      window.playerData.inventory[this.materialId] = (Number(window.playerData.inventory[this.materialId]) || 0) + 1;
      this.isCollected = true;
      console.log(`📦 Подобрана деталь (1 шт): ${this.materialId}. В рюкзаке: ${currentTotal + 1}/${MAX_BACKPACK_ITEMS}`);

      if (typeof window.refreshInventoryUI === 'function') {
        window.refreshInventoryUI();
      }
      return true;
    }

    this.isCollected = true;

    if (this.type === 'coin') {
      console.log("🪙 Собран крипто-койн!");
    } else if (this.type === 'heart' && player) {
      console.log("💖 Подобрано кристальное сердце (+HP)!");
      if (typeof player.heal === 'function') player.heal(25);
    } else if (this.type === 'plasma' && player) {
      console.log("⚡ Подобрано плазменное ядро (+Energy)!");
      if (typeof player.addEnergy === 'function') player.addEnergy(35);
    }

    return true;
  }

  draw(ctx, spriteSheetImg) {
    if (this.isCollected) return;

    ctx.save();

    if (this.type === 'material' && this.materialId) {
      const meta = MATERIAL_VISUALS[this.materialId] || { glow: '#00ffcc', label: 'MAT' };
      const img = getMaterialImage(this.materialId);

      // Лёгкое неоновое свечение за предметом
      ctx.shadowColor = meta.glow;
      ctx.shadowBlur = 10;

      if (img) {
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
      } else {
        // Фолбэк, если картинка ещё грузится
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = meta.glow;
        ctx.lineWidth = 2;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0;
        ctx.fillStyle = meta.glow;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.label, this.x + this.width / 2, this.y + this.height / 2);
      }
    } else {
      if (spriteSheetImg && spriteSheetImg.complete && spriteSheetImg.naturalWidth > 0) {
        const frameWidth = spriteSheetImg.naturalWidth / this.totalFrames;
        const frameHeight = spriteSheetImg.naturalHeight / 3;

        ctx.drawImage(
          spriteSheetImg,
          this.currentFrame * frameWidth, this.sheetRow * frameHeight, frameWidth, frameHeight,
          this.x, this.y, this.width, this.height
        );
      } else {
        ctx.fillStyle = this.type === 'coin' ? '#fbbf24' : (this.type === 'heart' ? '#ec4899' : '#38bdf8');
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }

    ctx.restore();
  }
}