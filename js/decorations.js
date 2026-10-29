// js/decorations.js

export class Cable {
  constructor(x1, y1, x2, y2, slack = 40) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.baseSlack = slack;
    
    // Центральная точка провисания
    this.cx = (x1 + x2) / 2;
    this.cy = (y1 + y2) / 2 + slack;
    this.targetCy = this.cy;
    this.vy = 0; // Скорость колебания
  }

  update(player) {
    // 1. Проверяем контакт игрока с центральной частью кабеля
    if (player) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const dist = Math.hypot(px - this.cx, py - this.cy);

      if (dist < 35) {
        // Передаем импульс от движения игрока
        this.vy += player.vy * 0.4 + (player.vx !== 0 ? 3 : 1);
      }
    }

    // 2. Затухающие пружинные колебания (физика провода)
    const force = (this.targetCy - this.cy) * 0.1;
    this.vy += force;
    this.vy *= 0.88; // Трение
    this.cy += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    // Квадратичная кривая для реалистичного провисания
    ctx.quadraticCurveTo(this.cx, this.cy, this.x2, this.y2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Внутренняя жила провода с неоновым блеском
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

export class Grass {
  constructor(x, y, height = 18) {
    this.x = x;
    this.y = y;
    this.height = height;
    this.bend = 0; // Изгиб от ветра или игрока
    this.targetBend = 0;
    this.timeOffset = Math.random() * 100;
  }

  update(player) {
    // Естественное фоновое колыхание по синусоиде
    const wind = Math.sin(Date.now() * 0.003 + this.timeOffset) * 4;

    if (player) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height;
      // Если игрок наступает на куст/траву
      if (Math.abs(px - this.x) < 20 && Math.abs(py - this.y) < 10) {
        this.targetBend = player.vx > 0 ? 12 : -12; // Пригибается по ходу движения
      } else {
        this.targetBend = wind;
      }
    } else {
      this.targetBend = wind;
    }

    // Плавный затухающий возврат
    this.bend += (this.targetBend - this.bend) * 0.15;
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    // Изгиб верхушки травинки
    ctx.quadraticCurveTo(this.x, this.y - this.height / 2, this.x + this.bend, this.y - this.height);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.restore();
  }
}
