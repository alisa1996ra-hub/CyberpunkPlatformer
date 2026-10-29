function renderLevel(ctx, levelData) {
    const { grid, biome } = levelData;
    const rows = grid.length;
    const cols = grid[0].length;

    const tileMapping = {
        1: 'ground_top',
        2: 'ground_sub',
        3: 'plat_left',
        4: 'plat_center',
        5: 'plat_right',
        6: 'liquid_top',
        7: 'liquid_body',
        8: 'decor_1',
        9: 'decor_2',
        10: 'decor_3'
    };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tileId = grid[r][c];
            if (tileId === 0) continue;

            const tileKey = tileMapping[tileId];
            const img = assetsCache[biome] ? assetsCache[biome][tileKey] : null;

            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, c * TILE, r * TILE, TILE, TILE);
            } else {
                if (tileId === 1) ctx.fillStyle = '#0ea5e9';
                else if (tileId === 2) ctx.fillStyle = '#0369a1';
                else if (tileId >= 3 && tileId <= 5) ctx.fillStyle = '#f59e0b';
                else if (tileId >= 6 && tileId <= 7) ctx.fillStyle = '#ef4444';
                else ctx.fillStyle = '#10b981'; // Цвет для декораций в фолбэке

                ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
            }
        }
    }
}
