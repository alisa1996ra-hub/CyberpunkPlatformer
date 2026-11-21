// js/weather.js

export class WeatherSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 60;
    this.lightningTimer = 0;
    this.flashAlpha = 0;
  }

  update(width, height, isNight = false) {
    // Генерация капель дождя / искр
    if (this.particles.length < this.maxParticles) {
      this.particles.push({
        x: Math.random() * width,
        y: -10,
        vy: Math.random * 8 + 6,
        vx: Math.random() * 2 - 1,
        size: Math.random() * 2 + 1,
        color: '#38bdf8'
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.y > height) {
        this.particles.splice(i, 1);
      }
    }

    // Логика вспышек молний для ночных уровней
    if (isNight) {
      this.lightningTimer--;
      if (this.lightningTimer <= 0) {
        if (Math.random() < 0.02) { // Шанс грозы
          this.flashAlpha = 0.85; // Яркая вспышка
          this.lightningTimer = Math.floor(Math.random() * 150) + 60;
          
          // Легкий тряс экрана при молнии, если доступен
          if (window.triggerScreenShake) {
            window.triggerScreenShake(3, 8);
          }
        }
      }
      
      // Плавное затухание вспышки
      if (this.flashAlpha > 0) {
        this.flashAlpha -= 0.08;
        if (this.flashAlpha < 0) this.flashAlpha = 0;
      }
    }
  }

  draw(ctx, width, height, isNight = false) {
    this.update(width, height, isNight);

    ctx.save();

    // 1. Затемнение экрана для ночных уровней
    if (isNight) {
      ctx.fillStyle = 'rgba(5, 5, 15, 0.45)';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Отрисовка капель дождя
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    for (const p of this.particles) {
      ctx.fillRect(p.x, p.y, p.size, p.size * 6);
    }

    // 3. Вспышка молнии поверх всего экрана
    if (isNight && this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }
}
