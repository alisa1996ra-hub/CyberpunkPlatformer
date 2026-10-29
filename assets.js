const assetsCache = {
  common: {},
};

const biomesList = ['exclusion', 'factory', 'industrial', 'power', 'seaport'];

function loadAllAssets(onComplete) {
  let totalAssetsToLoad = 0;
  let loadedAssetsCount = 0;

  function assetLoaded() {
    loadedAssetsCount++;
    if (loadedAssetsCount >= totalAssetsToLoad) {
      console.log("✅ Все ассеты успешно загружены!");
      if (typeof onComplete === 'function') onComplete();
    }
  }

  // Общие ассеты
  const commonImages = {
    player: 'assets/common/player.png',
    coin: 'assets/common/coin.png',
    heart: 'assets/common/heart.png',
    portal: 'assets/common/portal.png'
  };

  for (let key in commonImages) {
    totalAssetsToLoad++;
    let img = new Image();
    img.src = commonImages[key];
    img.onload = assetLoaded;
    img.onerror = () => assetLoaded();
    assetsCache.common[key] = img;
  }

  // Ассеты биомов (тайлы, вода, декор и параллакс)
  biomesList.forEach(biome => {
    assetsCache[biome] = {};

    let biomeImages = {};
    const basePath = `assets/${biome}`;

    if (biome === 'industrial') {
      biomeImages = {
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

        bg_back: `${basePath}/bg_back.png`,
        bg_mid: `${basePath}/bg_mid.png`,
        bg_front: `${basePath}/bg_front.png`
      };
    } else {
      biomeImages = {
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

        bg_back_day: `${basePath}/bg_back_day.png`,
        bg_mid_day: `${basePath}/bg_mid_day.png`,
        bg_front_day: `${basePath}/bg_front_day.png`,

        bg_back_night: `${basePath}/bg_back_night.png`,
        bg_mid_night: `${basePath}/bg_mid_night.png`,
        bg_front_night: `${basePath}/bg_front_night.png`
      };
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
