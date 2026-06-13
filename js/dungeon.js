// ============================================================
// ダンジョン生成(古典的な区画分割: 部屋+通路)と集落マップ
// ============================================================
"use strict";

// ---------- ダンジョン ----------
// 3x3区画。各区画に部屋または中継点を置き、隣接区画を通路で結ぶ。
function genDungeon(floor){
  const W = 42, H = 26;
  const map = new Array(H);
  for (let y = 0; y < H; y++) map[y] = new Array(W).fill(T.WALL);
  const roomId = new Array(H);
  for (let y = 0; y < H; y++) roomId[y] = new Array(W).fill(-1);

  const GX = 3, GY = 3;
  const cellW = Math.floor(W / GX), cellH = Math.floor(H / GY);
  const nodes = []; // {gx,gy,room?|point,cx,cy}
  const rooms = [];

  for (let gy = 0; gy < GY; gy++){
    for (let gx = 0; gx < GX; gx++){
      const isRoom = RNG.chance(0.82) || (gx===1 && gy===1);
      const x0 = gx*cellW, y0 = gy*cellH;
      if (isRoom){
        const rw = RNG.int(5, Math.max(6, cellW-4));
        const rh = RNG.int(4, Math.max(5, cellH-3));
        const rx = x0 + RNG.int(1, Math.max(1, cellW-rw-1));
        const ry = y0 + RNG.int(1, Math.max(1, cellH-rh-1));
        const id = rooms.length;
        rooms.push({x:rx, y:ry, w:rw, h:rh, id});
        for (let y = ry; y < ry+rh; y++)
          for (let x = rx; x < rx+rw; x++){
            map[y][x] = T.FLOOR; roomId[y][x] = id;
          }
        nodes.push({gx, gy, room:id, cx:rx+(rw>>1), cy:ry+(rh>>1)});
      } else {
        const cx = x0 + RNG.int(2, cellW-2), cy = y0 + RNG.int(2, cellH-2);
        map[cy][cx] = T.CORRIDOR;
        nodes.push({gx, gy, room:-1, cx, cy});
      }
    }
  }

  // L字通路で結ぶ
  function carve(x1, y1, x2, y2){
    let x = x1, y = y1;
    const horizFirst = RNG.chance(.5);
    const stepX = () => { while (x !== x2){ x += Math.sign(x2-x); if (map[y][x]===T.WALL) map[y][x]=T.CORRIDOR; } };
    const stepY = () => { while (y !== y2){ y += Math.sign(y2-y); if (map[y][x]===T.WALL) map[y][x]=T.CORRIDOR; } };
    if (horizFirst){ stepX(); stepY(); } else { stepY(); stepX(); }
  }
  const nodeAt = (gx,gy) => nodes[gy*GX+gx];
  // 全域木: 蛇行で確実に連結 + ランダム追加で環状路
  const order = [];
  for (let gy = 0; gy < GY; gy++){
    const row = [];
    for (let gx = 0; gx < GX; gx++) row.push([gx,gy]);
    if (gy % 2 === 1) row.reverse();
    order.push(...row);
  }
  for (let i = 1; i < order.length; i++){
    const a = nodeAt(order[i-1][0], order[i-1][1]);
    const b = nodeAt(order[i][0], order[i][1]);
    carve(a.cx, a.cy, b.cx, b.cy);
  }
  let extras = RNG.int(1, 3);
  while (extras-- > 0){
    const gx = RNG.int(0, GX-2), gy = RNG.int(0, GY-2);
    if (RNG.chance(.5)) carve(nodeAt(gx,gy).cx, nodeAt(gx,gy).cy, nodeAt(gx+1,gy).cx, nodeAt(gx+1,gy).cy);
    else carve(nodeAt(gx,gy).cx, nodeAt(gx,gy).cy, nodeAt(gx,gy+1).cx, nodeAt(gx,gy+1).cy);
  }

  // 床リスト
  const floors = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (map[y][x] === T.FLOOR) floors.push([x,y]);

  function randFloor(exclude){
    for (let i = 0; i < 300; i++){
      const [x,y] = RNG.pick(floors);
      if (exclude && exclude.some(([ex,ey]) => ex===x && ey===y)) continue;
      return [x,y];
    }
    return RNG.pick(floors);
  }

  // プレイヤー開始と階段(できるだけ別部屋)
  const startRoom = RNG.pick(rooms);
  const start = [startRoom.x + RNG.int(0,startRoom.w-1), startRoom.y + RNG.int(0,startRoom.h-1)];
  let stairs = null;
  const isLast = floor >= CONFIG.MAX_FLOOR;
  const otherRooms = rooms.filter(r => r.id !== startRoom.id);
  const targetRoom = otherRooms.length ? RNG.pick(otherRooms) : startRoom;
  const tx = targetRoom.x + RNG.int(0,targetRoom.w-1);
  const ty = targetRoom.y + RNG.int(0,targetRoom.h-1);
  if (isLast){
    map[ty][tx] = T.PEDESTAL; // 最深部: アクアコア台座
  } else {
    map[ty][tx] = T.STAIRS;
    stairs = [tx, ty];
  }

  // アイテム配置
  const groundItems = [];
  const itemCount = RNG.int(4, 7);
  const itable = itemTableFor(floor);
  for (let i = 0; i < itemCount; i++){
    const [x,y] = randFloor([start,[tx,ty]]);
    if (groundItems.some(g => g.x===x && g.y===y)) continue;
    groundItems.push({ x, y, item: makeItem(weightedPick(itable)) });
  }

  // 罠
  const traps = [];
  const trapCount = RNG.int(2, 3 + Math.floor(floor/6));
  const trapIds = Object.keys(TRAPS);
  for (let i = 0; i < trapCount; i++){
    const [x,y] = randFloor([start,[tx,ty]]);
    if (traps.some(t => t.x===x && t.y===y)) continue;
    if (groundItems.some(g => g.x===x && g.y===y)) continue;
    traps.push({ x, y, id: RNG.pick(trapIds), revealed:false });
  }

  // 敵
  const enemies = [];
  const etable = enemyTableFor(floor);
  const eCount = clamp(3 + Math.floor(floor/4), 3, 8);
  for (let i = 0; i < eCount; i++){
    const [x,y] = randFloor([start]);
    if (dist8(x,y,start[0],start[1]) < 4) { i--; continue; }
    if (enemies.some(e => e.x===x && e.y===y)) continue;
    enemies.push(makeEnemy(weightedPick(etable), x, y, floor));
  }
  if (isLast){
    // 番人を台座の傍に
    const wx = clamp(tx + RNG.pick([-2,2]), 1, W-2);
    const wy = clamp(ty + RNG.pick([-2,2]), 1, H-2);
    if (map[wy][wx] !== T.WALL) enemies.push(makeEnemy("warden", wx, wy, floor));
    else enemies.push(makeEnemy("warden", tx, clamp(ty+1,1,H-2), floor));
  }

  return { W, H, map, roomId, rooms, start, stairs, pedestal: isLast ? [tx,ty] : null,
           groundItems, traps, enemies, floor,
           explored: new Array(H).fill(0).map(()=>new Array(W).fill(false)) };
}

function makeItem(id, opts){
  const def = ITEMS[id];
  const it = { id, uid: Math.floor(RNG.next()*1e9) };
  if (def.cat === "weapon" || def.cat === "armor") it.plus = (opts && opts.plus) || 0;
  if (def.cat === "rod") it.charges = RNG.int(4, 7);
  return it;
}
function itemName(it){
  const def = ITEMS[it.id];
  let n = def.name;
  if (it.plus) n += `+${it.plus}`;
  if (it.charges != null) n += `[${it.charges}]`;
  return n;
}

function makeEnemy(id, x, y, floor){
  const def = ENEMIES[id];
  const sc = def.ai === "boss" ? 1 : enemyScale(floor);
  return {
    id, x, y,
    hp: Math.round(def.hp * sc), maxHp: Math.round(def.hp * sc),
    atk: Math.round(def.atk * sc), def: Math.round(def.def * sc),
    exp: Math.round(def.exp * sc),
    dir: 2, anim: { fx:x, fy:y, frame:0 },
    stun: 0, primed: false, awake: false,
    actGauge: 0,
  };
}

// ---------- 集落 ----------
// , 草 / . 道 / # 家壁 / ~ 井戸(涸れ) / F 柵 / G 東門 / P 浄水機 / 空白=草
const VILLAGE_LAYOUT = [
"FFFFFFFFFFFFFFFFFFFFFFFF",
"F,,,,,,,,,,,,,,,,,,,,,,F",
"F,RRRR,,,,RRRR,,,,PPPP,F",
"F,RRRR,,,,RRRR,,,,PPPP,F",
"F,#DD#,,,,#DD#,,,,PPPP,F",
"F,,..,,,,,,..,,,,,,..,,F",
"F,,........,,,,,......,F",
"F,c,,,,,,.,,**,,.,,,,c,F",
"F,,,,~~,,.,,**,,.,,,,,,F",
"F,,,,~~,,.,,,,,,.,,c,,,G",
"F,RRRR,,,........,,,,,,F",
"F,RRRR,,,.,,,,,,,RRRR,,F",
"F,#DD#,,,.,,,,,,,#DD#,,F",
"F,,..,,,,.,,,,,,,,..,,,F",
"F,,,,,,,,.,,,,c,,,,,,,,F",
"FFFFFFFFFFFFFFFFFFFFFFFF",
];
function getVillage(){
  const H = VILLAGE_LAYOUT.length, W = VILLAGE_LAYOUT[0].length;
  const map = [], kind = [];
  let start = [9, 9], gate = [W-1, 9], campfire = [11, 7];
  for (let y = 0; y < H; y++){
    map.push(new Array(W).fill(T.FLOOR));
    kind.push(new Array(W).fill("grass"));
    for (let x = 0; x < W; x++){
      const c = VILLAGE_LAYOUT[y][x];
      if (c === "F"){ map[y][x] = T.WALL; kind[y][x] = "fence"; }
      else if (c === "#"){ map[y][x] = T.WALL; kind[y][x] = "vwall"; }
      else if (c === "R"){ map[y][x] = T.WALL; kind[y][x] = "roof"; }
      else if (c === "D"){ map[y][x] = T.WALL; kind[y][x] = "door"; }
      else if (c === "P"){ map[y][x] = T.WALL; kind[y][x] = "purifier"; }
      else if (c === "~"){ map[y][x] = T.WALL; kind[y][x] = "well"; }
      else if (c === "c"){ map[y][x] = T.WALL; kind[y][x] = "crate"; }
      else if (c === "*"){ map[y][x] = T.WALL; kind[y][x] = "campfire"; }
      else if (c === "."){ kind[y][x] = "path"; }
      else if (c === "x"){ kind[y][x] = "path"; start = [x, y]; }
      else if (c === "G"){ map[y][x] = T.FLOOR; kind[y][x] = "gate"; gate = [x, y]; }
    }
  }
  // 開始位置(門へ向かう道の途中)と焚き火位置(中央広場の*ブロック)
  start = [9, 13];
  campfire = [12, 7];
  const npcs = [
    { id:"elder", name:"長老ガジュ", x:18, y:5, body:"elder",
      lines:[
        "おお、発掘家か。見ての通り、浄水機関が止まりかけておる。",
        "原動機の「アクアコア」が寿命を迎えたのじゃ。\n替えは…廃棄層の最深部、地下30階にしかない。",
        "AIどもは今も命令のままに作り、捨て続けておる。\n奴らにとって我らは、ただの障害物じゃ。気をつけよ。",
        "頼んだぞ。この集落の水は、お前さんに懸かっておる。",
      ]},
    { id:"mechanic", name:"機械工ルオ", x:3, y:6, body:"mechanic",
      lines:[
        "浄水機関、だましだまし回してるけど…もって十日ってとこ。",
        "廃棄層の機械は「敵」じゃない。ただの作業機械。\nでも作業の邪魔をする者は排除する。それだけの話。",
        "錆びた粘体に殴られると武器が腐食する。気をつけて。\n鍛錬チップがあれば直せるけどね。",
        "「帰還タグ」は必ず一枚は残しておくこと。\n深層で持ってないと…まあ、帰れないから。",
      ]},
    { id:"child", name:"少年ピノ", x:12, y:10, body:"child",
      lines:[
        "ねえねえ、廃棄層ってどんなとこ?\nぼくも大きくなったら発掘家になるんだ!",
        "おみずがないと、スープがつくれないんだって。\nはやくなんとかしてほしいなあ。",
      ]},
    { id:"keeper", name:"記録係ミレ", x:6, y:11, body:"keeper",
      lines:[
        "発掘記録はわたしが付けています。\nあなたの最深到達はタイトル画面にも残ります。",
        "倒れた発掘家の荷物は、戻ってきません。\nどうか、欲をかきすぎないで。",
        "倒れるとレベルも1からやり直しです。\nでも、装備して帰ってきたものは集落に残りますから。",
      ]},
  ];
  return { W, H, map, kind, start, gate, campfire, npcs };
}
