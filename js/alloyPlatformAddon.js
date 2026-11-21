// js/alloyPlatformAddon.js
(function () {
    console.log('🧩 ALLOY PLATFORM ADDON LOADED');

    const TILE = 32;
    const LOGICAL_HEIGHT = 580;

    function getCanvas() {
        return document.getElementById('gameCanvas');
    }

    function getCameraX() {
        if (typeof window.currentCameraX === 'number' && Number.isFinite(window.currentCameraX)) {
            return window.currentCameraX;
        }
        return 0;
    }

    function getAlloyList() {
        if (Array.isArray(window.alloyPlatforms)) return window.alloyPlatforms;
        if (window.currentLevelData && Array.isArray(window.currentLevelData.alloyPlatforms)) {
            window.alloyPlatforms = window.currentLevelData.alloyPlatforms;
            return window.alloyPlatforms;
        }
        return [];
    }

    function drawAddon() {
        const canvas = getCanvas();
        if (!canvas) {
            requestAnimationFrame(drawAddon);
            return;
        }

        const list = getAlloyList();
        if (list.length > 0) {
            const ctx = canvas.getContext('2d');
            const camX = getCameraX();
            const biome = window.currentLevelData?.biome || 'factory';
            const centerImg = window.assetsCache?.[biome]?.plat_center;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            for (const plat of list) {
                if (!plat) continue;
                const drawX = Math.round(plat.x - camX);
                const drawY = Math.round(plat.y);
                const drawW = plat.width || TILE * 2;
                const drawH = plat.height || TILE;

                for (let px = drawX; px < drawX + drawW; px += TILE) {
                    if (centerImg && centerImg.complete && centerImg.naturalWidth > 0) {
                        ctx.drawImage(centerImg, px, drawY, TILE, drawH);
                    } else {
                        ctx.fillStyle = '#0f766e';
                        ctx.fillRect(px, drawY, TILE, drawH);
                    }
                }

                ctx.fillStyle = 'rgba(0, 255, 204, 0.35)';
                ctx.fillRect(drawX, drawY, drawW, drawH);

                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00ffcc';
                ctx.shadowBlur = 12;
                ctx.strokeRect(drawX, drawY, drawW, drawH);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('ALLOY', drawX + 6, drawY + 14);
            }

            ctx.restore();
        }

        requestAnimationFrame(drawAddon);
    }

    requestAnimationFrame(drawAddon);
})();
