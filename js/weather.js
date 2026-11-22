// js/weather.js

export class WeatherSystem {
  constructor() {
    this.particles = [];
    this.splashes = [];
    this.maxParticles = 65;
    this.lightningTimer = 0;
    this.flashAlpha = 0;
    this.acidDamageTimer = 0;
  }

  isPointBlocked(worldX, worldY, levelData, tileSize = 32) {
    if (!levelData) return false;

    const grid = levelData.grid;
    if (grid && grid.length > 0) {
      const col = Math.floor(worldX / tileSize);
      const row = Math.floor(worldY / tileSize);
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[row].length) {
        const tileId = grid[row][col];
        if (tileId >= 1 && tileId <= 5) {
          return true;
        }
      }
    }

    const pmPlatforms = window.platformManager?.platforms;
    if (Array.isArray(pmPlatforms)) {
      for (const p of pmPlatforms) {
        const py = p.y + (p.offsetY || 0);
        if (worldX >= p.x && worldX <= p.x + p.width && worldY >= py && worldY <= py + p.height) {
          return true;
        }
      }
    }

    const alloyPlats = levelData.alloyPlatforms || window.alloyPlatforms;
    if (Array.isArray(alloyPlats)) {
      for (const p of alloyPlats) {
        if (worldX >= p.x && worldX <= p.x + p.width && worldY >= p.y && worldY <= p.y + p.height) {
          return true;
        }
      }
    }

    return false;
  }

  hasOverheadCover(player, levelData, tileSize = 32) {
    if (!player || !levelData) return false;

    const leftX = player.x + 4;
    const centerX = player.x + (player.width || 32) / 2;
    const rightX = player.x + (player.width || 32) - 4;
    const playerTopY = Math.max(0, player.y);

    const checkXs = [leftX, centerX, rightX];
    const grid = levelData.grid;

    if (grid && grid.length > 0) {
      const maxRow = Math.min(grid.length - 1, Math.floor(playerTopY / tileSize));
      for (const wx of checkXs) {
        const col = Math.floor(wx / tileSize);
        for (let r = 0; r <= maxRow; r++) {
          if (col >= 0 && col < grid[r].length) {
            const tileId = grid[r][col];
            if (tileId >= 1 && tileId <= 5) {
              return true;
            }
          }
        }
      }
    }

    const allPlats = [
      ...(window.platformManager?.platforms || []),
      ...(levelData.alloyPlatforms || window.alloyPlatforms || [])
    ];

    for (const p of allPlats) {
      const py = p.y + (p.offsetY || 0);
      if (py + p.height <= playerTopY + 8) {
        const overlapsX = rightX >= p.x && leftX <= p.x + p.width;
        if (overlapsX) {
          return true;
        }
      }
    }

    return false;
  }

  update(width, height, isNight = false, deltaTime = 0.016, context = {}) {
    const dt = Math.min(deltaTime || 0.016, 0.05);
    const cameraX = context.cameraX || 0;
    const levelData = context.levelData || null;
    const player = context.player || null;
    const isAcidRain = Boolean(isNight);

    const targetCount = isAcidRain ? 70 : this.maxParticles;
    if (this.particles.length < targetCount) {
      this.particles.push({
        x: Math.random() * width,
        y: -12,
        vy: Math.random() * 8 + (isAcidRain ? 9 : 6),
        vx: (Math.random() * 2 - 1) - (isAcidRain ? 0.8 : 0),
        size: isAcidRain ? (Math.random() * 1.6 + 1.5) : (Math.random() * 2 + 1)
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      const worldX = p.x + cameraX;
      const hitObstacle = this.isPointBlocked(worldX, p.y, levelData, 32);

      if (hitObstacle || p.y > height) {
        if (hitObstacle && isAcidRain && p.y >= 0 && p.y <= height && this.splashes.length < 30) {
          this.splashes.push({
            x: p.x,
            y: p.y,
            life: 0.2,
            maxLife: 0.2
          });
        }
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      this.splashes[i].life -= dt;
      if (this.splashes[i].life <= 0) {
        this.splashes.splice(i, 1);
      }
    }

    if (isAcidRain && player && typeof player.hp === 'number' && player.hp > 0) {
      this.acidDamageTimer -= dt;
      const sheltered = this.hasOverheadCover(player, levelData, 32);

      if (!sheltered && this.acidDamageTimer <= 0) {
        this.acidDamageTimer = 0.85;
        player.hp = Math.max(0, player.hp - 2);
        if (typeof window.triggerScreenShake === 'function') {
          window.triggerScreenShake(1.5, 4);
        }
      }
    } else {
      this.acidDamageTimer = Math.max(0, this.acidDamageTimer - dt);
    }

    if (isNight) {
      this.lightningTimer -= dt * 60;
      if (this.lightningTimer <= 0) {
        if (Math.random() < 0.02) {
          this.flashAlpha = 0.85;
          this.lightningTimer = Math.floor(Math.random() * 150) + 60;

          if (window.triggerScreenShake) {
            window.triggerScreenShake(3, 8);
          }
        }
      }

      if (this.flashAlpha > 0) {
        this.flashAlpha -= 0.08 * dt * 60;
        if (this.flashAlpha < 0) this.flashAlpha = 0;
      }
    } else {
      this.flashAlpha = 0;
    }
  }

  draw(ctx, width, height, isNight = false, deltaTime = 0.016, context = {}) {
    this.update(width, height, isNight, deltaTime, context);

    ctx.save();
    const isAcidRain = Boolean(isNight);

    ctx.fillStyle = isAcidRain ? 'rgba(57, 255, 20, 0.82)' : 'rgba(56, 189, 248, 0.6)';
    for (const p of this.particles) {
      ctx.fillRect(p.x, p.y, p.size, p.size * (isAcidRain ? 7 : 6));
    }

    if (isAcidRain && this.splashes.length > 0) {
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 1.5;
      for (const s of this.splashes) {
        const alpha = Math.max(0, s.life / s.maxLife);
        const spread = (1 - alpha) * 8 + 2;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(s.x - spread, s.y - 2);
        ctx.lineTo(s.x, s.y);
        ctx.lineTo(s.x + spread, s.y - 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (isNight && this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(210, 255, 235, ${this.flashAlpha * 0.75})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}