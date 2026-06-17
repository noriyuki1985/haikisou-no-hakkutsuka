// ============================================================
// ゲーム本体: 状態管理 / ターン制 / 戦闘 / 描画ループ
// ============================================================

"use strict";

const ENEMY_RENDER_TUNE = {
  scoutEye:       { scale: 0.98, yOffset: -0.03 },
  camouflageUnit: { scale: 1.04, yOffset: -0.02 },
  splitterBit:    { scale: 0.94, yOffset: -0.01 },
  coreDefender:   { scale: 1.12, yOffset: -0.05 },
  warden:         { scale: 1.08, yOffset: -0.06 },
};

const PLAYER_STATUS_COLORS = {
  poison: "#9de768",
  slow: "#8fd0ff",
  magnet: "#ffd24a",
};

const SPECIAL_ENEMY_SAFETY = {
  maxEnemies: 28,
  maxSplitterBits: 6,
  scoutCooldown: 4,
  camouflageCooldown: 6,
  splitterCooldown: 8,
  mistCooldown: 4,
  coolerCooldown: 5,
  magnetCooldown: 5,
};

const GAME = {

  st: null,
  canvas: null, ctx: null,
  zoom: 2,              // タイル描画倍率(16px x zoom)
  camera: { x:0, y:0, init:false },
  effects: [],
  busyUntil: 0,
  _shake: 0,
  over: false,

  // ---------------------------------------------------------
  // 起動
  // ---------------------------------------------------------
  boot(){
    buildAllSprites();
    UI.init();
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this._bindScreens();
    this._resize();
    window.addEventListener("resize", () => this._resize());
    INPUT.init(this.canvas, {
      canAct: () => this.canAct(),
      step: d => this.playerStep(d),
      dash: d => this.startDash(d),
      foot: () => this.footAction(),
      wait: () => this.waitTurn(),
      inv: () => this.openInventory(),
    });
    requestAnimationFrame(t => this._frame(t));
    // アセット読み込み → タイトルへ
    const fill = document.getElementById("loading-fill");
    const txt = document.getElementById("loading-text");
    ASSETS.load((n, total) => {
      const pct = Math.round(n/total*100);
      if (fill) fill.style.width = pct + "%";
      if (txt) txt.textContent = `アセットを読み込み中… ${pct}%`;
    }).then(() => {
      setTimeout(() => {
        const ls = document.getElementById("loading-screen");
        if (ls) ls.classList.add("hidden");
        document.getElementById("title-screen").classList.remove("hidden");
        this._refreshTitle();
      }, 200);
    });
  },

  _resize(){
    const wrap = document.getElementById("canvas-wrap");
    if (!wrap) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.dpr = dpr;
    // 横に約11タイル見える倍率(スマホ基準)、最低2倍・最大4倍
    this.zoom = clamp(Math.round(w / (16 * 11)), 2, 4);
    this.ctx.imageSmoothingEnabled = false;
  },
  get tilePx(){ return 16 * this.zoom; }, // CSSピクセルでの1タイル

  playerScreenPos(){
    const p = this.st.player;
    const t = this.tilePx;
    return {
      x: (p.anim.fx - this.camera.x) * t + this.canvas.clientWidth / 2,
      y: (p.anim.fy - this.camera.y) * t + this.canvas.clientHeight / 2,
    };
  },

  _bindScreens(){
    document.getElementById("btn-newgame").onclick = () => { AUDIO.init(); AUDIO.resume(); this.newGame(); };
    document.getElementById("btn-continue").onclick = () => { AUDIO.init(); AUDIO.resume(); this.loadGame(); };
    document.getElementById("intro-screen").onclick = () => this._introNext();
    document.getElementById("btn-inv").onclick = () => this.openInventory();
    document.getElementById("inv-close").onclick = () => UI.closeInv();
    document.getElementById("btn-foot").onclick = () => { AUDIO.init(); AUDIO.resume(); if (this.canAct()) this.footAction(); };
    document.getElementById("btn-wait").onclick = () => { if (this.canAct()) this.waitTurn(); };
    document.getElementById("btn-menu").onclick = () => { if (this.st) document.getElementById("menu-modal").classList.remove("hidden"); };
    document.getElementById("menu-close").onclick = () => document.getElementById("menu-modal").classList.add("hidden");
    document.getElementById("btn-mute").onclick = e => {
      AUDIO.init(); AUDIO.resume();
      const off = AUDIO.toggleMute();
      e.currentTarget.classList.toggle("off", off);
    };
    document.getElementById("m-help").onclick = async () => {
      document.getElementById("menu-modal").classList.add("hidden");
      await UI.dialog(
        `【操作】
行きたい方向をタップ=1歩
長押し=連続移動 / 2回タップ=ダッシュ
敵の方向をタップ=攻撃
自分をタップ or「足元」=階段・拾う

【ルール】
自分が動くと敵も動く。
満腹度が尽きるとHPが減っていく。
倒れると道具を全て失い、レベルも1に戻る。
帰還タグは命綱。最後の1枚は大事に。

【状態】
毒=ターンごとにHP減少
鈍足=ダッシュ不可
磁力干渉=装備性能が一時低下`,
        ["閉じる"]);
    };
    const enemyBookBtn = document.getElementById("m-enemybook");
    if (enemyBookBtn) enemyBookBtn.onclick = async () => {
      document.getElementById("menu-modal").classList.add("hidden");
      await this._showEnemyBook();
    };
    document.getElementById("m-record").onclick = async () => {
      document.getElementById("menu-modal").classList.add("hidden");
      const r = this._record();
      await UI.dialog(`【発掘記録】\n最深到達: B${r.bestFloor}F\n出発回数: ${r.runs}回\nアクアコア回収: ${r.clears}回`, ["閉じる"]);
    };
    document.getElementById("m-giveup").onclick = async () => {
      document.getElementById("menu-modal").classList.add("hidden");
      if (!this.st || this.st.mode !== "dungeon"){ return; }
      const a = await UI.dialog("探索をあきらめて集落へ戻る?\n(道具は持ち帰れる)", ["戻る", "やめる"]);
      if (a === 0){ this.returnHome(false); }
    };
    document.getElementById("m-title").onclick = async () => {
      document.getElementById("menu-modal").classList.add("hidden");
      if (!this.st) return;
      const inDungeon = this.st.mode === "dungeon";
      const msg = inDungeon ? "タイトルへ戻る?\n(探索中のため、この冒険は失われる)" : "タイトルへ戻る?";
      const a = await UI.dialog(msg, ["戻る", "やめる"]);
      if (a === 0){
        AUDIO.stopBgm();
        document.getElementById("game-screen").classList.add("hidden");
        document.getElementById("title-screen").classList.remove("hidden");
        this.st = null;
        this._refreshTitle();
      }
    };
    document.getElementById("talk").onclick = () => UI.talkNext();
  },

  _refreshTitle(){
    const r = this._record();
    document.getElementById("title-record").textContent =
      r.runs ? `最深到達 B${r.bestFloor}F ／ 出発 ${r.runs}回 ／ コア回収 ${r.clears}回` : "";
    let hasSave = false;
    try { hasSave = !!localStorage.getItem(CONFIG.SAVE_KEY); } catch(e){}
    document.getElementById("btn-continue").disabled = !hasSave;
  },
  _record(){
    try { return Object.assign({bestFloor:0, runs:0, clears:0}, JSON.parse(localStorage.getItem(CONFIG.RECORD_KEY) || "{}")); }
    catch(e){ return {bestFloor:0, runs:0, clears:0}; }
  },
  _saveRecord(r){ try { localStorage.setItem(CONFIG.RECORD_KEY, JSON.stringify(r)); } catch(e){} },

  // ---------------------------------------------------------
  // ニューゲーム / セーブ / ロード
  // ---------------------------------------------------------
  newGame(){
    this.over = false;
    this.st = {
      mode: "intro",
      floor: 0, hasCore: false, cleared: 0, turn: 0,
      player: this._newPlayer(),
      village: getVillage(),
      dungeon: null, visible: null,
      flags: this._defaultFlags(),
    };
    const v = this.st.village;
    this.st.player.x = v.start[0]; this.st.player.y = v.start[1];
    this.st.player.anim = { fx: v.start[0], fy: v.start[1] };
    document.getElementById("title-screen").classList.add("hidden");
    this._showIntro();
  },
  _defaultFlags(src){
    const talked = Object.assign({ elder:false, mechanic:false, keeper:false, child:false, sorter:false }, src && src.talked ? src.talked : {});
    return {
      villageGuideSeen: !!(src && src.villageGuideSeen),
      talked,
    };
  },
  _sanitizeFlags(flags){
    return this._defaultFlags(flags);
  },
  _newPlayer(){
    return {
      x:0, y:0, dir:2, lv:1, exp:0,
      hp:15, maxHp:15, belly:CONFIG.HUNGER_MAX,
      inv:[ makeItem("ration"), makeItem("spray"), makeItem("scrap"), makeItem("chipHome") ],
      weapon:null, armor:null,
      buffAtk:0, buffDef:0, stun:0,
      anim:{ fx:0, fy:0 }, lunge:null,
    };
  },
  saveGame(){
    if (!this.st || this.st.mode !== "village") return;
    const p = this.st.player;
    const data = {
      v: CONFIG.VERSION, cleared: this.st.cleared,
      player: { lv:p.lv, exp:p.exp, hp:p.hp, maxHp:p.maxHp,
                inv:p.inv, weapon:p.weapon, armor:p.armor },
      flags: this._sanitizeFlags(this.st.flags),
    };
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data)); } catch(e){}
  },
  loadGame(){
    this.over = false;
    let data = null;
    try { data = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY) || "null"); } catch(e){}
    if (!data){ this.newGame(); return; }
    this.st = {
      mode: "village",
      floor: 0, hasCore: false, cleared: data.cleared || 0, turn: 0,
      player: this._newPlayer(),
      village: getVillage(),
      dungeon: null, visible: null,
      flags: this._defaultFlags(data.flags),
    };
    Object.assign(this.st.player, data.player);
    this.st.player.poisonTurns = this.st.player.poisonTurns || 0;
    this.st.player.slowTurns = this.st.player.slowTurns || 0;
    this.st.player.magnetizedTurns = this.st.player.magnetizedTurns || 0;
    document.getElementById("title-screen").classList.add("hidden");
    this.enterVillage(true);
  },

  // ---------------------------------------------------------
  // イントロ
  // ---------------------------------------------------------
  _introPages: [
    "核の炎が世界を焼いてから、長い時が流れた。\n\n人は文明を失った。\nだが、文明の機械は止まらなかった。",
    "AIロボットは、もう誰もいない命令に従い、\n今日も何かを作り、そして捨て続ける。\n\n人々はその「ゴミの山」から\n使えそうな物を拾い、生き延びている。",
    "拾う者は「発掘家」と呼ばれた。\n\nある朝、集落の浄水機関が悲鳴を上げた。\n原動機――アクアコアの寿命だ。",
    "替えのコアは、廃棄層の最深部。\n地下30階に眠っているという。\n\n水が涸れるまで、あと十日。\n発掘家は、ひとり隔壁の前に立った。",
  ],
  _introIdx: 0,
  _showIntro(){
    this._introIdx = 0;
    document.getElementById("intro-screen").classList.remove("hidden");
    document.getElementById("intro-text").textContent = this._introPages[0];
  },
  _introNext(){
    AUDIO.init(); AUDIO.resume(); AUDIO.sfx("talk");
    this._introIdx++;
    if (this._introIdx < this._introPages.length){
      document.getElementById("intro-text").textContent = this._introPages[this._introIdx];
    } else {
      document.getElementById("intro-screen").classList.add("hidden");
      this.enterVillage(true);
    }
  },

  // ---------------------------------------------------------
  // 集落
  // ---------------------------------------------------------
  enterVillage(first){
    const st = this.st;
    st.mode = "village";
    st.floor = 0;
    st.dungeon = null;
    const v = st.village;
    st.player.x = v.start[0]; st.player.y = v.start[1];
    st.player.anim.fx = st.player.x; st.player.anim.fy = st.player.y;
    st.player.hp = st.player.maxHp;
    st.player.belly = CONFIG.HUNGER_MAX;
    st.player.buffAtk = 0; st.player.buffDef = 0; st.player.stun = 0;
    st.player.poisonTurns = 0; st.player.slowTurns = 0; st.player.magnetizedTurns = 0;
    this.camera.init = false;
    this.effects = [];
    document.getElementById("game-screen").classList.remove("hidden");
    this._resize();
    UI.clearLog();
    UI.updateHud(st);
    UI.drawMinimap(st);
    UI.banner("集 落", "SETTLEMENT");
    AUDIO.playBgm("village");
    if (first) this._showVillageGuide();
    else if (st.flags && st.flags.talked && st.flags.talked.elder) UI.log("東の隔壁の先が、廃棄層だ。", "sys");
    this.saveGame();
    this._refreshTitle();
  },

  _showVillageGuide(){
    const st = this.st;
    if (!st.flags) st.flags = this._defaultFlags();
    if (!st.flags.talked.elder){
      if (!st.flags.villageGuideSeen){
        UI.log("▼ が出た村人にぶつかると会話できる。", "sys");
        UI.log("まずは中央広場の長老ガジュに話しかけよう。", "sys");
      } else {
        UI.log("まずは中央広場の長老ガジュに話しかけよう。", "sys");
      }
    } else {
      UI.log("東の隔壁の先が、廃棄層だ。", "sys");
    }
    st.flags.villageGuideSeen = true;
  },

  _villageObjectiveNpcId(){
    const flags = this.st && this.st.flags;
    return flags && flags.talked && !flags.talked.elder ? "elder" : null;
  },

  async _confirmDive(){
    const a = await UI.dialog("東の隔壁。この先は廃棄層だ。\n入るか?", ["入る", "やめる"]);
    if (a === 0){
      this.saveGame();
      AUDIO.sfx("stairs");
      this.enterFloor(1);
    }
  },

  _talkNpc(npc){
    const st = this.st;
    st.player.dir = this._dirTo(st.player.x, st.player.y, npc.x, npc.y);
    let lines = npc.lines;
    if (npc.id === "elder" && st.cleared > 0){
      lines = ["おお…水だ。本当に水が戻った。\nお前さんは集落の恩人じゃ。",
               "じゃが廃棄層はまだ広い。\nお前さんの腕なら、もっと深くまで行けるじゃろう。"];
    }
    this._activeTalkNpcId = npc.id;
    UI.talk(npc.name, lines).then(() => {
      if (!st.flags) st.flags = this._defaultFlags();
      st.flags.talked[npc.id] = true;
      this._activeTalkNpcId = null;
      UI.updateHud(st);
      this.saveGame();
    });
  },
  _dirTo(x1,y1,x2,y2){
    const dx = Math.sign(x2-x1), dy = Math.sign(y2-y1);
    for (const k in DIRS){ if (DIRS[k][0]===dx && DIRS[k][1]===dy) return parseInt(k,10); }
    return 2;
  },

  // ---------------------------------------------------------
  // ダンジョン突入・降下
  // ---------------------------------------------------------
  enterFloor(floor){
    const st = this.st;
    st.mode = "dungeon";
    st.floor = floor;
    st.dungeon = genDungeon(floor);
    const d = st.dungeon;
    st.player.x = d.start[0]; st.player.y = d.start[1];
    st.player.anim.fx = st.player.x; st.player.anim.fy = st.player.y;
    this.camera.init = false;
    this.effects = [];
    st.player.poisonTurns = Math.max(0, st.player.poisonTurns || 0);
    st.player.slowTurns = Math.max(0, st.player.slowTurns || 0);
    st.player.magnetizedTurns = Math.max(0, st.player.magnetizedTurns || 0);
    this._computeVisibility();
    UI.updateHud(st);
    UI.drawMinimap(st);
    UI.banner(`廃棄層 B${floor}F`, floor >= CONFIG.MAX_FLOOR ? "― 最深部 ―" : "DEPTH REGISTER");
    AUDIO.playBgm(AUDIO.bgmForFloor(floor));
    if (floor === 1){
      const r = this._record(); r.runs++; this._saveRecord(r);
      UI.log("隔壁が背後で閉じた。前へ進むしかない。", "warn");
    }
    if (floor >= CONFIG.MAX_FLOOR) UI.log("空気が重い…この階のどこかにアクアコアが。", "sys");
    const r = this._record();
    if (floor > r.bestFloor){ r.bestFloor = floor; this._saveRecord(r); }
  },

  // ---------------------------------------------------------
  // 行動可否
  // ---------------------------------------------------------
  canAct(){
    if (!this.st || this.over) return false;
    if (this.st.mode !== "village" && this.st.mode !== "dungeon") return false;
    if (UI.talking || UI.invOpen) return false;
    if (!document.getElementById("dialog").classList.contains("hidden")) return false;
    if (!document.getElementById("dir-overlay").classList.contains("hidden")) return false;
    if (!document.getElementById("menu-modal").classList.contains("hidden")) return false;
    if (performance.now() < this.busyUntil) return false;
    return true;
  },
  _busy(ms){ this.busyUntil = performance.now() + ms; },

  // ---------------------------------------------------------
  // プレイヤー行動
  // ---------------------------------------------------------
  playerStep(dir, fromDash){
    const st = this.st, p = st.player;
    const [dx, dy] = DIRS[dir];
    p.dir = dir;
    if (p.stun > 0){
      UI.log("体がしびれて動けない!", "warn");
      this._endPlayerTurn();
      return false;
    }
    const nx = p.x + dx, ny = p.y + dy;

    if (st.mode === "village"){
      const v = st.village;
      const npc = v.npcs.find(n => n.x === nx && n.y === ny);
      if (npc){ this._talkNpc(npc); return false; }
      if (nx === v.gate[0] && ny === v.gate[1]){ this._confirmDive(); return false; }
      if (!this._walkable(nx, ny)) return false;
      this._movePlayerTo(nx, ny);
      this._busy(CONFIG.STEP_MS);
      return true;
    }

    // ダンジョン
    const d = st.dungeon;
    const enemy = d.enemies.find(e => e.x === nx && e.y === ny);
    if (enemy){
      if (fromDash) return false;
      this.playerAttack(enemy);
      return false;
    }
    if (!this._walkable(nx, ny)) return false;
    if (dx !== 0 && dy !== 0){ // 斜め移動は角を抜けられない
      if (!this._walkable(p.x + dx, p.y) || !this._walkable(p.x, p.y + dy)) return false;
    }
    this._movePlayerTo(nx, ny);
    this._afterPlayerMove();
    this._endPlayerTurn();
    return true;
  },

  // ---- ダッシュ: 何かあるまで連続前進 ----
  startDash(dir){
    const st = this.st;
    if (st.mode !== "dungeon"){ this.playerStep(dir); return; }
    if (st.player.slowTurns > 0){
      UI.log("冷却ダメージで動きが鈍い。ダッシュできない!", "warn");
      this.playerStep(dir);
      return;
    }
    const run = () => {
      if (!this.st || this.over) return;
      if (UI.talking || UI.invOpen) return;
      const p = this.st.player, d = this.st.dungeon;
      // 敵が見えていたら止まる
      if (this._anyEnemyVisible()) return;
      const moved = this.playerStep(dir, true);
      if (!moved) return;
      // 停止条件: 足元に何かある / 部屋の出入り / 通路の分岐 / HP危険
      if (d.map[p.y][p.x] === T.STAIRS || d.map[p.y][p.x] === T.PEDESTAL) return;
      if (d.groundItems.some(g => g.x===p.x && g.y===p.y)) return;
      if (d.traps.some(t => t.revealed && t.x===p.x && t.y===p.y)) return;
      if (p.hp <= p.maxHp * .25) return;
      const inRoom = d.roomId[p.y][p.x] >= 0;
      const [dx,dy] = DIRS[dir];
      const aheadRoom = this._walkable(p.x+dx, p.y+dy) ? (d.roomId[p.y+dy] ? d.roomId[p.y+dy][p.x+dx] : -1) : -2;
      if (inRoom !== (aheadRoom >= 0)) return;           // 部屋⇔通路の境界
      if (!inRoom && this._openNeighbors(p.x,p.y) >= 3) return; // 分岐
      if (this._anyEnemyVisible()) return;
      setTimeout(run, 70);
    };
    run();
  },
  _openNeighbors(x, y){
    let n = 0;
    for (const k of [2,4,6,8]){
      const [dx,dy] = DIRS[k];
      if (this._walkable(x+dx, y+dy)) n++;
    }
    return n;
  },
  _anyEnemyVisible(){
    const st = this.st;
    if (!st.dungeon || !st.visible) return false;
    return st.dungeon.enemies.some(e => st.visible[e.y] && st.visible[e.y][e.x]);
  },

  _walkable(x, y){
    const st = this.st;
    if (st.mode === "village"){
      const v = st.village;
      if (x < 0 || y < 0 || x >= v.W || y >= v.H) return false;
      if (v.map[y][x] === T.WALL) return false;
      if (v.npcs.some(n => n.x === x && n.y === y)) return false;
      return true;
    }
    const d = st.dungeon;
    if (!d || x < 0 || y < 0 || x >= d.W || y >= d.H) return false;
    return d.map[y][x] !== T.WALL;
  },

  _movePlayerTo(nx, ny){
    const p = this.st.player;
    p.x = nx; p.y = ny;
  },

  _afterPlayerMove(){
    const st = this.st, p = st.player, d = st.dungeon;
    this._computeVisibility();
    // ロボットステーション起動判定(部屋に入った瞬間)
    if (d.station && !d.station.triggered){
      const rid = d.roomId[p.y][p.x];
      if (rid >= 0 && rid === d.station.roomId){
        this._triggerStation();
      }
    }
    const gi = d.groundItems.find(g => g.x === p.x && g.y === p.y);
    if (gi) this._pickup(gi);
    const trap = d.traps.find(t => t.x === p.x && t.y === p.y);
    if (trap) this._stepTrap(trap);
    if (d.pedestal && p.x === d.pedestal[0] && p.y === d.pedestal[1] && !st.hasCore){
      this._takeCore();
    }
    if (d.map[p.y] && d.map[p.y][p.x] === T.STAIRS){
      UI.log(d.liftUp ? "帰還リフトだ。(自分をタップで帰還)" : "降下リフトだ。(自分をタップで降りる)", "sys");
    }
  },

  _triggerStation(){
    const st = this.st, d = st.dungeon;
    d.station.triggered = true;
    let n = 0;
    for (const e of d.enemies){
      if (e.station){ e.awake = true; n++; }
    }
    AUDIO.sfx("alarm");
    this._stationFlash = performance.now();
    UI.banner("警 報", "ROBOT STATION — 機械が一斉起動", 1700);
    UI.log(`ロボットステーション! ${n}体の機械が一斉に動き出した!`, "warn");
  },

  _pickup(gi){
    const st = this.st, p = st.player, d = st.dungeon;
    if (p.inv.length >= CONFIG.INV_MAX){
      UI.log(`${itemName(gi.item)} の上に乗った。(持ち物がいっぱい)`, "item");
      return;
    }
    p.inv.push(gi.item);
    d.groundItems.splice(d.groundItems.indexOf(gi), 1);
    UI.log(`${itemName(gi.item)} を拾った。`, "item");
    AUDIO.sfx("pickup");
    UI.updateHud(st);
  },

  _randomFloorTile(){
    const d = this.st.dungeon;
    for (let i = 0; i < 400; i++){
      const x = RNG.int(1, d.W-2), y = RNG.int(1, d.H-2);
      if (d.map[y][x] === T.FLOOR && !d.enemies.some(e=>e.x===x&&e.y===y)) return [x,y];
    }
    return [this.st.player.x, this.st.player.y];
  },

  _stepTrap(trap){
    const st = this.st, p = st.player;
    const trigger = trap.revealed ? RNG.chance(.3) : RNG.chance(.9);
    trap.revealed = true;
    if (!trigger){ UI.log(`${TRAPS[trap.id].name}を踏んだが、作動しなかった。`, "sys"); return; }
    const def = TRAPS[trap.id];
    AUDIO.sfx("trap");
    switch(def.effect){
      case "dmg": {
        const dmg = def.power + Math.floor(st.floor/3);
        this._addBoom(p.x, p.y);
        UI.log(`地雷だ!`, "warn");
        AUDIO.sfx("boom");
        this._damagePlayer(dmg, "地雷");
        break;
      }
      case "stun":
        p.stun = def.turns;
        UI.log("漏電パネル! 体がしびれた!", "warn");
        break;
      case "warp": {
        AUDIO.sfx("warp");
        const [x,y] = this._randomFloorTile();
        p.x = x; p.y = y; p.anim.fx = x; p.anim.fy = y;
        this.camera.init = false;
        this._computeVisibility();
        UI.log("転移パネル! どこかへ飛ばされた!", "warn");
        break;
      }
      case "rust": {
        const w = p.inv.find(i => i.uid === p.weapon);
        if (w && (w.plus||0) > -3){ w.plus = (w.plus||0) - 1; AUDIO.sfx("rust"); UI.log(`錆噴霧! ${ITEMS[w.id].name}が錆びた…`, "warn"); }
        else UI.log("錆噴霧を浴びたが、何ともなかった。", "sys");
        break;
      }
      case "hunger":
        p.belly = Math.max(0, p.belly - def.power);
        UI.log("消耗フィールド! 急に腹が減った…", "warn");
        break;
    }
    UI.updateHud(st);
  },

  _takeCore(){
    const st = this.st, d = st.dungeon;
    st.hasCore = true;
    st.player.inv.push(makeItem("aquaCore"));
    AUDIO.sfx("core");
    UI.banner("アクアコア 回収", "TARGET SECURED", 1600);
    UI.log("アクアコアを手に入れた! 青く脈打っている。", "good");
    d.map[d.pedestal[1]][d.pedestal[0]] = T.STAIRS;
    d.liftUp = true;
    d.liftPos = [d.pedestal[0], d.pedestal[1]];
    d.pedestal = null;
    UI.log("台座の機構が組み変わり、帰還リフトが起動した!", "sys");
    UI.updateHud(st);
  },

  // ---------------------------------------------------------
  // 足元 / 待機
  // ---------------------------------------------------------
  async footAction(){
    const st = this.st, p = st.player;
    if (st.mode === "village"){
      const v = st.village;
      // 隣にNPCがいれば話す(向いている方優先)
      const adj = v.npcs.find(n => dist8(n.x,n.y,p.x,p.y) === 1);
      if (adj){ this._talkNpc(adj); return; }
      if (dist8(v.gate[0], v.gate[1], p.x, p.y) <= 1){ this._confirmDive(); return; }
      UI.log("足元には何もない。");
      return;
    }
    const d = st.dungeon;
    const t = d.map[p.y][p.x];
    if (t === T.STAIRS){
      if (d.liftUp){
        const a = await UI.dialog("帰還リフトが待機している。\n地上へ帰還する?", ["帰還する", "まだだ"]);
        if (a === 0) this._victory();
      } else {
        const a = await UI.dialog(`降下リフト。\nB${st.floor+1}Fへ降りる?`, ["降りる", "やめる"]);
        if (a === 0){
          AUDIO.sfx("stairs");
          this.enterFloor(st.floor + 1);
        }
      }
      return;
    }
    const gi = d.groundItems.find(g => g.x === p.x && g.y === p.y);
    if (gi){
      if (p.inv.length >= CONFIG.INV_MAX){ UI.log("持ち物がいっぱいだ。", "warn"); AUDIO.sfx("deny"); return; }
      this._pickup(gi);
      this._endPlayerTurn();
      return;
    }
    this.waitTurn();
  },

  waitTurn(){
    if (this.st.mode !== "dungeon"){ return; }
    this._endPlayerTurn();
  },

  // ---------------------------------------------------------
  // 攻撃・戦闘
  // ---------------------------------------------------------
  playerAttack(enemy){
    const st = this.st, p = st.player;
    p.lunge = { dir: p.dir, t0: performance.now() };
    this._addMeleeArc(p.x, p.y, enemy.x, enemy.y, "#fff6d8", true);
    AUDIO.sfx("swing");
    if (RNG.chance(.08)){
      UI.log("攻撃をはずした!");
      AUDIO.sfx("miss");
      this._addMeleeArc(p.x, p.y, enemy.x, enemy.y, "#857f72", false);
      this._addPop(enemy.x, enemy.y, "miss", "#857f72");
      this._endPlayerTurn(CONFIG.ATTACK_MS);
      return;
    }
    const dmg = this._calcDamage(this._playerAtk(), this._enemyDef(enemy));
    setTimeout(() => AUDIO.sfx("hit"), 60);
    enemy.hp -= dmg;
    enemy.awake = true;
    this._addFlash(enemy);
    this._addHitImpact(enemy.x, enemy.y, "#fff6d8");
    this._addPop(enemy.x, enemy.y, dmg, "#fff6d8");
    if (enemy.hp <= 0){
      this._killEnemy(enemy, true);
    } else {
      UI.log(`${ENEMIES[enemy.id].name}に ${dmg} のダメージ。`);
    }
    this._endPlayerTurn(CONFIG.ATTACK_MS);
  },

  _playerAtk(){
    const p = this.st.player;
    let atk = 3 + Math.floor(p.lv * 1.3);
    const w = p.inv.find(i => i.uid === p.weapon);
    if (w) atk += ITEMS[w.id].atk + (w.plus || 0);
    if (p.buffAtk > 0) atk = Math.round(atk * 1.5);
    if (p.magnetizedTurns > 0) atk = Math.max(1, atk - 2);
    return atk;
  },
  _playerDef(){
    const p = this.st.player;
    let def = 0;
    const a = p.inv.find(i => i.uid === p.armor);
    if (a) def += ITEMS[a.id].def + (a.plus || 0);
    if (p.magnetizedTurns > 0) def = Math.max(0, def - 1);
    return def;
  },
  _calcDamage(atk, def){
    const r = 0.9 + RNG.next() * 0.25;
    return Math.max(1, Math.round(atk * r - def * 0.6));
  },

  _killEnemy(enemy, byPlayer){
    const st = this.st, d = st.dungeon;
    const idx = d.enemies.indexOf(enemy);
    if (idx >= 0) d.enemies.splice(idx, 1);
    this._addBurst(enemy.x, enemy.y, ENEMIES[enemy.id].hue);
    AUDIO.sfx("kill");
    UI.log(`${ENEMIES[enemy.id].name}を破壊した!`, "good");
    if (byPlayer && enemy.exp > 0) this._gainExp(enemy.exp);
    if (enemy.carryItem){
      const canDrop = !d.groundItems.some(g => g.x===enemy.x && g.y===enemy.y) && d.map[enemy.y][enemy.x] !== T.STAIRS && d.map[enemy.y][enemy.x] !== T.PEDESTAL;
      if (canDrop){
        d.groundItems.push({ x:enemy.x, y:enemy.y, item:enemy.carryItem });
        UI.log(`${ENEMIES[enemy.id].name}が回収していた${itemName(enemy.carryItem)}を落とした。`, "item");
      }
    }
    if (ENEMIES[enemy.id].ai === "boss"){
      UI.banner("番人 撃破", "WARDEN DOWN", 1500);
    }
  },

  _gainExp(exp){
    const p = this.st.player;
    p.exp += exp;
    this._addPop(p.x, p.y - 0.4, `+${exp}`, "#9fe08a");
    while (p.lv < 50 && p.exp >= EXP_TABLE[p.lv + 1]){
      p.lv++;
      p.maxHp += 5;
      p.hp = Math.min(p.maxHp, p.hp + 5);
      AUDIO.sfx("lvup");
      UI.log(`レベル ${p.lv} に上がった! 最大HP+5`, "good");
    }
    UI.updateHud(this.st);
  },

  _damagePlayer(dmg, srcName){
    const st = this.st, p = st.player;
    if (p.buffDef > 0) dmg = Math.max(1, Math.round(dmg / 2));
    p.hp -= dmg;
    p.hurtAt = performance.now();
    AUDIO.sfx("hurt");
    this._addHitImpact(p.x, p.y, "#ff9d8a");
    this._addPop(p.x, p.y, dmg, "#ff9d8a");
    this._shake = performance.now();
    UI.updateHud(st);
    if (p.hp <= 0){
      p.hp = 0;
      this._gameOver(srcName);
      return true;
    }
    return false;
  },

  // ---------------------------------------------------------
  // ターン経過
  // ---------------------------------------------------------
  _endPlayerTurn(animMs){
    const st = this.st;
    st.turn++;
    if (st.mode === "dungeon") this._enemiesAct();
    if (this.over) return;
    this._tickStatus();
    UI.updateHud(st);
    UI.drawMinimap(st);
    this._busy(animMs || CONFIG.STEP_MS);
  },

  _tickStatus(){
    const st = this.st, p = st.player;
    if (st.mode !== "dungeon") return;
    if (p.stun > 0) p.stun--;
    if (p.poisonTurns > 0){
      p.poisonTurns--;
      if (this._damagePlayer(1, "毒霧")) return;
      this._addPop(p.x, p.y - 0.28, "毒", PLAYER_STATUS_COLORS.poison);
      if (p.poisonTurns === 0) UI.log("毒霧の侵食が止まった。", "sys");
    }
    if (p.slowTurns > 0){
      p.slowTurns--;
      if (p.slowTurns === 0) UI.log("冷気の鈍りが解けた。", "sys");
    }
    if (p.magnetizedTurns > 0){
      p.magnetizedTurns--;
      if (p.magnetizedTurns === 0) UI.log("磁力干渉が収まり、装備が元に戻った。", "sys");
    }
    if (p.buffAtk > 0){ p.buffAtk--; if (p.buffAtk === 0) UI.log("ブースト剤が切れた。", "sys"); }
    if (p.buffDef > 0){ p.buffDef--; if (p.buffDef === 0) UI.log("硬化剤が切れた。", "sys"); }
    if (st.turn % CONFIG.HUNGER_TURNS === 0 && p.belly > 0){
      p.belly--;
      if (p.belly === 20) UI.log("腹が減ってきた…。", "warn");
      if (p.belly === 0)  UI.log("腹ぺこだ! HPが減っていく!", "warn");
    }
    if (p.belly <= 0){
      this._damagePlayer(1, "飢え");
    } else if (st.turn % CONFIG.REGEN_TURNS === 0 && p.hp < p.maxHp){
      p.hp = Math.min(p.maxHp, p.hp + Math.max(1, Math.round(p.maxHp/60)));
    }
  },

  // ---------------------------------------------------------
  // 敵AI
  // ---------------------------------------------------------
  _enemiesAct(){
    const st = this.st, d = st.dungeon;
    for (const e of d.enemies.slice()){
      if (this.over) return;
      if (e.hp <= 0) continue;
      const def = ENEMIES[e.id];
      if (!def) continue;
      if (e.stun > 0){ e.stun--; continue; }
      if (e.shieldTurns > 0) e.shieldTurns--;
      if (e.buffTurns > 0) e.buffTurns--;
      // 鈍足: 1ターンおき / 倍速: speed回行動
      let acts = 1;
      if (def.ai === "slow"){ e.actGauge ^= 1; if (!e.actGauge) continue; }
      if (def.speed) acts = Math.min(2, def.speed);
      for (let a = 0; a < acts; a++){
        if (this.over || e.hp <= 0) break;
        this._enemyActOnce(e, def);
      }
    }
  },

  _enemyActOnce(e, def){
    const st = this.st, d = st.dungeon, p = st.player;
    const dist = dist8(e.x, e.y, p.x, p.y);
    const sameRoom = d.roomId[e.y][e.x] >= 0 && d.roomId[e.y][e.x] === d.roomId[p.y][p.x];
    const sees = sameRoom || dist <= 5 || e.awake;
    if (sees) e.awake = true;

    // 回収ドローン: アイテムを拾って逃げる。倒すと拾った物を落とす。
    if (def.ai === "collector"){
      if (e.carryItem){
        if (dist <= 6){ this._enemyFlee(e); return; }
        this._enemyWander(e); return;
      }
      const picked = this._collectorTryPick(e, def);
      if (picked) return;
      const target = this._collectorFindTarget(e);
      if (target){ this._enemyMoveToward(e, target.x, target.y); return; }
      if (dist <= 2){ this._enemyFlee(e); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 吸引機: 直線上の主人公を引き寄せる。
    if (def.ai === "suction"){
      if (sees && this._trySuction(e, def)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // v22.1.2: 特殊敵は通常AIに落ちる前に、安全化した専用挙動を試す。
    if (e.id === "scoutEye"){
      if (this._tryScoutScan(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }
    if (e.id === "camouflageUnit"){
      if (this._tryCamouflageWarp(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }
    if (e.id === "splitterBit"){
      if (this._trySplitterSpawn(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }
    if (e.id === "mistSprayer"){
      if (this._tryMistSpray(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }
    if (e.id === "cooler"){
      if (this._tryCoolBlast(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }
    if (e.id === "magnetUnit"){
      if (this._tryMagnetPulse(e, def, sees)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e); else this._enemyWander(e);
      return;
    }

    // 自爆セル: 2カウントで爆発。敵も巻き込む。
    if (def.ai === "kamikaze"){
      if (e.primed){
        e.boomTimer = Math.max(0, (e.boomTimer ?? 2) - 1);
        if (e.boomTimer <= 0){ this._explodeEnemy(e, def); return; }
        this._addPop(e.x, e.y, e.boomTimer, "#ff5d4d");
        if (st.visible[e.y][e.x]) UI.log(`${def.name}の自爆カウント ${e.boomTimer}`, "warn");
        return;
      }
      if (dist <= 1){
        e.primed = true;
        e.boomTimer = 2;
        UI.log(`${def.name}が赤く明滅している…!`, "warn");
        AUDIO.sfx("trap");
        return;
      }
      if (sees){ this._enemyChase(e); }
      else this._enemyWander(e);
      return;
    }

    // 修復ビット: HP割合が最も低い味方を優先修復。
    if (def.ai === "healer"){
      const ally = this._findRepairTarget(e, 3);
      if (ally){
        const amt = def.healAmt || 8;
        ally.hp = Math.min(ally.maxHp, ally.hp + amt);
        this._addPop(ally.x, ally.y, `+${amt}`, "#9fe08a");
        if (st.visible[e.y][e.x]) UI.log(`${def.name}が${ENEMIES[ally.id].name}を修復した。`);
        return;
      }
      if (dist <= 2){ this._enemyFlee(e); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 補給ポッド: 周囲の敵を強化。
    if (def.ai === "buffer"){
      const ally = this._findBuffTarget(e, 3);
      if (ally){
        ally.buffTurns = def.buffTurns || 8;
        ally.buffAmt = def.buffAmt || 4;
        this._addPop(ally.x, ally.y, "強化", "#ffd24a");
        this._addSupplyFx(e.x, e.y, ally.x, ally.y);
        if (st.visible[e.y][e.x]) UI.log(`${def.name}が${ENEMIES[ally.id].name}を補給強化した。`, "warn");
        return;
      }
      if (dist <= 2){ this._enemyFlee(e); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 展開シールド: 周囲の敵に一時シールド。
    if (def.ai === "shielder"){
      const ally = this._findShieldTarget(e, 3);
      if (ally){
        ally.shieldTurns = def.shieldTurns || 6;
        this._addPop(ally.x, ally.y, "盾", "#8fd0ff");
        this._addShieldCastFx(e.x, e.y, ally.x, ally.y);
        if (st.visible[e.y][e.x]) UI.log(`${def.name}が${ENEMIES[ally.id].name}にシールドを展開した。`, "warn");
        return;
      }
      if (dist <= 2){ this._enemyFlee(e); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 警報ビーコン: 見つかると警報カウント後に増援を呼ぶ。
    if (def.ai === "beacon"){
      if (sees){
        e.alarmCharge = (e.alarmCharge || 0) + 1;
        if (e.alarmCharge >= (def.summonDelay || 3)){
          e.alarmCharge = 0;
          const n = this._summonEnemiesNear(e.x, e.y, 2);
          if (n > 0){
            AUDIO.sfx("alarm");
            this._addAlarmFx(e.x, e.y, true);
            UI.log(`${def.name}が警報を発した! 増援${n}体が起動。`, "warn");
            return;
          }
        } else if (st.visible[e.y][e.x]){
          this._addPop(e.x, e.y, "警報", "#ff5d4d");
          this._addAlarmFx(e.x, e.y, false);
        }
      }
      if (dist <= 2){ this._enemyFlee(e); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 投棄機: 廃材を投げる。着弾付近に鉄くずを残す。
    if (def.ai === "dumper" && sees){
      const line = this._lineToPlayer(e, def.range || 5);
      if (line){
        this._addProj(e.x, e.y, p.x, p.y, "#caa25a", itemSprite("scrap"));
        AUDIO.sfx("throw");
        const dmg = this._calcDamage(this._enemyAtk(e, def), this._playerDef());
        UI.log(`${def.name}が廃材を投げた! ${dmg}のダメージ!`, "dmg");
        this._damagePlayer(dmg, def.name);
        this._addScrapImpactFx(p.x, p.y);
        if (this._dropScrapNear(p.x, p.y)) this._addPop(p.x, p.y, "散乱", "#caa25a");
        return;
      }
    }

    // 掘削機: 直線上なら壁を壊しながら突進。
    if (def.ai === "drill"){
      if (sees && this._tryDrillMove(e, def)) return;
      if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){ this._enemyMelee(e, def); return; }
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 光学迷彩系の保険。専用処理に入らなかった場合は通常追跡に落とす。
    if (def.ai === "phantom"){
      if (sees) this._enemyChase(e);
      else this._enemyWander(e);
      return;
    }

    // 遠距離(警備ドローン / 狙撃砲台 / 中枢防衛機 / 番人)
    if ((def.ai === "ranged" || def.ai === "boss") && sees){
      const line = this._lineToPlayer(e, def.range || 6);
      if (line){
        this._addProj(e.x, e.y, p.x, p.y, "#8ad0ff");
        AUDIO.sfx("zap");
        const dmg = this._calcDamage(this._enemyAtk(e, def), this._playerDef());
        if (st.visible[e.y][e.x]) UI.log(`${def.name}の光弾! ${dmg}のダメージ!`, "dmg");
        this._damagePlayer(dmg, def.name);
        return;
      }
    }

    // 近接
    if (dist <= 1 && this._canMeleeFrom(e.x, e.y)){
      this._enemyMelee(e, def);
      return;
    }
    if (sees) this._enemyChase(e);
    else this._enemyWander(e);
  },

  _enemyAtk(e, def){
    return e.atk + ((e.buffTurns > 0) ? (e.buffAmt || 4) : 0);
  },

  _enemyDef(e){
    return e.def + ((e.shieldTurns > 0) ? 6 : 0) + ((e.buffTurns > 0) ? Math.ceil((e.buffAmt || 4) / 2) : 0);
  },

  _collectorTryPick(e, def){
    const d = this.st.dungeon;
    const gi = d.groundItems.find(g => dist8(g.x,g.y,e.x,e.y) <= 1);
    if (!gi) return false;
    e.carryItem = gi.item;
    d.groundItems.splice(d.groundItems.indexOf(gi), 1);
    this._addPop(e.x, e.y, "回収", "#ffd24a");
    if (this.st.visible[e.y][e.x]) UI.log(`${def.name}が${itemName(gi.item)}を回収した!`, "warn");
    AUDIO.sfx("pickup");
    return true;
  },

  _collectorFindTarget(e){
    const d = this.st.dungeon;
    let best = null;
    for (const gi of d.groundItems){
      const dd = dist8(gi.x, gi.y, e.x, e.y);
      if (dd > 8) continue;
      if (!best || dd < best.d) best = { x:gi.x, y:gi.y, d:dd };
    }
    return best;
  },

  _enemyMoveToward(e, tx, ty){
    const cands = [];
    for (const k in DIRS){
      const [dx,dy] = DIRS[k];
      const x = e.x+dx, y = e.y+dy;
      if (!this._enemyWalkable(e, x, y, dx, dy)) continue;
      cands.push([dist8(x,y,tx,ty), x, y]);
    }
    if (!cands.length) return false;
    cands.sort((a,b)=>a[0]-b[0]);
    e.x = cands[0][1]; e.y = cands[0][2];
    return true;
  },

  _trySuction(e, def){
    const st = this.st, p = st.player;
    const dx = Math.sign(e.x - p.x), dy = Math.sign(e.y - p.y);
    const adx = Math.abs(e.x - p.x), ady = Math.abs(e.y - p.y);
    if (!(e.x === p.x || e.y === p.y || adx === ady)) return false;
    if (Math.max(adx, ady) < 2 || Math.max(adx, ady) > (def.range || 4)) return false;
    if (!this._clearLine(p.x, p.y, e.x, e.y)) return false;
    const nx = p.x + dx, ny = p.y + dy;
    if (!this._walkable(nx, ny)) return false;
    if (st.dungeon.enemies.some(o => o.x === nx && o.y === ny)) return false;
    p.x = nx; p.y = ny; p.anim.fx = nx; p.anim.fy = ny;
    this._addProj(e.x, e.y, p.x, p.y, "#8fd0ff");
    this._addPop(p.x, p.y, "吸引", "#8fd0ff");
    UI.log(`${def.name}が吸引した!`, "warn");
    AUDIO.sfx("zap");
    this._afterPlayerMove();
    return true;
  },

  _clearLine(x1, y1, x2, y2){
    const d = this.st.dungeon;
    const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
    let x = x1 + dx, y = y1 + dy;
    while (!(x === x2 && y === y2)){
      if (d.map[y][x] === T.WALL) return false;
      x += dx; y += dy;
    }
    return true;
  },


_findOpenCellsAround(x, y, minDist){
  const d = this.st.dungeon;
  const cells = [];
  for (const k in DIRS){
    const [dx, dy] = DIRS[k];
    const xx = x + dx, yy = y + dy;
    if (!this._walkable(xx, yy)) continue;
    if (d.enemies.some(o => o.x === xx && o.y === yy)) continue;
    if (xx === this.st.player.x && yy === this.st.player.y) continue;
    if (minDist != null && dist8(xx, yy, x, y) < minDist) continue;
    cells.push([xx, yy]);
  }
  return cells;
},

_addScoutScanFx(x, y, found){
  this.effects.push({ type:"scanPulse", x, y, found:!!found, t0:performance.now(), dur: found ? 540 : 420 });
},
_addAppearFx(x, y){
  this.effects.push({ type:"appearPulse", x, y, t0:performance.now(), dur:360 });
},
_addSplitFx(x, y){
  this.effects.push({ type:"splitPulse", x, y, t0:performance.now(), dur:420 });
},
_addMistFx(x, y){
  this.effects.push({ type:"mistCloud", x, y, t0:performance.now(), dur:560 });
},
_addColdFx(x, y){
  this.effects.push({ type:"coldPulse", x, y, t0:performance.now(), dur:520 });
},
_addMagnetFx(x1, y1, x2, y2){
  this.effects.push({ type:"magnetBeam", x1, y1, x2, y2, t0:performance.now(), dur:260 });
  this.effects.push({ type:"magnetPulse", x:x2, y:y2, t0:performance.now(), dur:460 });
},

_tryScoutScan(e, def, sees){
  if (!sees) return false;
  e.scanCd = Math.max(0, e.scanCd || 0);
  if (e.scanCd > 0){ e.scanCd--; return false; }
  const p = this.st.player;
  const found = dist8(e.x, e.y, p.x, p.y) <= 7;
  this._addScoutScanFx(e.x, e.y, found);
  e.scanCd = SPECIAL_ENEMY_SAFETY.scoutCooldown;
  if (!found) return false;
  let woke = 0;
  for (const ally of this.st.dungeon.enemies){
    if (ally === e) continue;
    if (dist8(ally.x, ally.y, e.x, e.y) <= 5){
      ally.awake = true;
      if (ally.buffTurns < 1){ ally.buffTurns = 1; ally.buffAmt = Math.max(ally.buffAmt || 0, 1); }
      woke++;
    }
  }
  this._addPop(e.x, e.y - 0.3, "索敵", "#3ddad7");
  if (woke > 0) UI.log(`${def.name}が索敵波を放ち、周囲の機械を起こした。`, "warn");
  return true;
},

_tryCamouflageWarp(e, def, sees){
  if (!sees) return false;
  e.camoCd = Math.max(0, e.camoCd || 0);
  if (e.camoCd > 0){ e.camoCd--; return false; }
  const p = this.st.player;
  const d0 = dist8(e.x, e.y, p.x, p.y);
  if (d0 < 4 || d0 > 8 || !RNG.chance(0.35)) return false;
  const spots = [];
  for (let yy = p.y - 2; yy <= p.y + 2; yy++) for (let xx = p.x - 2; xx <= p.x + 2; xx++){
    if (dist8(xx, yy, p.x, p.y) !== 2) continue;
    if (!this._walkable(xx, yy)) continue;
    if (this.st.dungeon.enemies.some(o => o !== e && o.x === xx && o.y === yy)) continue;
    spots.push([xx, yy]);
  }
  if (!spots.length) return false;
  const [x, y] = RNG.pick(spots);
  e.x = x; e.y = y; e.anim.fx = x; e.anim.fy = y; e.awake = true;
  e.camoCd = SPECIAL_ENEMY_SAFETY.camouflageCooldown;
  this._addAppearFx(x, y);
  this._addPop(x, y - 0.25, "出現", "#c08bff");
  UI.log(`${def.name}が距離を詰めて出現した。`, "warn");
  AUDIO.sfx("warp");
  return true;
},

_trySplitterSpawn(e, def, sees){
  if (!sees) return false;
  e.splitCd = Math.max(0, e.splitCd || 0);
  if (e.splitCd > 0){ e.splitCd--; return false; }
  if (e.splitDone || e.splitChild) return false;
  const d = this.st.dungeon;
  const splitters = d.enemies.filter(o => o.id === "splitterBit").length;
  if (splitters >= SPECIAL_ENEMY_SAFETY.maxSplitterBits || d.enemies.length >= SPECIAL_ENEMY_SAFETY.maxEnemies) return false;
  if (e.hp > Math.max(2, Math.floor(e.maxHp * 0.55)) && !RNG.chance(0.18)) return false;
  const cells = this._findOpenCellsAround(e.x, e.y);
  if (!cells.length) return false;
  const [xx, yy] = RNG.pick(cells);
  const ne = makeEnemy("splitterBit", xx, yy, this.st.floor);
  ne.hp = Math.max(1, Math.floor(e.hp * 0.45));
  ne.maxHp = Math.max(ne.hp, Math.floor(ne.maxHp * 0.55));
  ne.atk = Math.max(1, Math.floor(ne.atk * 0.8));
  ne.exp = Math.max(1, Math.floor(ne.exp * 0.5));
  ne.awake = true; ne.splitDone = true; ne.splitChild = true;
  d.enemies.push(ne);
  e.splitDone = true; e.splitCd = SPECIAL_ENEMY_SAFETY.splitterCooldown;
  this._addSplitFx(e.x, e.y); this._addSplitFx(xx, yy);
  this._addPop(xx, yy - 0.25, "分裂", "#d8d2c4");
  UI.log(`${def.name}が小型ビットを分離した。`, "warn");
  return true;
},

_tryMistSpray(e, def, sees){
  if (!sees) return false;
  e.mistCd = Math.max(0, e.mistCd || 0);
  if (e.mistCd > 0){ e.mistCd--; return false; }
  const line = this._lineToPlayer(e, Math.max(3, (def.range || 4)));
  if (!line) return false;
  e.mistCd = SPECIAL_ENEMY_SAFETY.mistCooldown;
  this._addProj(e.x, e.y, this.st.player.x, this.st.player.y, "#9de768", fxSprite("pollution"));
  this._addMistFx(this.st.player.x, this.st.player.y);
  this.st.player.poisonTurns = Math.max(this.st.player.poisonTurns || 0, 2);
  this._addPop(this.st.player.x, this.st.player.y - 0.25, "毒", "#9de768");
  UI.log(`${def.name}の毒霧。数ターンHPが削られる。`, "warn");
  AUDIO.sfx("zap");
  this._damagePlayer(Math.max(1, Math.round(this._enemyAtk(e, def) * 0.25)), def.name);
  return true;
},

_tryCoolBlast(e, def, sees){
  if (!sees) return false;
  e.coolCd = Math.max(0, e.coolCd || 0);
  if (e.coolCd > 0){ e.coolCd--; return false; }
  const line = this._lineToPlayer(e, Math.max(4, (def.range || 5)));
  if (!line) return false;
  e.coolCd = SPECIAL_ENEMY_SAFETY.coolerCooldown;
  this._addProj(e.x, e.y, this.st.player.x, this.st.player.y, "#8fd0ff", fxSprite("laser"));
  this._addColdFx(this.st.player.x, this.st.player.y);
  this.st.player.slowTurns = Math.max(this.st.player.slowTurns || 0, 2);
  this._addPop(this.st.player.x, this.st.player.y - 0.25, "鈍足", "#8fd0ff");
  UI.log(`${def.name}の冷気。しばらくダッシュできない。`, "warn");
  AUDIO.sfx("zap");
  this._damagePlayer(Math.max(1, Math.round(this._enemyAtk(e, def) * 0.20)), def.name);
  return true;
},

_tryMagnetPull(e){
  const st = this.st, p = st.player;
  const dx = Math.sign(e.x - p.x), dy = Math.sign(e.y - p.y);
  const nx = p.x + dx, ny = p.y + dy;
  if (!this._walkable(nx, ny)) return false;
  if (st.dungeon.enemies.some(o => o.x === nx && o.y === ny)) return false;
  p.x = nx; p.y = ny; p.anim.fx = nx; p.anim.fy = ny;
  this._afterPlayerMove();
  return true;
},

_tryMagnetPulse(e, def, sees){
  if (!sees) return false;
  e.magnetCd = Math.max(0, e.magnetCd || 0);
  if (e.magnetCd > 0){ e.magnetCd--; return false; }
  const p = this.st.player;
  const line = this._lineToPlayer(e, Math.max(4, def.range || 4));
  if (!line) return false;
  e.magnetCd = SPECIAL_ENEMY_SAFETY.magnetCooldown;
  this._tryMagnetPull(e);
  this._addMagnetFx(e.x, e.y, p.x, p.y);
  p.magnetizedTurns = Math.max(p.magnetizedTurns || 0, 2);
  this._addPop(p.x, p.y - 0.25, "磁力", "#ffd24a");
  UI.log(`${def.name}の磁力干渉。装備性能が一時低下する。`, "warn");
  AUDIO.sfx("zap");
  return true;
},

_findRepairTarget(e, range){

    return this.st.dungeon.enemies
      .filter(o => o !== e && o.hp < o.maxHp && dist8(o.x,o.y,e.x,e.y) <= range)
      .sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0] || null;
  },

  _findBuffTarget(e, range){
    return this.st.dungeon.enemies
      .filter(o => o !== e && !(o.buffTurns > 0) && dist8(o.x,o.y,e.x,e.y) <= range)
      .sort((a,b)=>dist8(a.x,a.y,e.x,e.y)-dist8(b.x,b.y,e.x,e.y))[0] || null;
  },

  _findShieldTarget(e, range){
    return this.st.dungeon.enemies
      .filter(o => o !== e && !(o.shieldTurns > 0) && dist8(o.x,o.y,e.x,e.y) <= range)
      .sort((a,b)=>dist8(a.x,a.y,e.x,e.y)-dist8(b.x,b.y,e.x,e.y))[0] || null;
  },

  _summonEnemiesNear(x, y, n){
    const st = this.st, d = st.dungeon;
    const table = enemyTableFor(st.floor).filter(([id]) => id !== "alarmBeacon" && id !== "warden");
    if (d.enemies.length >= SPECIAL_ENEMY_SAFETY.maxEnemies) return 0;
    n = Math.min(n, SPECIAL_ENEMY_SAFETY.maxEnemies - d.enemies.length);
    let made = 0;
    const cells = [];
    for (let yy = y - 3; yy <= y + 3; yy++) for (let xx = x - 3; xx <= x + 3; xx++){
      if (!this._walkable(xx, yy)) continue;
      if (xx === st.player.x && yy === st.player.y) continue;
      if (d.enemies.some(o => o.x === xx && o.y === yy)) continue;
      if (dist8(xx,yy,x,y) < 2) continue;
      cells.push([xx,yy]);
    }
    RNG.shuffle(cells);
    for (const [xx,yy] of cells){
      if (made >= n) break;
      const id = weightedPick(table.length ? table : [["cleaner",10]]);
      const ne = makeEnemy(id, xx, yy, st.floor);
      ne.awake = true;
      d.enemies.push(ne);
      this._addBurst(xx, yy, ENEMIES[id].hue);
      made++;
    }
    return made;
  },

  _dropScrapNear(x, y){
    const d = this.st.dungeon;
    if (!RNG.chance(.45)) return false;
    const cells = [];
    for (const k in DIRS){
      const [dx,dy] = DIRS[k];
      const xx = x+dx, yy = y+dy;
      if (!this._walkable(xx, yy)) continue;
      if (d.enemies.some(o => o.x === xx && o.y === yy)) continue;
      if (d.groundItems.some(g => g.x === xx && g.y === yy)) continue;
      cells.push([xx,yy]);
    }
    if (!cells.length) return false;
    const [xx,yy] = RNG.pick(cells);
    d.groundItems.push({ x:xx, y:yy, item: makeItem("scrap") });
    return true;
  },

  _tryDrillMove(e, def){
    const st = this.st, d = st.dungeon, p = st.player;
    const dx = Math.sign(p.x - e.x), dy = Math.sign(p.y - e.y);
    const adx = Math.abs(p.x - e.x), ady = Math.abs(p.y - e.y);
    if (!(e.x === p.x || e.y === p.y || adx === ady)) return false;
    if (Math.max(adx, ady) > 6) return false;
    const nx = e.x + dx, ny = e.y + dy;
    if (nx === p.x && ny === p.y){ this._enemyMelee(e, def); return true; }
    if (d.map[ny] && d.map[ny][nx] === T.WALL){
      d.map[ny][nx] = T.FLOOR;
      this._addBurst(nx, ny, "#c46f35");
      if (st.visible[e.y][e.x]) UI.log(`${def.name}が壁を掘削した!`, "warn");
      AUDIO.sfx("hit");
      return true;
    }
    if (this._enemyWalkable(e, nx, ny, dx, dy)){
      e.x = nx; e.y = ny;
      this._addPop(e.x, e.y, "突進", "#c46f35");
      return true;
    }
    return false;
  },

  _canMeleeFrom(x, y){
    const p = this.st.player;
    const dx = p.x - x, dy = p.y - y;
    if (dx !== 0 && dy !== 0){ // 斜め攻撃も角抜け禁止
      if (!this._walkable(x + dx, y) || !this._walkable(x, y + dy)) return false;
    }
    return true;
  },

  _enemyMelee(e, def){
    const st = this.st, p = st.player;
    e.lunge = { dir: this._dirTo(e.x, e.y, p.x, p.y), t0: performance.now() };
    this._addMeleeArc(e.x, e.y, p.x, p.y, "#ff9d8a", true);
    if (RNG.chance(.1)){
      this._addPop(p.x, p.y, "miss", "#857f72");
      AUDIO.sfx("miss");
      return;
    }
    const dmg = this._calcDamage(this._enemyAtk(e, def), this._playerDef());
    UI.log(`${def.name}の攻撃! ${dmg}のダメージ!`, "dmg");
    if (this._damagePlayer(dmg, def.name)) return;
    // 研磨機など: 装備を削る。武器優先、なければ防具。
    if (def.special === "rust" && RNG.chance(.35)){
      const candidates = [p.weapon, p.armor].map(uid => p.inv.find(i => i.uid === uid)).filter(Boolean);
      const gear = candidates.find(i => (i.plus||0) > -3);
      if (gear){
        gear.plus = (gear.plus||0) - 1;
        AUDIO.sfx("rust");
        UI.log(`${ITEMS[gear.id].name}が研磨され、性能が落ちた…!`, "warn");
      }
    }
  },

  _explodeEnemy(e, def){
    const st = this.st, d = st.dungeon, p = st.player;
    this._addBoom(e.x, e.y);
    AUDIO.sfx("boom");
    UI.log(`${def.name}が爆発した!`, "warn");
    if (dist8(p.x, p.y, e.x, e.y) <= 1){
      this._damagePlayer(def.blastDmg, "爆発");
    }
    for (const o of d.enemies.slice()){
      if (o !== e && dist8(o.x,o.y,e.x,e.y) <= 1){
        o.hp -= def.blastDmg;
        if (o.hp <= 0) this._killEnemy(o, false);
        else this._addPop(o.x, o.y, def.blastDmg, "#fff6d8");
      }
    }
    const idx = d.enemies.indexOf(e);
    if (idx >= 0) d.enemies.splice(idx, 1);
    this._addBurst(e.x, e.y, def.hue);
  },

  _lineToPlayer(e, range){
    const p = this.st.player, d = this.st.dungeon;
    const dx = Math.sign(p.x - e.x), dy = Math.sign(p.y - e.y);
    const adx = Math.abs(p.x - e.x), ady = Math.abs(p.y - e.y);
    if (!(e.x === p.x || e.y === p.y || adx === ady)) return null;
    if (Math.max(adx, ady) > range) return null;
    let x = e.x + dx, y = e.y + dy;
    while (!(x === p.x && y === p.y)){
      if (d.map[y][x] === T.WALL) return null;
      if (d.enemies.some(o => o.x===x && o.y===y)) return null;
      x += dx; y += dy;
    }
    return true;
  },

  _enemyChase(e){
    const p = this.st.player;
    const cands = [];
    for (const k in DIRS){
      const [dx,dy] = DIRS[k];
      const x = e.x+dx, y = e.y+dy;
      if (!this._enemyWalkable(e, x, y, dx, dy)) continue;
      cands.push([dist8(x,y,p.x,p.y), x, y, parseInt(k,10)]);
    }
    if (!cands.length) return;
    cands.sort((a,b)=>a[0]-b[0]);
    const cur = dist8(e.x,e.y,p.x,p.y);
    if (cands[0][0] >= cur) {
      if (cands[0][0] > cur) return; // 近づけないなら待つ
    }
    const best = cands.filter(c => c[0] === cands[0][0]);
    const [, x, y, k] = RNG.pick(best);
    e.x = x; e.y = y; e.dir = k;
  },
  _enemyFlee(e){
    const p = this.st.player;
    const cands = [];
    for (const k in DIRS){
      const [dx,dy] = DIRS[k];
      const x = e.x+dx, y = e.y+dy;
      if (!this._enemyWalkable(e, x, y, dx, dy)) continue;
      cands.push([dist8(x,y,p.x,p.y), x, y]);
    }
    if (!cands.length) return;
    cands.sort((a,b)=>b[0]-a[0]);
    e.x = cands[0][1]; e.y = cands[0][2];
  },
  _enemyWander(e){
    if (!RNG.chance(.4)) return;
    const k = RNG.pick(Object.keys(DIRS));
    const [dx,dy] = DIRS[k];
    if (this._enemyWalkable(e, e.x+dx, e.y+dy, dx, dy)){ e.x += dx; e.y += dy; }
  },
  _enemyWalkable(e, x, y, dx, dy){
    const st = this.st, d = st.dungeon, p = st.player;
    if (!this._walkable(x, y)) return false;
    if (x === p.x && y === p.y) return false;
    if (d.enemies.some(o => o !== e && o.x === x && o.y === y)) return false;
    if (dx !== 0 && dy !== 0){
      if (!this._walkable(e.x + dx, e.y) || !this._walkable(e.x, e.y + dy)) return false;
    }
    return true;
  },

  // ---------------------------------------------------------
  // 道具
  // ---------------------------------------------------------
  openInventory(){
    if (!this.st || UI.talking) return;
    UI.openInv(this.st, (action, idx) => this._invAction(action, idx));
  },

  async _invAction(action, idx){
    const st = this.st, p = st.player;
    const it = p.inv[idx];
    if (!it) return;
    const def = ITEMS[it.id];

    if (action === "drop"){
      if (st.mode !== "dungeon"){ UI.log("ここでは置けない。", "sys"); AUDIO.sfx("deny"); return; }
      if (def.cat === "quest"){ UI.log("これを手放すわけにはいかない。", "sys"); AUDIO.sfx("deny"); return; }
      const d = st.dungeon;
      if (d.groundItems.some(g => g.x===p.x && g.y===p.y)){ UI.log("足元にはもう道具がある。", "sys"); AUDIO.sfx("deny"); return; }
      this._unequipIfNeeded(it);
      p.inv.splice(idx, 1);
      d.groundItems.push({ x:p.x, y:p.y, item:it });
      UI.log(`${itemName(it)} を足元に置いた。`, "item");
      UI.closeInv();
      this._endPlayerTurn();
      return;
    }

    if (action === "throw"){
      if (st.mode !== "dungeon"){ UI.log("ここでは投げられない。", "sys"); AUDIO.sfx("deny"); return; }
      if (def.cat === "quest"){ UI.log("これを投げるわけにはいかない!", "sys"); AUDIO.sfx("deny"); return; }
      UI.closeInv();
      const dir = await UI.pickDir(`${itemName(it)} をどの方向へ?`);
      if (!dir) return;
      this._throwItem(it, idx, dir);
      return;
    }

    // use
    switch(def.cat){
      case "food":
        p.belly = Math.min(CONFIG.HUNGER_MAX, p.belly + def.belly);
        p.inv.splice(idx, 1);
        AUDIO.sfx("eat");
        UI.log(`${def.name}を食べた。満腹度が回復した。`, "good");
        break;
      case "med":
        if (def.heal){
          if (def.maxUp){ p.maxHp += def.maxUp; }
          p.hp = Math.min(p.maxHp, p.hp + def.heal);
          AUDIO.sfx("heal");
          UI.log(def.maxUp ? "ナノマシンが体を作り替えた! 全回復+最大HP上昇!" : `HPが回復した。`, "good");
        } else if (def.buff === "atk"){
          p.buffAtk = def.turns;
          AUDIO.sfx("heal");
          UI.log("体の奥が熱い! 攻撃力が上がった!", "good");
        } else if (def.buff === "def"){
          p.buffDef = def.turns;
          AUDIO.sfx("heal");
          UI.log("皮膚が硬質化した! 守りが固くなった!", "good");
        }
        p.inv.splice(idx, 1);
        break;
      case "weapon": case "armor": {
        const slot = def.cat === "weapon" ? "weapon" : "armor";
        if (p[slot] === it.uid){
          p[slot] = null;
          UI.log(`${itemName(it)} を外した。`);
        } else {
          p[slot] = it.uid;
          AUDIO.sfx("equip");
          UI.log(`${itemName(it)} を装備した。`, "good");
        }
        UI.closeInv();
        UI.updateHud(st);
        this._endPlayerTurn();
        return;
      }
      case "chip": {
        const done = await this._useChip(it, idx);
        if (!done) return;
        break;
      }
      case "rod": {
        if (st.mode !== "dungeon"){ UI.log("ここでは使えない。", "sys"); AUDIO.sfx("deny"); return; }
        if (it.charges <= 0){ UI.log("ロッドの残量がない。", "sys"); AUDIO.sfx("deny"); return; }
        UI.closeInv();
        const dir = await UI.pickDir("どの方向へ放電する?");
        if (!dir) return;
        this._fireRod(it, dir);
        return;
      }
      default:
        AUDIO.sfx("deny");
        return;
    }
    UI.closeInv();
    UI.updateHud(st);
    this._endPlayerTurn();
  },

  _unequipIfNeeded(it){
    const p = this.st.player;
    if (p.weapon === it.uid) p.weapon = null;
    if (p.armor === it.uid) p.armor = null;
  },

  async _useChip(it, idx){
    const st = this.st, p = st.player, def = ITEMS[it.id];
    if (st.mode !== "dungeon" && def.effect !== "forge" && def.effect !== "plate"){
      UI.log("ここでは使えない。", "sys"); AUDIO.sfx("deny"); return false;
    }
    const d = st.dungeon;
    switch(def.effect){
      case "scan":
        for (let y = 0; y < d.H; y++) for (let x = 0; x < d.W; x++) d.explored[y][x] = true;
        d.scanned = true;
        AUDIO.sfx("chip");
        UI.log("チップが階層の構造を読み出した!", "good");
        break;
      case "warp": {
        AUDIO.sfx("warp");
        const [x,y] = this._randomFloorTile();
        p.x = x; p.y = y; p.anim.fx = x; p.anim.fy = y;
        this.camera.init = false;
        this._computeVisibility();
        UI.log("視界が歪み、別の場所に立っていた。", "good");
        break;
      }
      case "home": {
        const a = await UI.dialog("帰還タグを起動する?\n(道具を持ったまま集落へ帰る)", ["帰還する", "やめる"]);
        if (a !== 0) return false;
        p.inv.splice(idx, 1);
        UI.closeInv();
        AUDIO.sfx("warp");
        if (st.hasCore){ this._victory(); }
        else { this.returnHome(true); }
        return false;
      }
      case "forge": {
        const w = p.inv.find(i => i.uid === p.weapon);
        if (!w){ UI.log("武器を装備していない。", "sys"); AUDIO.sfx("deny"); return false; }
        w.plus = (w.plus||0) + 1;
        AUDIO.sfx("chip");
        UI.log(`${ITEMS[w.id].name}が鍛え直された! +1`, "good");
        break;
      }
      case "plate": {
        const a = p.inv.find(i => i.uid === p.armor);
        if (!a){ UI.log("防具を装備していない。", "sys"); AUDIO.sfx("deny"); return false; }
        a.plus = (a.plus||0) + 1;
        AUDIO.sfx("chip");
        UI.log(`${ITEMS[a.id].name}が強化された! +1`, "good");
        break;
      }
      case "sleep": {
        const rid = d.roomId[p.y][p.x];
        let n = 0;
        for (const e of d.enemies){
          const inRange = rid >= 0 ? d.roomId[e.y][e.x] === rid : dist8(e.x,e.y,p.x,p.y) <= 2;
          if (inRange){ e.stun = 5; n++; }
        }
        AUDIO.sfx("chip");
        UI.log(n ? `周囲の機械 ${n}体が強制休眠した!` : "効果のある機械はいなかった。", n ? "good" : "sys");
        break;
      }
    }
    p.inv.splice(idx, 1);
    return true;
  },

  _throwItem(it, idx, dir){
    const st = this.st, p = st.player, d = st.dungeon;
    const def = ITEMS[it.id];
    this._unequipIfNeeded(it);
    p.inv.splice(idx, 1);
    p.dir = dir;
    AUDIO.sfx("throw");
    const [dx,dy] = DIRS[dir];
    let x = p.x, y = p.y, hit = null;
    for (let i = 0; i < 10; i++){
      const nx = x + dx, ny = y + dy;
      if (!this._walkable(nx, ny)) break;
      x = nx; y = ny;
      hit = d.enemies.find(e => e.x === x && e.y === y) || null;
      if (hit) break;
    }
    this._addProj(p.x, p.y, x, y, "#d8d2c4", itemSprite(it.id));
    const resolve = () => {
      if (def.blast){
        this._addBoom(x, y);
        AUDIO.sfx("boom");
        UI.log("焼夷セルが炸裂した!", "warn");
        for (const o of d.enemies.slice()){
          if (dist8(o.x,o.y,x,y) <= def.blast){
            o.hp -= def.dmg; o.awake = true;
            if (o.hp <= 0) this._killEnemy(o, true);
            else this._addPop(o.x, o.y, def.dmg, "#fff6d8");
          }
        }
        if (dist8(p.x,p.y,x,y) <= def.blast) this._damagePlayer(Math.round(def.dmg/2), "爆発");
      } else if (hit){
        const dmg = def.dmg || 2 + Math.floor((def.atk||def.def||0)/2);
        hit.hp -= dmg; hit.awake = true;
        AUDIO.sfx("hit");
        this._addFlash(hit);
        this._addPop(hit.x, hit.y, dmg, "#fff6d8");
        if (hit.hp <= 0) this._killEnemy(hit, true);
        else UI.log(`${itemName(it)}が${ENEMIES[hit.id].name}に命中! ${dmg}のダメージ。`);
      } else {
        if (!d.groundItems.some(g => g.x===x && g.y===y) && d.map[y][x] !== T.STAIRS && d.map[y][x] !== T.PEDESTAL){
          d.groundItems.push({ x, y, item: it });
        }
        UI.log(`${itemName(it)}は床に落ちた。`);
      }
      UI.updateHud(st);
      UI.drawMinimap(st);
    };
    setTimeout(resolve, 160);
    this._endPlayerTurnDelayed(220);
  },

  _fireRod(it, dir){
    const st = this.st, p = st.player, d = st.dungeon;
    it.charges--;
    p.dir = dir;
    AUDIO.sfx("zap");
    const [dx,dy] = DIRS[dir];
    let x = p.x, y = p.y, hit = null;
    for (let i = 0; i < 10; i++){
      const nx = x + dx, ny = y + dy;
      if (!this._walkable(nx, ny)) break;
      x = nx; y = ny;
      hit = d.enemies.find(e => e.x === x && e.y === y) || null;
      if (hit) break;
    }
    this._addProj(p.x, p.y, x, y, "#3ddad7");
    if (hit){
      const dmg = ITEMS[it.id].dmg;
      hit.hp -= dmg; hit.awake = true;
      this._addFlash(hit);
      this._addPop(hit.x, hit.y, dmg, "#8ae8ff");
      if (hit.hp <= 0) this._killEnemy(hit, true);
      else UI.log(`電撃が${ENEMIES[hit.id].name}を貫いた! ${dmg}のダメージ!`, "good");
    } else {
      UI.log("電撃は虚しく壁に散った。");
    }
    UI.updateHud(st);
    this._endPlayerTurnDelayed(200);
  },

  _endPlayerTurnDelayed(ms){
    this._busy(ms + CONFIG.STEP_MS);
    setTimeout(() => { if (!this.over && this.st) this._endPlayerTurn(); }, ms);
  },

  // ---------------------------------------------------------
  // 帰還 / 勝利 / ゲームオーバー
  // ---------------------------------------------------------
  returnHome(byTag){
    const st = this.st;
    UI.banner("帰 還", "RETURN TO SETTLEMENT", 1300);
    setTimeout(() => {
      this.enterVillage(false);
      UI.log(byTag ? "帰還タグの光に包まれ、集落へ戻った。" : "来た道を引き返し、集落へ戻った。", "sys");
    }, 600);
  },

  async _victory(){
    const st = this.st;
    st.cleared++;
    const r = this._record(); r.clears++; this._saveRecord(r);
    st.hasCore = false;
    st.player.inv = st.player.inv.filter(i => i.id !== "aquaCore");
    this.over = false;
    AUDIO.stopBgm();
    AUDIO.sfx("core");
    await UI.showResult("水は、戻った",
      `アクアコアは浄水機関に収まり、\n乾いた配管に水音が帰ってきた。\n\n子供たちが井戸に駆けていく。\n発掘家の仕事は、また明日からだ。\n\n― B${CONFIG.MAX_FLOOR}F 踏破 / アクアコア回収 ―`);
    this.enterVillage(false);
    UI.log("集落に水が戻った! みんなが笑っている。", "good");
  },

  async _gameOver(srcName){
    if (this.over) return;
    this.over = true;
    const st = this.st;
    AUDIO.stopBgm();
    AUDIO.sfx("boom");
    const floor = st.floor, lv = st.player.lv;
    await new Promise(r => setTimeout(r, 700));
    await UI.showResult("倒れてしまった…",
      `B${floor}F ― ${srcName}にやられた。\n\n気づくと集落の寝床だった。\n荷物はすべて、廃棄層に消えた。\n体も鈍ってしまった。(Lv${lv}→1)\n\nだが、命だけは拾われた。`, true);
    // 全ロスト
    st.player = this._newPlayer();
    st.hasCore = false;
    this.over = false;
    this.enterVillage(false);
    UI.log("「生きて戻れただけ上等さ」と機械工が笑った。", "sys");
    this.saveGame();
  },

  async _showEnemyBook(){
    const ids = Array.from(this.catalog);
    if (!ids.length){
      await UI.dialog("まだ敵データがない。廃棄層で敵を見つけよう。", ["閉じる"]);
      return;
    }
    const rangeLabel = (floors) => floors[0] === floors[1] ? `B${floors[0]}F` : `B${floors[0]}-${floors[1]}F`;
    const total = Object.keys(ENEMIES).filter(id => id !== "warden").length;
    const rows = ids.map(id => ENEMIES[id]).filter(Boolean)
      .sort((a, b) => (a.floors[0] - b.floors[0]) || a.name.localeCompare(b.name, "ja"))
      .map(def => `[${rangeLabel(def.floors)}] ${def.name}: ${def.role}`);
    const text = [
      `【敵図鑑】 発見済み ${rows.length}/${total}種`,
      "凡例: 毒=毎ターン1ダメージ / 鈍足=ダッシュ不可 / 磁力=攻防低下",
      "",
      ...rows,
    ].join("\n");
    await UI.dialog(text, ["閉じる"]);
  },

  _enemyBookHint(id, def){
    const hints = {
      scoutEye:"索敵波で周囲の敵を起こす",
      camouflageUnit:"半透明で接近し、離れていると出現奇襲",
      splitterBit:"弱ると一度だけ分裂",
      mistSprayer:"毒霧で継続ダメージ",
      cooler:"冷気で鈍足にする",
      magnetUnit:"引き寄せと装備干渉",
      alarmBeacon:"警報で増援",
      shieldDeployer:"シールド付与",
      supplyPod:"敵を強化",
      repairBit:"敵を修復",
      boomCell:"接近後に自爆"
    };
    return hints[id] || def.role || "通常敵";
  },

  // ---------------------------------------------------------
  // 視界
  // ---------------------------------------------------------
  _computeVisibility(){
    const st = this.st;
    if (st.mode !== "dungeon"){ st.visible = null; return; }
    const d = st.dungeon, p = st.player;
    const vis = new Array(d.H);
    for (let y = 0; y < d.H; y++) vis[y] = new Array(d.W).fill(false);
    const rid = d.roomId[p.y][p.x];
    if (rid >= 0){
      const r = d.rooms[rid];
      for (let y = r.y-1; y <= r.y+r.h; y++)
        for (let x = r.x-1; x <= r.x+r.w; x++)
          if (y>=0 && x>=0 && y<d.H && x<d.W){ vis[y][x] = true; d.explored[y][x] = true; }
    } else {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++){
          const x = p.x+dx, y = p.y+dy;
          if (y>=0 && x>=0 && y<d.H && x<d.W){ vis[y][x] = true; d.explored[y][x] = true; }
        }
    }
    st.visible = vis;
  },

  // ---------------------------------------------------------
  // エフェクト
  // ---------------------------------------------------------
  _addPop(x, y, text, color){
    this.effects.push({ type:"pop", x, y, text:String(text), color, t0:performance.now(), dur:650 });
  },
  _addFlash(enemy){
    this.effects.push({ type:"flash", target:enemy, t0:performance.now(), dur:140 });
  },
  _addMeleeArc(x1, y1, x2, y2, color, strong){
    this.effects.push({ type:"meleeArc", x1, y1, x2, y2, color, strong:!!strong, t0:performance.now(), dur: strong ? 210 : 160 });
  },
  _addHitImpact(x, y, color){
    this.effects.push({ type:"hitImpact", x, y, color, t0:performance.now(), dur:220 });
  },
  _addBurst(x, y, hue){
    const parts = [];
    for (let i = 0; i < 10; i++){
      const a = RNG.next() * Math.PI * 2, sp = .5 + RNG.next() * 2.2;
      parts.push({ a, sp, r: 1 + RNG.next()*2 });
    }
    this.effects.push({ type:"burst", x, y, hue, parts, t0:performance.now(), dur:420 });
  },
  _addBoom(x, y){
    this.effects.push({ type:"boom", x, y, t0:performance.now(), dur:380 });
  },
  _addProj(x1, y1, x2, y2, color, sprite){
    this.effects.push({ type:"proj", x1, y1, x2, y2, color, sprite, t0:performance.now(), dur:150 });
  },
  _addHealFx(x1, y1, x2, y2){
    const t0 = performance.now();
    this.effects.push({ type:"healLink", x1, y1, x2, y2, t0, dur:220 });
    this.effects.push({ type:"healPulse", x:x2, y:y2, t0, dur:420 });
  },
  _addAlarmFx(x, y, strong){
    this.effects.push({ type:"alarmPulse", x, y, strong:!!strong, t0:performance.now(), dur: strong ? 520 : 360 });
  },
  _addSupplyFx(x1, y1, x2, y2){
    const t0 = performance.now();
    this.effects.push({ type:"supplyLink", x1, y1, x2, y2, t0, dur:260 });
    this.effects.push({ type:"supplyPulse", x:x2, y:y2, t0, dur:460 });
  },
  _addShieldCastFx(x1, y1, x2, y2){
    const t0 = performance.now();
    this.effects.push({ type:"shieldLink", x1, y1, x2, y2, t0, dur:260 });
    this.effects.push({ type:"shieldPulse", x:x2, y:y2, t0, dur:520 });
  },
  _addScrapImpactFx(x, y){
    const parts = [];
    for (let i = 0; i < 12; i++){
      const a = RNG.next() * Math.PI * 2, sp = 0.5 + RNG.next() * 1.6;
      parts.push({ a, sp, r: 1 + RNG.next() * 2.2, w: 3 + RNG.next() * 5 });
    }
    this.effects.push({ type:"scrapImpact", x, y, parts, t0:performance.now(), dur:420 });
  },

  // ---------------------------------------------------------
  // 描画ループ
  // ---------------------------------------------------------
  _frame(now){
    requestAnimationFrame(t => this._frame(t));
    if (!this.st || (this.st.mode !== "village" && this.st.mode !== "dungeon")) return;
    const st = this.st, ctx = this.ctx;
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    const tp = this.tilePx;
    const p = st.player;

    // 位置補間
    const LERP = 1 - Math.pow(0.0008, 16/1000 * 60); // 約0.18相当
    p.anim.fx += (p.x - p.anim.fx) * 0.35;
    p.anim.fy += (p.y - p.anim.fy) * 0.35;
    if (Math.abs(p.x - p.anim.fx) < .02) p.anim.fx = p.x;
    if (Math.abs(p.y - p.anim.fy) < .02) p.anim.fy = p.y;

    // カメラ
    const world = st.mode === "village" ? st.village : st.dungeon;
    const viewW = cw / tp, viewH = ch / tp;
    let cx = p.anim.fx, cy = p.anim.fy;
    cx = clamp(cx, viewW/2 - .5, world.W - viewW/2 - .5);
    cy = clamp(cy, viewH/2 - .5, world.H - viewH/2 - .5);
    if (world.W < viewW) cx = world.W/2 - .5;
    if (world.H < viewH) cy = world.H/2 - .5;
    if (!this.camera.init){ this.camera.x = cx; this.camera.y = cy; this.camera.init = true; }
    this.camera.x += (cx - this.camera.x) * 0.2;
    this.camera.y += (cy - this.camera.y) * 0.2;

    // 画面揺れ
    let shx = 0, shy = 0;
    if (now - this._shake < 180){
      const k = 1 - (now - this._shake) / 180;
      shx = (RNG.next()-.5) * 6 * k; shy = (RNG.next()-.5) * 6 * k;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(Math.round(cw/2 - this.camera.x * tp + shx), Math.round(ch/2 - this.camera.y * tp + shy));

    const frame = Math.floor(now / 280) % 2;
    const x0 = Math.floor(this.camera.x - viewW/2) - 1, x1 = Math.ceil(this.camera.x + viewW/2) + 1;
    const y0 = Math.floor(this.camera.y - viewH/2) - 1, y1 = Math.ceil(this.camera.y + viewH/2) + 1;

    if (st.mode === "village"){
      this._drawVillage(ctx, x0, x1, y0, y1, tp, now, frame);
      this._drawActorsVillage(ctx, tp, now);
    } else {
      this._drawDungeon(ctx, x0, x1, y0, y1, tp, now, frame);
      this._drawActorsDungeon(ctx, tp, now, frame);
    }

    // ミニマップの点滅アニメ用に約8fpsで再描画
    if (st.mode === "dungeon" && (!this._mmLast || now - this._mmLast > 120)){
      this._mmLast = now;
      UI.drawMinimap(st);
    }

    // エフェクト(カメラ変換内)
    this._drawEffects(ctx, tp, now);

    ctx.restore();

    // --- 画面空間オーバーレイ(カメラ変換の外) ---
    // ロボットステーション起動時の赤フラッシュ
    if (this._stationFlash && now - this._stationFlash < 600){
      const k = 1 - (now - this._stationFlash) / 600;
      ctx.fillStyle = `rgba(255,60,50,${0.5*k})`;
      ctx.fillRect(0, 0, cw, ch);
    }
    // ステーションが起動中(敵が残っている間)は赤い縁を点滅
    if (st.mode === "dungeon" && st.dungeon.station && st.dungeon.station.triggered){
      const alive = st.dungeon.enemies.some(e => e.station);
      if (alive){
        const pulse = 0.3 + 0.25 * Math.sin(now/200);
        const grad = ctx.createRadialGradient(cw/2, ch/2, Math.min(cw,ch)*0.35, cw/2, ch/2, Math.max(cw,ch)*0.7);
        grad.addColorStop(0, "rgba(255,40,40,0)");
        grad.addColorStop(1, `rgba(255,40,40,${pulse})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
      }
    }
  },

  _dirKey(dir){
    if (dir === 8 || dir === 7 || dir === 9) return "up";
    if (dir === 2 || dir === 1 || dir === 3) return "down";
    if (dir === 4) return "left";
    return "right";
  },

  // 立ち絵アクターの統一描画(プレイヤー・敵・NPC共通)
  // gx,gy: グリッド座標(補間済み) / portrait: 画像 or null
  // opts: { scale, bob, lungeDir, lungeT, flash, dead, dir }
  _drawActor(ctx, gx, gy, tp, portrait, opts){
    opts = opts || {};
    const scale = opts.scale || 1;
    // 立ち絵は「1マス幅より少し大きい」程度に抑える(密集しても重なりにくく)
    const baseH = tp * 1.25 * scale;      // 高さはマスの1.25倍
    let drawH = baseH, drawW, aspect = 208/256;
    if (portrait){
      aspect = portrait.width / portrait.height;
      drawW = drawH * aspect;
    } else {
      drawW = tp * scale; drawH = tp * scale;
    }
    // 中心(足元)位置: マス中央x, マス下端付近y
    const footX = (gx + 0.5) * tp;
    const footY = (gy + 0.95) * tp;
    // 踏み込み(lunge)
    let lx = 0, ly = 0;
    if (opts.lungeDir != null && opts.lungeT != null && opts.lungeT < 1){
      const k = Math.sin(Math.min(1, opts.lungeT) * Math.PI) * 0.32 * tp;
      lx = DIRS[opts.lungeDir][0] * k;
      ly = DIRS[opts.lungeDir][1] * k;
    }
    // 上下バウンド(歩行/呼吸)
    const bob = opts.bob || 0;
    // 影(足元・バウンドで縮む)
    const shW = drawW * 0.5 * (1 - bob*0.012);
    const shH = shW * 0.32;
    ctx.save();
    ctx.globalAlpha = (opts.dead ? 0.4 : 0.42);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(footX + lx, footY - 1, shW, shH, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // 本体
    const dx = footX - drawW/2 + lx;
    const dy = footY - drawH + ly - bob;
    if (portrait){
      // 左向き(dir==4)は足元基準で安定して反転
      const flip = (opts.dir === 4);
      ctx.save();
      if (opts.dead){ ctx.globalAlpha = 0.85; }
      if (flip){
        const pivotX = footX + lx;
        ctx.translate(pivotX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-pivotX, 0);
      }
      ctx.drawImage(portrait, dx, dy, drawW, drawH);
      // 被弾フラッシュ(加算で白く)
      if (opts.flash > 0){
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = opts.flash * 0.8;
        ctx.drawImage(portrait, dx, dy, drawW, drawH);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
    } else {
      // フォールバック: コード生成スプライト(16x16)を拡大
      const fb = opts.fallback;
      if (fb) ctx.drawImage(fb, dx, dy, drawW, drawH);
    }
    return { footX, footY, drawW, drawH, topY: dy };
  },

  _drawPlayer(ctx, tp, now){
    const st = this.st, p = st.player;
    const moving = Math.abs(p.x - p.anim.fx) > .03 || Math.abs(p.y - p.anim.fy) > .03;
    // バウンド: 移動中は歩幅をはっきり、停止中は呼吸を控えめに
    const bob = moving
      ? Math.abs(Math.sin(now / 84)) * tp * 0.10
      : Math.sin(now / 700) * tp * 0.016 + tp*0.018;
    let lungeT = null, lungeDir = null;
    if (p.lunge){
      lungeT = (now - p.lunge.t0) / CONFIG.ATTACK_MS;
      lungeDir = p.lunge.dir;
      if (lungeT >= 1) p.lunge = null;
    }
    const hurtFlash = p.hurtAt ? Math.max(0, 1 - ((now - p.hurtAt) / 220)) : 0;
    let animState = moving ? "walk" : "idle";
    if (UI.talking && st.mode === "village") animState = (Math.floor((UI.talkPhase || now) / 900) % 3 === 2) ? "talk" : "idle";
    if (lungeT != null && lungeT < 1) animState = "attack";
    if (hurtFlash > 0.01) animState = "hurt";
    const portrait = playerPortrait(st.mode, p.dir, animState, now);
    const fb = SPR.player[this._dirKey(p.dir)][moving ? (Math.floor(now/120)%2) : 0];
    let alpha = 1;
    if (p.stun > 0) alpha = 0.7 + 0.3 * Math.sin(now/60);
    ctx.globalAlpha = alpha;
    this._drawActor(ctx, p.anim.fx, p.anim.fy, tp, portrait, {
      dir: p.dir, bob, lungeT, lungeDir, flash: hurtFlash, fallback: fb, scale: 1,
    });
    ctx.globalAlpha = 1;
    const px = (p.anim.fx + 0.5) * tp, py = (p.anim.fy + 0.9) * tp;
    if (p.poisonTurns > 0) this._drawStatusRing(ctx, px, py, tp, PLAYER_STATUS_COLORS.poison, now, 0.18, 0.38);
    if (p.slowTurns > 0) this._drawStatusRing(ctx, px, py, tp, PLAYER_STATUS_COLORS.slow, now + 240, 0.26, 0.48);
    if (p.magnetizedTurns > 0) this._drawStatusRing(ctx, px, py, tp, PLAYER_STATUS_COLORS.magnet, now + 480, 0.34, 0.56, true);
  },


_drawStatusRing(ctx, x, y, tp, color, now, rMin, rMax, squared){
  const pulse = 0.5 + 0.5 * Math.sin(now/150);
  const r = tp * (rMin + (rMax-rMin) * pulse);
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, tp*0.04);
  if (squared){
    ctx.strokeRect(x-r*0.6, y-r*0.35, r*1.2, r*0.7);
  } else {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r*0.42, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
},

// ---------- 背景画像レイヤー ----------
  _drawBgLayer(ctx, world, tp, alpha){
    const img = bgImage(this.st.mode);
    if (!img) return;
    // 背景をワールド全体に1枚引き伸ばし、暗めに敷く
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, world.W * tp, world.H * tp);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
  },

  _drawVillage(ctx, x0, x1, y0, y1, tp, now, frame){
    const v = this.st.village;
    // 集落はタイルのみで構築(固定背景は使わない)
    for (let y = Math.max(0,y0); y <= Math.min(v.H-1,y1); y++){
      for (let x = Math.max(0,x0); x <= Math.min(v.W-1,x1); x++){
        ctx.drawImage(tileSprite(v.kind[y][x], x, y), x*tp, y*tp, tp, tp);
      }
    }
    // 焚き火のゆらめき(中央広場)
    if (v.campfire){
      const [cfx, cfy] = v.campfire;
      const fl = 0.7 + 0.3*Math.sin(now/120) + 0.1*Math.sin(now/57);
      ctx.globalAlpha = fl;
      ctx.fillStyle = "#ff9d3a";
      const fx = (cfx+0.5)*tp, fy = (cfy+0.55)*tp;
      ctx.beginPath();
      ctx.moveTo(fx, fy - tp*0.32*fl);
      ctx.quadraticCurveTo(fx - tp*0.16, fy, fx, fy + tp*0.1);
      ctx.quadraticCurveTo(fx + tp*0.16, fy, fx, fy - tp*0.32*fl);
      ctx.fill();
      ctx.fillStyle = "#ffd24a";
      ctx.globalAlpha = fl;
      ctx.beginPath();
      ctx.arc(fx, fy, tp*0.1*fl, 0, Math.PI*2);
      ctx.fill();
      // 灯りのにじみ
      const grad = ctx.createRadialGradient(fx, fy, tp*0.1, fx, fy, tp*2.2);
      grad.addColorStop(0, "rgba(255,160,60,0.16)");
      grad.addColorStop(1, "rgba(255,160,60,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(fx - tp*2.2, fy - tp*2.2, tp*4.4, tp*4.4);
      ctx.globalAlpha = 1;
    }
    // 東門の明滅矢印
    const g = v.gate;
    const elderDone = !!(this.st.flags && this.st.flags.talked && this.st.flags.talked.elder);
    ctx.globalAlpha = elderDone ? (.5 + .5 * Math.sin(now/300)) : 0.32;
    ctx.fillStyle = elderDone ? "#f5a623" : "#c9b38b";
    ctx.font = `bold ${Math.round(tp*.5)}px monospace`;
    ctx.fillText("▶", (g[0]-0.4)*tp, (g[1]+0.65)*tp);
    ctx.globalAlpha = 1;
  },

  _drawSpeakerMarker(ctx, x, y, tp, label, now){
    const pulse = 0.5 + 0.5 * Math.sin(now / 170);
    const cx = (x + 0.5) * tp, cy = (y - 0.90) * tp;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.max(9, Math.round(tp * 0.23))}px sans-serif`;
    const w = Math.max(tp * 1.08, ctx.measureText(label).width + 14);
    const h = Math.max(15, tp * 0.31);
    ctx.globalAlpha = 0.68;
    ctx.fillStyle = "rgba(17,20,24,0.72)";
    ctx.fillRect(cx - w/2, cy - h/2, w, h);
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = `rgba(255,210,74,${0.56 + pulse*0.22})`;
    ctx.lineWidth = Math.max(1, tp*0.028);
    ctx.strokeRect(cx - w/2, cy - h/2, w, h);
    ctx.fillStyle = "#fff6d8";
    ctx.fillText(label, cx, cy + h*0.23);
    ctx.beginPath();
    ctx.globalAlpha = 0.24 + pulse*0.14;
    ctx.strokeStyle = "#ffd24a";
    ctx.ellipse((x+0.5)*tp, (y+0.94)*tp, tp*0.40, tp*0.12, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  },

  _drawObjectiveMarker(ctx, x, y, tp, now){
    const pulse = 0.5 + 0.5 * Math.sin(now / 240);
    const cx = (x + 0.5) * tp, cy = (y - 1.12) * tp;
    const r = Math.max(9, tp * 0.20);
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(255,210,74,0.95)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 0.78 + pulse * 0.18;
    ctx.strokeStyle = "rgba(80,46,4,0.92)";
    ctx.lineWidth = Math.max(1, tp * 0.028);
    ctx.stroke();
    ctx.fillStyle = "#3b2405";
    ctx.font = `bold ${Math.max(10, Math.round(tp * 0.22))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("!", cx, cy + r*0.36);
    ctx.restore();
  },

  // 集落の立ち絵(NPC + プレイヤー)を足元Yでソートして描画
  _drawActorsVillage(ctx, tp, now){
    const st = this.st, v = st.village, p = st.player;
    if (!UI.talking) this._activeTalkNpcId = null;
    const npcTune = {
      logistics: { scale:0.94, yOffset:-0.02 },
      builder:   { scale:0.94, yOffset:0.00 },
      medic:     { scale:0.92, yOffset:0.00 },
      sorter:    { scale:0.82, yOffset:0.05 },
      child:     { scale:0.68, yOffset:0.08 },
    };
    const actors = [];
    for (const n of v.npcs){
      n._fx = (n._fx==null?n.x:n._fx); n._fy = (n._fy==null?n.y:n._fy);
      const keyBody = resolveNpcBody(n.body);
      actors.push({ kind:"npc", n, keyBody, y:n.y + ((npcTune[keyBody] && npcTune[keyBody].yOffset) || 0) });
    }
    actors.push({ kind:"player", y:p.anim.fy });
    actors.sort((a,b)=>a.y-b.y);
    for (const a of actors){
      if (a.kind === "player"){ this._drawPlayer(ctx, tp, now); continue; }
      const n = a.n;
      const keyBody = a.keyBody || resolveNpcBody(n.body);
      const activeTalk = !!(UI.talking && this._activeTalkNpcId === n.id);
      const nearPlayer = dist8(n.x,n.y,p.x,p.y) <= 1;
      const talkPhase = UI.talkPhase || 0;
      const npcState = activeTalk ? ((Math.floor(talkPhase / 520) % 2 === 0) ? "talk" : "react") : (nearPlayer ? "react" : "idle");
      const portrait = npcPortrait(keyBody, npcState);
      const fb = SPR.npc[keyBody] ? SPR.npc[keyBody].down[Math.floor(now/450)%2] : null;
      const bob = activeTalk
        ? (Math.sin(now/180 + n.x) * tp*0.022 + tp*0.034)
        : (nearPlayer ? Math.sin(now/520 + n.x) * tp*0.018 + tp*0.020 : Math.sin(now/760 + n.x) * tp*0.012 + tp*0.014);
      const tune = npcTune[keyBody] || { scale:0.92, yOffset:0 };
      let dir = 2;
      if (nearPlayer || activeTalk){
        const dx = p.x - n.x, dy = p.y - n.y;
        if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) dir = dx < 0 ? 4 : 6;
      }
      if (activeTalk){
        ctx.save();
        ctx.globalAlpha = 0.16 + 0.10*Math.abs(Math.sin(now/180));
        ctx.fillStyle = "#ffd24a";
        ctx.beginPath();
        ctx.ellipse((n.x+0.5)*tp, (n.y+0.92)*tp, tp*0.40, tp*0.12, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
      this._drawActor(ctx, n.x, n.y + tune.yOffset, tp, portrait, { dir, bob, fallback:fb, scale:tune.scale + (activeTalk ? 0.035 : 0) });
      if (activeTalk){
        this._drawSpeakerMarker(ctx, n.x, n.y + tune.yOffset, tp, UI.talkingName || n.name, now);
      } else if (this._villageObjectiveNpcId() === n.id){
        this._drawObjectiveMarker(ctx, n.x, n.y + tune.yOffset, tp, now);
      }
      // 会話可能マーク
      if (nearPlayer && !activeTalk){
        const mx = (n.x+0.5)*tp, my = (n.y-0.98)*tp - Math.sin(now/250)*2.5;
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = "#fff6d8";
        ctx.font = `bold ${Math.round(tp*.42)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("▼", mx, my);
        ctx.restore();
        ctx.textAlign = "left";
      }
    }
  },

  _drawDungeon(ctx, x0, x1, y0, y1, tp, now, frame){
    const st = this.st, d = st.dungeon, vis = st.visible;
    // 床・壁を画像タイルで(なければコード生成)
    for (let y = Math.max(0,y0); y <= Math.min(d.H-1,y1); y++){
      for (let x = Math.max(0,x0); x <= Math.min(d.W-1,x1); x++){
        if (!d.explored[y][x]) continue;
        const t = d.map[y][x];
        const inSight = vis[y][x];
        ctx.globalAlpha = inSight ? 1 : .4;
        if (t === T.WALL){
          const wt = wallTile(d, x, y);
          if (wt && wt.img){
            if (wt.rot){
              const cx = x*tp + tp/2, cy = y*tp + tp/2;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(wt.rot);
              ctx.drawImage(wt.img, -tp/2, -tp/2, tp, tp);
              ctx.restore();
            } else {
              ctx.drawImage(wt.img, x*tp, y*tp, tp, tp);
            }
          } else {
            ctx.drawImage(tileSprite("dwall", x, y), x*tp, y*tp, tp, tp);
          }
          ctx.globalAlpha = 1;
          continue;
        }
        let img = null;
        if (t === T.STAIRS) img = stairsImage(!!d.liftUp);
        else if (t === T.PEDESTAL) img = pedestalImage();
        else img = floorImageFor(x,y);
        if (img){
          ctx.drawImage(img, x*tp, y*tp, tp, tp);
          if (t === T.FLOOR || t === T.CORRIDOR){
            const dc = decorFor(x,y);
            if (dc) ctx.drawImage(dc, x*tp + tp*0.1, y*tp + tp*0.1, tp*0.8, tp*0.8);
          }
        } else {
          const kind = t === T.STAIRS ? "stairs" : t === T.PEDESTAL ? "pedestal" : "dfloor";
          ctx.drawImage(tileSprite(kind, x, y), x*tp, y*tp, tp, tp);
        }
        ctx.globalAlpha = 1;
      }
    }
    // 罠(発見済み)
    for (const tr of d.traps){
      if (!tr.revealed || !d.explored[tr.y][tr.x]) continue;
      ctx.globalAlpha = vis[tr.y][tr.x] ? 1 : .4;
      ctx.fillStyle = "#f5a623";
      const cx = tr.x*tp + tp/2, cy = tr.y*tp + tp/2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - tp*.22);
      ctx.lineTo(cx - tp*.2, cy + tp*.16);
      ctx.lineTo(cx + tp*.2, cy + tp*.16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1a1410";
      ctx.fillRect(cx-1, cy-tp*.08, 2, tp*.12);
      ctx.globalAlpha = 1;
    }
    // 台座のコア(強く発光: 最重要インタラクト)
    if (d.pedestal){
      const [px2, py2] = d.pedestal;
      if (d.explored[py2][px2]){
        const cx = (px2+0.5)*tp, cy = (py2+0.5)*tp;
        // 床からのにじみ光
        const pulse = .55 + .45 * Math.sin(now/220);
        const grad = ctx.createRadialGradient(cx, cy, tp*0.1, cx, cy, tp*1.6);
        grad.addColorStop(0, `rgba(61,218,215,${0.32*pulse})`);
        grad.addColorStop(1, "rgba(61,218,215,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - tp*1.6, cy - tp*1.6, tp*3.2, tp*3.2);
        ctx.globalAlpha = 0.7 + 0.3*Math.sin(now/200);
        ctx.drawImage(itemSprite("aquaCore"), px2*tp + tp*.25, py2*tp - tp*.32 - Math.sin(now/300)*2, tp*.5, tp*.5);
        ctx.globalAlpha = 1;
      }
    }
    // 床の道具(発光リングで「拾える物」と明示)
    for (const gi of d.groundItems){
      if (!d.explored[gi.y][gi.x]) continue;
      const seen = vis[gi.y][gi.x];
      ctx.globalAlpha = seen ? 1 : .4;
      const cx = (gi.x+0.5)*tp, cy = (gi.y+0.5)*tp;
      const bob = Math.sin(now/360 + gi.x*2 + gi.y) * tp*0.05;
      // アイテムの種別色で淡い発光(視界内のみ)
      if (seen){
        const cat = ITEMS[gi.item.id] ? ITEMS[gi.item.id].cat : "device";
        const glowCol = ({food:"255,200,90", med:"120,220,160", chip:"61,218,215",
                          rod:"255,160,80", throw:"255,120,90", weapon:"255,180,90",
                          armor:"140,200,255", quest:"61,218,215"})[cat] || "255,210,120";
        const gp = .45 + .35*Math.sin(now/260 + gi.x);
        const grad = ctx.createRadialGradient(cx, cy, tp*0.05, cx, cy, tp*0.7);
        grad.addColorStop(0, `rgba(${glowCol},${0.5*gp})`);
        grad.addColorStop(1, `rgba(${glowCol},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - tp*0.7, cy - tp*0.7, tp*1.4, tp*1.4);
        // 足元の小さな光リング
        ctx.strokeStyle = `rgba(${glowCol},${0.6*gp})`;
        ctx.lineWidth = Math.max(1, tp*0.04);
        ctx.beginPath();
        ctx.ellipse(cx, (gi.y+0.82)*tp, tp*0.28, tp*0.1, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      const img = itemImage(gi.item.id);
      if (img){
        ctx.drawImage(img, gi.x*tp + tp*.18, gi.y*tp + tp*.1 - bob, tp*.64, tp*.64);
      } else {
        ctx.drawImage(itemSprite(gi.item.id), gi.x*tp + tp*.18, gi.y*tp + tp*.16 - bob, tp*.64, tp*.64);
      }
      // 上昇するきらめき粒
      if (seen){
        const tw = (now/90 + gi.x*3 + gi.y*7) % 7;
        if (tw < 1.4){
          ctx.globalAlpha = (1.4 - tw) * 0.8;
          ctx.fillStyle = "#fff6d8";
          ctx.fillRect(cx + Math.sin(now/200+gi.x)*tp*0.2, (gi.y+0.3)*tp - tw*tp*0.12, 2, 2);
          ctx.globalAlpha = seen ? 1 : .4;
        }
      }
      ctx.globalAlpha = 1;
    }
    // 階段・リフト(インタラクト可能: 明るい輪郭パルス)
    this._highlightInteractive(ctx, d, tp, now, vis);
  },

  // インタラクト可能タイル(階段/リフト)に強調パルスを描く
  _highlightInteractive(ctx, d, tp, now, vis){
    for (let y = 0; y < d.H; y++){
      const row = d.map[y];
      for (let x = 0; x < d.W; x++){
        if (row[x] !== T.STAIRS) continue;
        if (!d.explored[y][x] || !vis[y][x]) continue;
        const cx = (x+0.5)*tp, cy = (y+0.5)*tp;
        const col = d.liftUp ? "255,210,74" : "245,166,35";
        const gp = .5 + .5*Math.sin(now/300);
        const grad = ctx.createRadialGradient(cx, cy, tp*0.1, cx, cy, tp*1.3);
        grad.addColorStop(0, `rgba(${col},${0.28*gp})`);
        grad.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - tp*1.3, cy - tp*1.3, tp*2.6, tp*2.6);
        // 矢印(降りる=▼ / 帰還=▲)
        ctx.globalAlpha = gp;
        ctx.fillStyle = `rgb(${col})`;
        ctx.font = `bold ${Math.round(tp*0.42)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(d.liftUp ? "\u25b2" : "\u25bc", cx, cy - tp*0.5 - Math.sin(now/250)*2);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
    }
  },

  // ダンジョンの立ち絵(敵 + プレイヤー)を足元Yでソート
  _drawActorsDungeon(ctx, tp, now, frame){
    const st = this.st, d = st.dungeon, vis = st.visible, p = st.player;
    const actors = [];
    for (const e of d.enemies){
      if (!vis[e.y] || !vis[e.y][e.x]) continue;
      e.anim.fx += (e.x - e.anim.fx) * 0.35;
      e.anim.fy += (e.y - e.anim.fy) * 0.35;
      if (Math.abs(e.x-e.anim.fx)<.02) e.anim.fx=e.x;
      if (Math.abs(e.y-e.anim.fy)<.02) e.anim.fy=e.y;
      actors.push({ kind:"enemy", e, y:e.anim.fy });
    }
    actors.push({ kind:"player", y:p.anim.fy });
    actors.sort((a,b)=>a.y-b.y);
    for (const a of actors){
      if (a.kind === "player"){ this._drawPlayer(ctx, tp, now); continue; }
      this._drawEnemy(ctx, a.e, tp, now, frame);
    }
  },

  _drawEnemy(ctx, e, tp, now, frame){
    const def = ENEMIES[e.id];
    const moving = Math.abs(e.x - e.anim.fx) > .03 || Math.abs(e.y - e.anim.fy) > .03;
    const portrait = enemyPortrait(e.id);
    const fbs = (e.primed && SPR.enemy[e.id+"_primed"]) ? SPR.enemy[e.id+"_primed"] : SPR.enemy[e.id];
    const fb = fbs ? fbs[frame] : null;
    const isBoss = def.ai === "boss";
    const tune = ENEMY_RENDER_TUNE[e.id] || {};
    const scaleBase = isBoss ? 1.5 : (def.body === "golem" || def.body === "arm" || def.body === "grendel" || e.id === "coreDefender" || e.id === "dismantler" ? 1.18 : 0.95);
    const scale = scaleBase * (tune.scale || 1);
    const drawFy = e.anim.fy + (tune.yOffset || 0);
    let lungeT = null, lungeDir = null;
    if (e.lunge){
      lungeT = (now - e.lunge.t0) / CONFIG.ATTACK_MS;
      lungeDir = e.lunge.dir;
      if (lungeT >= 1) e.lunge = null;
    }
    const bob = moving ? Math.abs(Math.sin(now/100 + e.x)) * tp*0.10 : Math.sin(now/580 + e.y) * tp*0.018;
    // 被弾フラッシュ量
    const fl = this.effects.find(f => f.type==="flash" && f.target===e);
    const flash = fl ? (1 - (now-fl.t0)/fl.dur) : 0;
    // 自爆予兆: 赤く明滅
    const baseAlpha = (e.id === "camouflageUnit" && !e.awake && dist8(e.x, e.y, this.st.player.x, this.st.player.y) > 1) ? (0.35 + 0.1*Math.sin(now/110)) : 1;
    if (e.primed){ ctx.globalAlpha = (0.6 + 0.4*Math.abs(Math.sin(now/80))) * baseAlpha; }
    else ctx.globalAlpha = baseAlpha;
    this._drawActor(ctx, e.anim.fx, drawFy, tp, portrait, {
      dir: e.dir, bob, lungeT, lungeDir, flash, fallback: fb, scale,
    });
    ctx.globalAlpha = 1;
    const footX = (e.anim.fx+0.5)*tp, footY = (drawFy+0.95)*tp;
    const dh = tp*1.25*scale, dw = portrait ? dh*(portrait.width/portrait.height) : tp*scale;
    // primed の赤オーバーレイ
    if (e.primed && portrait){
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.3*Math.abs(Math.sin(now/80));
      ctx.fillStyle = "#ff5d4d";
      ctx.fillRect(footX-dw/2, footY-dh, dw, dh);
      const ring = tp * (0.16 + 0.10*Math.abs(Math.sin(now/80)));
      ctx.strokeStyle = "rgba(255,93,77,.95)";
      ctx.lineWidth = Math.max(2, tp*0.05);
      ctx.beginPath();
      ctx.ellipse(footX, footY-2, ring*1.4, ring*.68, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    // 展開シールドのバリア表示
    if (e.shieldTurns > 0){
      const pulse = 0.5 + 0.5*Math.sin(now/150 + e.x + e.y);
      const rx = Math.max(tp*0.42, dw*0.43), ry = Math.max(tp*0.54, dh*0.48);
      const cy = footY - dh*0.54;
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.06*pulse;
      ctx.fillStyle = "#8fd0ff";
      ctx.beginPath();
      ctx.ellipse(footX, cy, rx, ry, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = `rgba(143,208,255,${0.70 + 0.18*pulse})`;
      ctx.lineWidth = Math.max(2, tp*0.045);
      ctx.beginPath();
      ctx.ellipse(footX, cy, rx, ry, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = `rgba(216,245,255,${0.4 + 0.25*pulse})`;
      ctx.beginPath();
      ctx.ellipse(footX, cy, rx*0.78, ry*0.78, 0, 0, Math.PI*2);
      ctx.stroke();
      for (let i=0; i<6; i++){
        const a = (Math.PI*2/6)*i + now/900;
        const x = footX + Math.cos(a)*rx*0.9;
        const y = cy + Math.sin(a)*ry*0.9;
        ctx.fillStyle = "rgba(216,245,255,.8)";
        ctx.fillRect(x-1.5, y-1.5, 3, 3);
      }
      ctx.restore();
    }
    // 補給中バフの軽いオーラ
    if (e.buffTurns > 0){
      const pulse = 0.55 + 0.45*Math.sin(now/170 + e.x*0.7);
      ctx.save();
      ctx.globalAlpha = 0.26 + 0.08*pulse;
      ctx.strokeStyle = "#ffd24a";
      ctx.lineWidth = Math.max(2, tp*0.04);
      ctx.beginPath();
      ctx.arc(footX, footY-2, tp*(0.20 + 0.02*pulse), 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

if (e.id === "scoutEye"){
  const pulse = 0.45 + 0.35*Math.sin(now/160 + e.x);
  ctx.save();
  ctx.strokeStyle = `rgba(61,218,215,${0.28 + pulse*0.18})`;
  ctx.lineWidth = Math.max(1, tp*0.03);
  ctx.beginPath();
  ctx.ellipse(footX, footY-2, tp*0.58, tp*0.22, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();
}
if (e.id === "camouflageUnit" && !e.awake){
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.08*Math.sin(now/90);
  ctx.strokeStyle = "#c08bff";
  ctx.setLineDash([tp*0.12, tp*0.08]);
  ctx.beginPath();
  ctx.ellipse(footX, footY-dh*0.56, dw*0.42, dh*0.34, 0, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();
}
    // HPバー(立ち絵の頭上)
    if (e.hp < e.maxHp){
      const w = tp * .8, hx = (e.anim.fx+0.5)*tp - w/2, hy = (drawFy+0.95)*tp - dh - 4;
      ctx.fillStyle = "rgba(10,12,14,.85)"; ctx.fillRect(hx-1, hy-1, w+2, 5);
      ctx.fillStyle = e.hp/e.maxHp > .5 ? "#7ed47e" : e.hp/e.maxHp > .25 ? "#f5a623" : "#ff5d4d";
      ctx.fillRect(hx, hy, w * Math.max(0, e.hp/e.maxHp), 3);
    }
    // 名前(ボスのみ常時)
    if (isBoss){
      ctx.fillStyle = "#ffd24a";
      ctx.font = `bold ${Math.round(tp*.28)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(def.name, (e.anim.fx+0.5)*tp, (drawFy+0.95)*tp - tp*1.25*scale - 8);
      ctx.textAlign = "left";
    }
    // スタン表示
    if (e.stun > 0){
      ctx.fillStyle = "#9fe08a";
      ctx.font = `bold ${Math.round(tp*.4)}px monospace`;
      const zx = (e.anim.fx+0.7)*tp, zy = (drawFy+0.2)*tp + Math.sin(now/200)*3;
      ctx.fillText("z", zx, zy);
    }
  },

  _drawEffects(ctx, tp, now){
    for (const f of this.effects.slice()){
      const t = (now - f.t0) / f.dur;
      if (t >= 1){
        this.effects.splice(this.effects.indexOf(f), 1);
        continue;
      }
      if (f.type === "pop"){
        ctx.globalAlpha = 1 - t*t;
        ctx.fillStyle = f.color;
        ctx.font = `bold ${Math.round(tp*.42)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x*tp + tp/2, f.y*tp - t*tp*.5 + tp*.2);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      } else if (f.type === "meleeArc"){
        const x1 = f.x1*tp + tp/2, y1 = f.y1*tp + tp/2;
        const x2 = f.x2*tp + tp/2, y2 = f.y2*tp + tp/2;
        const mx = (x1+x2)/2, my = (y1+y2)/2;
        const dx = x2-x1, dy = y2-y1;
        const len = Math.max(1, Math.hypot(dx,dy));
        const nx = -dy/len, ny = dx/len;
        ctx.save();
        ctx.globalAlpha = (1-t) * (f.strong ? 0.92 : 0.55);
        ctx.strokeStyle = f.color || "#fff6d8";
        ctx.lineWidth = Math.max(2, tp*(f.strong ? 0.074 : 0.046));
        ctx.beginPath();
        ctx.moveTo(x1 + dx*0.20, y1 + dy*0.20);
        ctx.quadraticCurveTo(mx + nx*tp*0.24*Math.sin(t*Math.PI), my + ny*tp*0.24*Math.sin(t*Math.PI), x2 - dx*0.20, y2 - dy*0.20);
        ctx.stroke();
        ctx.globalAlpha *= 0.45;
        ctx.lineWidth = Math.max(1, tp*0.022);
        ctx.beginPath();
        ctx.moveTo(x1 + dx*0.32, y1 + dy*0.32);
        ctx.lineTo(x2 - dx*0.25, y2 - dy*0.25);
        ctx.stroke();
        ctx.restore();
      } else if (f.type === "hitImpact"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp*0.42;
        ctx.save();
        ctx.globalAlpha = (1-t) * 0.85;
        ctx.strokeStyle = f.color || "#fff6d8";
        ctx.lineWidth = Math.max(2, tp*0.050);
        for (let i=0;i<6;i++){
          const a = (Math.PI*2*i/6) + t*0.5;
          const r1 = tp*(0.07 + t*0.10);
          const r2 = tp*(0.19 + t*0.26);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1);
          ctx.lineTo(cx + Math.cos(a)*r2, cy + Math.sin(a)*r2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (f.type === "burst"){
        ctx.fillStyle = f.hue;
        ctx.globalAlpha = 1 - t;
        for (const pt of f.parts){
          const r = t * pt.sp * tp * .9;
          ctx.fillRect(f.x*tp + tp/2 + Math.cos(pt.a)*r, f.y*tp + tp/2 + Math.sin(pt.a)*r, pt.r*2, pt.r*2);
        }
        ctx.globalAlpha = 1;
      } else if (f.type === "boom"){
        const r = t * tp * 1.4;
        ctx.globalAlpha = (1 - t) * .8;
        ctx.fillStyle = "#ffb36b";
        ctx.beginPath();
        ctx.arc(f.x*tp + tp/2, f.y*tp + tp/2, r, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#fff6d8";
        ctx.beginPath();
        ctx.arc(f.x*tp + tp/2, f.y*tp + tp/2, r*.55, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (f.type === "healLink"){
        const x1 = f.x1*tp + tp/2, y1 = f.y1*tp + tp/2;
        const x2 = f.x2*tp + tp/2, y2 = f.y2*tp + tp/2;
        ctx.strokeStyle = `rgba(159,224,138,${0.85*(1-t)})`;
        ctx.lineWidth = Math.max(2, tp*0.08);
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
        const bx = x1 + (x2-x1)*t, by = y1 + (y2-y1)*t;
        ctx.fillStyle = "#d8ffd0";
        ctx.globalAlpha = 1 - t*.35;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(2, tp*0.12), 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (f.type === "healPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const r = tp * (0.12 + t*0.5);
        ctx.globalAlpha = 0.9*(1-t);
        ctx.strokeStyle = "#9fe08a";
        ctx.lineWidth = Math.max(2, tp*0.06);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx-r*.45, cy); ctx.lineTo(cx+r*.45, cy);
        ctx.moveTo(cx, cy-r*.45); ctx.lineTo(cx, cy+r*.45);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.type === "alarmPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const r = tp * ((f.strong ? 0.18 : 0.10) + t*(f.strong ? 1.05 : 0.75));
        ctx.globalAlpha = (1-t) * (f.strong ? 0.9 : 0.65);
        ctx.strokeStyle = f.strong ? "#ff7c69" : "#ff5d4d";
        ctx.lineWidth = Math.max(2, tp*(f.strong ? 0.07 : 0.05));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.stroke();
        if (f.strong){
          ctx.beginPath();
          ctx.arc(cx, cy, r*0.6, 0, Math.PI*2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (f.type === "supplyLink"){
        const x1 = f.x1*tp + tp/2, y1 = f.y1*tp + tp/2;
        const x2 = f.x2*tp + tp/2, y2 = f.y2*tp + tp/2;
        ctx.save();
        ctx.strokeStyle = `rgba(255,210,74,${0.9*(1-t)})`;
        ctx.lineWidth = Math.max(2, tp*0.07);
        ctx.setLineDash([tp*0.12, tp*0.08]);
        ctx.lineDashOffset = -t*tp*0.7;
        ctx.beginPath();
        ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.stroke();
        ctx.restore();
        const bx = x1 + (x2-x1)*t, by = y1 + (y2-y1)*t;
        ctx.globalAlpha = 1-t*0.35;
        ctx.fillStyle = "#fff1a8";
        ctx.fillRect(bx-tp*0.08, by-tp*0.08, tp*0.16, tp*0.16);
        ctx.globalAlpha = 1;
      } else if (f.type === "supplyPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const r = tp * (0.12 + t*0.55);
        ctx.save();
        ctx.globalAlpha = 0.85*(1-t);
        ctx.strokeStyle = "#ffd24a";
        ctx.lineWidth = Math.max(2, tp*0.06);
        ctx.strokeRect(cx-r*0.55, cy-r*0.55, r*1.1, r*1.1);
        ctx.beginPath();
        ctx.arc(cx, cy, r*0.7, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      } else if (f.type === "shieldLink"){
        const x1 = f.x1*tp + tp/2, y1 = f.y1*tp + tp/2;
        const x2 = f.x2*tp + tp/2, y2 = f.y2*tp + tp/2;
        ctx.save();
        ctx.strokeStyle = `rgba(143,208,255,${0.9*(1-t)})`;
        ctx.lineWidth = Math.max(2, tp*0.06);
        ctx.beginPath();
        ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
        ctx.stroke();
        for (let i=0; i<3; i++){
          const q = (t + i*0.22) % 1;
          const px = x1 + (x2-x1)*q, py = y1 + (y2-y1)*q;
          ctx.fillStyle = "rgba(216,245,255,.95)";
          ctx.fillRect(px-1.5, py-1.5, 3, 3);
        }
        ctx.restore();
      } else if (f.type === "shieldPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const rx = tp * (0.18 + t*0.65), ry = tp * (0.22 + t*0.82);
        ctx.save();
        ctx.globalAlpha = 0.85*(1-t);
        ctx.strokeStyle = "#8fd0ff";
        ctx.lineWidth = Math.max(2, tp*0.06);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx*0.72, ry*0.72, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      } else if (f.type === "scrapImpact"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        ctx.save();
        ctx.globalAlpha = 0.75*(1-t);
        ctx.strokeStyle = "#d9a86b";
        ctx.lineWidth = Math.max(2, tp*0.05);
        ctx.beginPath();
        ctx.arc(cx, cy, tp*(0.14 + 0.45*t), 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = "#caa25a";
        for (const pt of f.parts){
          const r = tp * 0.12 + t * pt.sp * tp * 0.7;
          const px = cx + Math.cos(pt.a)*r;
          const py = cy + Math.sin(pt.a)*r - Math.sin(t*Math.PI)*tp*0.08;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(pt.a + t*4);
          ctx.fillRect(-pt.w*0.35, -pt.r, pt.w*0.7, pt.r*2);
          ctx.restore();
        }
        ctx.restore();
      } else if (f.type === "scanPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const sprite = fxSprite("holoScan");
        ctx.save();
        if (sprite){
          ctx.globalAlpha = 0.82 * (1 - t*0.45);
          const s = tp * (1.35 + t*0.35);
          ctx.drawImage(sprite, cx - s/2, cy - s/2, s, s);
        }
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.strokeStyle = f.found ? "#3ddad7" : "#7bd1d0";
        ctx.lineWidth = Math.max(2, tp*0.05);
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.25 + t*0.85), 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      } else if (f.type === "appearPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.75;
        ctx.strokeStyle = "#c08bff";
        ctx.lineWidth = Math.max(2, tp*0.07);
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.18 + t*0.65), 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      } else if (f.type === "splitPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.72;
        ctx.strokeStyle = "#d8d2c4";
        ctx.lineWidth = Math.max(2, tp*0.06);
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.16 + t*0.75), 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.10 + t*0.42), 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      } else if (f.type === "mistCloud"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const sprite = fxSprite("toxicSmoke") || fxSprite("pollution");
        ctx.save();
        ctx.globalAlpha = 0.92 * (1 - t*0.25);
        if (sprite){
          const s = tp * (1.9 + Math.sin(t*Math.PI)*0.45);
          ctx.drawImage(sprite, cx - s/2, cy - s/2, s, s);
        }
        ctx.restore();
      } else if (f.type === "coldPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const sprite = fxSprite("frostBurst");
        ctx.save();
        ctx.globalAlpha = 0.95 * (1 - t*0.18);
        if (sprite){
          const s = tp * (2.0 + Math.sin(t*Math.PI)*0.35);
          ctx.drawImage(sprite, cx - s/2, cy - s/2, s, s);
        }
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.strokeStyle = "#c8f0ff";
        ctx.lineWidth = Math.max(2, tp*0.05);
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.22 + t*0.85), 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      } else if (f.type === "magnetBeam"){
        const x1 = f.x1*tp + tp/2, y1 = f.y1*tp + tp/2;
        const x2 = f.x2*tp + tp/2, y2 = f.y2*tp + tp/2;
        ctx.save();
        ctx.strokeStyle = `rgba(255,210,74,${0.85*(1-t)})`;
        ctx.lineWidth = Math.max(2, tp*0.08);
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        const mx = (x1+x2)/2 + Math.sin(t*Math.PI)*tp*0.25;
        const my = (y1+y2)/2 - Math.cos(t*Math.PI)*tp*0.15;
        ctx.quadraticCurveTo(mx, my, x2, y2);
        ctx.stroke();
        ctx.restore();
      } else if (f.type === "magnetPulse"){
        const cx = f.x*tp + tp/2, cy = f.y*tp + tp/2;
        const sprite = fxSprite("goldenWave");
        ctx.save();
        ctx.globalAlpha = 0.9 * (1 - t*0.2);
        if (sprite){
          const s = tp * (1.7 + t*0.65);
          ctx.drawImage(sprite, cx - s/2, cy - s/2, s, s);
        }
        ctx.globalAlpha = (1-t) * 0.75;
        ctx.strokeStyle = "#ffd24a";
        ctx.lineWidth = Math.max(2, tp*0.05);
        ctx.beginPath(); ctx.arc(cx, cy, tp*(0.18 + t*0.95), 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      } else if (f.type === "proj"){
        const x = f.x1 + (f.x2 - f.x1) * t, y = f.y1 + (f.y2 - f.y1) * t;
        if (f.sprite){
          ctx.drawImage(f.sprite, x*tp + tp*.2, y*tp + tp*.2 - Math.sin(t*Math.PI)*tp*.4, tp*.6, tp*.6);
        } else {
          ctx.fillStyle = f.color;
          ctx.fillRect(x*tp + tp*.4, y*tp + tp*.4, tp*.22, tp*.22);
          ctx.globalAlpha = .5;
          ctx.fillRect((f.x1 + (f.x2-f.x1)*Math.max(0,t-.12))*tp + tp*.42, (f.y1 + (f.y2-f.y1)*Math.max(0,t-.12))*tp + tp*.42, tp*.16, tp*.16);
          ctx.globalAlpha = 1;
        }
      }
    }
  },
};

window.addEventListener("DOMContentLoaded", () => GAME.boot());
