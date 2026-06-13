// ============================================================
// 入力: タップ=方向移動 / 長押し=連続(指スライドで方向転換) / 3回タップ=ダッシュ
//        キーボード(矢印・テンキー・viキー)対応
// ============================================================
"use strict";
const INPUT = {
  canvas: null,
  holdTimer: null, holdDir: 0, holding: false,
  pointerX: 0, pointerY: 0, pointerDown: false,
  tapCount: 0, tapDir: 0, lastTapTime: 0,
  HOLD_DELAY: 340,   // 押してから連続移動が始まるまでの猶予(ms)
  HOLD_STEP: 165,    // 連続移動の1歩あたりの最短間隔(ms)
  TAP_WINDOW: 320,   // 連続タップとみなす間隔(ms)。3回でダッシュ
  DEADZONE: 0.42,    // 自分中心からこの割合(タイル比)以内のタップは「足元」
  enabled: true,

  _stopHold(){
    this.holding = false;
    if (this.holdTimer){ clearTimeout(this.holdTimer); this.holdTimer = null; }
  },
  // 指を離すまで、行動可能になるたび1歩ずつ。方向は「現在の指の位置」で都度判定(スライド対応)
  _holdTick(){
    if (!this.holding || !this.enabled || !this.pointerDown){ this._stopHold(); return; }
    if (this.h.canAct()){
      // 指の現在位置から方向を再計算(スライドで方向転換できる)
      const dir = this._dirFromXY(this.pointerX, this.pointerY);
      if (dir !== 0){
        this.holdDir = dir;
        this.h.step(dir);
      }
      this.holdTimer = setTimeout(() => this._holdTick(), this.HOLD_STEP);
    } else {
      this.holdTimer = setTimeout(() => this._holdTick(), 30);
    }
  },

  init(canvas, handlers){
    this.canvas = canvas;
    this.h = handlers; // { step(dir), dash(dir), foot(), canAct() }

    canvas.addEventListener("pointerdown", e => {
      e.preventDefault();
      AUDIO.init(); AUDIO.resume();
      this.pointerDown = true;
      this._updatePointer(e);
      if (!this.enabled || !this.h.canAct()) return;
      const dir = this._dirFromEvent(e);
      const now = performance.now();
      if (dir === 0){
        this.h.foot();
        return;
      }
      // 連続タップのカウント(同方向のみ加算)
      if (now - this.lastTapTime < this.TAP_WINDOW && this.tapDir === dir){
        this.tapCount++;
      } else {
        this.tapCount = 1;
        this.tapDir = dir;
      }
      this.lastTapTime = now;
      // 3回目でダッシュ
      if (this.tapCount >= 3){
        this.tapCount = 0;
        this.lastTapTime = 0;
        this._stopHold();
        this.h.dash(dir);
        return;
      }
      // 通常の1歩
      this.h.step(dir);
      // 長押しリピート開始(押し続けている時のみ)
      this.holdDir = dir;
      this.holding = true;
      this._stopHold();
      this.holding = true;
      this.holdTimer = setTimeout(() => this._holdTick(), this.HOLD_DELAY);
    }, { passive:false });

    // 指の移動を追跡(スライドで方向転換)
    canvas.addEventListener("pointermove", e => {
      if (!this.pointerDown) return;
      this._updatePointer(e);
    }, { passive:true });

    const stopHold = () => { this.pointerDown = false; this._stopHold(); };
    canvas.addEventListener("pointerup", stopHold);
    canvas.addEventListener("pointercancel", stopHold);
    canvas.addEventListener("pointerleave", stopHold);

    // キーボード
    const KEYMAP = {
      ArrowUp:8, ArrowDown:2, ArrowLeft:4, ArrowRight:6,
      k:8, j:2, h:4, l:6, y:7, u:9, b:1, n:3,
      Home:7, PageUp:9, End:1, PageDown:3,
    };
    window.addEventListener("keydown", e => {
      if (!this.enabled) return;
      if (UI.talking){ if (e.key === "Enter" || e.key === " "){ UI.talkNext(); e.preventDefault(); } return; }
      if (!this.h.canAct()) return;
      const dir = KEYMAP[e.key];
      if (dir){
        e.preventDefault();
        if (e.shiftKey) this.h.dash(dir);
        else this.h.step(dir);
      } else if (e.key === "." || e.key === "s"){
        e.preventDefault(); this.h.wait();
      } else if (e.key === "Enter" || e.key === " "){
        e.preventDefault(); this.h.foot();
      } else if (e.key === "i"){
        e.preventDefault(); this.h.inv();
      }
    });
  },

  // ポインタのキャンバス内座標を保持(スライド方向転換に使用)
  _updatePointer(e){
    const r = this.canvas.getBoundingClientRect();
    this.pointerX = e.clientX - r.left;
    this.pointerY = e.clientY - r.top;
  },
  // タップ/指の画面座標 → 8方向 + 中央(0)。中央はデッドゾーン
  _dirFromXY(px, py){
    const c = GAME.playerScreenPos(); // {x,y} CSSピクセル
    const dx = px - c.x, dy = py - c.y;
    const dist = Math.hypot(dx, dy);
    // デッドゾーン: タイルの実表示サイズ基準
    const tile = (GAME.tilePx ? GAME.tilePx : CONFIG.TILE * GAME.cssScale);
    if (dist < tile * this.DEADZONE) return 0; // 足元
    const ang = Math.atan2(dy, dx);
    const oct = Math.round(ang / (Math.PI/4)); // -4..4
    const table = { "-4":4, "-3":7, "-2":8, "-1":9, "0":6, "1":3, "2":2, "3":1, "4":4 };
    return table[String(oct)];
  },
  _dirFromEvent(e){
    const r = this.canvas.getBoundingClientRect();
    return this._dirFromXY(e.clientX - r.left, e.clientY - r.top);
  },
};
