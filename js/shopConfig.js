// js/shopConfig.js

export const SHOP_CONFIG = {
  // --- ВКЛАДКА 1: УЛУЧШЕНИЯ ХАРАКТЕРИСТИК ---
  upgrades: {
    maxHp: {
      id: "maxHp",
      name: "Нано-броня (HP)",
      icon: "50.png",
      baseValue: 100,
      stepValue: 10,
      basePrice: 50,
      priceMultiplier: 1.5,
      maxLevel: 10
    },
    backpack: {
      id: "backpack",
      name: "Инженерный рюкзак (Inventory)",
      icon: "46.png",
      baseValue: 4,
      stepValue: 2,
      basePrice: 100,
      priceMultiplier: 2.0,
      maxLevel: 5
    },
    attack: {
      id: "attack",
      name: "Модификатор удара (Attack)",
      icon: "41.png",
      baseValue: 10,
      stepValue: 5,
      basePrice: 75,
      priceMultiplier: 1.8,
      maxLevel: 6
    },
    maxEnergy: {
      id: "maxEnergy",
      name: "Энергоядро (Energy)",
      icon: "31.png",
      baseValue: 100,
      stepValue: 10,
      basePrice: 40,
      priceMultiplier: 1.4,
      maxLevel: 10
    },
    tradeSkill: {
      id: "tradeSkill",
      name: "Черный рынок (Курс продажи)",
      icon: "27.png",
      baseValue: 1.0,
      stepValue: 0.1,
      basePrice: 120,
      priceMultiplier: 2.2,
      maxLevel: 5
    }
  },

  // --- ВКЛАДКА 2: МАТЕРИАЛЫ И ЗАПЧАСТИ ---
  materials: {
    copper_wire: {
      id: "copper_wire",
      name: "Медный провод",
      icon: "Icon14_38.png",
      buyPrice: 15,
      sellPrice: 8
    },
    microchip: {
      id: "microchip",
      name: "Корпоративная плата",
      icon: "Icon14_32.png",
      buyPrice: 45,
      sellPrice: 25
    },
    power_cell: {
      id: "power_cell",
      name: "Энерго-элемент",
      icon: "Icon14_39.png",
      buyPrice: 80,
      sellPrice: 40
    },
    rare_alloy: {
      id: "rare_alloy",
      name: "Редкий сплав",
      icon: "Icon14_09.png",
      buyPrice: 150,
      sellPrice: 90
    }
  },

  // --- ИКОНКИ ДЛЯ ИНТЕРФЕЙСА И КНОПОК ---
  uiIcons: {
    shopExchange: "22.png",
    settings: "20.png",
    shopUpgrades: "8.png"
  }
};
