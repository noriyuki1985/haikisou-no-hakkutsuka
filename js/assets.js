// ============================================================
// 画像アセットのロードと管理(v19)
//  - 立ち絵キャラ / タイル / アイテム / 背景 / エフェクト を読み込む
//  - 読み込み失敗時は sprites.js のコード生成にフォールバック
// ============================================================
"use strict";
const ASSETS = {
  img: {},          // key -> HTMLImageElement (loaded)
  ready: false,
  loaded: 0, total: 0,

  // アセット定義(パスは index.html からの相対)
  manifest: {
    // 立ち絵
    "char.player_town":   "assets/chars/player_town.png",
    "char.player_dungeon":"assets/chars/player_dungeon.png",
    "char.builder":       "assets/chars/builder.png",
    "char.medic":         "assets/chars/medic.png",
    "char.sorter":        "assets/chars/sorter.png",
    "char.logistics":     "assets/chars/logistics.png",
    "char.cleaner":       "assets/chars/cleaner.png",
    "char.dismantler":    "assets/chars/dismantler.png",
    "char.guardian":      "assets/chars/guardian.png",
    "char.hunter":        "assets/chars/hunter.png",
    "char.soldier":       "assets/chars/soldier.png",
    // タイル
    "tile.floor_a":  "assets/tiles/floor_base_a.png",
    "tile.floor_b":  "assets/tiles/floor_base_b.png",
    "tile.floor_c":  "assets/tiles/floor_base_c.png",
    "tile.wall_a":   "assets/tiles/wall_base_a.png",
    "tile.wall_b":   "assets/tiles/wall_base_b.png",
    "tile.void":     "assets/tiles/void_dark.png",
    "tile.lift":     "assets/tiles/lift_tile.png",
    "tile.return":   "assets/tiles/return_point_tile.png",
    "tile.terminal": "assets/tiles/terminal_tile.png",
    "tile.pedestal": "assets/tiles/core_pedestal_tile.png",
    "decor.rust":    "assets/tiles/decor_rust.png",
    "decor.cables":  "assets/tiles/decor_cables.png",
    "decor.pipe":    "assets/tiles/decor_pipe.png",
    "decor.panel":   "assets/tiles/decor_panel.png",
    "decor.scrap":   "assets/tiles/decor_scrap.png",
    // アイテム種別アイコン
    "item.food":     "assets/items/nutrition_block.png",
    "item.med":      "assets/items/medicine.png",
    "item.device":   "assets/items/device.png",
    "item.equip":    "assets/items/equipment.png",
    "item.tactical": "assets/items/tactical.png",
    "item.unknown":  "assets/items/unknown.png",
    // 背景
    "bg.title":   "assets/bg/title.jpg",
    "bg.village": "assets/bg/base.jpg",
    "bg.dungeon": "assets/bg/dungeon.jpg",
    // エフェクト
    "fx.slash":     "assets/fx/slash.png",
    "fx.spark":     "assets/fx/spark.png",
    "fx.laser":     "assets/fx/laser.png",
    "fx.pollution": "assets/fx/pollution.png",
    "fx.shutdown":  "assets/fx/terminal_shutdown.png",
  },

  load(onProgress){
    const keys = Object.keys(this.manifest);
    this.total = keys.length;
    this.loaded = 0;
    return new Promise(resolve => {
      if (!keys.length){ this.ready = true; resolve(); return; }
      keys.forEach(key => {
        const im = new Image();
        im.onload = () => {
          this.img[key] = im;
          this.loaded++;
          if (onProgress) onProgress(this.loaded, this.total);
          if (this.loaded >= this.total){ this.ready = true; resolve(); }
        };
        im.onerror = () => {
          // 失敗してもフォールバックがあるので続行
          this.loaded++;
          if (onProgress) onProgress(this.loaded, this.total);
          if (this.loaded >= this.total){ this.ready = true; resolve(); }
        };
        im.src = this.manifest[key];
      });
    });
  },

  has(key){ return !!this.img[key]; },
  get(key){ return this.img[key] || null; },
};
