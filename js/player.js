// js/player.js

export class Player {
  constructor(x, y, character = 'Alisa') { // 🌟 Алиса по умолчанию главный герой!
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 48;
    this.vx = 0;
    this.vy = 0;
    this.speed = 4.5;
    this.jumpForce = -11;
    this.gravity = 0.55;
    this.isGrounded = false;
    
    this.animFrame = 0;
    this.animTimer = 0;
    this.facingRight = true;

    this.isAttacking = false;

    // Здоровье и энергия
    this.hp = 100;
    this.maxHp = 100;
    this.energy = 0;
    this.maxEnergy = 100;
    
    this.isTurboUnlocked = false; 
    this.isTurboActive = false;   
    this.energyCost = 10;         

    this.sprite = new Image();
    this.setCharacter(character);
  }

  setCharacter(characterName) {
    this.sprite.src = `assets/common/${characterName}.png`;
  }

  stop() {
    this.vx = 0;
  }

  moveLeft() {
    this.vx = -this.speed;
    this.facingRight = false;
  }

  moveRight() {
    this.vx = this.speed;
    this.facingRight = true;
  }

  jump() {
    if (this.isGrounded && !this.isAttacking) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }
  }

  // 🎚️ Переключение тумблера турбо-режима (кнопка-молния)
  toggleTurbo() {
    if (!this.isTurboUnlocked) {
      console.log("🔒 Модуль супер-оружия заблокирован в текущем биоме!");
      return false;
    }
    if (this.energy < this.energyCost) {
      console.log("⚠️ Недостаточно энергии для активации турбо-режима!");
      this.isTurboActive = false;
      return false;
    }
    this.isTurboActive = !this.isTurboActive;
    console.log(`⚡ Турбо-режим: ${this.isTurboActive ? 'АКТИВИРОВАН' : 'ОТКЛЮЧЕН'}`);
    return this.isTurboActive;
  }

  addEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // ⚔️ Умный метод атаки: супер-оружие при активном турбо, иначе — штатный удар/ремонт
  triggerAttack(projectileManager, worldObjects = []) {
    if (this.isAttacking) return;

    const canUseSuper = this.isTurboActive && this.energy >= this.energyCost;

    if (canUseSuper) {
      // 🚀 СУПЕР-УДАР (расход 10 энергии)
      this.energy -= this.energyCost;
      if (this.energy < this.energyCost) {
        this.isTurboActive = false; 
      }

      this.isAttacking = true;
      this.animFrame = 0;
      this.animTimer = 0;

      if (!projectileManager) return;
      const spritePath = this.sprite.src;

      if (spritePath.includes('Chebur')) {
        projectileManager.spawn({
          type: 'orange',
          x: this.facingRight ? this.x + this.width : this.x,
          y: this.y + this.height / 3,
          vx: this.facingRight ? 7 : -7,
          vy: -6,
          gravity: 0.45,
          maxDist: 380,
          config: { color: '#fb923c', secondaryColor: '#fef08a' }
        });
      } else if (spritePath.includes('Nancy')) {
        projectileManager.spawn({
          type: 'whip',
          playerRef: this,
          facingRight: this.facingRight,
          config: { color: '#ec4899', secondaryColor: '#f43f5e' }
        });
      } else {
        projectileManager.spawn({
          type: 'tesla',
          playerRef: this,
          facingRight: this.facingRight,
          config: { color: '#38bdf8', secondaryColor: '#facc15' }
        });
      }
    } else {
      // 👊 ШТАТНЫЙ УДАР РУКОЙ (Наносит ровно 10 урона объектам)
      this.isAttacking = true;
      this.animFrame = 0;
      this.animTimer = 0;

      const attackHitbox = {
        x: this.facingRight ? this.x + this.width : this.x - 35,
        y: this.y + 5,
        width: 35,
        height: this.height - 5
      };

      if (Array.isArray(worldObjects)) {
        worldObjects.forEach(obj => {
          if (obj && typeof obj.takeDamage === 'function' && typeof obj.getHitbox === 'function') {
            const hb = obj.getHitbox();
            if (
              attackHitbox.x < hb.x + hb.width &&
              attackHitbox.x + attackHitbox.width > hb.x &&
              attackHitbox.y < hb.y + hb.height &&
              attackHitbox.y + attackHitbox.height > hb.y
            ) {
              obj.takeDamage(10); // ⚡ Наносим ровно 10 единиц урона рукой!
            }
          }
        });
      }
    }
  }


  update(grid, TILE = 32, waterY, particleSystem) {
    const wasGrounded = this.isGrounded;
    this.isGrounded = false;

    if (this.isAttacking) {
      this.animTimer++;
      if (this.animTimer > 4) {
        this.animFrame++;
        this.animTimer = 0;
        if (this.animFrame >= 8) {
          this.isAttacking = false;
          this.animFrame = 0;
        }
      }
    }

    // Горизонтальное движение
    this.x += this.vx;
    if (grid) {
      const leftTile = Math.floor(this.x / TILE);
      const rightTile = Math.floor((this.x + this.width) / TILE);
      const topTile = Math.floor(this.y / TILE);
      const bottomTile = Math.floor((this.y + this.height - 1) / TILE);

      if (this.vx > 0) {
        for (let r = topTile; r <= bottomTile; r++) {
          if (grid[r] && grid[r][rightTile] > 0 && grid[r][rightTile] < 6) {
            this.x = rightTile * TILE - this.width;
            break;
          }
        }
      } else if (this.vx < 0) {
        for (let r = topTile; r <= bottomTile; r++) {
          if (grid[r] && grid[r][leftTile] > 0 && grid[r][leftTile] < 6) {
            this.x = (leftTile + 1) * TILE;
            break;
          }
        }
      }
    }

    // Вертикальное движение
    this.vy += this.gravity;
    this.y += this.vy;

    if (grid) {
      const leftTile = Math.floor(this.x / TILE);
      const rightTile = Math.floor((this.x + this.width - 1) / TILE);

      if (this.vy > 0) {
        const bottomTile = Math.floor((this.y + this.height) / TILE);
        let collision = false;

        for (let c = leftTile; c <= rightTile; c++) {
          if (grid[bottomTile] && grid[bottomTile][c] > 0 && grid[bottomTile][c] < 6) {
            collision = true;
            break;
          }
        }

        if (collision) {
          if (!wasGrounded && this.vy > 3) {
            const fallImpact = Math.min(this.vy, 22);
            if (particleSystem && typeof particleSystem.emit === 'function') {
              particleSystem.emit(this.x + this.width / 2, bottomTile * TILE, Math.floor(fallImpact * 1.2), '#38bdf8');
            }
            if (fallImpact > 10 && window.triggerScreenShake) {
              window.triggerScreenShake((fallImpact - 9) * 1.5, 14);
            }
          }
          this.y = bottomTile * TILE - this.height;
          this.vy = 0;
          this.isGrounded = true;
        }
      } else if (this.vy < 0) {
        const topTile = Math.floor(this.y / TILE);
        let collision = false;

        for (let c = leftTile; c <= rightTile; c++) {
          if (grid[topTile] && grid[topTile][c] > 0 && grid[topTile][c] < 6) {
            collision = true;
            break;
          }
        }

        if (collision) {
          this.y = (topTile + 1) * TILE;
          this.vy = 0;
        }
      }
    }

    // Анимация
    if (!this.isAttacking) {
      if (!this.isGrounded) {
        this.animTimer = 0;
      } else if (Math.abs(this.vx) > 0.3) {
        this.animTimer++;
        if (this.animTimer > 5) {
          this.animFrame = (this.animFrame + 1) % 8;
          this.animTimer = 0;
        }
      } else {
        this.animTimer++;
        if (this.animTimer > 12) {
          this.animFrame = (this.animFrame + 1) % 8;
          this.animTimer = 0;
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
      const totalCols = 8;
      const totalRows = 4;
      
      const frameWidth = this.sprite.naturalWidth / totalCols;
      const frameHeight = this.sprite.naturalHeight / totalRows;
      
      let col = 0;
      let row = 0;

      if (this.isAttacking) {
        row = 3;
        col = Math.min(this.animFrame, 7);
      } else if (!this.isGrounded) {
        row = 2;
        if (this.vy < -7) col = 0;
        else if (this.vy >= -7 && this.vy < -3) col = 1;
        else if (this.vy >= -3 && this.vy < 0) col = 2;
        else if (this.vy >= 0 && this.vy < 3) col = 3;
        else if (this.vy >= 3 && this.vy < 6) col = 4;
        else if (this.vy >= 6 && this.vy < 9) col = 5;
        else if (this.vy >= 9 && this.vy < 12) col = 6;
        else col = 7;
      } else if (Math.abs(this.vx) > 0.3) {
        row = 1;
        col = this.animFrame % 8;
      } else {
        row = 0;
        col = this.animFrame % 8;
      }

      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      if (!this.facingRight) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        this.sprite,
        col * frameWidth, row * frameHeight, frameWidth, frameHeight,
        -this.width / 2 - 12, -this.height / 2 - 12, this.width + 24, this.height + 24
      );
    } else {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // ⚡ Неоновая аура вокруг персонажа, если турбо-режим активен
    if (this.isTurboActive) {
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 12;
      ctx.strokeRect(this.x - 6, this.y - 6, this.width + 12, this.height + 12);
    }

    ctx.restore();
  }
}