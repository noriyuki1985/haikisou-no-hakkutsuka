// ============================================================
// 全グラフィックをコードで生成するドット絵システム
//  - プレイヤー: 手打ち16x16グリッド(3方向x2フレーム、左右反転)
//  - 敵: パラメトリック描画(2フレームで脚・回転翼・明滅が動く)
//  - タイル/アイテム: ペインタ関数 + キャッシュ
// ============================================================
"use strict";
const SPR = { player:{}, npc:{}, enemy:{}, item:{}, tileCache:{} };

function makeCtx(w, h){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
function px(ctx, x, y, col){ ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
function rect(ctx, x, y, w, h, col){ ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }

// 色操作
function shade(hex, f){
  const n = parseInt(hex.slice(1), 16);
  let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  r = clamp(Math.round(r*f),0,255); g = clamp(Math.round(g*f),0,255); b = clamp(Math.round(b*f),0,255);
  return `rgb(${r},${g},${b})`;
}

// ---------- グリッド描画 ----------
function drawGrid(grid, pal){
  const ctx = makeCtx(16, 16);
  for (let y = 0; y < grid.length; y++){
    const row = grid[y];
    for (let x = 0; x < row.length; x++){
      const ch = row[x];
      if (ch === "." ) continue;
      const col = pal[ch];
      if (col) px(ctx, x, y, col);
    }
  }
  return ctx.canvas;
}
function flipH(canvas){
  const ctx = makeCtx(canvas.width, canvas.height);
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(canvas, 0, 0);
  return ctx.canvas;
}

// ---------- プレイヤー(発掘家): フード+ゴーグル+背負い袋 ----------
const PLAYER_PAL = {
  K:"#1a1410", H:"#caa23a", h:"#8a6a26", S:"#e8b88a", E:"#2c1d12",
  G:"#3ddad7", C:"#4a4438", c:"#332f26", B:"#7a4e2c", b:"#5a3a20",
  O:"#2c2620", L:"#3a342a", W:"#fff6d8",
};
const P_DOWN_A = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHhhhhhhHK...",
"...KHGGKKGGHK...",
"...KHGWKKGWHK...",
"...KKSSSSSSKK...",
"..KBKcCCCCcKBK..",
".KBbKCCCCCCKbBK.",
".KBbKCCCCCCKbBK.",
"..KKcCCCCCCcKK..",
"....KCCKKCCK....",
"....KLLK.KLLK...",
"....KOOK.KOOK...",
"....KKK...KKK...",
];
const P_DOWN_B = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHhhhhhhHK...",
"...KHGGKKGGHK...",
"...KHGWKKGWHK...",
"...KKSSSSSSKK...",
"..KBKcCCCCcKBK..",
".KBbKCCCCCCKbBK.",
".KBbKCCCCCCKbBK.",
"..KKcCCCCCCcKK..",
"....KCCKKCCK....",
"...KLLK...KLLK..",
"...KOOK...KOOK..",
"...KKK.....KKK..",
];
const P_UP_A = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHHHHHHHHK...",
"...KHHHHHHHHK...",
"...KhhhhhhhhK...",
"...KKBBBBBBKK...",
"..KCKBbbbbBKCK..",
".KCcKBbbbbBKcCK.",
".KCcKBbbbbBKcCK.",
"..KKBBBBBBBBKK..",
"....KCCKKCCK....",
"....KLLK.KLLK...",
"....KOOK.KOOK...",
"....KKK...KKK...",
];
const P_UP_B = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHHHHHHHHK...",
"...KHHHHHHHHK...",
"...KhhhhhhhhK...",
"...KKBBBBBBKK...",
"..KCKBbbbbBKCK..",
".KCcKBbbbbBKcCK.",
".KCcKBbbbbBKcCK.",
"..KKBBBBBBBBKK..",
"....KCCKKCCK....",
"...KLLK...KLLK..",
"...KOOK...KOOK..",
"...KKK.....KKK..",
];
// 右向き
const P_SIDE_A = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHhhhhhhHK...",
"...KHHGGKGWK....",
"...KHHGGKGWK....",
"....KKSSSSKK....",
"...KBBKCCCCK....",
"..KBbbKCCCCCK...",
"..KBbbKCCCCCK...",
"...KBBcCCCCK....",
".....KCCCCK.....",
".....KLLKLLK....",
".....KOOKOOK....",
".....KKK.KKK....",
];
const P_SIDE_B = [
"................",
".....KKKKKK.....",
"....KHHHHHHK....",
"...KHHHHHHHHK...",
"...KHhhhhhhHK...",
"...KHHGGKGWK....",
"...KHHGGKGWK....",
"....KKSSSSKK....",
"...KBBKCCCCK....",
"..KBbbKCCCCCK...",
"..KBbbKCCCCCK...",
"...KBBcCCCCK....",
".....KCCCCK.....",
"....KLLK..KLK...",
"....KOOK..KOK...",
"....KKK...KK....",
];

function buildPlayerSprites(){
  const mk = g => drawGrid(g, PLAYER_PAL);
  SPR.player = {
    down: [mk(P_DOWN_A), mk(P_DOWN_B)],
    up:   [mk(P_UP_A),   mk(P_UP_B)],
    right:[mk(P_SIDE_A), mk(P_SIDE_B)],
  };
  SPR.player.left = SPR.player.right.map(flipH);
  // NPC: フード色替え
  const swap = (hood, hood2) => {
    const pal = Object.assign({}, PLAYER_PAL, { H:hood, h:hood2, G:"#857f72", W:"#d8d2c4" });
    return { down:[drawGrid(P_DOWN_A,pal), drawGrid(P_DOWN_B,pal)] };
  };
  SPR.npc = {
    elder:    swap("#b8b2a4", "#857f72"),
    mechanic: swap("#3ddad7", "#1f8a88"),
    child:    swap("#9fe08a", "#5cb85c"),
    keeper:   swap("#c08bff", "#7a4ec0"),
  };
}

// ---------- 敵(パラメトリック2フレーム) ----------
const ENEMY_PAINTERS = {
  mouse(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.3);
    rect(ctx,4,8,8,5,hue); rect(ctx,3,9,1,3,d); rect(ctx,12,9,2,1,d); // 体と尻尾線
    rect(ctx,10,6,4,4,hue); rect(ctx,13,7,1,1,"#ff5d4d");             // 頭と目
    rect(ctx,10,4,1,2,l); rect(ctx,12,4,1,2,l);                       // 耳アンテナ
    rect(ctx,14,9,1,3,d);
    if (f===0){ rect(ctx,5,13,2,2,d); rect(ctx,9,13,2,2,d); }
    else      { rect(ctx,4,13,2,2,d); rect(ctx,10,13,2,2,d); }
  },
  bit(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.4);
    const oy = f===0?0:1;
    rect(ctx,5,5+oy,6,6,hue); rect(ctx,5,5+oy,6,1,l); rect(ctx,5,10+oy,6,1,d);
    rect(ctx,7,7+oy,2,2,"#1a1410"); px(ctx,7,7+oy,"#fff6d8");
    rect(ctx,4,7+oy,1,2,d); rect(ctx,11,7+oy,1,2,d);   // 把持アーム
    rect(ctx,6,3+oy,4,1,f===0?l:d);                    // プロペラ明滅
  },
  drone(ctx, f, hue){
    const d = shade(hue,.5), l = shade(hue,1.4);
    const oy = f===0?0:1;
    if (f===0){ rect(ctx,2,3+oy,12,1,d); } else { rect(ctx,7,1+oy,1,5,d); } // ローター回転
    rect(ctx,5,5+oy,6,5,hue); rect(ctx,5,5+oy,6,1,l);
    rect(ctx,6,7+oy,4,2,"#1a1410"); rect(ctx,7,7+oy,2,1,"#ff5d4d");        // センサー
    rect(ctx,4,6+oy,1,3,d); rect(ctx,11,6+oy,1,3,d);
    rect(ctx,7,10+oy,2,2,d);                                               // 砲口
  },
  slime(ctx, f, hue){
    const d = shade(hue,.5), l = shade(hue,1.35);
    if (f===0){ rect(ctx,4,6,8,8,hue); rect(ctx,5,5,6,1,hue); rect(ctx,3,12,10,2,d); }
    else      { rect(ctx,3,8,10,6,hue); rect(ctx,4,7,8,1,hue); rect(ctx,2,12,12,2,d); }
    rect(ctx,6,8+(f===0?0:1),1,2,"#1a1410"); rect(ctx,9,8+(f===0?0:1),1,2,"#1a1410");
    px(ctx,5,6,l); px(ctx,11,9,l); px(ctx,7,12,d);
  },
  arm(ctx, f, hue){
    const d = shade(hue,.5), l = shade(hue,1.3);
    rect(ctx,4,12,8,3,"#3a3f46"); rect(ctx,4,12,8,1,"#5a626c"); // 台座
    rect(ctx,7,6,2,6,hue);                                      // 支柱
    if (f===0){ rect(ctx,8,4,6,2,hue); rect(ctx,13,3,2,2,d); rect(ctx,13,6,2,2,d); }
    else      { rect(ctx,8,3,5,2,hue); rect(ctx,12,2,2,2,d); rect(ctx,12,5,2,2,d); }
    px(ctx,8,7,"#ff5d4d"); rect(ctx,7,6,2,1,l);
  },
  boom(ctx, f, hue, st){
    const d = shade(hue,.5);
    rect(ctx,5,5,6,8,"#3a3f46"); rect(ctx,5,5,6,1,"#5a626c");
    rect(ctx,5,8,6,2,hue); rect(ctx,5,8,2,2,"#ffd24a");        // 警告帯
    px(ctx,9,8,"#ffd24a");
    const blink = (st && st.primed) ? true : f===1;
    rect(ctx,7,6,2,1, blink ? "#fff6d8" : d);
    if (st && st.primed){ ctx.globalAlpha=.5; rect(ctx,3,3,10,12,"#ff5d4d"); ctx.globalAlpha=1; }
    rect(ctx,6,13,1,2,d); rect(ctx,9,13,1,2,d);
  },
  healer(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.4);
    const oy = f===0?0:1;
    rect(ctx,5,5+oy,6,6,"#3a3f46"); rect(ctx,5,5+oy,6,1,"#5a626c");
    rect(ctx,7,6+oy,2,4,hue); rect(ctx,6,7+oy,4,2,hue);        // 十字
    px(ctx,7,7+oy,l);
    rect(ctx,4,11+oy,8,1,f===0?d:l);                            // ホバーリング
  },
  golem(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.3);
    const sh = f===0?0:1;
    rect(ctx,3,3,10,9,hue); rect(ctx,3,3,10,1,l);
    rect(ctx,1,4+sh,2,5,d); rect(ctx,13,5-sh,2,5,d);           // 肩が交互に動く
    rect(ctx,5,5,2,2,"#ff5d4d"); rect(ctx,9,5,2,2,"#ff5d4d");
    rect(ctx,4,9,8,1,d); rect(ctx,6,10,4,1,"#1a1410");
    rect(ctx,4,12,3,3,d); rect(ctx,9,12,3,3,d);
  },
  phantom(ctx, f, hue){
    ctx.globalAlpha = f===0 ? .85 : .55;
    const d = shade(hue,.5), l = shade(hue,1.4);
    rect(ctx,5,3,6,9,hue); rect(ctx,5,3,6,1,l);
    rect(ctx,6,5,1,2,"#fff6d8"); rect(ctx,9,5,1,2,"#fff6d8");
    rect(ctx,4,12,2,2,d); rect(ctx,7,13,2,2,d); rect(ctx,10,12,2,2,d); // 裾が霧散
    ctx.globalAlpha = 1;
  },
  hunter(ctx, f, hue){
    const d = shade(hue,.5), l = shade(hue,1.4);
    rect(ctx,3,7,10,4,hue); rect(ctx,3,7,10,1,l);
    rect(ctx,12,8,3,2,d);                                       // 機首
    rect(ctx,13,8,1,1,"#ff5d4d");
    rect(ctx,1,8+(f===0?0:1),2,2,f===0?"#ffd24a":d);            // スラスタ
    rect(ctx,4,11,8,1,d); rect(ctx,5,5,4,2,d);
  },
  grendel(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.35);
    const sh = f===0?0:1;
    rect(ctx,2,2,12,11,hue); rect(ctx,2,2,12,1,l);
    rect(ctx,0,3+sh,2,6,d); rect(ctx,14,4-sh,2,6,d);
    rect(ctx,4,4,3,3,"#ffd24a"); rect(ctx,9,4,3,3,"#ffd24a");
    rect(ctx,4,5,3,1,"#1a1410"); rect(ctx,9,5,3,1,"#1a1410");
    rect(ctx,3,10,10,1,d); rect(ctx,5,11,6,1,"#1a1410");
    rect(ctx,3,13,4,2,d); rect(ctx,9,13,4,2,d);
  },
  sentinel(ctx, f, hue){
    const d = shade(hue,.5), l = shade(hue,1.4);
    rect(ctx,6,2,4,12,"#3a3f46"); rect(ctx,6,2,4,1,"#5a626c");
    rect(ctx,5,4,6,4,hue); rect(ctx,5,4,6,1,l);
    rect(ctx,7,5,2,2, f===0 ? "#fff6d8" : d);                   // 単眼が明滅
    rect(ctx,4,14,8,1,d); rect(ctx,5,9,6,1,d); rect(ctx,5,11,6,1,d);
  },
  warden(ctx, f, hue){
    const d = shade(hue,.55), l = shade(hue,1.35);
    const sh = f===0?0:1;
    rect(ctx,2,1,12,12,"#2c353d"); rect(ctx,2,1,12,1,"#4a565f");
    rect(ctx,3,3,10,4,hue); rect(ctx,3,3,10,1,l);
    rect(ctx,5,4,2,2,"#3ddad7"); rect(ctx,9,4,2,2,"#3ddad7");
    rect(ctx,0,4+sh,2,7,d); rect(ctx,14,5-sh,2,7,d);
    rect(ctx,4,8,8,2,d); rect(ctx,6,9,4,1,f===0?"#3ddad7":"#1a5a58");
    rect(ctx,3,13,4,2,d); rect(ctx,9,13,4,2,d);
  },
};
function buildEnemySprites(){
  for (const id in ENEMIES){
    const def = ENEMIES[id];
    const painter = ENEMY_PAINTERS[def.body];
    SPR.enemy[id] = [0,1].map(f => {
      const ctx = makeCtx(16,16);
      painter(ctx, f, def.hue);
      return ctx.canvas;
    });
    // 自爆セルの起爆状態
    if (def.body === "boom"){
      SPR.enemy[id+"_primed"] = [0,1].map(f => {
        const ctx = makeCtx(16,16);
        painter(ctx, f, def.hue, {primed:true});
        return ctx.canvas;
      });
    }
  }
}

// ---------- アイテムアイコン ----------
const ITEM_PAINTERS = {
  ration(ctx){ rect(ctx,3,5,10,7,"#a8763a"); rect(ctx,3,5,10,2,"#caa25a"); rect(ctx,7,5,2,7,"#6a4a26"); rect(ctx,3,11,10,1,"#6a4a26"); },
  bigRation(ctx){ rect(ctx,2,4,12,9,"#a8763a"); rect(ctx,2,4,12,2,"#caa25a"); rect(ctx,6,4,4,9,"#6a4a26"); rect(ctx,2,12,12,1,"#6a4a26"); px(ctx,4,7,"#ffd98a"); },
  spray(ctx){ rect(ctx,6,5,4,8,"#d8d2c4"); rect(ctx,6,5,4,2,"#ff5d4d"); rect(ctx,7,3,2,2,"#857f72"); rect(ctx,6,9,4,2,"#ff9d8a"); },
  nano(ctx){ rect(ctx,6,4,4,9,"#8fd0ff"); rect(ctx,6,4,4,2,"#d8f0ff"); rect(ctx,7,2,2,2,"#857f72"); px(ctx,7,8,"#fff"); px(ctx,8,10,"#fff"); },
  boost(ctx){ rect(ctx,6,4,4,9,"#ff8a3d"); rect(ctx,6,4,4,2,"#ffc08a"); rect(ctx,7,2,2,2,"#857f72"); px(ctx,7,9,"#fff6d8"); },
  hardener(ctx){ rect(ctx,6,4,4,9,"#5aa0d8"); rect(ctx,6,4,4,2,"#a8d0f0"); rect(ctx,7,2,2,2,"#857f72"); px(ctx,8,9,"#fff"); },
  chip(ctx, hue){ rect(ctx,3,4,10,9,"#2c353d"); rect(ctx,3,4,10,1,"#4a565f"); rect(ctx,5,6,6,5,hue); rect(ctx,6,7,1,1,"#0a0c0e"); rect(ctx,8,9,2,1,"#0a0c0e"); rect(ctx,4,13,1,1,hue); rect(ctx,7,13,1,1,hue); rect(ctx,10,13,1,1,hue); },
  tag(ctx, hue){ rect(ctx,4,3,8,11,hue||"#ffd24a"); rect(ctx,4,3,8,2,shade(hue||"#ffd24a",1.3)); px(ctx,7,5,"#1a1410"); px(ctx,8,5,"#1a1410"); rect(ctx,6,8,4,1,"#1a1410"); rect(ctx,6,10,4,1,"#1a1410"); },
  rod(ctx){ rect(ctx,7,3,2,10,"#857f72"); rect(ctx,7,3,1,10,"#b8b2a4"); rect(ctx,6,2,4,3,"#3ddad7"); px(ctx,7,1,"#d8fffe"); rect(ctx,6,12,4,2,"#4a4438"); },
  scrap(ctx){ rect(ctx,4,7,8,5,"#8a8f96"); rect(ctx,6,5,5,3,"#6a6f76"); rect(ctx,4,7,8,1,"#b8bdc4"); px(ctx,5,9,"#b06a3a"); px(ctx,9,10,"#b06a3a"); },
  fireCell(ctx){ rect(ctx,5,4,6,9,"#d8743a"); rect(ctx,5,4,6,2,"#ffb36b"); rect(ctx,5,8,6,2,"#ffd24a"); rect(ctx,7,2,2,2,"#857f72"); px(ctx,7,9,"#1a1410"); },
  wrench(ctx){ rect(ctx,7,5,2,9,"#b8bdc4"); rect(ctx,5,2,6,4,"#b8bdc4"); rect(ctx,7,3,2,2,"#14181c"); rect(ctx,7,5,1,9,"#e0e4e8"); },
  cutter(ctx){ rect(ctx,8,2,3,8,"#d8e4ec"); rect(ctx,8,2,1,8,"#fff"); rect(ctx,7,10,4,4,"#caa23a"); rect(ctx,7,10,4,1,"#8a6a26"); },
  vibro(ctx){ rect(ctx,8,1,3,10,"#a8e0ff"); rect(ctx,8,1,1,10,"#e8f8ff"); rect(ctx,7,11,4,4,"#3a3f46"); px(ctx,9,12,"#3ddad7"); },
  vest(ctx){ rect(ctx,4,4,8,9,"#8a6a4a"); rect(ctx,4,4,2,3,"#6a4e36"); rect(ctx,10,4,2,3,"#6a4e36"); rect(ctx,7,4,2,9,"#5a3e2a"); },
  plate(ctx){ rect(ctx,4,3,8,10,"#5aa0d8"); rect(ctx,4,3,8,2,"#a8d0f0"); rect(ctx,7,6,2,5,"#2c5a80"); rect(ctx,4,12,8,1,"#2c5a80"); },
  heavy(ctx){ rect(ctx,3,3,10,11,"#6a6f76"); rect(ctx,3,3,10,2,"#a0a5ac"); rect(ctx,6,6,4,6,"#3a3f46"); px(ctx,5,5,"#ffd24a"); px(ctx,10,5,"#ffd24a"); },
  aqua(ctx){ rect(ctx,6,3,4,2,"#8ae8ff"); rect(ctx,5,5,6,6,"#3ddad7"); rect(ctx,6,11,4,2,"#1f8a88"); px(ctx,6,5,"#d8fffe"); px(ctx,7,6,"#d8fffe"); rect(ctx,4,6,1,4,"#1f8a88"); rect(ctx,11,6,1,4,"#1f8a88"); },
};
function itemSprite(itemId){
  const def = ITEMS[itemId];
  const key = def.icon + (def.hue || "");
  if (SPR.item[key]) return SPR.item[key];
  const ctx = makeCtx(16,16);
  ITEM_PAINTERS[def.icon](ctx, def.hue);
  SPR.item[key] = ctx.canvas;
  return ctx.canvas;
}

// ---------- タイル ----------
// kind: dfloor / dwall / dvoid / stairs / pedestal /
//        grass / path / vwall / vroof / water / gate / fence
function tileSprite(kind, vx, vy){
  const variant = Math.floor(tileHash(vx, vy, 7) * 4);
  const key = kind + variant;
  if (SPR.tileCache[key]) return SPR.tileCache[key];
  const S = 16, ctx = makeCtx(S, S);
  const h = (a,b,s)=>tileHash(a,b,s);
  switch(kind){
    case "dfloor": {
      rect(ctx,0,0,S,S,"#23292f");
      // パネル目地
      rect(ctx,0,0,S,1,"#1b2025"); rect(ctx,0,0,1,S,"#1b2025");
      rect(ctx,0,8,S,1,"#1e2429");
      for (let i=0;i<5;i++){
        const x=Math.floor(h(variant,i,1)*15), y=Math.floor(h(i,variant,2)*15);
        px(ctx,x,y, h(x,y,3)<.5 ? "#2a3138" : "#1e2429");
      }
      if (variant===1){ rect(ctx,3,11,5,2,"#5a3a26"); px(ctx,4,10,"#6a4530"); }   // 錆
      if (variant===2){ rect(ctx,9,3,1,9,"#33271c"); px(ctx,9,3,"#caa23a"); }     // ケーブル
      if (variant===3){ rect(ctx,2,2,4,4,"#1e2429"); rect(ctx,3,3,2,2,"#171c21"); } // グレーチング
      break;
    }
    case "dwall": {
      rect(ctx,0,0,S,6,"#3a444d");                       // 上面
      rect(ctx,0,0,S,1,"#4d5963");
      rect(ctx,0,6,S,10,"#262e35");                      // 前面
      rect(ctx,0,6,S,1,"#11151a");
      px(ctx,3,9,"#3a444d"); px(ctx,12,12,"#3a444d");    // リベット
      if (variant===1) rect(ctx,5,8,6,5,"#1e252b");      // 破損パネル
      if (variant===2){ rect(ctx,2,2,12,2,"#caa23a"); rect(ctx,4,2,2,2,"#1a1410"); rect(ctx,10,2,2,2,"#1a1410"); } // 警告帯
      break;
    }
    case "dvoid": rect(ctx,0,0,S,S,"#0a0d10"); if(variant===0)px(ctx,7,7,"#11161b"); break;
    case "stairs": {
      rect(ctx,0,0,S,S,"#11161b");
      rect(ctx,1,1,14,14,"#0a0d10");
      for (let i=0;i<3;i++) rect(ctx,3+i*2,3+i*3,10-i*4,2,"#2a3138");
      rect(ctx,6,11,4,2,"#f5a623"); rect(ctx,7,8,2,2,"#caa23a"); // 降下灯
      break;
    }
    case "pedestal": {
      rect(ctx,0,0,S,S,"#23292f");
      rect(ctx,3,5,10,8,"#3a444d"); rect(ctx,3,5,10,1,"#4d5963");
      rect(ctx,5,3,6,3,"#2c353d");
      rect(ctx,6,2,4,2,"#3ddad7"); px(ctx,7,1,"#8ae8ff");
      break;
    }
    case "grass": {
      rect(ctx,0,0,S,S,"#3c4430");
      for (let i=0;i<7;i++){
        const x=Math.floor(h(variant,i,4)*15), y=Math.floor(h(i,variant,5)*15);
        px(ctx,x,y, h(x,y,6)<.5 ? "#49543a" : "#313927");
        if (h(x,y,9)<.3) px(ctx,x,y-1>=0?y-1:0,"#566142"); // 草の立ち
      }
      if (variant===2){ px(ctx,4,6,"#caa23a"); px(ctx,11,10,"#857f72"); }
      break;
    }
    case "path": {
      rect(ctx,0,0,S,S,"#6a5b42");
      rect(ctx,0,0,S,1,"#7a6a4e"); rect(ctx,0,S-1,S,1,"#564a36");
      for (let i=0;i<6;i++){
        const x=Math.floor(h(variant,i,7)*15), y=Math.floor(h(i,variant,8)*15);
        px(ctx,x,y, h(x,y,3)<.5 ? "#594c38" : "#766548");
      }
      // 踏み固められた石
      if (variant!==0){ px(ctx,3,11,"#857257"); px(ctx,11,4,"#857257"); }
      break;
    }
    case "vwall": {
      // 家の前壁(木+トタン)
      rect(ctx,0,0,S,S,"#4a3f30");
      rect(ctx,0,0,S,6,"#6a5a44"); rect(ctx,0,0,S,1,"#8a7858");
      rect(ctx,0,6,S,1,"#2c251c");
      // 板の縦目地
      for (let x=2;x<S;x+=4) rect(ctx,x,6,1,10,"#3a3024");
      rect(ctx,2,9,3,4,"#2c241a");
      break;
    }
    case "roof": {
      // 家の屋根(トタン波板・斜め光)
      rect(ctx,0,0,S,S,"#7a4a2c");
      rect(ctx,0,0,S,1,"#9a6038");
      for (let x=0;x<S;x+=3){ rect(ctx,x,0,1,S,"#6a3f26"); rect(ctx,x+1,0,1,S,"#86532f"); }
      // 錆
      if (variant!==2){ rect(ctx,Math.floor(h(variant,1,2)*10)+2,Math.floor(h(variant,2,3)*10)+2,3,2,"#5a3520"); }
      break;
    }
    case "door": {
      // 家の入口側(屋根の軒下+扉)
      rect(ctx,0,0,S,S,"#4a3f30");
      rect(ctx,0,0,S,3,"#7a4a2c"); rect(ctx,0,0,S,1,"#9a6038"); // 軒
      rect(ctx,5,4,6,12,"#2c2018"); rect(ctx,5,4,6,1,"#5a4a36"); // 扉
      rect(ctx,6,5,4,10,"#3a2c20");
      px(ctx,9,10,"#caa23a"); // 取っ手
      // 窓の灯り
      if (variant===1){ rect(ctx,1,7,3,3,"#ffd24a"); }
      break;
    }
    case "purifier": {
      // 浄水機関(青く光る大型機械パーツ)
      rect(ctx,0,0,S,S,"#2c353d");
      rect(ctx,0,0,S,1,"#4a565f"); rect(ctx,0,0,1,S,"#3a444d");
      rect(ctx,3,3,10,10,"#3a444d"); rect(ctx,3,3,10,1,"#5a646e");
      // 配管
      rect(ctx,1,6,2,5,"#4a3f30"); rect(ctx,13,5,2,6,"#4a3f30");
      // コア窓(青)
      const glow = "#3ddad7";
      rect(ctx,6,6,4,4,glow); rect(ctx,7,7,2,2,"#8ae8ff");
      // 計器ランプ
      px(ctx,4,11, h(variant,0,1)<.5 ? "#7ed47e" : "#f5a623");
      px(ctx,11,11,"#ff5d4d");
      break;
    }
    case "well": {
      // 涸れ井戸(石組み・空)
      rect(ctx,0,0,S,S,"#3c4430");
      rect(ctx,3,3,10,10,"#6a5f4e"); rect(ctx,3,3,10,1,"#8a7d66");
      rect(ctx,5,5,6,6,"#1a1510"); // 空の井戸の底
      rect(ctx,4,4,8,1,"#564a38");
      px(ctx,6,7,"#2c2418"); px(ctx,9,9,"#2c2418");
      break;
    }
    case "crate": {
      // 木箱(物資)
      rect(ctx,0,0,S,S,"#3c4430");
      rect(ctx,2,4,12,11,"#7a5a36"); rect(ctx,2,4,12,1,"#9a7544");
      rect(ctx,2,4,1,11,"#5a4026"); rect(ctx,13,4,1,11,"#5a4026");
      rect(ctx,2,9,12,1,"#5a4026"); rect(ctx,7,4,1,11,"#5a4026");
      px(ctx,4,6,"#caa23a"); // 留め金
      break;
    }
    case "campfire": {
      // 焚き火の土台(石囲い+薪)。炎は game.js 側で動的描画
      rect(ctx,0,0,S,S,"#5a4e3a");
      // 石の輪
      for (const [sx,sy] of [[3,4],[7,3],[11,4],[12,8],[10,12],[6,12],[3,9]]) { rect(ctx,sx,sy,2,2,"#6a6055"); }
      // 薪
      rect(ctx,5,8,6,2,"#3a2c1e"); rect(ctx,6,7,5,2,"#4a3826");
      rect(ctx,7,9,3,1,"#1a1410");
      // 残り火
      px(ctx,8,9,"#ff7a3a"); px(ctx,7,10,"#ffb36b");
      break;
    }
    case "water": {
      rect(ctx,0,0,S,S,"#1d3a44");
      rect(ctx,2,4,5,1,"#2c5a66"); rect(ctx,8,10,5,1,"#2c5a66");
      px(ctx,4,8,"#3ddad7");
      break;
    }
    case "gate": {
      rect(ctx,0,0,S,S,"#23292f");
      rect(ctx,1,0,3,S,"#3a444d"); rect(ctx,12,0,3,S,"#3a444d");
      rect(ctx,4,0,8,2,"#3a444d");
      rect(ctx,5,3,6,1,"#f5a623"); rect(ctx,6,5,4,1,"#caa23a");
      rect(ctx,5,8,6,8,"#0a0d10");
      break;
    }
    case "fence": {
      rect(ctx,0,0,S,S,"#3c4430");
      rect(ctx,1,4,14,1,"#6a5a44"); rect(ctx,1,9,14,1,"#6a5a44");
      rect(ctx,3,2,2,12,"#4a3f30"); rect(ctx,11,2,2,12,"#4a3f30");
      break;
    }
  }
  SPR.tileCache[key] = ctx.canvas;
  return ctx.canvas;
}

function buildAllSprites(){
  buildPlayerSprites();
  buildEnemySprites();
}

// ============================================================
// v19: 画像アセット ↔ ゲーム要素 のマッピング層
//   画像があれば立ち絵/タイル画像を返し、なければコード生成にフォールバック
// ============================================================

// --- 敵ID → 立ち絵キャラのキー ---
const ENEMY_PORTRAIT = {
  rustMouse: "char.cleaner",      // 小型清掃機
  pickBit:   "char.sorter",       // 仕分け機(小型・近接)
  guardDrone:"char.guardian",     // 警備(遠距離)… ※下のガーディアンと差別化のため色味は別途
  slime:     "char.cleaner",      // 腐食(暫定: 清掃機を緑寄せ)
  arm:       "char.dismantler",   // 解体アーム
  boomCell:  "char.sorter",       // 自爆(仕分け機ベース)
  repairBit: "char.medic",        // 修復(医療系の見た目)
  golem:     "char.dismantler",   // ゴーレム(解体機の大型)
  phantom:   "char.hunter",       // 幻影(ハンター)
  hunter:    "char.hunter",       // 高速ハンター
  grendel:   "char.guardian",     // 重廃機(ガーディアン大型)
  sentinel:  "char.soldier",      // コアガーディアン(兵装)
  warden:    "char.guardian",     // 番人(ガーディアン・特大)
};
// 敵ごとの色味補正(同じ画像を使い回す敵を差別化するための淡い着色)
const ENEMY_TINT = {
  slime:   { color:"#7ed47e", alpha:0.30 },
  phantom: { color:"#c08bff", alpha:0.32 },
  boomCell:{ color:"#ff5d4d", alpha:0.18 },
  guardDrone:{ color:"#5aa0d8", alpha:0.16 },
  sentinel:{ color:"#3ddad7", alpha:0.18 },
  warden:  { color:"#ffd24a", alpha:0.14 },
};

// --- NPC body → 立ち絵キーは npc定義の body をそのまま使う(村人) ---
const NPC_PORTRAIT = {
  elder:    "char.logistics",   // 長老(杖を持つ logistics)
  mechanic: "char.builder",     // 機械工(builder)
  child:    "char.player_town", // 少年(発掘家の見習い・小さめ表示)
  keeper:   "char.medic",       // 記録係(medic)
};

// 着色済みキャッシュ
const _tintCache = {};
function tintedPortrait(key, tint){
  const base = ASSETS.get(key);
  if (!base) return null;
  if (!tint) return base;
  const ck = key + "|" + tint.color + "|" + tint.alpha;
  if (_tintCache[ck]) return _tintCache[ck];
  const ctx = makeCtx(base.width, base.height);
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = "source-atop"; // 不透明部分のみ着色
  ctx.globalAlpha = tint.alpha;
  ctx.fillStyle = tint.color;
  ctx.fillRect(0, 0, base.width, base.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  _tintCache[ck] = ctx.canvas;
  return ctx.canvas;
}

// プレイヤー立ち絵(集落/ダンジョンで切替)
function playerPortrait(mode){
  return ASSETS.get(mode === "village" ? "char.player_town" : "char.player_dungeon");
}
function enemyPortrait(id){
  const key = ENEMY_PORTRAIT[id] || "char.cleaner";
  return tintedPortrait(key, ENEMY_TINT[id]);
}
function npcPortrait(body){
  return ASSETS.get(NPC_PORTRAIT[body] || "char.builder");
}

// --- タイル画像(なければコード生成 tileSprite にフォールバック) ---
function floorImageFor(x, y){
  if (!ASSETS.ready) return null;
  const v = Math.floor(tileHash(x, y, 11) * 3);
  const k = ["tile.floor_a","tile.floor_b","tile.floor_c"][v];
  return ASSETS.get(k);
}
// 壁オートタイル: 4近傍(上下左右)が「歩ける床」かを見て、内壁/外壁/角/端を選び回転を返す
//  返り値: { img, rot(ラジアン) } / 画像が無ければ null(呼び出し側でコード生成へ)
function wallTile(d, x, y){
  if (!ASSETS.ready) return null;
  const isFloor = (xx, yy) => {
    if (xx < 0 || yy < 0 || xx >= d.W || yy >= d.H) return false;
    const t = d.map[yy][xx];
    return t !== T.WALL; // 床/通路/階段/台座は「開いている」
  };
  const N = isFloor(x, y-1), S = isFloor(x, y+1), E = isFloor(x+1, y), W = isFloor(x-1, y);
  const NE = isFloor(x+1,y-1), NW = isFloor(x-1,y-1), SE = isFloor(x+1,y+1), SW = isFloor(x-1,y+1);
  const openCount = (N?1:0)+(S?1:0)+(E?1:0)+(W?1:0);
  const HALF = Math.PI/2;

  // 端(行き止まりの壁: 3辺が床)→ wall_end(上が開いた向きを基準と仮定し回転)
  if (openCount >= 3){
    const img = ASSETS.get("tile.wall_end");
    if (img){
      // 唯一「閉じている」方向に背を向ける。基準: capの開口が上(N)
      let rot = 0;
      if (!N) rot = 0; else if (!S) rot = Math.PI; else if (!W) rot = -HALF; else rot = HALF;
      return { img, rot };
    }
  }
  // 外角(隣接2辺が床で、しかも隣り合う=角)→ wall_outer_corner
  // 例: N かつ E が床 → 北東が外に開いた角
  if (openCount === 2){
    const adjacent = (N&&E)||(E&&S)||(S&&W)||(W&&N);
    if (adjacent){
      const img = ASSETS.get("tile.wall_outer");
      if (img){
        // 基準: N&W が開く向きを rot=0 と仮定し、時計回りに合わせる
        let rot = 0;
        if (N && W) rot = 0;
        else if (N && E) rot = HALF;
        else if (S && E) rot = Math.PI;
        else if (S && W) rot = -HALF;
        return { img, rot };
      }
    }
    // 対向2辺(N&S または E&W)が床 = 通路状の壁 → 平壁(回転で縦横)
    const img = ASSETS.get(Math.floor(tileHash(x,y,13)*2) ? "tile.wall_a" : "tile.wall_b");
    if (img) return { img, rot: (E&&W) ? 0 : 0 };
  }
  // 内角(1辺だけ床、かつ斜めに床が無い側)→ wall_inner_corner
  if (openCount === 1){
    const img = ASSETS.get("tile.wall_inner");
    if (img){
      let rot = 0;
      if (N) rot = 0; else if (E) rot = HALF; else if (S) rot = Math.PI; else rot = -HALF;
      return { img, rot };
    }
  }
  // 周囲が壁ばかり(openCount 0)で、斜めにだけ床がある → 内角で角を埋める
  if (openCount === 0 && (NE||NW||SE||SW)){
    const img = ASSETS.get("tile.wall_inner");
    if (img){
      let rot = 0;
      if (SE) rot = 0; else if (SW) rot = HALF; else if (NW) rot = Math.PI; else rot = -HALF;
      return { img, rot };
    }
  }
  // それ以外は平壁
  const img = ASSETS.get(Math.floor(tileHash(x,y,13)*2) ? "tile.wall_a" : "tile.wall_b");
  return img ? { img, rot: 0 } : null;
}
// 後方互換(未使用化)
function wallImageFor(x, y){
  if (!ASSETS.ready) return null;
  const v = Math.floor(tileHash(x, y, 13) * 2);
  return ASSETS.get(v === 0 ? "tile.wall_a" : "tile.wall_b");
}
function stairsImage(isUp){
  return ASSETS.get(isUp ? "tile.return" : "tile.lift");
}
function pedestalImage(){ return ASSETS.get("tile.pedestal"); }

// 装飾(床に重ねる・当たり判定なし)
const DECOR_KEYS = ["decor.rust","decor.cables","decor.pipe","decor.panel","decor.scrap"];
function decorFor(x, y){
  // 一定確率でのみ装飾(ハッシュで安定)
  const h = tileHash(x, y, 23);
  if (h > 0.16) return null;             // 約16%のタイルに装飾
  const idx = Math.floor(tileHash(x, y, 29) * DECOR_KEYS.length);
  return ASSETS.get(DECOR_KEYS[idx]);
}

// アイテム種別アイコン(カテゴリ→画像)。個別アイコンはコード生成へフォールバック
const CAT_ITEM_IMG = {
  food:"item.food", med:"item.med", chip:"item.device",
  rod:"item.equip", throw:"item.tactical", weapon:"item.equip",
  armor:"item.equip", quest:"item.unknown",
};
function itemImage(itemId){
  if (!ASSETS.ready) return null;
  const def = ITEMS[itemId];
  // アクアコアは台座のコア画像が無いので unknown ではなくコード生成の aqua を使う
  if (itemId === "aquaCore") return null;
  const k = CAT_ITEM_IMG[def.cat];
  return ASSETS.get(k);
}

// 背景
function bgImage(mode){
  return ASSETS.get(mode === "village" ? "bg.village" : "bg.dungeon");
}
