// ============================================================
// UI: ログ / HUD / ミニマップ / 道具 / ダイアログ / 会話
// ============================================================
"use strict";
const UI = {
  el: {},
  init(){
    const ids = ["hud-floor","hud-hp","hp-bar","hud-lv","belly-bar","log","objective",
      "inv-modal","inv-list","inv-actions","inv-desc","inv-modal-count","inv-count","hud-status",
      "dialog","dialog-text","dialog-buttons","talk","talk-name","talk-text",
      "floor-banner","minimap","menu-modal","dir-overlay","dir-msg","result-screen",
      "result-title","result-body"];
    for (const id of ids) this.el[id] = document.getElementById(id);
    this.mm = this.el["minimap"].getContext("2d");
  },

  // ---------- ログ ----------
  logLines: [],
  log(msg, cls){
    const div = document.createElement("div");
    div.className = "log-line";
    if (cls) div.innerHTML = `<span class="c-${cls}">${msg}</span>`;
    else div.textContent = msg;
    this.el["log"].appendChild(div);
    this.logLines.push(div);
    while (this.logLines.length > 4){
      const old = this.logLines.shift();
      old.remove();
    }
    this.logLines.forEach((d, i) => d.classList.toggle("old", i < this.logLines.length - 2));
    clearTimeout(this._logTimer);
    this._logTimer = setTimeout(() => {
      this.logLines.forEach(d => d.classList.add("old"));
    }, 4000);
  },
  clearLog(){
    this.logLines.forEach(d => d.remove());
    this.logLines = [];
  },

  // ---------- HUD ----------
  updateHud(st){
    const p = st.player;
    this.el["hud-floor"].textContent = st.mode === "village" ? "集落" : `B${st.floor}F`;
    this.el["hud-hp"].textContent = `${p.hp}/${p.maxHp}`;
    const ratio = p.hp / p.maxHp;
    const bar = this.el["hp-bar"];
    bar.style.width = `${ratio*100}%`;
    bar.classList.toggle("low", ratio <= .5 && ratio > .25);
    bar.classList.toggle("crit", ratio <= .25);
    this.el["hud-lv"].textContent = p.lv;
    this.el["belly-bar"].style.width = `${p.belly/CONFIG.HUNGER_MAX*100}%`;
    this.el["inv-count"].textContent = `${p.inv.length}/${CONFIG.INV_MAX}`;
    const hs = this.el["hud-status"];
    if (hs){
      const chips = [];
      if ((p.poisonTurns || 0) > 0) chips.push(`<span class="status-chip poison">毒 ${p.poisonTurns}T</span>`);
      if ((p.slowTurns || 0) > 0) chips.push(`<span class="status-chip slow">鈍足 ${p.slowTurns}T</span>`);
      if ((p.magnetizedTurns || 0) > 0) chips.push(`<span class="status-chip magnet">磁力 ${p.magnetizedTurns}T</span>`);
      hs.innerHTML = chips.join("");
      hs.classList.toggle("hidden", chips.length === 0);
    }
    this.el["objective"].textContent = objectiveFor(st);
  },

  // ---------- 階バナー ----------
  banner(main, sub, ms){
    const b = this.el["floor-banner"];
    b.innerHTML = `${main}${sub ? `<small>${sub}</small>` : ""}`;
    b.classList.remove("hidden");
    b.style.opacity = "1";
    clearTimeout(this._bnTimer);
    this._bnTimer = setTimeout(() => {
      b.style.transition = "opacity .45s";
      b.style.opacity = "0";
      setTimeout(() => { b.classList.add("hidden"); b.style.transition = ""; }, 460);
    }, ms || 1100);
  },

  // ---------- ミニマップ ----------
  drawMinimap(st){
    const cv = this.el["minimap"];
    if (st.mode !== "dungeon"){ cv.style.display = "none"; return; }
    cv.style.display = "block";
    const d = st.dungeon, sc = 4;          // 拡大(3→4)で見やすく
    const pad = 2;
    cv.width = d.W * sc + pad*2; cv.height = d.H * sc + pad*2;
    cv.style.width = `${cv.width}px`; cv.style.height = `${cv.height}px`;
    const g = this.mm;
    g.clearRect(0,0,cv.width,cv.height);
    const ox = pad, oy = pad;
    // 床・通路
    for (let y = 0; y < d.H; y++){
      for (let x = 0; x < d.W; x++){
        if (!d.explored[y][x]) continue;
        const t = d.map[y][x];
        if (t === T.WALL) continue;
        g.fillStyle = (t === T.CORRIDOR) ? "#39424b" : "#626d78";
        g.fillRect(ox+x*sc, oy+y*sc, sc, sc);
      }
    }
    const now = performance.now();
    const blink = (Math.sin(now/250) > 0);
    // アイテム(種別色のドット)
    for (const gi of d.groundItems){
      if (!d.explored[gi.y][gi.x]) continue;
      const cat = ITEMS[gi.item.id] ? ITEMS[gi.item.id].cat : "device";
      g.fillStyle = ({food:"#ffce5a", med:"#9be89b", chip:"#4fe8e4", rod:"#ffae50",
                      throw:"#ff785a", weapon:"#ffb45a", armor:"#8cc8ff", quest:"#4fe8e4"})[cat] || "#ffd24a";
      g.fillRect(ox+gi.x*sc+1, oy+gi.y*sc+1, sc-1, sc-1);
    }
    // 階段/リフト/コア台座(点滅アイコン)
    for (let y = 0; y < d.H; y++){
      for (let x = 0; x < d.W; x++){
        if (!d.explored[y][x]) continue;
        const t = d.map[y][x];
        if (t === T.STAIRS){
          g.fillStyle = blink ? (d.liftUp ? "#ffd24a" : "#ffb53d") : "#7a5a1a";
          g.fillRect(ox+x*sc-1, oy+y*sc-1, sc+2, sc+2);
        } else if (t === T.PEDESTAL){
          g.fillStyle = blink ? "#4fe8e4" : "#1a6a68";
          g.fillRect(ox+x*sc-1, oy+y*sc-1, sc+2, sc+2);
        }
      }
    }
    // 視界内の敵(ステーション敵は一回り大きく)
    for (const e of d.enemies){
      if (!(st.visible[e.y] && st.visible[e.y][e.x])) continue;
      const isBoss = ENEMIES[e.id] && ENEMIES[e.id].ai === "boss";
      g.fillStyle = isBoss ? "#ff3838" : (e.station ? "#ff785a" : "#ff5d4d");
      const s2 = isBoss ? sc+2 : sc;
      g.fillRect(ox+e.x*sc - (s2-sc)/2, oy+e.y*sc - (s2-sc)/2, s2, s2);
    }
    // 自分(向きの小矢印付き)
    g.fillStyle = "#fff6d8";
    g.fillRect(ox+st.player.x*sc-1, oy+st.player.y*sc-1, sc+2, sc+2);

    // ステーション起動中は枠を赤く点滅
    const active = d.station && d.station.triggered && d.enemies.some(e=>e.station);
    g.lineWidth = 2;
    g.strokeStyle = active ? (blink ? "#ff3838" : "#7a1a1a") : "rgba(184,137,63,0.6)";
    g.strokeRect(1, 1, cv.width-2, cv.height-2);
  },

  // ---------- 汎用ダイアログ ----------
  dialog(text, buttons){
    return new Promise(resolve => {
      this.el["dialog-text"].textContent = text;
      const bx = this.el["dialog-buttons"];
      bx.innerHTML = "";
      buttons.forEach((label, i) => {
        const b = document.createElement("button");
        b.textContent = label;
        b.onclick = () => {
          AUDIO.sfx("cursor");
          this.el["dialog"].classList.add("hidden");
          resolve(i);
        };
        bx.appendChild(b);
      });
      this.el["dialog"].classList.remove("hidden");
    });
  },

  // ---------- 会話 ----------
  talkQueue: null, talkResolve: null, talkName: "", talkLineIndex: 0, talkLineStartedAt: 0,
  talk(name, lines){
    return new Promise(resolve => {
      this.talkQueue = lines.slice();
      this.talkResolve = resolve;
      this.talkName = name;
      this.talkLineIndex = 0;
      this.talkLineStartedAt = performance.now();
      this.el["talk-name"].textContent = name;
      this.el["talk-text"].textContent = this.talkQueue.shift();
      this.el["talk"].classList.remove("hidden");
      AUDIO.sfx("talk");
    });
  },
  talkNext(){
    if (!this.talkResolve) return;
    if (this.talkQueue.length){
      this.talkLineIndex++;
      this.talkLineStartedAt = performance.now();
      this.el["talk-text"].textContent = this.talkQueue.shift();
      AUDIO.sfx("talk");
    } else {
      this.el["talk"].classList.add("hidden");
      const r = this.talkResolve;
      this.talkResolve = null;
      this.talkName = "";
      this.talkLineIndex = 0;
      r();
    }
  },
  get talking(){ return !!this.talkResolve; },
  get talkingName(){ return this.talkName || ""; },
  get talkPhase(){ return this.talking ? Math.max(0, performance.now() - (this.talkLineStartedAt || 0)) : 0; },

  // ---------- 道具 ----------
  invSel: -1,
  openInv(st, onAction){
    this.invSel = -1;
    this._renderInv(st, onAction);
    this.el["inv-modal"].classList.remove("hidden");
    AUDIO.sfx("cursor");
  },
  closeInv(){ this.el["inv-modal"].classList.add("hidden"); },
  get invOpen(){ return !this.el["inv-modal"].classList.contains("hidden"); },
  _renderInv(st, onAction){
    const p = st.player;
    const list = this.el["inv-list"];
    this.el["inv-modal-count"].textContent = `${p.inv.length}/${CONFIG.INV_MAX}`;
    list.innerHTML = "";
    if (!p.inv.length){
      list.innerHTML = `<div class="inv-empty">なにも持っていない</div>`;
    }
    p.inv.forEach((it, i) => {
      const def = ITEMS[it.id];
      const row = document.createElement("div");
      row.className = "inv-row" + (i === this.invSel ? " sel" : "");
      const ic = document.createElement("canvas");
      ic.width = 16; ic.height = 16;
      ic.getContext("2d").drawImage(itemSprite(it.id), 0, 0);
      row.appendChild(ic);
      const nm = document.createElement("span");
      nm.className = "inv-name";
      nm.textContent = itemName(it);
      row.appendChild(nm);
      if (p.weapon === it.uid || p.armor === it.uid){
        const eq = document.createElement("span");
        eq.className = "inv-eq"; eq.textContent = "装備中";
        row.appendChild(eq);
      }
      const tg = document.createElement("span");
      tg.className = "inv-tag"; tg.textContent = CAT_LABEL[def.cat];
      row.appendChild(tg);
      row.onclick = () => {
        AUDIO.sfx("cursor");
        this.invSel = (this.invSel === i) ? -1 : i;
        this._renderInv(st, onAction);
      };
      list.appendChild(row);
    });
    const act = this.el["inv-actions"];
    if (this.invSel >= 0 && p.inv[this.invSel]){
      const it = p.inv[this.invSel];
      const def = ITEMS[it.id];
      act.classList.remove("hidden");
      this.el["inv-desc"].textContent = def.desc;
      const useBtn = document.getElementById("ia-use");
      useBtn.textContent =
        def.cat === "food" ? "食べる" :
        def.cat === "weapon" || def.cat === "armor"
          ? ((st.player.weapon === it.uid || st.player.armor === it.uid) ? "外す" : "装備")
        : def.cat === "rod" ? "振る"
        : def.cat === "throw" ? "投げる"
        : "使う";
      useBtn.disabled = def.cat === "quest" || (def.cat === "throw");
      if (def.cat === "throw") useBtn.disabled = true;
      document.getElementById("ia-use").onclick = () => onAction("use", this.invSel);
      document.getElementById("ia-throw").onclick = () => onAction("throw", this.invSel);
      document.getElementById("ia-drop").onclick = () => onAction("drop", this.invSel);
    } else {
      act.classList.add("hidden");
    }
  },

  // ---------- 方向選択 ----------
  pickDir(msg){
    return new Promise(resolve => {
      this.el["dir-msg"].textContent = msg;
      this.el["dir-overlay"].classList.remove("hidden");
      const grid = this.el["dir-overlay"].querySelectorAll("button");
      grid.forEach(b => {
        b.onclick = () => {
          AUDIO.sfx("cursor");
          this.el["dir-overlay"].classList.add("hidden");
          const d = parseInt(b.dataset.d, 10);
          resolve(d === 0 ? null : d);
        };
      });
    });
  },

  // ---------- リザルト ----------
  showResult(title, body, dead){
    return new Promise(resolve => {
      this.el["result-title"].textContent = title;
      this.el["result-title"].classList.toggle("dead", !!dead);
      this.el["result-body"].textContent = body;
      this.el["result-screen"].classList.remove("hidden");
      document.getElementById("result-ok").onclick = () => {
        this.el["result-screen"].classList.add("hidden");
        resolve();
      };
    });
  },
};
