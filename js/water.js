// js/water.js

export class WaterWave {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.time = 0;
  }

  update(deltaTime = 0.016) {
    // ⚙️ СКОРОСТЬ ТЕЧЕНИЯ ВОДЫ
    // Чем меньше число, тем медленнее и спокойнее течет вода.
    // Умножаем на deltaTime, чтобы скорость была независима от FPS!
    const dt = Math.min(deltaTime, 0.05);
    this.time += 2.0 * dt; 
  }

 // Отрисовка воды с заполнением пространства под волной
  drawAt(ctx, x, y, width, height, isSurface = true) {
    ctx.save();
    
    // 🌊 1. Заливаем всё пространство ямы/тайла под водой сплошным полупрозрачным цветом
    ctx.fillStyle = isSurface ? 'rgba(0, 255, 204, 0.45)' : 'rgba(14, 116, 144, 0.85)';
    ctx.fillRect(x, y, width, height);

    // 2. Если это поверхность, рисуем красивую колышущуюся неоновую линию сверху
    if (isSurface) {
      ctx.beginPath();
      
      const waveFrequency = 0.03; // Ширина волны
      const waveAmplitude = 2.0;  // Высота гребня

      const y1 = y + Math.sin(x * waveFrequency + this.time) * waveAmplitude;
      const y2 = y + Math.sin((x + width) * waveFrequency + this.time) * waveAmplitude;

      ctx.moveTo(x, y1);
      ctx.lineTo(x + width, y2);

      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
}