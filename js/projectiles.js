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
      this.effects.push({
        player: data.playerRef,
        config: data.config,
        type: data.type,
        life: duration,
        maxLife: duration,
        facingRight: data.facingRight
      });
    }
  }

  update() {
    // Обновляем апельсины Чебура
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.travelled += Math.abs(p.vx);

      if (p.travelled >= p.maxDist || p.y > 2000) {
        this.projectiles.splice(i, 1);
      }
    }

    // Обновляем визуальные эффекты
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      eff.life--;
      if (eff.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
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

        // Рисуем цепь по точкам (звенья + кольца)
        ctx.strokeStyle = eff.config.color;
        ctx.fillStyle = eff.config.color;
        ctx.lineWidth = 2;

        const chainSteps = 10;
        let prevX = startX;
        let prevY = startY;

        for (let i = 1; i <= chainSteps; i++) {
          const t = i / chainSteps;
          // Параболическая интерполяция для дуги цепи
          const cx = startX + (anchorX - startX) * t;
          const cy = startY + (anchorY - startY) * t + Math.sin(t * Math.PI) * (-40);

          // Рисуем перемычку цепи
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          // Рисуем кольцо цепи в узловых точках
          ctx.beginPath();
          ctx.ellipse(cx, cy, 4, 2, t * Math.PI, 0, Math.PI * 2);
          ctx.fill();

          prevX = cx;
          prevY = cy;
        }

        // Оборванный хвост цепи, летящий позади якоря (эффект инерции)
        ctx.strokeStyle = eff.config.secondaryColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(anchorX - dir * 25, anchorY - 12);
        ctx.stroke();

        // Крупный детализированный якорь
        ctx.save();
        ctx.translate(anchorX, anchorY);
        const angle = (progress * Math.PI * 1.2) * dir;
        ctx.rotate(angle);

        ctx.fillStyle = eff.config.color;
        ctx.strokeStyle = eff.config.secondaryColor;
        ctx.lineWidth = 2.5;

        // Кольцо якоря
        ctx.beginPath();
        ctx.arc(0, -22, 7, 0, Math.PI * 2);
        ctx.stroke();

        // Веретено и шток
        ctx.fillRect(-3, -16, 6, 32);   
        ctx.fillRect(-14, -10, 28, 4);  

        // Рога якоря
        ctx.beginPath();
        ctx.arc(0, -2, 20, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.lineWidth = 6;
        ctx.stroke();

        // Левая лапа
        ctx.beginPath();
        ctx.moveTo(-17, 10);
        ctx.lineTo(-24, 4);
        ctx.lineTo(-14, 2);
        ctx.closePath();
        ctx.fill();

        // Правая лапа
        ctx.beginPath();
        ctx.moveTo(17, 10);
        ctx.lineTo(24, 4);
        ctx.lineTo(14, 2);
        ctx.closePath();
        ctx.fill();

        // Блик
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