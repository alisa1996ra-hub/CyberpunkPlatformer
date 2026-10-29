// js/particles.js

export class Particle {
  constructor(x, y, vx, vy, color, size, lifeDecay = 0.02) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.alpha = 1.0;
    this.decay = lifeDecay; // Скорость угасания прозрачности
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // Небольшая гравитация для реалистичности падения искр
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Метод генерации пачки частиц (например, искра из щитка)
  emit(x, y, count = 5, customColor = '#00ffcc') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 0.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1; // Импульс немного вверх
      const size = Math.random() * 2.5 + 1;
      const decay = Math.random() * 0.03 + 0.015; // Время жизни
      
      this.particles.push(new Particle(x, y, vx, vy, customColor, size, decay));
    }
  }

  update() {
    // Проходим по массиву с конца, чтобы безопасно удалять мертвые частицы
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}
