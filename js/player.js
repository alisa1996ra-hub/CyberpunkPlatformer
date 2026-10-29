// js/player.js

export class Player {
  constructor(x, y, character = 'Alisa') {
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

  // Метод атаки: строго по персонажам, без случайных срабатываний
  triggerAttack(projectileManager) {
    if (this.isAttacking) return;
    
    this.isAttacking = true;
    this.animFrame = 0;
    this.animTimer = 0;

    if (!projectileManager) return;

    const spritePath = this.sprite.src;

    if (spritePath.includes('Chebur')) {
      // Чебур швыряет апельсин
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
      // Нэнси бьёт хлыстом
      projectileManager.spawn({
        type: 'whip',
        playerRef: this,
        facingRight: this.facingRight,
        config: { color: '#ec4899', secondaryColor: '#f43f5e' }
      });
    } else {
      // Алиса: Тесла-молния (только у неё!)
      projectileManager.spawn({
        type: 'tesla',
        playerRef: this,
        facingRight: this.facingRight,
        config: { color: '#38bdf8', secondaryColor: '#facc15' }
      });
    }
  }

  update(levelWidth, levelHeight, waterY, particleSystem, platformManager) {
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

    this.x += this.vx;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > levelWidth) this.x = levelWidth - this.width;

    this.vy += this.gravity;
    this.y += this.vy;

    const floorY = levelHeight - 120;
    if (this.y + this.height >= floorY) {
      if (!wasGrounded && this.vy > 3) {
        const fallImpact = Math.min(this.vy, 22);
        particleSystem.emit(this.x + this.width / 2, floorY, Math.floor(fallImpact * 1.2), '#38bdf8');

        if (fallImpact > 10 && window.triggerScreenShake) {
          window.triggerScreenShake((fallImpact - 9) * 1.5, 14);
        }
      }
      this.y = floorY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    }

    if (platformManager && platformManager.platforms) {
      for (const p of platformManager.platforms) {
        const pCurrentY = p.y + p.offsetY;
        const hitX = (this.x + this.width > p.x) && (this.x < p.x + p.width);

        if (hitX) {
          if (this.vy > 0 && (this.y + this.height - this.vy) <= pCurrentY + 6 && (this.y + this.height) >= pCurrentY) {
            this.y = pCurrentY - this.height;
            this.vy = 0;
            this.isGrounded = true;
          }
          else if (this.vy < 0 && (this.y - this.vy) >= pCurrentY + p.height - 6 && this.y <= pCurrentY + p.height) {
            this.y = pCurrentY + p.height;
            this.vy = 0;
            p.offsetY = -6; 
          }
        }
      }
    }

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

    ctx.restore();
  }
}