// ============================================================
// 入力: タップ=方向移動 / 長押し=連続 / ダブルタップ=ダッシュ
//        キーボード(矢印・テンキー・viキー)対応
// ============================================================
"use strict";
const INPUT = {
  canvas: null,
  holdTimer: null, holdDir: 0,
  lastTapTime: 0, lastTapDir: 0,
  enabled: true,

  init(canvas, handlers){
    this.canvas = canvas;
    this.h = handlers; // { step(dir), dash(dir), foot(), canAct() }

    canvas.addEventListener("pointerdown", e => {
      e.preventDefault();
      AUDIO.init(); AUDIO.resume();
      if (!this.enabled || !this.h.canAct()) return;
      const dir = this._dirFromEvent(e);
      const now = performance.now();
      if (dir === 0){
        this.h.foot();
        return;
      }
      // ダブルタップ判定
      if (now - this.lastTapTime < 280 && this.lastTapDir === dir){
        this.lastTapTime = 0;
        this.h.dash(dir);
        return;
      }
      this.lastTapTime = now;
      this.lastTapDir = dir;
      this.h.step(dir);
      // 長押しリピート
      this.holdDir = dir;
      clearInterval(this.holdTimer);
      this.holdTimer = setInterval(() => {
        if (!this.enabled || !this.h.canAct()){ return; }
        // 指の現在位置から方向を更新できないため、押下時の方向を継続
        this.h.step(this.holdDir);
      }, 60);
    }, { passive:false });

    const stopHold = () => { clearInterval(this.holdTimer); this.holdTimer = null; };
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

  // タップ位置→方向: プレイヤーの画面位置を中心に8方向+中央
  _dirFromEvent(e){
    const r = this.canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const c = GAME.playerScreenPos(); // {x,y} CSSピクセル
    const dx = px - c.x, dy = py - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CONFIG.TILE * GAME.cssScale * 0.55) return 0; // 自分タップ=足元
    const ang = Math.atan2(dy, dx); // -PI..PI
    const oct = Math.round(ang / (Math.PI/4)); // -4..4
    const table = { "-4":4, "-3":7, "-2":8, "-1":9, "0":6, "1":3, "2":2, "3":1, "4":4 };
    return table[String(oct)];
  },
};
