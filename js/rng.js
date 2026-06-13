// ============================================================
// 乱数・ユーティリティ
// ============================================================
"use strict";
const RNG = {
  _s: (Date.now() ^ 0x9e3779b9) >>> 0,
  seed(n){ this._s = n >>> 0; },
  next(){ // mulberry32
    this._s = (this._s + 0x6D2B79F5) >>> 0;
    let t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  int(a, b){ return a + Math.floor(this.next() * (b - a + 1)); }, // a..b inclusive
  pick(arr){ return arr[Math.floor(this.next() * arr.length)]; },
  chance(p){ return this.next() < p; },
  shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};
// タイル座標ごとの安定ハッシュ(床の模様ゆらぎ用・乱数列を消費しない)
function tileHash(x, y, salt){
  let h = (x * 374761393 + y * 668265263 + (salt||0) * 2147483647) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function dist8(ax, ay, bx, by){ return Math.max(Math.abs(ax-bx), Math.abs(ay-by)); }
