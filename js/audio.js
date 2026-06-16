// ============================================================
// WebAudio: 効果音 + チップチューンBGMシーケンサ(完全自己完結)
// ============================================================
"use strict";
const AUDIO = {
  ctx: null, muted: false, master: null,
  bgm: { timer:null, song:null, step:0, nextTime:0 },

  init(){
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch(e){ this.ctx = null; }
  },
  resume(){ if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
  toggleMute(){
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  // ---- 基本発音 ----
  tone(freq, dur, type, vol, t0, slide){
    if (!this.ctx) return;
    const t = t0 || this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(vol || .15, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, vol, t0, low){
    if (!this.ctx) return;
    const t = t0 || this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * (1 - i/n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol || .2;
    if (low){
      const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = low;
      s.connect(f); f.connect(g);
    } else s.connect(g);
    g.connect(this.master);
    s.start(t);
  },

  // ---- 効果音 ----
  sfx(name){
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch(name){
      case "swing":  this.noise(.07, .12, t, 1800); break;
      case "hit":    this.tone(320, .08, "square", .18, t, 140); this.noise(.05, .1, t); break;
      case "kill":   this.noise(.25, .25, t, 900); this.tone(110, .22, "sawtooth", .15, t, 40); break;
      case "hurt":   this.tone(150, .15, "sawtooth", .2, t, 60); this.noise(.08, .12, t, 600); break;
      case "miss":   this.tone(500, .06, "sine", .08, t, 420); break;
      case "pickup": this.tone(660, .07, "square", .1, t); this.tone(990, .09, "square", .1, t+.07); break;
      case "eat":    this.tone(220, .06, "square", .12, t); this.tone(180, .06, "square", .12, t+.08); this.tone(260, .08, "square", .12, t+.16); break;
      case "heal":   [523,659,784].forEach((f,i)=>this.tone(f,.1,"sine",.1,t+i*.06)); break;
      case "chip":   this.tone(880,.05,"square",.1,t); this.tone(1320,.05,"square",.08,t+.05); this.tone(1760,.08,"square",.06,t+.1); break;
      case "equip":  this.tone(330,.08,"square",.12,t); this.tone(440,.1,"square",.12,t+.08); break;
      case "throw":  this.tone(700,.1,"sine",.08,t,300); break;
      case "zap":    this.tone(1200,.15,"sawtooth",.14,t,200); this.noise(.1,.08,t,3000); break;
      case "boom":   this.noise(.4,.3,t,500); this.tone(70,.35,"sawtooth",.2,t,30); break;
      case "alarm":  // 警報クラクション(2回鳴る)
        this.tone(440,.18,"sawtooth",.16,t,660);
        this.tone(440,.18,"sawtooth",.16,t+.22,660);
        this.tone(330,.3,"square",.1,t+.05);
        this.noise(.5,.06,t,2000);
        break;
      case "stairs": [392,330,262,196].forEach((f,i)=>this.tone(f,.12,"triangle",.12,t+i*.09)); break;
      case "lvup":   [523,659,784,1047].forEach((f,i)=>this.tone(f,.12,"square",.1,t+i*.08)); break;
      case "trap":   this.tone(200,.12,"sawtooth",.15,t,90); break;
      case "warp":   this.tone(300,.3,"sine",.1,t,1200); break;
      case "talk":   this.tone(440,.04,"square",.07,t); break;
      case "cursor": this.tone(700,.03,"square",.06,t); break;
      case "deny":   this.tone(160,.1,"square",.12,t); this.tone(140,.12,"square",.12,t+.1); break;
      case "core":   [523,659,784,1047,1319].forEach((f,i)=>this.tone(f,.18,"sine",.1,t+i*.1)); break;
      case "rust":   this.noise(.15,.12,t,1200); this.tone(900,.12,"sawtooth",.07,t,300); break;
    }
  },

  // ---- BGM ----
  // 曲: 16ステップ x 小節構成。bass/lead/perc の3トラック。
  songs: {
    village: {
      bpm: 78, swing: 0,
      bass: [131,0,0,0, 98,0,0,0, 110,0,0,0, 98,0,131,0],
      lead: [392,0,440,0, 523,0,440,392, 330,0,0,392, 440,0,392,330],
      leadType: "triangle", bassType: "triangle",
      perc: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
      vol: .35,
    },
    dungeonA: {
      bpm: 96, swing: 0,
      bass: [87,0,87,0, 87,0,82,0, 87,0,87,0, 92,0,82,0],
      lead: [0,0,349,0, 330,0,0,0, 0,294,0,330, 0,0,262,0],
      leadType: "square", bassType: "triangle",
      perc: [1,0,0,0, 2,0,0,0, 1,0,0,1, 2,0,0,0],
      vol: .3,
    },
    dungeonB: {
      bpm: 110, swing: 0,
      bass: [73,73,0,73, 0,73,69,0, 73,73,0,78, 0,82,69,0],
      lead: [0,294,0,277, 0,0,330,0, 294,0,247,0, 277,0,0,220],
      leadType: "square", bassType: "sawtooth",
      perc: [1,0,2,0, 1,0,2,0, 1,0,2,0, 1,2,0,2],
      vol: .3,
    },
    dungeonC: {
      bpm: 126, swing: 0,
      bass: [65,65,98,65, 65,65,92,65, 62,62,92,62, 62,62,87,73],
      lead: [392,0,370,392, 0,440,0,330, 392,0,494,0, 440,392,370,330],
      leadType: "square", bassType: "sawtooth",
      perc: [1,0,2,2, 1,0,2,0, 1,0,2,2, 1,2,2,2],
      vol: .32,
    },
  },
  playBgm(name){
    if (!this.ctx) return;
    if (this.bgm.song === name) return;
    this.stopBgm();
    const song = this.songs[name];
    if (!song) return;
    this.bgm.song = name;
    this.bgm.step = 0;
    this.bgm.nextTime = this.ctx.currentTime + .1;
    const stepDur = 60 / song.bpm / 4;
    const tick = () => {
      if (this.bgm.song !== name || !this.ctx) return;
      while (this.bgm.nextTime < this.ctx.currentTime + .25){
        const i = this.bgm.step % 16;
        const t = this.bgm.nextTime;
        if (!this.muted){
          const b = song.bass[i]; if (b) this.tone(b, stepDur*1.8, song.bassType, .09*song.vol*2, t);
          const l = song.lead[i]; if (l) this.tone(l, stepDur*1.4, song.leadType, .06*song.vol*2, t);
          const p = song.perc[i];
          if (p===1) this.noise(.04,.10,t,300);   // キック的
          else if (p===2) this.noise(.03,.06,t,4000); // ハット的
        }
        this.bgm.step++;
        this.bgm.nextTime += stepDur;
      }
      this.bgm.timer = setTimeout(tick, 60);
    };
    tick();
  },
  stopBgm(){
    if (this.bgm.timer) clearTimeout(this.bgm.timer);
    this.bgm.timer = null; this.bgm.song = null;
  },
  bgmForFloor(f){
    if (f <= 9) return "dungeonA";
    if (f <= 19) return "dungeonB";
    return "dungeonC";
  },
};
