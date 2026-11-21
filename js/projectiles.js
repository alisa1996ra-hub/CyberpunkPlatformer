// js/projectiles.js

export class ProjectileManager {
  constructor() {
    this.projectiles = []; // Для апельсинов Чебура
    this.effects = [];     // Для атак Алисы и Нэнси
  }

  spawn(data) {
    if (data.type === 'orange') {
      this.projectiles.push({
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        gravity: data.gravity,
        maxDist: data.maxDist,
        travelled: 0,
        config: data.config
      });
    } else {
      const duration = data.type === 'whip' ? 28 : 15; 
      const newEffect = {
        player: data.playerRef,
        config: data.config,
        type: data.type,
        life: duration,
        maxLife: duration,
        facingRight: data.facingRight,
        damagedBarrels: new Set() // Чтобы не наносить урон одной и той же бочке многократно за один удар
      };

      this.effects.push(newEffect);

      // ⚡ ПЕРЕХВАТ УДАРА по столбам ЛЭП в момент спавна
      if (data.playerRef && window.currentLevelData && window.currentLevelData.poles) {
        const p = data.playerRef;
        const attackRange = data.type === 'tesla' ? 260 : 210;
        const attackX = p.x + (data.facingRight ? p.width : 0);
        const minX = Math.min(attackX, attackX + (data.facingRight ? attackRange : -attackRange));
        const maxX = Math.max(attackX, attackX + (data.facingRight ? attackRange : -attackRange));

        window.currentLevelData.poles.forEach(pole => {
          if (pole.x >= minX - 30 && pole.x <= maxX + 30) {
            pole.takeDamage(1);
            if (window.triggerScreenShake) window.triggerScreenShake(4, 15);
          }
        });
      }
    }
  }

  update() {
    // 1. Обновляем апельсины Чебура
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.travelled += Math.abs(p.vx);

      // Проверка попадания апельсина по столбам
      if (window.currentLevelData && window.currentLevelData.poles) {
        window.currentLevelData.poles.forEach(pole => {
          const poleTopY = pole.groundY - pole.height;
          if (p.x >= pole.x - 20 && p.x <= pole.x + 20 && p.y >= poleTopY && p.y <= pole.groundY) {
            pole.takeDamage(1);
            p.travelled = p.maxDist;
            if (window.triggerScreenShake) window.triggerScreenShake(4, 15);
          }
        });
      }

      // Проверка попадания апельсина по бочкам
      if (window.currentLevelData && window.currentLevelData.barrels) {
        const pBox = { x: p.x - 6, y: p.y - 6, width: 12, height: 12 };
        window.currentLevelData.barrels.forEach(barrel => {
          if (!barrel.isDestroyed && this.rectIntersect(pBox, barrel.getHitbox())) {
            barrel.takeDamage(30, p.x);
            p.travelled = p.maxDist; // Уничтожаем снаряд
            if (window.triggerScreenShake) window.triggerScreenShake(3, 10);
          }
        });
      }

      if (p.travelled >= p.maxDist || p.y > 2000) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Обновляем визуальные эффекты и проверяем урон от ударов ближнего боя (Тесла / Цепь)
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      eff.life--;

      // 🔌 ПЕРЕХВАТ УДАРА по силовым кабелям
      if (eff.player && window.currentLevelData && window.currentLevelData.cables) {
        const p = eff.player;
        const dir = eff.facingRight ? 1 : -1;
        const attackRange = eff.type === 'tesla' ? 260 : 210;
        const startX = p.x + (eff.facingRight ? p.width : 0);

        const attackHitbox = {
          x: eff.facingRight ? startX : startX - attackRange,
          y: p.y - 40,
          width: attackRange,
          height: p.height + 60
        };

        window.currentLevelData.cables.forEach(cable => {
          if (!cable.isBroken && !eff.damagedCables?.has(cable)) {
            if (this.rectIntersect(attackHitbox, cable.getHitbox())) {
              cable.takeDamage(1);
              if (!eff.damagedCables) eff.damagedCables = new Set();
              eff.damagedCables.add(cable);
              if (window.triggerScreenShake) window.triggerScreenShake(3, 10);
            }
          }
        });
      }

      // Проверяем коллизию атак с бочками во время активной фазы удара
      if (eff.player && window.currentLevelData && window.currentLevelData.barrels) {
        const p = eff.player;
        const dir = eff.facingRight ? 1 : -1;
        const attackRange = eff.type === 'tesla' ? 260 : 210;
        const startX = p.x + (eff.facingRight ? p.width : 0);

        const attackHitbox = {
          x: eff.facingRight ? startX : startX - attackRange,
          y: p.y - 10,
          width: attackRange,
          height: p.height + 20
        };

        window.currentLevelData.barrels.forEach(barrel => {
          if (!barrel.isDestroyed && !eff.damagedBarrels.has(barrel)) {
            if (this.rectIntersect(attackHitbox, barrel.getHitbox())) {
              barrel.takeDamage(30, p.x + p.width / 2);
              eff.damagedBarrels.add(barrel); // Фиксируем, что эта бочка уже получила урон от текущего удара
              if (window.triggerScreenShake) window.triggerScreenShake(3, 10);
            }
          }
        });
      }

      if (eff.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  // Вспомогательный метод для пересечения AABB хитбоксов
  rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.width ||
             r2.x + r2.width < r1.x ||
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
  }

  draw(ctx) {
    // 1. Рендер апельсинов Чебура
    for (const p of this.projectiles) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.config.color;

      ctx.fillStyle = p.config.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Рендер атак Алисы и Нэнси
    for (const eff of this.effects) {
      if (!eff.player) continue;
      ctx.save();
      ctx.shadowBlur = 22;
      ctx.shadowColor = eff.config.color;

      const p = eff.player;
      const dir = eff.facingRight ? 1 : -1;
      const startX = p.x + (eff.facingRight ? p.width : 0);
      const startY = p.y + p.height / 2;

      if (eff.type === 'tesla') {
        // --- АЛИСА: Тесла-молния ---
        const length = 260;
        for (let branch = 0; branch < 3; branch++) {
          ctx.strokeStyle = branch === 0 ? eff.config.secondaryColor : eff.config.color;
          ctx.lineWidth = branch === 0 ? 3 : 1.5;
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          let currentX = startX;
          let currentY = startY;
          const steps = 6;
          
          for (let s = 1; s <= steps; s++) {
            currentX = startX + (dir * (length / steps) * s);
            currentY = startY + (Math.sin(s * 3 + branch) * 18) + (Math.random() * 14 - 7);
            ctx.lineTo(currentX, currentY);
          }
          ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(startX + dir * length, startY, 5, 0, Math.PI * 2);
        ctx.fill();

      } else if (eff.type === 'whip') {
        // --- НЭНСИ: Якорь с хвостом из реальных звеньев цепи ---
        const progress = 1 - (eff.life / eff.maxLife); 
        const maxReach = 210; 
        const currentDist = maxReach * progress;
        const anchorX = startX + dir * currentDist;
        
        const arcHeight = -65 * Math.sin(progress * Math.PI); 
        const floorFall = progress * 45; 
        const anchorY = startY + arcHeight + floorFall;

        ctx.strokeStyle = eff.config.color;
        ctx.fillStyle = eff.config.color;
        ctx.lineWidth = 2;

        const chainSteps = 10;
        let prevX = startX;
        let prevY = startY;

        for (let i = 1; i <= chainSteps; i++) {
          const t = i / chainSteps;
          const cx = startX + (anchorX - startX) * t;
          const cy = startY + (anchorY - startY) * t + Math.sin(t * Math.PI) * (-40);

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(cx, cy, 4, 2, t * Math.PI, 0, Math.PI * 2);
          ctx.fill();

          prevX = cx;
          prevY = cy;
        }

        ctx.strokeStyle = eff.config.secondaryColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(anchorX - dir * 25, anchorY - 12);
        ctx.stroke();

        ctx.save();
        ctx.translate(anchorX, anchorY);
        const angle = (progress * Math.PI * 1.2) * dir;
        ctx.rotate(angle);

        ctx.fillStyle = eff.config.color;
        ctx.strokeStyle = eff.config.secondaryColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, -22, 7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillRect(-3, -16, 6, 32);   
        ctx.fillRect(-14, -10, 28, 4);  

        ctx.beginPath();
        ctx.arc(0, -2, 20, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-17, 10);
        ctx.lineTo(-24, 4);
        ctx.lineTo(-14, 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(17, 10);
        ctx.lineTo(24, 4);
        ctx.lineTo(14, 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
  }
}