// js/decorations.js
import { spawnLootFromBarrel } from './main.js';

export class Grass {
  constructor(x, y, type = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.sway = Math.random() * Math.PI * 2;
    this.bendForce = 0;

    if (this.type === 1) {
      this.stems = [
        { offsetX: -10, length: 14, curve: -0.2 },
        { offsetX: -5,  length: 17, curve: -0.1 },
        { offsetX: 0,   length: 20, curve:  0.0 },
        { offsetX: 5,   length: 17, curve:  0.1 },
        { offsetX: 10,  length: 14, curve:  0.2 }
      ];
      this.speed = 0.12;
      this.windAmpl = 0.2;
    } else if (this.type === 2) {
      this.stems = [
        { offsetX: -6, length: 24, curve: -0.15 },
        { offsetX: -2, length: 28, curve: -0.05 },
        { offsetX: 2,  length: 30, curve:  0.05 },
        { offsetX: 6,  length: 22, curve:  0.15 }
      ];
      this.speed = 0.16;
      this.windAmpl = 0.25;
    } else {
      this.stems = [
        { offsetX: -8, length: 15, curve: -0.2 },
        { offsetX: -3, length: 19, curve: -0.1 },
        { offsetX: 3,  length: 21, curve:  0.1 },
        { offsetX: 7,  length: 16, curve:  0.2 }
      ];
      this.speed = 0.14;
      this.windAmpl = 0.22;
    }
  }

  update(player, deltaTime) {
    const dt = deltaTime || 0.016;
    this.sway += this.speed * dt * 60;

    if (player) {
      const playerCenterX = player.x + (player.width || 32) / 2;
      const playerCenterY = player.y + (player.height || 32) / 2;

      const distX = playerCenterX - this.x;
      const distY = playerCenterY - this.y;

      const touchRadiusX = 25;
      const absX = Math.abs(distX);

      if (absX < touchRadiusX && Math.abs(distY) < 25) {
        const pushDir = distX < 0 ? 1 : -1;
        const forceFactor = (1 - absX / touchRadiusX);
        const targetBend = pushDir * forceFactor * 1.2;

        this.bendForce += (targetBend - this.bendForce) * Math.min(1, 8 * dt);
      } else {
        this.bendForce += (0 - this.bendForce) * Math.min(1, 0.5 * dt);
      }
    } else {
      this.bendForce += (0 - this.bendForce) * Math.min(1, 3.5 * dt);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.type === 2 ? '#38bdf8' : '#00ffcc';
    ctx.fillStyle = this.type === 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(0, 255, 204, 0.45)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    this.stems.forEach((stem, index) => {
      ctx.beginPath();

      const windEffect = Math.sin(this.sway + index * 0.5) * this.windAmpl;
      const totalCurve = stem.curve + this.bendForce;

      const tipX = this.x + stem.offsetX + (totalCurve * 25) + windEffect;
      const tipY = this.y - stem.length;

      ctx.moveTo(this.x, this.y);
      ctx.quadraticCurveTo(this.x + stem.offsetX * 0.5, this.y - stem.length * 0.5, tipX, tipY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(tipX, tipY, this.type === 2 ? 2 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}

export class PowerLinePole {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.height = 200;

    this.health = 150;
    this.maxHealth = 150;
    this.isDestroyed = false;
    this.isPowered = false;
    this.hasPower = false;
    this.cables = [];
  }

  setPowerState(powered) {
    this.isPowered = Boolean(powered);
    this.hasPower = this.isPowered;
  }

  getHitbox() {
    return {
      x: this.x - 12,
      y: this.groundY - this.height,
      width: 24,
      height: this.height
    };
  }

  getCableAttachmentPoint() {
    const topY = this.groundY - this.height;
    const attachLocalX = 0;
    const attachLocalY = topY + 24;

    if (this.isDestroyed) {
      const angle = 0.25;
      const rotatedX = attachLocalX * Math.cos(angle) - (attachLocalY - this.groundY) * Math.sin(angle);
      const rotatedY = attachLocalX * Math.sin(angle) + (attachLocalY - this.groundY) * Math.cos(angle);
      return {
        x: this.x + rotatedX,
        y: this.groundY + rotatedY
      };
    }

    return {
      x: this.x + attachLocalX,
      y: attachLocalY
    };
  }

  takeDamage(amount = 10) {
    if (this.isDestroyed) return;

    this.health -= amount;
    console.log(`⚡ Столб на X:${this.x} получил урон: -${amount}. Осталось здоровья: ${this.health}/${this.maxHealth}`);

    if (this.health <= 0) {
      this.collapse();
    }
  }

  collapse() {
    this.isDestroyed = true;
    this.setPowerState(false);
    console.log(`💥 Опора ЛЭП разрушена! Обрываем все связанные провода.`);

    if (this.cables && this.cables.length > 0) {
      this.cables.forEach(cable => {
        if (!cable.isBroken) {
          cable.forceBreak();
        }
      });
    }
  }

  repairPole() {
    this.isDestroyed = false;
    this.health = this.maxHealth;
    console.log(`🔧 Столб на X:${this.x} восстановлен (${this.health}/${this.maxHealth} HP).`);
  }

  draw(ctx) {
    ctx.save();
    const topY = this.groundY - this.height;

    if (this.isDestroyed) {
      ctx.translate(this.x, this.groundY);
      ctx.rotate(0.25);
      ctx.translate(-this.x, -this.groundY);
    }

    const bodyColor = '#0f172a';
    const powered = Boolean(this.isPowered) && !this.isDestroyed;
    const hpPercent = this.health / this.maxHealth;

    // Жёлтый и красный — только на элементах под напряжением в цепи
    let strokeColor = '#64748b';
    let glowColor = 'transparent';
    let glowBlur = 0;

    if (powered) {
      strokeColor = '#38bdf8';
      glowColor = '#38bdf8';
      glowBlur = 8;

      if (hpPercent <= 0.5) {
        strokeColor = '#fbbf24';
        glowColor = '#fbbf24';
        glowBlur = 10;
      }
      if (hpPercent <= 0.2) {
        strokeColor = '#ef4444';
        glowColor = '#ef4444';
        glowBlur = 12;
      }
    }

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.lineWidth = 2;

    ctx.fillRect(this.x - 6, topY, 12, this.height);
    ctx.strokeRect(this.x - 6, topY, 12, this.height);

    ctx.fillRect(this.x - 30, topY + 20, 60, 8);
    ctx.strokeRect(this.x - 30, topY + 20, 60, 8);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(this.x - 10, topY - 12, 20, 14);
    ctx.strokeRect(this.x - 10, topY - 12, 20, 14);

    // Фонарь на столбе: синий при питании, серый без питания (без красного/жёлтого, если нет тока)
    const lampColor = powered ? '#38bdf8' : '#64748b';
    ctx.fillStyle = lampColor;
    ctx.shadowColor = powered ? '#00ffcc' : 'transparent';
    ctx.shadowBlur = powered ? 12 : 0;
    ctx.fillRect(this.x - 5, topY - 5, 10, 4);

    if (powered) {
      const grad = ctx.createRadialGradient(this.x, topY - 3, 2, this.x, topY + 14, 34);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, topY + 10, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Cable {
  constructor(startX, startY, endX, endY, slack = 45, leftPole = null, rightPole = null) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.leftPole = leftPole;
    this.rightPole = rightPole;
    this.slack = slack;
    this.currentSlack = slack;
    this.velocity = 0;

    this.hp = 100;
    this.maxHp = 100;
    this.isBroken = false;
    this.isPowered = false;
    this.hasPower = false;

    this.leftTip = { x: startX, y: startY, vx: 0, vy: 0 };
    this.rightTip = { x: endX, y: endY, vx: 0, vy: 0 };
    this.sparkTimer = 0;
  }

  setPowerState(powered) {
    this.isPowered = Boolean(powered);
    this.hasPower = this.isPowered;
  }

  getHitbox() {
    return {
      x: Math.min(this.startX, this.endX),
      y: Math.min(this.startY, this.endY) - 20,
      width: Math.abs(this.endX - this.startX) || 30,
      height: 60
    };
  }

  takeDamage(amount = 10) {
    if (this.isBroken) return;

    this.hp -= amount;
    this.velocity += 18;
    console.log(`🔌 Кабель получил урон: -${amount}. Осталось HP: ${this.hp}/${this.maxHp}`);

    if (this.hp <= 0) {
      this.forceBreak();
    }
  }

  repair() {
    this.isBroken = false;
    this.hp = this.maxHp;
    this.velocity = 0;
    this.currentSlack = this.slack;
    this.leftTip = { x: this.startX, y: this.startY, vx: 0, vy: 0 };
    this.rightTip = { x: this.endX, y: this.endY, vx: 0, vy: 0 };
    console.log("🔌 Кабель восстановлен и подключён.");
  }

  update(player, deltaTime) {
    const dt = deltaTime || 0.016;

    if (this.leftPole && typeof this.leftPole.getCableAttachmentPoint === 'function') {
      const p1 = this.leftPole.getCableAttachmentPoint();
      this.startX = p1.x;
      this.startY = p1.y;
    }
    if (this.rightPole && typeof this.rightPole.getCableAttachmentPoint === 'function') {
      const p2 = this.rightPole.getCableAttachmentPoint();
      this.endX = p2.x;
      this.endY = p2.y;
    }

    if (this.isBroken) {
      const anchorLeftX = this.startX + 25;
      const anchorLeftY = this.startY + 50;
      const anchorRightX = this.endX - 25;
      const anchorRightY = this.endY + 50;

      const forceLeftX = (anchorLeftX - this.leftTip.x) * 80;
      const forceLeftY = (anchorLeftY - this.leftTip.y) * 80;
      this.leftTip.vx = (this.leftTip.vx + forceLeftX * dt) * 0.92;
      this.leftTip.vy = (this.leftTip.vy + forceLeftY * dt) * 0.92;
      this.leftTip.x += this.leftTip.vx * dt;
      this.leftTip.y += this.leftTip.vy * dt;

      const forceRightX = (anchorRightX - this.rightTip.x) * 80;
      const forceRightY = (anchorRightY - this.rightTip.y) * 80;
      this.rightTip.vx = (this.rightTip.vx + forceRightX * dt) * 0.92;
      this.rightTip.vy = (this.rightTip.vy + forceRightY * dt) * 0.92;
      this.rightTip.x += this.rightTip.vx * dt;
      this.rightTip.y += this.rightTip.vy * dt;

      this.sparkTimer += dt;
      return;
    }

    if (player) {
      const pCenterX = player.x + (player.width || 32) / 2;
      const pCenterY = player.y + (player.height || 32) / 2;
      const wireY = (this.startY + this.endY) / 2;

      const distX = pCenterX - ((this.startX + this.endX) / 2);
      const distY = pCenterY - wireY;
      const halfLength = Math.abs(this.endX - this.startX) / 2;

      if (Math.abs(distX) < halfLength + 20 && Math.abs(distY) < 60) {
        if (player.vy !== undefined && Math.abs(player.vy) > 1 && (!this.cooldown || this.cooldown <= 0)) {
          this.velocity += player.vy * 4;
          this.cooldown = 0.2;
        }
      }
    }

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    const springFactor = 120;
    const damping = 3.5;
    const force = (this.slack - this.currentSlack) * springFactor;

    this.velocity += force * dt;
    this.velocity *= Math.max(0, 1 - damping * dt);
    this.currentSlack += this.velocity * dt;
  }

  forceBreak() {
    if (this.isBroken) return;
    this.isBroken = true;
    this.hp = 0;
    this.setPowerState(false);

    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    this.leftTip.x = (this.startX + this.endX) / 2;
    this.leftTip.y = (this.startY + this.endY) / 2;
    this.leftTip.vx = (Math.random() * 180 + 60) * randomDirection;
    this.leftTip.vy = -(Math.random() * 220 + 120);

    this.rightTip.x = (this.startX + this.endX) / 2;
    this.rightTip.y = (this.startY + this.endY) / 2;
    this.rightTip.vx = -(Math.random() * 180 + 60) * randomDirection;
    this.rightTip.vy = -(Math.random() * 220 + 120);

    console.log("💥 Аварийный обрыв кабеля!");
  }

  draw(ctx) {
    ctx.save();
    const powered = Boolean(this.isPowered);

    if (this.isBroken) {
      const breakColor = powered ? '#ef4444' : '#64748b';
      ctx.strokeStyle = breakColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = powered ? '#ef4444' : 'transparent';
      ctx.shadowBlur = powered ? 12 : 0;

      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.quadraticCurveTo(this.startX + 20, this.startY + 20, this.leftTip.x, this.leftTip.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(this.endX, this.endY);
      ctx.quadraticCurveTo(this.endX - 20, this.endY + 20, this.rightTip.x, this.rightTip.y);
      ctx.stroke();

      // Искры — только если оборванный провод под напряжением
      if (powered && Math.sin(this.sparkTimer * 15) > 0.3) {
        ctx.fillStyle = '#00ffcc';
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(this.leftTip.x, this.leftTip.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.rightTip.x, this.rightTip.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.leftTip.x, this.leftTip.y);
        ctx.lineTo(this.leftTip.x + (Math.random() * 16 - 8), this.leftTip.y + (Math.random() * 16 - 8));
        ctx.moveTo(this.rightTip.x, this.rightTip.y);
        ctx.lineTo(this.rightTip.x + (Math.random() * 16 - 8), this.rightTip.y + (Math.random() * 16 - 8));
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    ctx.beginPath();
    const midX = (this.startX + this.endX) / 2;
    const midY = (this.startY + this.endY) / 2 + this.currentSlack;

    ctx.moveTo(this.startX, this.startY);
    ctx.quadraticCurveTo(midX, midY, this.endX, this.endY);

    const hpPercent = this.hp / this.maxHp;

    let strokeColor = '#64748b';
    let glowColor = 'transparent';
    let glowBlur = 0;

    if (powered) {
      strokeColor = '#38bdf8';
      glowColor = '#38bdf8';
      glowBlur = 8;

      if (hpPercent <= 0.6) {
        strokeColor = '#fbbf24';
        glowColor = '#fbbf24';
        glowBlur = 10;
      }
      if (hpPercent <= 0.3) {
        strokeColor = '#ef4444';
        glowColor = '#ef4444';
        glowBlur = 12;
      }
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = powered ? 2.5 : 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.stroke();

    ctx.restore();
  }
}

export class Generator {
  constructor(x, y, width = 44, height = 40, label = 'GEN') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.label = label;
    this.isPowered = false;
    this.linkedCables = [];
    this.pulseTimer = 0;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  getConnectionPoint() {
    return {
      x: this.x + this.width / 2,
      y: this.y + 8
    };
  }

  powerOn() {
    this.isPowered = true;
    console.log(`⚡ Генератор [${this.label}] запущен!`);
  }

  update(deltaTime) {
    const dt = deltaTime || 0.016;
    this.pulseTimer += dt * (this.isPowered ? 8 : 2);
  }

  draw(ctx, player = null) {
    ctx.save();
    const activeColor = this.isPowered ? '#00ffcc' : '#fbbf24';
    const pulse = Math.sin(this.pulseTimer) * 0.25 + 0.75;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = activeColor;
    ctx.shadowBlur = this.isPowered ? 14 : 6;

    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = this.isPowered ? `rgba(0, 255, 204, ${pulse})` : 'rgba(251, 191, 36, 0.35)';
    ctx.fillRect(this.x + 7, this.y + 7, this.width - 14, 10);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.isPowered ? `${this.label}:ON` : `${this.label}:OFF`, this.x + this.width / 2, this.y + 31);

    if (player) {
      const pCenterX = player.x + (player.width || 32) / 2;
      const pCenterY = player.y + (player.height || 32) / 2;
      const gCenterX = this.x + this.width / 2;
      const gCenterY = this.y + this.height / 2;
      if (Math.hypot(pCenterX - gCenterX, pCenterY - gCenterY) < 75) {
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('[E] ГЕНЕРАТОР', gCenterX, this.y - 10);
      }
    }

    ctx.restore();
  }
}

export class Debris {
  constructor(x, y, vx, vy, color, size, lifetime = 0.6) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.gravity = 980;
    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 12;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.isDead = false;
  }

  update(dt) {
    if (this.isDead) return;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.vRot * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    if (this.isDead) return;
    const alpha = Math.max(0, this.lifetime / this.maxLifetime);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.fill();
    ctx.restore();
  }
}

export class DestructibleBarrel {
  constructor(x, y, width = 32, height = 48) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.hp = 50;
    this.maxHp = 50;
    this.isDestroyed = false;
    this.debrisList = [];

    this.mainColor = '#ff2a6d';
    this.stripeColor = '#05d9e8';
    this.darkColor = '#1a0429';
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  takeDamage(amount = 10, hitSourceX = null) {
    if (this.isDestroyed) return;

    this.hp -= amount;
    console.log(`🛢️ Бочка на координатах X:${this.x}, Y:${this.y} получила урон: -${amount}. Осталось HP: ${this.hp}/${this.maxHp}`);

    if (this.hp <= 0 && !this.isDestroyed) {
      this.isDestroyed = true;
      console.log(`💥 БАХ! Бочка уничтожена на точных координатах -> X: ${this.x}, Y: ${this.y}`);

      if (typeof window.spawnLootFromBarrel === 'function') {
        window.spawnLootFromBarrel(this.x, this.y);
      }

      this.explode(hitSourceX);
    }
  }

  explode(hitSourceX) {
    this.isDestroyed = true;
    const rows = 4;
    const cols = 4;
    const pieceW = this.width / cols;
    const pieceH = this.height / rows;
    const baseDirX = hitSourceX ? (this.x + this.width / 2 > hitSourceX ? 1 : -1) : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pX = this.x + c * pieceW + pieceW / 2;
        const pY = this.y + r * pieceH + pieceH / 2;
        const angle = Math.random() * Math.PI - Math.PI;
        const speed = 120 + Math.random() * 240;
        const vx = Math.cos(angle) * speed + baseDirX * 80;
        const vy = Math.sin(angle) * speed - 100;
        const color = (r === 1 || r === 2) ? this.stripeColor : this.mainColor;
        const size = 3 + Math.random() * 5;

        this.debrisList.push(new Debris(pX, pY, vx, vy, color, size, 0.5 + Math.random() * 0.4));
      }
    }
  }

  update(dt) {
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const shard = this.debrisList[i];
      shard.update(dt);
      if (shard.isDead) {
        this.debrisList.splice(i, 1);
      }
    }
  }

  draw(ctx, biomeAssets) {
    if (!this.isDestroyed) {
      ctx.save();
      const barrelImg = biomeAssets ? (biomeAssets.decor_2 || biomeAssets.decor_3 || biomeAssets.decor_1) : null;

      if (barrelImg && barrelImg.complete && barrelImg.naturalWidth > 0) {
        ctx.drawImage(barrelImg, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = this.darkColor;
        ctx.strokeStyle = this.mainColor;
        ctx.lineWidth = 2;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
      ctx.restore();
    }

    this.debrisList.forEach(shard => shard.draw(ctx));
  }
}