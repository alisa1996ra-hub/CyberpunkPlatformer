// js/biomes.js

export const BIOME_CONFIGS = {
  industrial_day: {
    name: "Industrial Sector [Day]",
    path: "industrial/day/",
    darkness: 0.0,
    flashlight: false,
    weather: "clear",
    particleColor: "#38bdf8"
  },
  industrial_night: {
    name: "Industrial Sector [Night Storm]",
    path: "industrial/night/",
    darkness: 0.9,
    flashlight: true,
    weather: "storm", // Гроза, молнии, моргающий фонарик
    particleColor: "#facc15"
  },
  factory_day: {
    name: "Factory Floor [Day]",
    path: "factory/day/",
    darkness: 0.1,
    flashlight: false,
    weather: "ash", // Тлеющий пепел
    particleColor: "#fbbf24"
  },
  factory_night: {
    name: "Factory Core [Night]",
    path: "factory/night/",
    darkness: 0.85,
    flashlight: true,
    weather: "storm",
    particleColor: "#ff4444"
  },
  power_day: {
    name: "Substation & VRU [Day]",
    path: "power/day/",
    darkness: 0.0,
    flashlight: false,
    weather: "clear",
    particleColor: "#00ffcc"
  },
  power_night: {
    name: "Substation Grid [Night]",
    path: "power/night/",
    darkness: 0.92,
    flashlight: true,
    weather: "storm",
    particleColor: "#00ffcc"
  },
  seaport_day: {
    name: "Industrial Seaport [Day]",
    path: "seaport/day/",
    darkness: 0.0,
    flashlight: false,
    weather: "clear",
    particleColor: "#38bdf8"
  },
  seaport_night: {
    name: "Seaport Docks [Night]",
    path: "seaport/night/",
    darkness: 0.88,
    flashlight: true,
    weather: "storm",
    particleColor: "#38bdf8"
  },
  exclusion_day: {
    name: "Exclusion Zone [Day]",
    path: "exclusion/day/",
    darkness: 0.2,
    flashlight: false,
    weather: "ash",
    particleColor: "#a855f7"
  },
  exclusion_night: {
    name: "Exclusion Zone [Midnight]",
    path: "exclusion/night/",
    darkness: 0.95,
    flashlight: true,
    weather: "storm",
    particleColor: "#a855f7"
  }
};
