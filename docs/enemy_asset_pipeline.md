# 敵専用画像 組み込みメモ v21.4.1

## 方針

v21.4.1では、25体の軸敵とB30F固定ラスボスの画像受け口に加え、研磨機の暫定専用PNGを同梱した。
敵専用PNGが未配置でもゲームは起動し、既存の `assets/chars/*` 画像にフォールバックする。

## 配置先

```
assets/enemies/cleaner.png
assets/enemies/collector_drone.png
assets/enemies/guard_drone.png
assets/enemies/cutter.png
assets/enemies/suction_unit.png
assets/enemies/grinder.png
assets/enemies/welder.png
assets/enemies/compressor.png
assets/enemies/boomcell.png
assets/enemies/repairbit.png
assets/enemies/supply_pod.png
assets/enemies/carrier.png
assets/enemies/dumper.png
assets/enemies/shield_deployer.png
assets/enemies/alarm_beacon.png
assets/enemies/drill_rig.png
assets/enemies/scout_eye.png
assets/enemies/magnet_unit.png
assets/enemies/mist_sprayer.png
assets/enemies/cooler.png
assets/enemies/camouflage_unit.png
assets/enemies/splitter_bit.png
assets/enemies/sniper_turret.png
assets/enemies/dismantler.png
assets/enemies/core_defender.png
assets/enemies/warden.png
```

## 実装

- `js/config.js` の `ENEMIES` を25体の軸敵 + B30F固定ラスボスへ更新
- `js/config.js` に `ENEMY_FLOOR_TABLE` を追加
- `js/assets.js` の `optionalManifest` を25体分の敵画像枠へ拡張
- `js/sprites.js` の `ENEMY_ART` を25体分の敵画像枠へ拡張
- PNGが未配置の敵は既存の `assets/chars/*` と `fallbackTint` へ戻る

## 注意

v21.4.1時点では、序盤〜中盤の主要10種について固有行動を実装済み。残りの敵は一部既存AIまたは簡易AIに寄せている。
