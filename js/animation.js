// js/animation.js

export class SpriteAnimator {
  constructor(image, frameWidth, frameHeight, totalFrames, fps = 10) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.totalFrames = totalFrames;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameInterval = 1000 / fps;
  }

  update(deltaTime = 16.6) {
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }
  }

  draw(ctx, x, y, destWidth, destHeight, rowIndex = 0) {
    if (!this.image || !this.image.complete) return;

    ctx.drawImage(
      this.image,
      this.currentFrame * this.frameWidth, // Позиция кадра по X
      rowIndex * this.frameHeight,          // Строка: 0 - монета, 1 - сердце, 2 - портал
      this.frameWidth,                      // Ширина кадра в спрайтшите (напр. 256)
      this.frameHeight,                     // Высота кадра в спрайтшите (напр. 256)
      x, y,                                 // Позиция на canvas
      destWidth, destHeight                 // Размеры отрисовки в игре
    );
  }
}
export { SpriteAnimator as AnimationController };
