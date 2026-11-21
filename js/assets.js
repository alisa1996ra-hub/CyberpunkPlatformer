export const assetsCache = {
  common: {},
};

const biomesList = ['exclusion', 'factory', 'industrial', 'power', 'seaport'];

export function loadAllAssets(onComplete) {
  let totalAssetsToLoad = 0;
  let loadedAssetsCount = 0;

  function assetLoaded() {
    loadedAssetsCount++;
    if (loadedAssetsCount >= totalAssetsToLoad) {
      console.log("✅ Все ассеты успешно загружены!");
      if (typeof onComplete === 'function') onComplete();
    }
  }

// Реальные файлы из твоей папки assets/common/
  const commonImages = {
    alisa: 'assets/common/Alisa.png',
    chebur: 'assets/common/Chebur.png',
    nancy: 'assets/common/Nancy.png',
    spritesheet: 'assets/common/spritesheet.png',
    logo1: 'assets/common/Logo1.png',
    
    // 🪙 Чистые ключи для иконок материалов
    'Icon14_39': 'assets/common/Icon14_39.png',
    'Icon14_38': 'assets/common/Icon14_38.png',
    'Icon14_32': 'assets/common/Icon14_32.png',
    'Icon14_09': 'assets/common/Icon14_09.png',

    // Иконки магазина из конфига:
    '50': 'assets/common/50.png',
    '46': 'assets/common/46.png',
    '41': 'assets/common/41.png',
    '31': 'assets/common/31.png',
    '27': 'assets/common/27.png',
    '22': 'assets/common/22.png',
    '20': 'assets/common/20.png',
    '8': 'assets/common/8.png'
  };

  for (let key in commonImages) {
    totalAssetsToLoad++;
    let img = new Image();
    img.src = commonImages[key];
    img.onload = assetLoaded;
    img.onerror = () => assetLoaded();
    assetsCache.common[key] = img;
  }

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
      decor_1: `${basePath}/decor_1.png`,
      decor_2: `${basePath}/decor_2.png`,
      decor_3: `${basePath}/decor_3.png`,
      
      bg_background_day: `${basePath}/bg_background_day.png`,
      bg_background_night: `${basePath}/bg_background_night.png`,
    };

    // 🎯 Жестко разделяем: у industrial слои параллакса общие, у остальных — по дням и ночам
    if (biome === 'industrial') {
      biomeImages.bg_back = `${basePath}/bg_back.png`;
      biomeImages.bg_mid = `${basePath}/bg_mid.png`;
      biomeImages.bg_front = `${basePath}/bg_front.png`;
    } else {
      biomeImages.bg_back_day = `${basePath}/bg_back_day.png`;
      biomeImages.bg_mid_day = `${basePath}/bg_mid_day.png`;
      biomeImages.bg_front_day = `${basePath}/bg_front_day.png`;
      biomeImages.bg_back_night = `${basePath}/bg_back_night.png`;
      biomeImages.bg_mid_night = `${basePath}/bg_mid_night.png`;
      biomeImages.bg_front_night = `${basePath}/bg_front_night.png`;
    }

    for (let key in biomeImages) {
      totalAssetsToLoad++;
      let img = new Image();
      img.src = biomeImages[key];
      img.onload = assetLoaded;
      img.onerror = () => assetLoaded();
      assetsCache[biome][key] = img;
    }
  });
}
