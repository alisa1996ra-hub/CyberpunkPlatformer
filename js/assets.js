// js/assets.js

export const assetsCache = {
  common: {},
};

const biomesList = ['exclusion', 'factory', 'industrial', 'power', 'seaport'];

export function loadAllAssets(onProgress, onComplete) {
  let totalAssetsToLoad = 0;
  let loadedAssetsCount = 0;
  let isFinished = false;

  function finishLoading() {
    if (isFinished) return;
    isFinished = true;
    console.log("✅ Все ассеты успешно загружены!");
    if (typeof onComplete === 'function') onComplete();
  }

  function assetLoaded(assetName) {
    if (isFinished) return;
    loadedAssetsCount++;
    
    if (typeof onProgress === 'function') {
      onProgress(loadedAssetsCount, Math.max(totalAssetsToLoad, loadedAssetsCount), assetName);
    }
    
    if (loadedAssetsCount >= totalAssetsToLoad) {
      finishLoading();
    }
  }

  // Страховка от зависания сети (если какой-то файл не найден, через 3 секунды игра принудительно запустится)
  setTimeout(() => {
    if (!isFinished) {
      console.warn("⚠️ Внимание: Таймаут загрузки ассетов истек, принудительный запуск игры.");
      finishLoading();
    }
  }, 3000);

  // Общие ассеты (спрайт-шит и персонажи)
  const commonImages = {
    spritesheet: 'assets/common/spritesheet.png',
    Alisa: 'assets/common/Alisa.png',
    Chebur: 'assets/common/Chebur.png',
    Nancy: 'assets/common/Nancy.png'
  };

  for (let key in commonImages) {
    totalAssetsToLoad++;
    let img = new Image();
    const assetName = `common/${key}`;
    img.src = commonImages[key];
    img.onload = () => assetLoaded(assetName);
    img.onerror = () => {
      console.warn(`[AssetLoader] Пропущен файл: ${commonImages[key]}`);
      assetLoaded(assetName); // Не блокируем загрузку при ошибке 404
    };
    assetsCache.common[key] = img;
  }

  // Ассеты биомов
  biomesList.forEach(biome => {
    assetsCache[biome] = {};
    const basePath = `assets/${biome}`;

    let biomeImages = {
      ground_top: `${basePath}/ground_top.png`,
      ground_sub: `${basePath}/ground_sub.png`,
      plat_left: `${basePath}/plat_left.png`,
      plat_center: `${basePath}/plat_center.png`,
      plat_right: `${basePath}/plat_right.png`,
      liquid_top: `${basePath}/liquid_top.png`,
      liquid_body: `${basePath}/liquid_body.png`,
      bg_background_day: `${basePath}/bg_background_day.png`,
      bg_background_night: `${basePath}/bg_background_night.png`,
      bg_back_day: `${basePath}/bg_back_day.png`,
      bg_mid_day: `${basePath}/bg_mid_day.png`,
      bg_front_day: `${basePath}/bg_front_day.png`,
      bg_back_night: `${basePath}/bg_back_night.png`,
      bg_mid_night: `${basePath}/bg_mid_night.png`,
      bg_front_night: `${basePath}/bg_front_night.png`
    };

    for (let key in biomeImages) {
      totalAssetsToLoad++;
      let img = new Image();
      const assetName = `${biome}/${key}`;
      img.src = biomeImages[key];
      img.onload = () => assetLoaded(assetName);
      img.onerror = () => {
        assetLoaded(assetName); // Игнорируем отсутствие необязательных фонов
      };
      assetsCache[biome][key] = img;
    }
  });
}