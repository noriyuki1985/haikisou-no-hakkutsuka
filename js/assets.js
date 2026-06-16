// ============================================================
// 画像アセットのロードと管理(v21.5.0)
//  - 立ち絵キャラ / タイル / アイテム / 背景 / エフェクト を読み込む
//  - 読み込み失敗時は sprites.js のコード生成にフォールバック
// ============================================================
"use strict";
const ASSETS = {
  img: {},          // key -> HTMLImageElement (loaded)
  ready: false,
  loaded: 0, total: 0,
  missing: {},

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
    "tile.wall_inner":"assets/tiles/wall_inner_corner.png",
    "tile.wall_outer":"assets/tiles/wall_outer_corner.png",
    "tile.wall_end": "assets/tiles/wall_end_cap.png",
    "tile.wall_trans":"assets/tiles/floor_wall_transition.png",
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
    // 背景(タイトルのみ。集落はタイル構築、ダンジョンはタイル構築)
    "bg.title":   "assets/bg/title.jpg",
    // エフェクト
    "fx.slash":     "assets/fx/slash.png",
    "fx.spark":     "assets/fx/spark.png",
    "fx.laser":     "assets/fx/laser.png",
    "fx.pollution": "assets/fx/pollution.png",
    "fx.shutdown":  "assets/fx/terminal_shutdown.png",
  },

  // 将来追加する敵専用画像。未配置でも起動を止めず、sprites.js 側で既存画像へフォールバックする。
  optionalManifest: {
    "enemy.cleaner":        "assets/enemies/cleaner.png",
    "enemy.collectorDrone": "assets/enemies/collector_drone.png",
    "enemy.guardDrone":     "assets/enemies/guard_drone.png",
    "enemy.cutter":         "assets/enemies/cutter.png",
    "enemy.suctionUnit":    "assets/enemies/suction_unit.png",
    "enemy.grinder":        "assets/enemies/grinder.png",
    "enemy.welder":         "assets/enemies/welder.png",
    "enemy.compressor":     "assets/enemies/compressor.png",
    "enemy.boomCell":       "assets/enemies/boomcell.png",
    "enemy.repairBit":      "assets/enemies/repairbit.png",
    "enemy.supplyPod":      "assets/enemies/supply_pod.png",
    "enemy.carrier":        "assets/enemies/carrier.png",
    "enemy.dumper":         "assets/enemies/dumper.png",
    "enemy.shieldDeployer": "assets/enemies/shield_deployer.png",
    "enemy.alarmBeacon":    "assets/enemies/alarm_beacon.png",
    "enemy.drillRig":       "assets/enemies/drill_rig.png",
    "enemy.scoutEye":       "assets/enemies/scout_eye.png",
    "enemy.magnetUnit":     "assets/enemies/magnet_unit.png",
    "enemy.mistSprayer":    "assets/enemies/mist_sprayer.png",
    "enemy.cooler":         "assets/enemies/cooler.png",
    "enemy.camouflageUnit": "assets/enemies/camouflage_unit.png",
    "enemy.splitterBit":    "assets/enemies/splitter_bit.png",
    "enemy.sniperTurret":   "assets/enemies/sniper_turret.png",
    "enemy.dismantler":     "assets/enemies/dismantler.png",
    "enemy.coreDefender":   "assets/enemies/core_defender.png",
    "enemy.warden":         "assets/enemies/warden.png",
  },

  load(onProgress){
    const allManifest = Object.assign({}, this.manifest, this.optionalManifest || {});
    const keys = Object.keys(allManifest);
    this.total = keys.length;
    this.loaded = 0;
    this.ready = false;
    this.missing = {};
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
          this.missing[key] = true;
          this.loaded++;
          if (onProgress) onProgress(this.loaded, this.total);
          if (this.loaded >= this.total){ this.ready = true; resolve(); }
        };
        im.src = allManifest[key];
      });
    });
  },

  has(key){ return !!this.img[key]; },
  isMissing(key){ return !!this.missing[key]; },
  get(key){ return this.img[key] || null; },
};
