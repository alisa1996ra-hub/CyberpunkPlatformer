import os
from pathlib import Path

# Индивидуальная карта для каждой темы с учетом реальных имен на твоих скриншотах
themes_config = {
    "factory": {
        "ground_top": ["Tile_34.png"],
        "ground_sub": ["Tile_42.png"],
        "plat_left": ["Tile_03.png"],
        "plat_center": ["Tile_02.png"],
        "plat_right": ["Tile_04.png"],
        "liquid_top": ["Tile_05.png"],
        "liquid_body": ["Tile_58.png"],
        "decor_1": ["1.png"],
        "decor_2": ["2.png"],
        "decor_3": ["3.png"],
    },
    "industrial": {
        "ground_top": ["IndustrialTile_05.png"],
        "ground_sub": ["IndustrialTile_11.png"],
        "plat_left": ["IndustrialTile_58.png"],
        "plat_center": ["IndustrialTile_59.png"],
        "plat_right": ["IndustrialTile_60.png"],
        "liquid_top": ["IndustrialTile_48.png"],
        "liquid_body": ["IndustrialTile_46.png"],
        "decor_1": ["Pointer1.png"],
        "decor_2": ["Box6.png"],
        "decor_3": ["Barrel3.png"],
    },
    "seaport": {
        "ground_top": ["Tile_02.png"],
        "ground_sub": ["Tile_07.png"],
        "plat_left": ["Tile_16.png"],
        "plat_center": ["Tile_17.png"],
        "plat_right": ["Tile_18.png"],
        "liquid_top": ["WaterTile_01.png"],
        "liquid_body": ["WaterTile_05.png"],
        "decor_1": ["14.png"],
        "decor_2": ["18.png"],
        "decor_3": ["19.png"],
    },
    "exclusion": {
        "ground_top": ["Tile_02.png"],
        "ground_sub": ["Tile_11.png"],
        "plat_left": ["Tile_23.png"],
        "plat_center": ["Tile_24.png"],
        "plat_right": ["Tile_26.png"],
        "liquid_top": ["Tile_67.png"],
        "liquid_body": ["Tile_55.png"],
        "decor_1": ["15.png"],
        "decor_2": ["6.png"],
        "decor_3": ["13.png"],
    },
    "power": {
        "ground_top": ["Tile_02.png"],
        "ground_sub": ["Tile_10.png"],
        "plat_left": ["Tile_25.png"],
        "plat_center": ["Tile_26.png"],
        "plat_right": ["Tile_27.png"],
        "liquid_top": ["Tile_49.png"],
        "liquid_body": ["Tile_46.png"],
        "decor_1": ["Tile_30.png"],
        "decor_2": ["Tile_31.png"],
        "decor_3": ["Tile_32.png"],
    },
}

assets_dir = Path("assets")

for theme, mapping in themes_config.items():
  theme_path = assets_dir / theme
  if not theme_path.exists():
    print(f"⚠️ Папка {theme_path} не найдена, пропускаем...")
    continue

  print(f"\n⚙️ Обрабатываю тему: {theme}")

  for target_name, possible_sources in mapping.items():
    found = False
    for src_name in possible_sources:
      matches = list(theme_path.rglob(src_name))
      if matches:
        src_file = matches[0]
        dst_file = theme_path / f"{target_name}.png"

        # Создаем копию файла под чистым универсальным именем прямо в корне папки темы
        dst_file.write_bytes(src_file.read_bytes())
        print(f"   ✔ {src_name} -> {target_name}")
        found = True
        break

    if not found:
      print(f"   ✖ Не найден файл для {target_name} (искали: {possible_sources})")

print(
    "\n✨ Готово! Все тайлы скопированы и приведены к единому стандарту внутри"
    " каждой папки."
)
