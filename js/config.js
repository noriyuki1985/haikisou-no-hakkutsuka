// ============================================================
// 定数・バランステーブル・アイテム/敵 定義
// ============================================================
"use strict";
const CONFIG = {
  VERSION: "v21.5.0",
  TILE: 32,            // 論理タイルサイズ(px)
  SPRITE: 16,          // ドット絵の解像度
  MAX_FLOOR: 30,       // 最深部
  INV_MAX: 12,
  STEP_MS: 125,        // 1歩のアニメ時間
  ATTACK_MS: 130,
  HUNGER_MAX: 100,
  HUNGER_TURNS: 8,     // 何ターンで満腹度1減るか
  REGEN_TURNS: 4,      // 何ターンでHP1回復するか(満腹時)
  SAVE_KEY: "hakkutsuka_v18_save",
  RECORD_KEY: "hakkutsuka_v18_record",
};

// タイル種別
const T = { WALL:0, FLOOR:1, CORRIDOR:2, STAIRS:3, PEDESTAL:4 };

// 8方向 (dx,dy)。テンキー対応: 1↙2↓3↘4←6→7↖8↑9↗
const DIRS = {
  1:[-1, 1], 2:[0, 1], 3:[1, 1],
  4:[-1, 0],           6:[1, 0],
  7:[-1,-1], 8:[0,-1], 9:[1,-1],
};

// ------------------------------------------------------------
// レベルアップ必要経験値(累積)
// ------------------------------------------------------------
const EXP_TABLE = (() => {
  const t = [0, 0];
  for (let lv = 2; lv <= 50; lv++) t[lv] = t[lv-1] + Math.floor(8 * Math.pow(lv-1, 1.65));
  return t;
})();

// ------------------------------------------------------------
// アイテム定義
//   cat: food / med / chip / rod / throw / weapon / armor / quest
// ------------------------------------------------------------
const ITEMS = {
  // --- 食料 ---
  ration:    { cat:"food", name:"圧縮レーション", desc:"満腹度が50回復する。発掘家の主食。",
               belly:50, icon:"ration" },
  bigRation: { cat:"food", name:"大型レーション", desc:"満腹度が100回復する。当たりだ。",
               belly:100, icon:"bigRation" },
  // --- 薬剤 ---
  spray:     { cat:"med", name:"止血スプレー", desc:"HPが40回復する。",
               heal:40, icon:"spray" },
  nano:      { cat:"med", name:"ナノリペア", desc:"HPが全回復し、最大HPが2上がる。",
               heal:9999, maxUp:2, icon:"nano" },
  boost:     { cat:"med", name:"ブースト剤", desc:"20ターンの間、攻撃力が1.5倍になる。",
               buff:"atk", turns:20, icon:"boost" },
  hardener:  { cat:"med", name:"硬化剤", desc:"20ターンの間、受けるダメージが半分になる。",
               buff:"def", turns:20, icon:"hardener" },
  // --- データチップ(巻物相当) ---
  chipScan:  { cat:"chip", name:"索敵チップ", desc:"この階の地形・道具・敵の位置がすべて分かる。",
               effect:"scan", icon:"chip", hue:"#3ddad7" },
  chipWarp:  { cat:"chip", name:"転移チップ", desc:"この階のどこかへ転移する。",
               effect:"warp", icon:"chip", hue:"#c08bff" },
  chipHome:  { cat:"chip", name:"帰還タグ", desc:"道具を持ったまま集落へ帰還する。命綱。",
               effect:"home", icon:"tag", hue:"#ffd24a" },
  chipForge: { cat:"chip", name:"鍛錬チップ", desc:"装備中の武器の強化値が1上がる。",
               effect:"forge", icon:"chip", hue:"#ff9a3d" },
  chipPlate: { cat:"chip", name:"装甲チップ", desc:"装備中の防具の強化値が1上がる。",
               effect:"plate", icon:"chip", hue:"#8fd0ff" },
  chipSleep: { cat:"chip", name:"休眠チップ", desc:"同じ部屋の機械をすべて5ターン停止させる。",
               effect:"sleep", icon:"chip", hue:"#9fe08a" },
  // --- 放電ロッド(杖相当) ---
  rod:       { cat:"rod", name:"放電ロッド", desc:"直線上の敵に25ダメージの電撃。残量あり。",
               dmg:25, icon:"rod" },
  // --- 投げ物 ---
  scrap:     { cat:"throw", name:"鉄くず塊", desc:"投げると15ダメージ。発掘家の基本武装。",
               dmg:15, icon:"scrap" },
  fireCell:  { cat:"throw", name:"焼夷セル", desc:"投げると着弾点の周囲を爆破する(25ダメージ)。",
               dmg:25, blast:1, icon:"fireCell" },
  // --- 武器 ---
  wrench:    { cat:"weapon", name:"パイプレンチ", desc:"頑丈な工具。攻撃+3。", atk:3, icon:"wrench" },
  cutter:    { cat:"weapon", name:"多目的カッター", desc:"よく切れる。攻撃+6。", atk:6, icon:"cutter" },
  vibroBlade:{ cat:"weapon", name:"振動ブレード", desc:"旧文明の刃。攻撃+10。", atk:10, icon:"vibro" },
  // --- 防具 ---
  vest:      { cat:"armor", name:"廃材ベスト", desc:"気休めよりは上等。防御+2。", def:2, icon:"vest" },
  plate:     { cat:"armor", name:"警備プレート", desc:"警備機の外装の流用。防御+5。", def:5, icon:"plate" },
  heavyArmor:{ cat:"armor", name:"重合金アーマー", desc:"旧文明の重装甲。防御+9。", def:9, icon:"heavy" },
  // --- クエスト ---
  aquaCore:  { cat:"quest", name:"アクアコア", desc:"浄水機関の心臓部。淡く青く脈打っている。",
               icon:"aqua" },
};
const CAT_LABEL = { food:"食料", med:"薬剤", chip:"チップ", rod:"ロッド",
                    throw:"投擲", weapon:"武器", armor:"防具", quest:"重要" };

// 階層ごとのアイテム出現テーブル [id, weight]
function itemTableFor(floor){
  const t = [
    ["ration", 16], ["scrap", 14], ["spray", 13],
    ["chipScan", 6], ["chipWarp", 5], ["chipHome", 6], ["chipSleep", 4],
    ["rod", 5], ["fireCell", 5],
  ];
  if (floor >= 2)  t.push(["wrench", 5], ["vest", 5]);
  if (floor >= 4)  t.push(["boost", 5], ["hardener", 4], ["chipForge", 4], ["chipPlate", 4]);
  if (floor >= 7)  t.push(["cutter", 4], ["plate", 4], ["bigRation", 4]);
  if (floor >= 10) t.push(["nano", 3]);
  if (floor >= 14) t.push(["vibroBlade", 3], ["heavyArmor", 3]);
  return t;
}

// ------------------------------------------------------------
// 敵定義(v21.5.0)
//   25体の軸敵 + 30F固定ラスボス。
//   今回は「名前・出現階層・役割・画像枠」の整備が目的。
//   ai は既存ロジックへ寄せる: melee / ranged / slow / kamikaze / healer / phantom / fast / boss
//   role は設計上の役割。未実装の固有挙動は role で保持し、後続バージョンでAI化する。
// ------------------------------------------------------------
const ENEMIES = {
  cleaner:       { name:"清掃機", hp:6,  atk:3,  def:0, exp:4,  ai:"melee",  role:"基本近接。低火力だが数で圧をかける", floors:[1,5],  body:"mouse",    hue:"#b06a3a" },
  collectorDrone:{ name:"回収ドローン", hp:9,  atk:4,  def:1, exp:7,  ai:"collector", speed:2, role:"落ちているアイテムを拾って逃げる。倒すと拾った物を落とす", floors:[2,8],  body:"bit",      hue:"#caa23a" },
  guardDrone:    { name:"警備ドローン", hp:13, atk:6,  def:2, exp:13, ai:"ranged", range:6, role:"遠距離射撃。射線管理を要求", floors:[3,18], body:"drone",    hue:"#5aa0d8" },
  cutter:        { name:"切断機", hp:18, atk:10, def:2, exp:18, ai:"melee",  role:"高火力近接。隣接を避けたい敵", floors:[4,12], body:"arm",      hue:"#d8743a" },
  suctionUnit:   { name:"吸引機", hp:20, atk:7,  def:2, exp:20, ai:"suction", range:4, role:"直線上の主人公を吸引して引き寄せる", floors:[5,13], body:"drone",    hue:"#8fd0ff" },

  grinder:       { name:"研磨機", hp:16, atk:7,  def:1, exp:16, ai:"melee", special:"rust", role:"装備劣化。攻撃時に武器を削る", floors:[4,14], body:"slime",    hue:"#b8b2a4" },
  welder:        { name:"溶接機", hp:22, atk:11, def:2, exp:22, ai:"ranged", range:4, role:"火花・燃焼床想定。現状は短射程射撃", floors:[6,15], body:"sentinel", hue:"#ff8a3d" },
  compressor:    { name:"圧縮機", hp:30, atk:14, def:4, exp:28, ai:"slow",   role:"ノックバック・壁衝突想定。現状は鈍足高火力", floors:[6,16], body:"golem",    hue:"#8a8f96" },
  boomCell:      { name:"自爆セル", hp:12, atk:0,  def:1, exp:18, ai:"kamikaze", blastDmg:30, role:"接近後に自爆。敵も巻き込む", floors:[7,17], body:"boom", hue:"#ff5d4d" },
  repairBit:     { name:"修復ビット", hp:14, atk:2,  def:2, exp:26, ai:"healer", healAmt:8, role:"敵回復。優先処理対象", floors:[8,30], body:"healer", hue:"#9fe08a" },

  supplyPod:     { name:"補給ポッド", hp:18, atk:3,  def:3, exp:26, ai:"buffer", buffAmt:4, buffTurns:8, role:"周囲の敵を強化する補助機", floors:[8,28], body:"healer", hue:"#ffd24a" },
  carrier:       { name:"搬送機", hp:24, atk:8,  def:3, exp:30, ai:"fast", speed:2, role:"敵や主人公の位置操作想定。現状は高速敵", floors:[9,20], body:"hunter", hue:"#caa25a" },
  dumper:        { name:"投棄機", hp:28, atk:12, def:4, exp:34, ai:"dumper", range:5, role:"廃材を投げ、着弾地点に鉄くずを残す", floors:[10,21], body:"sentinel", hue:"#a8763a" },
  shieldDeployer:{ name:"展開シールド", hp:26, atk:4,  def:6, exp:36, ai:"shielder", shieldTurns:6, role:"周囲の敵に一時シールドを張る", floors:[10,30], body:"healer", hue:"#5aa0d8" },
  alarmBeacon:   { name:"警報ビーコン", hp:20, atk:0,  def:2, exp:35, ai:"beacon", range:7, summonDelay:3, role:"発見後に警報を鳴らし増援を呼ぶ", floors:[11,28], body:"sentinel", hue:"#ff5d4d" },

  drillRig:      { name:"掘削機", hp:34, atk:15, def:5, exp:42, ai:"drill", role:"壁を破壊しながら直線突進する", floors:[12,23], body:"arm", hue:"#c46f35" },
  scoutEye:      { name:"索敵アイ", hp:18, atk:5,  def:2, exp:32, ai:"fast", speed:2, role:"敵誘導・索敵支援想定。現状は高速小型", floors:[12,30], body:"bit", hue:"#3ddad7" },
  magnetUnit:    { name:"磁力機", hp:28, atk:10, def:4, exp:44, ai:"melee", role:"金属装備干渉想定。現状は近接敵", floors:[13,27], body:"golem", hue:"#7a8fa6" },
  mistSprayer:   { name:"毒霧散布機", hp:30, atk:9,  def:3, exp:46, ai:"ranged", range:4, role:"範囲状態異常想定。現状は短射程射撃", floors:[14,30], body:"slime", hue:"#7ed47e" },
  cooler:        { name:"冷却機", hp:32, atk:10, def:5, exp:48, ai:"slow", role:"鈍足・凍結想定。現状は鈍足耐久敵", floors:[15,30], body:"sentinel", hue:"#8fd0ff" },

  camouflageUnit:{ name:"光学迷彩機", hp:30, atk:18, def:4, exp:50, ai:"phantom", role:"見えにくい奇襲。現状は転移奇襲", floors:[16,30], body:"phantom", hue:"#c08bff" },
  splitterBit:   { name:"分裂ビット", hp:24, atk:8,  def:3, exp:52, ai:"fast", speed:2, role:"増殖想定。現状は高速小型", floors:[17,30], body:"bit", hue:"#d8d2c4" },
  sniperTurret:  { name:"狙撃砲台", hp:38, atk:20, def:7, exp:70, ai:"ranged", range:8, role:"長射程固定敵想定。現状は長射程射撃", floors:[18,30], body:"sentinel", hue:"#3ddad7" },
  dismantler:    { name:"解体重機", hp:70, atk:26, def:10, exp:110, ai:"slow", role:"大型近接強敵。鈍足・高耐久・高火力", floors:[20,30], body:"grendel", hue:"#6a4a8a" },
  coreDefender:  { name:"中枢防衛機", hp:60, atk:22, def:8, exp:95, ai:"ranged", range:7, role:"終盤防衛機。射撃と支援混在の中ボス枠", floors:[25,30], body:"warden", hue:"#ffd24a" },

  // ラスボス。25体の軸敵とは別に、B30F固定配置で使用する。
  warden:        { name:"廃棄層の番人", hp:150, atk:28, def:10, exp:0, ai:"boss", range:6, role:"最深部固定ボス", floors:[30,30], body:"warden", hue:"#ffd24a" },
};

// 30階出現テーブル(v21.5.0)
// 通常枠=10、支援/低頻度=5、危険/レア=3 を目安にした明示テーブル。
const ENEMY_FLOOR_TABLE = {
  1:  [["cleaner",10]],
  2:  [["cleaner",10],["collectorDrone",10]],
  3:  [["cleaner",10],["collectorDrone",10],["guardDrone",10]],
  4:  [["cleaner",10],["guardDrone",10],["cutter",10],["grinder",5]],
  5:  [["collectorDrone",10],["guardDrone",10],["cutter",10],["grinder",5],["suctionUnit",3]],
  6:  [["cutter",10],["grinder",10],["welder",10],["guardDrone",5],["compressor",3]],
  7:  [["cutter",10],["welder",10],["boomCell",10],["suctionUnit",5],["compressor",3]],
  8:  [["welder",10],["boomCell",10],["repairBit",10],["supplyPod",5],["compressor",3]],
  9:  [["grinder",10],["boomCell",10],["carrier",10],["repairBit",5],["supplyPod",5],["compressor",3]],
  10: [["welder",10],["carrier",10],["dumper",10],["repairBit",5],["shieldDeployer",5],["boomCell",3]],
  11: [["guardDrone",10],["dumper",10],["alarmBeacon",10],["shieldDeployer",5],["boomCell",3]],
  12: [["cutter",10],["alarmBeacon",10],["drillRig",10],["scoutEye",5],["dumper",3]],
  13: [["grinder",10],["drillRig",10],["magnetUnit",10],["scoutEye",5],["alarmBeacon",3]],
  14: [["welder",10],["magnetUnit",10],["mistSprayer",10],["shieldDeployer",5],["drillRig",3]],
  15: [["compressor",10],["mistSprayer",10],["cooler",10],["supplyPod",5],["repairBit",5],["alarmBeacon",3]],
  16: [["guardDrone",10],["cooler",10],["camouflageUnit",10],["scoutEye",5],["mistSprayer",3]],
  17: [["camouflageUnit",10],["splitterBit",10],["magnetUnit",10],["repairBit",5],["cooler",3]],
  18: [["guardDrone",10],["splitterBit",10],["sniperTurret",10],["shieldDeployer",5],["camouflageUnit",3]],
  19: [["sniperTurret",10],["camouflageUnit",10],["splitterBit",10],["repairBit",5],["supplyPod",5],["mistSprayer",3]],
  20: [["drillRig",10],["sniperTurret",10],["dismantler",10],["shieldDeployer",5],["boomCell",3]],
  21: [["dismantler",10],["mistSprayer",10],["alarmBeacon",10],["repairBit",5],["shieldDeployer",5],["camouflageUnit",3]],
  22: [["dismantler",10],["drillRig",10],["magnetUnit",10],["supplyPod",5],["scoutEye",5],["sniperTurret",3]],
  23: [["drillRig",10],["cooler",10],["splitterBit",10],["repairBit",5],["dismantler",3]],
  24: [["scoutEye",10],["camouflageUnit",10],["sniperTurret",10],["shieldDeployer",5],["magnetUnit",3]],
  25: [["mistSprayer",10],["cooler",10],["dismantler",10],["repairBit",5],["supplyPod",5],["coreDefender",3]],
  26: [["camouflageUnit",10],["splitterBit",10],["sniperTurret",10],["scoutEye",5],["shieldDeployer",5],["dismantler",3]],
  27: [["splitterBit",10],["magnetUnit",10],["cooler",10],["repairBit",5],["coreDefender",3]],
  28: [["sniperTurret",10],["dismantler",10],["alarmBeacon",10],["shieldDeployer",5],["supplyPod",5],["camouflageUnit",3]],
  29: [["dismantler",10],["coreDefender",10],["splitterBit",10],["repairBit",5],["scoutEye",5],["sniperTurret",3]],
  30: [["coreDefender",10],["dismantler",10],["sniperTurret",10],["repairBit",5],["shieldDeployer",5],["splitterBit",3]],
};

function enemyTableFor(floor){
  return ENEMY_FLOOR_TABLE[floor] || [["cleaner",10]];
}
// 階層が深いほど敵が強くなる係数
function enemyScale(floor){ return 1 + Math.max(0, floor - 1) * 0.035; }

function weightedPick(table){
  let sum = 0;
  for (const [, w] of table) sum += w;
  let r = RNG.next() * sum;
  for (const [id, w] of table){ r -= w; if (r <= 0) return id; }
  return table[table.length - 1][0];
}

// ------------------------------------------------------------
// 罠
// ------------------------------------------------------------
const TRAPS = {
  mine:   { name:"地雷",       effect:"dmg",  power:12 },
  shock:  { name:"漏電パネル", effect:"stun", turns:2 },
  warp:   { name:"転移パネル", effect:"warp" },
  rust:   { name:"錆噴霧",     effect:"rust" },
  hungry: { name:"消耗フィールド", effect:"hunger", power:15 },
};

// 目的表示
function objectiveFor(state){
  if (state.mode === "village") return "▶ 東の隔壁から廃棄層へ";
  if (state.hasCore) return "▶ アクアコアを集落へ持ち帰れ";
  if (state.floor >= CONFIG.MAX_FLOOR) return "▶ アクアコアを探せ";
  return `▶ 降下リフトを探せ (B${CONFIG.MAX_FLOOR}Fを目指す)`;
}
