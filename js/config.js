// ============================================================
// 定数・バランステーブル・アイテム/敵 定義
// ============================================================
"use strict";
const CONFIG = {
  VERSION: "v19.1.0",
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
// 敵定義
//   ai: melee / ranged / slow / kamikaze / healer / phantom / fast / boss
//   special: rust(武器を錆びさせる)
// ------------------------------------------------------------
const ENEMIES = {
  rustMouse: { name:"ラストマウス", hp:6,  atk:3,  def:0, exp:4,  ai:"melee",
               floors:[1,5],  body:"mouse",  hue:"#b06a3a" },
  pickBit:   { name:"ピックビット", hp:9,  atk:5,  def:1, exp:7,  ai:"melee",
               floors:[2,7],  body:"bit",    hue:"#caa23a" },
  guardDrone:{ name:"警備ドローン", hp:13, atk:6,  def:2, exp:13, ai:"ranged", range:6,
               floors:[3,10], body:"drone",  hue:"#5aa0d8" },
  slime:     { name:"腐食粘体",     hp:16, atk:7,  def:1, exp:15, ai:"melee", special:"rust",
               floors:[4,11], body:"slime",  hue:"#7ed47e" },
  arm:       { name:"解体アーム",   hp:26, atk:14, def:3, exp:24, ai:"slow",
               floors:[6,13], body:"arm",    hue:"#d8743a" },
  boomCell:  { name:"自爆セル",     hp:12, atk:0,  def:1, exp:18, ai:"kamikaze", blastDmg:30,
               floors:[7,15], body:"boom",   hue:"#ff5d4d" },
  repairBit: { name:"修復ビット",   hp:14, atk:2,  def:2, exp:26, ai:"healer", healAmt:8,
               floors:[9,17], body:"healer", hue:"#9fe08a" },
  golem:     { name:"ジャンクゴーレム", hp:48, atk:16, def:7, exp:45, ai:"melee",
               floors:[10,19], body:"golem", hue:"#8a8f96" },
  phantom:   { name:"ファントムユニット", hp:30, atk:18, def:4, exp:50, ai:"phantom",
               floors:[13,22], body:"phantom", hue:"#c08bff" },
  hunter:    { name:"ハンターキラー", hp:38, atk:20, def:6, exp:70, ai:"fast", speed:2,
               floors:[16,26], body:"hunter", hue:"#ff8a3d" },
  grendel:   { name:"重廃機グランドル", hp:70, atk:26, def:10, exp:110, ai:"melee",
               floors:[20,29], body:"grendel", hue:"#6a4a8a" },
  sentinel:  { name:"コア・ガーディアン", hp:55, atk:22, def:8, exp:90, ai:"ranged", range:7,
               floors:[24,30], body:"sentinel", hue:"#3ddad7" },
  warden:    { name:"廃棄層の番人",  hp:150, atk:28, def:10, exp:0, ai:"boss", range:6,
               floors:[30,30], body:"warden", hue:"#ffd24a" },
};
function enemyTableFor(floor){
  const t = [];
  for (const id in ENEMIES){
    const e = ENEMIES[id];
    if (e.ai === "boss") continue;
    if (floor >= e.floors[0] && floor <= e.floors[1]) t.push([id, 10]);
  }
  return t;
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
