// js/lighting.js

export class LightSystem {
  constructor() {
    // Список источников света на уровне (щитки ВРУ, аварийные лампы, терминалы)
    this.lights = [
      { x: 300, y: 180, radius: 200, color: 'rgba(0, 255, 204, 0.35)', baseRadius: 200 }, // Бирюзовый неоновый свет
      { x: 850, y: 220, radius: 250, color: 'rgba(250, 204, 21, 0.3)', baseRadius: 250 },  // Желтый аварийный свет щитка
      { x: 1050, y: 300, radius: 180, color: 'rgba(56, 189, 248, 0.3)', baseRadius: 180 }   // Холодный синий светодиод
    ];
    this.time = 0;
  }

  update() {
    this.time += 0.04;
  }

  draw(ctx) {
    ctx.save();
    
    // Режим наложения screen заставляет световые пятна красиво суммироваться при пересечении
    ctx.globalCompositeOperation = 'screen';

    this.lights.forEach((light, index) => {
      // Имитируем легкий электрический фликкер (нестабильность сети / пульсация ламп)
      const flicker = Math.sin(this.time * 3 + index * 2.5) * 8 + Math.cos(this.time * 7 + index) * 4;
      const currentRadius = light.baseRadius + flicker;
      
      // Радиальный градиент от центра лампы к краям
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 5,
        light.x, light.y, currentRadius
      );

      gradient.addColorStop(0, light.color);
      gradient.addColorStop(0.4, light.color.replace(/[\d.]+\)$/i, '0.15)'));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Рисуем точку самого источника света (например, лампочку или индикатор на щитке)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = light.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(light.x, light.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // сбрасываем тени
    });

    ctx.restore();
  }
}
