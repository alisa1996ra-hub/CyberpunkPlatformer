// js/lighting.js

export class LightSystem {
  constructor() {
    this.darkCanvas = null;
    this.darkCtx = null;
    this.stampCache = new Map();
    this.coneCache = new Map();
  }

  ensureDarkCanvas(width, height) {
    if (!this.darkCanvas) {
      this.darkCanvas = document.createElement('canvas');
      this.darkCtx = this.darkCanvas.getContext('2d');
    }
    if (this.darkCanvas.width !== width || this.darkCanvas.height !== height) {
      this.darkCanvas.width = width;
      this.darkCanvas.height = height;
    }
  }

  getRadialStamp(key, radius, stops) {
    const r = Math.max(8, Math.round(radius));
    const cacheKey = `${key}_${r}`;
    if (this.stampCache.has(cacheKey)) {
      return this.stampCache.get(cacheKey);
    }

    const size = r * 2;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const sctx = c.getContext('2d');

    const grad = sctx.createRadialGradient(r, r, r * 0.08, r, r, r);
    for (const [offset, rgba] of stops) {
      grad.addColorStop(offset, rgba);
    }

    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, size, size);
    this.stampCache.set(cacheKey, c);
    return c;
  }

  getStreetLampConeStamp(mode, dropHeight, topHalfW, bottomHalfW) {
    const h = Math.max(40, Math.round(dropHeight));
    const wTop = Math.max(8, Math.round(topHalfW));
    const wBot = Math.max(40, Math.round(bottomHalfW));
    const key = `${mode}_${h}_${wTop}_${wBot}`;

    if (this.coneCache.has(key)) {
      return this.coneCache.get(key);
    }

    const padX = 36;
    const padY = 20;
    const canvasW = wBot * 2 + padX * 2;
    const canvasH = h + padY * 2;
    const cx = canvasW / 2;
    const topY = padY;
    const botY = padY + h;

    const c = document.createElement('canvas');
    c.width = canvasW;
    c.height = canvasH;
    const sctx = c.getContext('2d');

    // 1. Широкий купольный луч вниз к земле
    sctx.save();
    sctx.beginPath();
    sctx.moveTo(cx - wTop, topY);
    sctx.lineTo(cx + wTop, topY);
    sctx.bezierCurveTo(
      cx + wBot * 0.76,
      topY + h * 0.42,
      cx + wBot * 0.98,
      botY - h * 0.1,
      cx + wBot,
      botY
    );
    sctx.lineTo(cx - wBot, botY);
    sctx.bezierCurveTo(
      cx - wBot * 0.98,
      botY - h * 0.1,
      cx - wBot * 0.76,
      topY + h * 0.42,
      cx - wTop,
      topY
    );
    sctx.closePath();

    const beamGrad = sctx.createLinearGradient(cx, topY, cx, botY);
    if (mode === 'cut') {
      beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      beamGrad.addColorStop(0.62, 'rgba(0, 0, 0, 0.84)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    } else {
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      beamGrad.addColorStop(0.55, 'rgba(0, 255, 204, 0.09)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.025)');
    }

    sctx.fillStyle = beamGrad;
    sctx.fill();
    sctx.restore();

    // 2. Широкое световое пятно купола на земле
    const groundRadiusX = wBot * 1.14;
    const groundRadiusY = 26;
    sctx.save();
    sctx.translate(cx, botY);
    sctx.scale(1, groundRadiusY / groundRadiusX);

    const groundGrad = sctx.createRadialGradient(0, 0, 6, 0, 0, groundRadiusX);
    if (mode === 'cut') {
      groundGrad.addColorStop(0, 'rgba(0, 0, 0, 0.94)');
      groundGrad.addColorStop(0.68, 'rgba(0, 0, 0, 0.62)');
      groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      groundGrad.addColorStop(0, 'rgba(0, 255, 204, 0.19)');
      groundGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.08)');
      groundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    sctx.fillStyle = groundGrad;
    sctx.beginPath();
    sctx.arc(0, 0, groundRadiusX, 0, Math.PI * 2);
    sctx.fill();
    sctx.restore();

    this.coneCache.set(key, { canvas: c, cx, topY });
    return this.coneCache.get(key);
  }

  collectPoweredLights(levelData, player, cameraX = 0) {
    const lights = [];
    const cones = [];

    if (levelData && Array.isArray(levelData.poles)) {
      for (const pole of levelData.poles) {
        if (!pole || pole.isDestroyed) continue;
        const powered = Boolean(pole.isPowered || pole.hasPower);
        if (!powered) continue;

        const poleHeight = pole.height || 200;
        const groundY = pole.groundY || 400;
        const topY = groundY - poleHeight;
        const lampX = (pole.x || 0) - cameraX;
        const lampY = topY - 4;

        lights.push({
          x: lampX,
          y: lampY,
          radius: 85,
          cutKey: 'lamp_head_cut',
          glowKey: 'lamp_head_glow',
          cutStops: [
            [0, 'rgba(0, 0, 0, 1)'],
            [0.65, 'rgba(0, 0, 0, 0.65)'],
            [1, 'rgba(0, 0, 0, 0)']
          ],
          glowStops: [
            [0, 'rgba(56, 189, 248, 0.20)'],
            [1, 'rgba(0, 0, 0, 0)']
          ],
          coreColor: '#38bdf8',
          coreRadius: 3
        });

        cones.push({
          x: lampX,
          y: lampY,
          dropHeight: Math.max(60, groundY - lampY),
          topHalfW: 18,
          bottomHalfW: 210
        });
      }
    }

    if (levelData && Array.isArray(levelData.generators)) {
      for (const gen of levelData.generators) {
        if (!gen || !gen.isPowered) continue;

        const gx = (gen.x || 0) + (gen.width || 44) / 2 - cameraX;
        const gy = (gen.y || 0) + (gen.height || 40) / 2;

        lights.push({
          x: gx,
          y: gy,
          radius: 155,
          cutKey: 'gen_cut',
          glowKey: 'gen_glow',
          cutStops: [
            [0, 'rgba(0, 0, 0, 1)'],
            [0.6, 'rgba(0, 0, 0, 0.7)'],
            [1, 'rgba(0, 0, 0, 0)']
          ],
          glowStops: [
            [0, 'rgba(0, 255, 204, 0.16)'],
            [0.6, 'rgba(56, 189, 248, 0.05)'],
            [1, 'rgba(0, 0, 0, 0)']
          ],
          coreColor: '#00ffcc',
          coreRadius: 3.5
        });
      }
    }

    if (player) {
      const px = (player.x || 0) + (player.width || 32) / 2 - cameraX;
      const py = (player.y || 0) + (player.height || 32) / 2;

      lights.push({
        x: px,
        y: py,
        radius: 120,
        cutKey: 'player_cut',
        glowKey: 'player_glow',
        cutStops: [
          [0, 'rgba(0, 0, 0, 0.92)'],
          [0.65, 'rgba(0, 0, 0, 0.55)'],
          [1, 'rgba(0, 0, 0, 0)']
        ],
        glowStops: [
          [0, 'rgba(148, 163, 184, 0.06)'],
          [1, 'rgba(0, 0, 0, 0)']
        ],
        coreColor: null,
        coreRadius: 0
      });
    }

    return { lights, cones };
  }

  drawNightMaskAndLamps(ctx, width, height, levelData, player, cameraX = 0) {
    this.ensureDarkCanvas(width, height);

    const { lights, cones } = this.collectPoweredLights(levelData, player, cameraX);
    const dctx = this.darkCtx;

    dctx.save();
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, width, height);
    dctx.fillStyle = 'rgba(3, 7, 20, 0.78)';
    dctx.fillRect(0, 0, width, height);

    dctx.globalCompositeOperation = 'destination-out';

    for (const cone of cones) {
      if (cone.x < -cone.bottomHalfW - 60 || cone.x > width + cone.bottomHalfW + 60) continue;
      const stamp = this.getStreetLampConeStamp('cut', cone.dropHeight, cone.topHalfW, cone.bottomHalfW);
      dctx.drawImage(
        stamp.canvas,
        Math.round(cone.x - stamp.cx),
        Math.round(cone.y - stamp.topY)
      );
    }

    for (const light of lights) {
      if (light.x < -light.radius || light.x > width + light.radius) continue;
      const stamp = this.getRadialStamp(light.cutKey, light.radius, light.cutStops);
      dctx.drawImage(stamp, Math.round(light.x - stamp.width / 2), Math.round(light.y - stamp.height / 2));
    }
    dctx.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.darkCanvas, 0, 0);

    ctx.globalCompositeOperation = 'lighter';

    for (const cone of cones) {
      if (cone.x < -cone.bottomHalfW - 60 || cone.x > width + cone.bottomHalfW + 60) continue;
      const stamp = this.getStreetLampConeStamp('glow', cone.dropHeight, cone.topHalfW, cone.bottomHalfW);
      ctx.drawImage(
        stamp.canvas,
        Math.round(cone.x - stamp.cx),
        Math.round(cone.y - stamp.topY)
      );
    }

    for (const light of lights) {
      if (light.x < -light.radius || light.x > width + light.radius) continue;

      const glowStamp = this.getRadialStamp(light.glowKey, light.radius, light.glowStops);
      ctx.drawImage(glowStamp, Math.round(light.x - glowStamp.width / 2), Math.round(light.y - glowStamp.height / 2));

      if (light.coreColor) {
        ctx.fillStyle = light.coreColor;
        ctx.beginPath();
        ctx.arc(Math.round(light.x), Math.round(light.y), light.coreRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}