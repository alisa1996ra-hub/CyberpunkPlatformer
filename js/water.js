// js/water.js

export class WaterWave {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;

    // Поднимаем воду выше, чтобы её сразу было видно (на середину/нижнюю треть холста)
    this.yLevel = canvasHeight - 200;
    this.amplitude = 18; // Делаем волны пошире
    this.frequency = 0.012;
    this.speed = 0.04;
    this.time = 0;
  }

  update() {
    this.time += this.speed;
  }

  draw(ctx) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(0, this.height);
    ctx.lineTo(0, this.yLevel);

    for (let x = 0; x <= this.width; x += 5) {
      const y =
        this.yLevel +
        Math.sin(x * this.frequency + this.time) * this.amplitude +
        Math.cos(x * 0.006 + this.time * 0.4) * (this.amplitude / 2);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      0,
      this.yLevel - 40,
      0,
      this.height,
    );
    gradient.addColorStop(0, "rgba(0, 255, 204, 0.6)");
    gradient.addColorStop(0.3, "rgba(14, 116, 144, 0.8)");
    gradient.addColorStop(1, "rgba(3, 7, 18, 0.98)");

    ctx.fillStyle = gradient;
    ctx.fill();

    // Неоновая линия волны
    ctx.beginPath();
    for (let x = 0; x <= this.width; x += 5) {
      const y =
        this.yLevel +
        Math.sin(x * this.frequency + this.time) * this.amplitude +
        Math.cos(x * 0.006 + this.time * 0.4) * (this.amplitude / 2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 15;
    ctx.stroke();

    ctx.restore();
  }
}
