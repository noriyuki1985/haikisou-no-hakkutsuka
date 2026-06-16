# assets/enemies

敵専用立ち絵の配置先。v21.5.0では `grinder.png` の暫定敵専用PNGを同梱。その他は未配置時フォールバック。

追加予定ファイル:

- cleaner.png
- collector_drone.png
- guard_drone.png
- cutter.png
- suction_unit.png
- grinder.png
- welder.png
- compressor.png
- boomcell.png
- repairbit.png
- supply_pod.png
- carrier.png
- dumper.png
- shield_deployer.png
- alarm_beacon.png
- drill_rig.png
- scout_eye.png
- magnet_unit.png
- mist_sprayer.png
- cooler.png
- camouflage_unit.png
- splitter_bit.png
- sniper_turret.png
- dismantler.png
- core_defender.png
- warden.png

上記PNGを配置すると、js/assets.js の optionalManifest と js/sprites.js の ENEMY_ART により自動的に専用画像が使われる。
未配置の場合は既存の assets/chars/* 画像と fallbackTint に戻る。

- v21.5.0: `grinder.png` の黒背景を除去し、透過PNGへ補正。`docs/grinder_cleaner_compare_v21.5.0.png` に比較画像を追加。
