// --- visuals.js ---
const Visuals = (() => {
  const SPRITE_PATHS = {
    player: "assets/characters/player.png",
    player_town: "assets/characters/player_town.png",
    player_dungeon: "assets/characters/player_dungeon.png",
    cleaner: "assets/characters/cleaner.png",
    hunter: "assets/characters/hunter.png",
    soldier: "assets/characters/soldier.png",
    builder: "assets/characters/builder.png",
    dismantler: "assets/characters/dismantler.png",
    logistics: "assets/characters/logistics.png",
    medic: "assets/characters/medic.png",
    sorter: "assets/characters/sorter.png",
    guardian: "assets/characters/guardian.png"
  };



  const TILE_SPRITE_PATHS = {
    [TILE.FLOOR]: "assets/tiles/floor.png",
    [TILE.WALL]: "assets/tiles/wall.png",
    [TILE.LIFT]: "assets/tiles/lift.png",
    [TILE.CORE]: "assets/tiles/core.png",
    [TILE.TERMINAL]: "assets/tiles/terminal.png",
    [TILE.POLLUTION]: "assets/tiles/pollution.png"
  };

  const ITEM_ICON_PATHS = {
    food: "assets/items/nutrition_block.png",
    medicine: "assets/items/medicine.png",
    device: "assets/items/device.png",
    tactical: "assets/items/tactical.png",
    equipment: "assets/items/equipment.png",
    unknown: "assets/items/unknown.png"
  };

  const TRAP_SPRITE_PATH = "assets/tiles/trap.png";

  const UI_SPRITE_PATHS = {
    title: "assets/backgrounds/title.png",
    base: "assets/backgrounds/base.png",
    dungeon: "assets/backgrounds/dungeon.png",
    panel: "assets/ui/panel.png"
  };

  const EFFECT_SPRITE_PATHS = {
    slash: "assets/effects/slash.png",
    laser: "assets/effects/laser.png",
    spark: "assets/effects/spark.png",
    terminal: "assets/effects/terminal_shutdown.png",
    pollution: "assets/effects/pollution.png"
  };

  const SPRITE_SCALE = {
    player: 1.78,
    player_town: 1.78,
    player_dungeon: 1.78,
    cleaner: 1.70,
    hunter: 1.72,
    soldier: 1.74,
    builder: 1.72,
    dismantler: 1.74,
    logistics: 1.72,
    medic: 1.72,
    sorter: 1.70,
    guardian: 1.82
  };

  const SPRITE_FOOT_OFFSET_Y = {
    player: 0.04,
    player_town: 0.04,
    player_dungeon: 0.04,
    builder: 0.04,
    medic: 0.04,
    logistics: 0.04,
    cleaner: 0.06,
    hunter: 0.06,
    sorter: 0.06,
    dismantler: 0.07,
    soldier: 0.07,
    guardian: 0.08
  };

  const NPC_SPRITE_KEYS = {
    water_keeper: "medic",
    old_digger: "logistics",
    mechanic: "builder",
    lookout: "soldier",
    recorder: "sorter"
  };

  const NPC_PORTRAIT_META = {
    water_keeper: { title: "水守", role: "濾過槽と給水の番人", place: "水場の脇で配水を見守っている", note: "水の濁りや配給量に敏感。静かだが周囲をよく見ている。" },
    old_digger: { title: "老発掘家", role: "拾得物の目利き", place: "寝床と焚き火の近くに腰を下ろす", note: "昔話が長い。危ない区画ほど覚えている。" },
    mechanic: { title: "修理屋", role: "工具と発電機の整備担当", place: "作業台と廃材置き場を行き来する", note: "口は悪いが手は確か。使える部品を見ると黙れない。" },
    lookout: { title: "見張り", role: "外縁警戒", place: "見張り台から外を睨んでいる", note: "入口周辺の異音にすぐ反応する。" },
    recorder: { title: "記録係", role: "回収記録と日報の整理", place: "記録小屋で帳面を抱えている", note: "淡々としているが、誰がどこへ行ったか全部覚えている。" }
  };

  const ANIM_PROFILES = {
    player: { ms: 1800, bob: 0.030, sway: 0.018, scaleX: 0.010, scaleY: 0.014, glow: "rgba(126,220,255,1)" },
    player_town: { ms: 1800, bob: 0.030, sway: 0.018, scaleX: 0.010, scaleY: 0.014, glow: "rgba(126,220,255,1)" },
    player_dungeon: { ms: 1800, bob: 0.030, sway: 0.018, scaleX: 0.010, scaleY: 0.014, glow: "rgba(126,220,255,1)" },
    cleaner: { ms: 1200, bob: 0.010, sway: 0.010, scaleX: 0.010, scaleY: 0.006, glow: "rgba(255,80,70,1)" },
    hunter: { ms: 950, bob: 0.040, sway: 0.032, scaleX: 0.008, scaleY: 0.016, glow: "rgba(255,70,62,1)" },
    soldier: { ms: 1500, bob: 0.018, sway: 0.010, scaleX: 0.006, scaleY: 0.010, glow: "rgba(255,60,45,1)" },
    builder: { ms: 1700, bob: 0.020, sway: 0.020, scaleX: 0.010, scaleY: 0.010, glow: "rgba(255,206,70,1)" },
    dismantler: { ms: 1050, bob: 0.025, sway: 0.026, scaleX: 0.012, scaleY: 0.012, glow: "rgba(255,120,60,1)" },
    logistics: { ms: 1600, bob: 0.018, sway: 0.018, scaleX: 0.008, scaleY: 0.008, glow: "rgba(255,80,70,1)" },
    medic: { ms: 1450, bob: 0.026, sway: 0.014, scaleX: 0.007, scaleY: 0.012, glow: "rgba(125,255,220,1)" },
    sorter: { ms: 1300, bob: 0.022, sway: 0.020, scaleX: 0.010, scaleY: 0.012, glow: "rgba(255,85,75,1)" },
    guardian: { ms: 2200, bob: 0.010, sway: 0.006, scaleX: 0.006, scaleY: 0.010, glow: "rgba(255,95,45,1)" }
  };

  const SPRITES = {};
  const ASSET_VERSION = typeof VERSION !== "undefined" ? String(VERSION) : "dev";
  const ASSET_STATE = { total: 0, loaded: 0, failed: 0, failedKeys: [], startedAt: Date.now() };

  function withAssetVersion(src) {
    const sep = String(src).includes("?") ? "&" : "?";
    return `${src}${sep}v=${encodeURIComponent(ASSET_VERSION)}`;
  }

  function notifyAssetProgress() {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      try { window.dispatchEvent(new CustomEvent("haikiso:asset-progress")); } catch (_) {}
    }
  }

  function registerSprite(key, src) {
    ASSET_STATE.total++;
    if (typeof Image === "undefined") {
      ASSET_STATE.failed++;
      ASSET_STATE.failedKeys.push(key);
      notifyAssetProgress();
      return;
    }
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { ASSET_STATE.loaded++; notifyAssetProgress(); };
    img.onerror = () => { ASSET_STATE.failed++; ASSET_STATE.failedKeys.push(key); notifyAssetProgress(); };
    img.src = withAssetVersion(src);
    SPRITES[key] = img;
  }

  const preloadMap = { ...SPRITE_PATHS };
  for (const [tile, src] of Object.entries(TILE_SPRITE_PATHS)) preloadMap[`tile:${tile}`] = src;
  for (const [category, src] of Object.entries(ITEM_ICON_PATHS)) preloadMap[`item:${category}`] = src;
  for (const [key, src] of Object.entries(UI_SPRITE_PATHS)) preloadMap[`ui:${key}`] = src;
  for (const [key, src] of Object.entries(EFFECT_SPRITE_PATHS)) preloadMap[`fx:${key}`] = src;
  preloadMap["trap:discovered"] = TRAP_SPRITE_PATH;
  for (const [key, src] of Object.entries(preloadMap)) registerSprite(key, src);

  function assetStatus() {
    const done = ASSET_STATE.loaded + ASSET_STATE.failed;
    return {
      total: ASSET_STATE.total,
      loaded: ASSET_STATE.loaded,
      failed: ASSET_STATE.failed,
      done,
      ready: done >= ASSET_STATE.total,
      timedOut: false,
      ratio: ASSET_STATE.total ? Math.min(1, done / ASSET_STATE.total) : 1,
      failedKeys: [...ASSET_STATE.failedKeys]
    };
  }


  function drawAssetBackground(ctx, key, x, y, w, h, fallbackA, fallbackB) {
    const img = SPRITES[`ui:${key}`];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, w, h);
      return true;
    }
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, fallbackA || "#08111a");
    g.addColorStop(1, fallbackB || "#030507");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return false;
  }

  function drawSceneTile(ctx, key, gx, gy, px, py, t) {
    const img = SPRITES[`ui:${key}`];
    if (!(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0)) return false;
    const cols = Math.max(1, CONFIG.mapWidth);
    const rows = Math.max(1, CONFIG.mapHeight);
    const cellW = img.naturalWidth / cols;
    const cellH = img.naturalHeight / rows;
    const sx = Math.max(0, Math.min(img.naturalWidth - cellW, gx * cellW));
    const sy = Math.max(0, Math.min(img.naturalHeight - cellH, gy * cellH));
    ctx.drawImage(img, sx, sy, cellW, cellH, px, py, t, t);
    return true;
  }

  function getAsset(key) {
    return SPRITES[key] || null;
  }

  const COLORS = {
    floorA: "#242424",
    floorB: "#171717",
    floorLine: "rgba(255,255,255,0.055)",
    floorEdge: "rgba(0,0,0,0.45)",
    wallTop: "#4a4a4a",
    wallFace: "#252525",
    wallSide: "#151515",
    metalLight: "#8fa3b6",
    blue: "#70d8ff",
    amber: "#e8b64a",
    danger: "#ff6b64",
    green: "#62e06f",
    poison: "#56c95b",
    text: "#e8e8e8"
  };


  function hashSeed(seed) {
    const text = String(seed || "sprite");
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  function wave(now, ms, seed, offset = 0) {
    if (!FEATURES.spriteAnimation) return 0;
    const phase = ((now || 0) / Math.max(1, ms || CONFIG.idleAnimMs) + hashSeed(seed) + offset) * Math.PI * 2;
    return Math.sin(phase);
  }

  function pulse(now, ms, seed, offset = 0) {
    return (wave(now, ms, seed, offset) + 1) * 0.5;
  }

  function safeGradient(ctx, x1, y1, x2, y2, stops) {
    if (!ctx.createLinearGradient) return stops[0]?.[1] || "#222";
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    return g;
  }

  function safeRadial(ctx, x1, y1, r1, x2, y2, r2, stops) {
    if (!ctx.createRadialGradient) return stops[0]?.[1] || "rgba(255,255,255,0.2)";
    const g = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    return g;
  }

  function path(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  }

  function poly(ctx, points, fill, stroke) {
    path(ctx, points);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    else ctx.arc(x, y, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function rect(ctx, x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  function line(ctx, x1, y1, x2, y2, stroke, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function glow(ctx, cx, cy, r, color, alpha = 0.45) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.fillStyle = safeRadial(ctx, cx, cy, 0, cx, cy, r, [
      [0, color],
      [0.55, color.replace("1)", "0.32)")],
      [1, "rgba(0,0,0,0)"]
    ]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function glyph(ctx, ch, px, py, t, color, scale) {
    ctx.fillStyle = color;
    ctx.font = `${Math.floor(t * (scale || 0.66))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, px + t / 2, py + t / 2 + 1);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function softShadow(ctx, px, py, t, alpha = 0.42, sx = 0.34, sy = 0.14) {
    ellipse(ctx, px + t * 0.5, py + t * 0.72, t * sx, t * sy, `rgba(0,0,0,${alpha})`);
  }

  function spriteReady(key) {
    const img = SPRITES[key];
    return Boolean(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
  }

  function drawSprite(ctx, key, px, py, t, options = {}) {
    if (!FEATURES.imageSprites || !spriteReady(key)) return false;
    const img = SPRITES[key];
    const profile = ANIM_PROFILES[key] || ANIM_PROFILES.cleaner;
    const now = options.now || 0;
    const seed = options.seed || key;
    const strength = CONFIG.spriteAnimStrength ?? 1.0;
    const idle = wave(now, profile.ms, seed) * strength;
    const blink = pulse(now, (profile.ms || 1200) * 0.55, seed, 0.17);
    const moving = Boolean(options.moving);
    const moveProgress = clamp(options.moveProgress ?? 1, 0, 1);
    const moveLift = moving ? Math.sin(moveProgress * Math.PI) : 0;
    const scale = options.scale || SPRITE_SCALE[key] || 2.0;
    const footOffsetY = options.offsetY ?? SPRITE_FOOT_OFFSET_Y[key] ?? 0;
    const size = t * scale;
    const bob = t * ((profile.bob || 0) * idle - 0.11 * moveLift);
    const rotate = (profile.sway || 0) * idle + (moving ? 0.045 * Math.sin(moveProgress * Math.PI * 2) : 0);
    const scaleX = 1 + (profile.scaleX || 0) * idle + (moving ? 0.035 * moveLift : 0);
    const scaleY = 1 + (profile.scaleY || 0) * -idle - (moving ? 0.035 * moveLift : 0);
    const baseX = px + t * 0.5 + (options.offsetX || 0) * t;
    const baseY = py + t * 0.92 + footOffsetY * t + bob;
    softShadow(ctx, px, py + moveLift * t * 0.03, t, options.shadowAlpha ?? 0.42, options.shadowX || 0.36, options.shadowY || 0.13);
    if (options.glow !== false && profile.glow) {
      glow(ctx, px + t * 0.5, py + t * 0.46, t * (0.36 + blink * 0.18), profile.glow, (options.glowAlpha ?? 0.12) + blink * 0.05);
    }
    ctx.save();
    if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
    if (options.filter && "filter" in ctx) ctx.filter = options.filter;
    if (ctx.translate && ctx.rotate && ctx.scale) {
      ctx.translate(baseX, baseY);
      ctx.rotate(rotate);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(img, -size * 0.5, -size, size, size);
    } else {
      ctx.drawImage(img, baseX - size * 0.5, baseY - size, size, size);
    }
    ctx.restore();
    return true;
  }

  function drawTileSprite(ctx, key, px, py, t, visible) {
    if (!FEATURES.imageSprites || !spriteReady(key)) return false;
    const img = SPRITES[key];
    ctx.drawImage(img, px, py, t, t);
    if (!visible) {
      ctx.fillStyle = "rgba(0,0,0,0.58)";
      ctx.fillRect(px, py, t, t);
    }
    return true;
  }

  function drawIconSprite(ctx, key, px, py, t, scale = 0.92) {
    if (!FEATURES.imageSprites || !spriteReady(key)) return false;
    const img = SPRITES[key];
    const size = t * scale;
    ctx.drawImage(img, px + (t - size) / 2, py + (t - size) / 2, size, size);
    return true;
  }

  function drawStunOverlay(ctx, px, py, t) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, px + t * 0.5, py + t * 0.42, t * 0.62, "rgba(155,226,141,1)", 0.20);
    ctx.strokeStyle = "rgba(155,226,141,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + t * 0.5, py + t * 0.47, t * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }


  function drawPlayerOverlay(ctx, px, py, t, opts = {}) {
    const now = opts.now || 0;
    const p1 = pulse(now, 1200, opts.seed || "player-light");
    const p2 = pulse(now, 1800, opts.seed || "player-visor", 0.33);
    glow(ctx, px + t * 0.28, py + t * 0.58, t * (0.28 + p1 * 0.08), "rgba(255,190,90,1)", 0.16 + p1 * 0.06);
    glow(ctx, px + t * 0.54, py + t * 0.31, t * (0.22 + p2 * 0.08), "rgba(112,216,255,1)", 0.13 + p2 * 0.06);
  }

  function drawEnemyOverlay(ctx, type, px, py, t, opts = {}) {
    const now = opts.now || 0;
    const seed = opts.seed || type;
    const p = pulse(now, ANIM_PROFILES[type]?.ms || CONFIG.enemyAnimMs, seed);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (type === "cleaner") {
      const cx1 = px + t * 0.34;
      const cx2 = px + t * 0.66;
      const cy = py + t * 0.73;
      ctx.strokeStyle = `rgba(230,190,110,${0.25 + p * 0.35})`;
      ctx.lineWidth = 2;
      for (const cx of [cx1, cx2]) {
        ctx.beginPath();
        ctx.arc(cx, cy, t * 0.15, p * Math.PI * 2, p * Math.PI * 2 + Math.PI * 1.25);
        ctx.stroke();
      }
    } else if (type === "hunter") {
      glow(ctx, px + t * 0.50, py + t * 0.26, t * (0.22 + p * 0.18), "rgba(255,70,55,1)", 0.22 + p * 0.10);
      line(ctx, px + t * 0.50, py + t * 0.16, px + t * 0.50, py + t * 0.48, `rgba(255,90,80,${0.25 + p * 0.45})`, 2);
    } else if (type === "soldier") {
      glow(ctx, px + t * 0.74, py + t * 0.39, t * (0.22 + p * 0.20), "rgba(255,75,45,1)", 0.20 + p * 0.12);
      line(ctx, px + t * 0.60, py + t * 0.42, px + t * (0.80 + p * 0.10), py + t * 0.37, `rgba(255,110,70,${0.22 + p * 0.36})`, 2);
    } else if (type === "builder") {
      glow(ctx, px + t * 0.68, py + t * 0.32, t * (0.20 + p * 0.14), "rgba(255,210,78,1)", 0.16 + p * 0.08);
      line(ctx, px + t * 0.58, py + t * 0.46, px + t * 0.79, py + t * 0.29, `rgba(255,220,90,${0.15 + p * 0.32})`, 2);
    } else if (type === "dismantler") {
      const cx = px + t * 0.33;
      const cy = py + t * 0.62;
      ctx.strokeStyle = `rgba(255,150,80,${0.25 + p * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, t * 0.18, p * Math.PI * 2, p * Math.PI * 2 + Math.PI * 1.6);
      ctx.stroke();
    } else if (type === "logistics") {
      rect(ctx, px + t * 0.46, py + t * 0.33, t * 0.12, t * 0.04, `rgba(255,60,45,${0.35 + p * 0.55})`);
    } else if (type === "medic") {
      glow(ctx, px + t * 0.48, py + t * 0.40, t * (0.24 + p * 0.15), "rgba(130,255,220,1)", 0.18 + p * 0.08);
      line(ctx, px + t * 0.43, py + t * 0.42, px + t * 0.57, py + t * 0.42, `rgba(150,255,226,${0.30 + p * 0.40})`, 2);
      line(ctx, px + t * 0.50, py + t * 0.35, px + t * 0.50, py + t * 0.50, `rgba(150,255,226,${0.30 + p * 0.40})`, 2);
    } else if (type === "sorter") {
      line(ctx, px + t * 0.26, py + t * (0.35 + p * 0.28), px + t * 0.78, py + t * (0.35 + p * 0.28), `rgba(255,75,60,${0.18 + p * 0.28})`, 1);
    } else if (type === "guardian") {
      glow(ctx, px + t * 0.51, py + t * 0.45, t * (0.55 + p * 0.38), "rgba(255,90,35,1)", 0.30 + p * 0.16);
      ctx.strokeStyle = `rgba(255,140,70,${0.35 + p * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + t * 0.51, py + t * 0.45, t * (0.20 + p * 0.28), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloorPanel(ctx, px, py, t, visible, tint = null) {
    const dim = !visible;
    const top = dim ? "#111722" : (tint || COLORS.floorA);
    const bottom = dim ? "#0a0c12" : COLORS.floorB;
    const edge = dim ? "rgba(40,55,70,0.22)" : COLORS.floorLine;
    ctx.fillStyle = safeGradient(ctx, px, py, px + t, py + t, [[0, top], [1, bottom]]);
    ctx.fillRect(px, py, t, t);
    poly(ctx, [
      [px + t * 0.08, py + t * 0.28],
      [px + t * 0.70, py + t * 0.10],
      [px + t * 0.94, py + t * 0.62],
      [px + t * 0.30, py + t * 0.88]
    ], safeGradient(ctx, px, py, px + t, py + t, [[0, dim ? "#141b24" : "#2b2b2b"], [1, dim ? "#090b0f" : "#151515"]]), edge);
    line(ctx, px + t * 0.12, py + t * 0.31, px + t * 0.31, py + t * 0.83, dim ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.05)");
    line(ctx, px + t * 0.72, py + t * 0.13, px + t * 0.92, py + t * 0.61, dim ? "rgba(0,0,0,0.25)" : COLORS.floorEdge);
    if (visible) {
      line(ctx, px + t * 0.20, py + t * 0.48, px + t * 0.34, py + t * 0.44, "rgba(255,255,255,0.045)");
      line(ctx, px + t * 0.55, py + t * 0.30, px + t * 0.64, py + t * 0.38, "rgba(0,0,0,0.28)");
    }
  }

  function drawWallBlock(ctx, px, py, t, visible) {
    const dim = !visible;
    const h = t * 0.34;
    const topY = py + t * 0.10;
    ctx.fillStyle = "#030303";
    ctx.fillRect(px, py, t, t);
    softShadow(ctx, px, py + t * 0.10, t, dim ? 0.28 : 0.58, 0.44, 0.18);
    const topFill = safeGradient(ctx, px, topY, px + t, py + t * 0.58, [[0, dim ? "#20242a" : "#5a5a5a"], [1, dim ? "#101317" : COLORS.wallTop]]);
    const faceFill = safeGradient(ctx, px, py + h, px, py + t, [[0, dim ? "#15191f" : COLORS.wallFace], [1, dim ? "#07080b" : "#111"]]);
    const sideFill = safeGradient(ctx, px + t, py, px, py + t, [[0, dim ? "#101216" : "#323232"], [1, dim ? "#06080a" : COLORS.wallSide]]);
    poly(ctx, [
      [px + t * 0.12, topY + t * 0.12],
      [px + t * 0.54, topY],
      [px + t * 0.88, topY + t * 0.22],
      [px + t * 0.48, topY + t * 0.42]
    ], topFill, dim ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.10)");
    poly(ctx, [
      [px + t * 0.12, topY + t * 0.28],
      [px + t * 0.48, topY + t * 0.50],
      [px + t * 0.48, py + t * 0.92],
      [px + t * 0.12, py + t * 0.68]
    ], faceFill);
    poly(ctx, [
      [px + t * 0.48, topY + t * 0.50],
      [px + t * 0.88, topY + t * 0.30],
      [px + t * 0.88, py + t * 0.72],
      [px + t * 0.48, py + t * 0.92]
    ], sideFill);
    line(ctx, px + t * 0.17, py + t * 0.68, px + t * 0.45, py + t * 0.86, dim ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.07)");
    line(ctx, px + t * 0.85, py + t * 0.33, px + t * 0.50, py + t * 0.51, dim ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.38)");
  }

  function drawLift(ctx, px, py, t, visible) {
    drawFloorPanel(ctx, px, py, t, visible, visible ? "#24201a" : "#11100c");
    const cx = px + t * 0.5;
    const cy = py + t * 0.52;
    ellipse(ctx, cx, cy, t * 0.34, t * 0.19, visible ? "#25211a" : "#13100b", visible ? "#d8a231" : "#4a3811");
    line(ctx, px + t * 0.30, py + t * 0.70, px + t * 0.70, py + t * 0.70, visible ? COLORS.amber : "#5e4a10", 2);
    glyph(ctx, ">", px, py + t * 0.02, t, visible ? "#ffd35a" : "#6c5519", 0.62);
  }

  function drawCore(ctx, px, py, t, visible) {
    drawFloorPanel(ctx, px, py, t, visible, visible ? "#17242e" : "#0b1116");
    if (visible) glow(ctx, px + t * 0.5, py + t * 0.48, t * 0.58, "rgba(72,206,255,1)", 0.38);
    softShadow(ctx, px, py, t, 0.35);
    ellipse(ctx, px + t * 0.5, py + t * 0.62, t * 0.23, t * 0.08, "rgba(0,0,0,0.55)");
    rect(ctx, px + t * 0.36, py + t * 0.25, t * 0.28, t * 0.42, visible ? "rgba(116,220,255,0.72)" : "rgba(40,75,92,0.5)", visible ? "#d9f7ff" : "#4a7180");
    ellipse(ctx, px + t * 0.50, py + t * 0.25, t * 0.14, t * 0.05, visible ? "#e7fbff" : "#527482");
    ellipse(ctx, px + t * 0.50, py + t * 0.67, t * 0.14, t * 0.05, visible ? "#64d8ff" : "#314f59");
  }

  function drawTerminal(ctx, px, py, t, visible) {
    drawFloorPanel(ctx, px, py, t, visible, visible ? "#171b2c" : "#0b0d16");
    softShadow(ctx, px, py, t, 0.34);
    if (visible) glow(ctx, px + t * 0.52, py + t * 0.35, t * 0.40, "rgba(98,190,255,1)", 0.30);
    poly(ctx, [
      [px + t * 0.37, py + t * 0.22],
      [px + t * 0.62, py + t * 0.16],
      [px + t * 0.68, py + t * 0.68],
      [px + t * 0.42, py + t * 0.75]
    ], visible ? "#1b273b" : "#0e121c", visible ? "#82c7ff" : "#2e4b64");
    rect(ctx, px + t * 0.45, py + t * 0.30, t * 0.15, t * 0.20, visible ? "#8edcff" : "#315066");
    line(ctx, px + t * 0.45, py + t * 0.58, px + t * 0.62, py + t * 0.54, visible ? "#c3edff" : "#3f5e70");
  }

  function tile(ctx, kind, px, py, t, visible) {
    const tileKey = `tile:${kind}`;
    if (drawTileSprite(ctx, tileKey, px, py, t, visible)) return;
    if (kind === TILE.WALL) return drawWallBlock(ctx, px, py, t, visible);
    if (kind === TILE.LIFT) return drawLift(ctx, px, py, t, visible);
    if (kind === TILE.ENTRANCE) {
      drawFloorPanel(ctx, px, py, t, visible, visible ? "#161313" : "#080606");
      if (visible) {
        glow(ctx, px + t * 0.52, py + t * 0.48, t * 0.58, "rgba(255,125,65,1)", 0.20);
        poly(ctx, [[px+t*.22,py+t*.73],[px+t*.50,py+t*.20],[px+t*.78,py+t*.73]], "rgba(30,15,10,0.92)", "#e07a42");
        rect(ctx, px+t*.39, py+t*.46, t*.22, t*.25, "#08090a", "rgba(255,210,140,0.55)");
      }
      return;
    }
    if (kind === TILE.CORE) return drawCore(ctx, px, py, t, visible);
    if (kind === TILE.TERMINAL) return drawTerminal(ctx, px, py, t, visible);
    if (kind === TILE.POLLUTION) {
      drawFloorPanel(ctx, px, py, t, visible, visible ? "#132615" : "#071107");
      if (visible) {
        glow(ctx, px + t * 0.52, py + t * 0.54, t * 0.48, "rgba(70,255,110,1)", 0.22);
        ellipse(ctx, px + t * 0.52, py + t * 0.54, t * 0.24, t * 0.09, "rgba(60,210,86,0.36)", "rgba(110,255,130,0.42)");
        line(ctx, px + t * 0.34, py + t * 0.52, px + t * 0.70, py + t * 0.45, "rgba(158,255,150,0.32)");
      }
      return;
    }
    drawFloorPanel(ctx, px, py, t, visible);
  }

  function item(ctx, kind, px, py, t, opts = {}) {
    const def = ITEM_DEFS[kind] || {};
    const bob = FEATURES.spriteAnimation ? wave(opts.now || 0, 1500, opts.seed || kind) * t * 0.035 : 0;
    py += bob;
    softShadow(ctx, px, py, t, 0.28, 0.22, 0.09);
    const cx = px + t * 0.5;
    const cy = py + t * 0.50;
    const category = def.category || "unknown";
    const iconCategory = kind === "nutrition_block" ? "food" : (category === "medicine" || kind === "water_filter") ? "medicine" : category === "equipment" ? "equipment" : category === "tactical" ? "tactical" : category === "device" ? "device" : "unknown";
    if (drawIconSprite(ctx, `item:${iconCategory}`, px, py, t, 0.86)) return;
    if (category === "medicine" || kind === "water_filter") {
      glow(ctx, cx, cy, t * 0.28, "rgba(128,230,255,1)", 0.18);
      rect(ctx, px + t * 0.42, py + t * 0.30, t * 0.17, t * 0.34, "#b9f1ff", "#ffffff");
      ellipse(ctx, cx, py + t * 0.31, t * 0.09, t * 0.035, "#ffffff");
      rect(ctx, px + t * 0.44, py + t * 0.44, t * 0.13, t * 0.14, "#69d76d");
      return;
    }
    if (category === "equipment") {
      poly(ctx, [[px+t*.32,py+t*.62],[px+t*.56,py+t*.20],[px+t*.66,py+t*.27],[px+t*.44,py+t*.69]], "#c4ccd5", "#f3f6fa");
      line(ctx, px+t*.35, py+t*.66, px+t*.63, py+t*.22, "#777", 2);
      return;
    }
    if (category === "food") {
      poly(ctx, [[px+t*.32,py+t*.38],[px+t*.65,py+t*.31],[px+t*.73,py+t*.57],[px+t*.40,py+t*.66]], "#7b6b3a", "#d7c06b");
      line(ctx, px+t*.40, py+t*.45, px+t*.66, py+t*.39, "rgba(255,255,255,0.22)");
      return;
    }
    if (category === "tactical" || category === "device") {
      glow(ctx, cx, cy, t * 0.28, "rgba(120,180,255,1)", 0.16);
      poly(ctx, [[px+t*.32,py+t*.39],[px+t*.58,py+t*.31],[px+t*.70,py+t*.51],[px+t*.44,py+t*.64]], "#26394f", "#78aee8");
      rect(ctx, px+t*.47, py+t*.42, t*.12, t*.10, "#74d8ff");
      return;
    }
    glyph(ctx, def.glyph || "?", px, py, t, "#8fd0ff", 0.66);
  }

  function robotBody(ctx, px, py, t, body, accent, opts = {}) {
    softShadow(ctx, px, py, t, 0.42);
    const cx = px + t * 0.5;
    const cy = py + t * 0.52;
    if (opts.glow) glow(ctx, cx, cy, t * opts.glow, accent, 0.20);
    ellipse(ctx, cx, cy + t * 0.13, t * 0.26, t * 0.12, "rgba(0,0,0,0.28)");
    poly(ctx, [[px+t*.29,py+t*.38],[px+t*.55,py+t*.25],[px+t*.75,py+t*.43],[px+t*.48,py+t*.62]], body, "rgba(255,255,255,0.14)");
    rect(ctx, px + t * 0.44, py + t * 0.36, t * 0.17, t * 0.12, accent);
  }

  function enemy(ctx, type, px, py, t, opts = {}) {
    const stun = Boolean(opts.stun);
    const accent = stun ? "#9be28d" : (type === "guardian" ? "#ffd64d" : "#ff5d55");
    if (drawSprite(ctx, type, px, py, t, {
      scale: SPRITE_SCALE[type] || 2.0,
      shadowAlpha: type === "guardian" ? 0.60 : 0.42,
      shadowX: type === "guardian" ? 0.48 : 0.36,
      shadowY: type === "guardian" ? 0.16 : 0.13,
      now: opts.now,
      seed: opts.seed || type,
      moving: opts.moving,
      moveProgress: opts.moveProgress,
      glowAlpha: type === "guardian" ? 0.20 : 0.10
    })) {
      drawEnemyOverlay(ctx, type, px, py, t, opts);
      if (stun) drawStunOverlay(ctx, px, py, t);
      return;
    }
    if (type === "cleaner") {
      softShadow(ctx, px, py, t, 0.38);
      ellipse(ctx, px+t*.5, py+t*.55, t*.31, t*.16, "#30343a", "#6e757d");
      ellipse(ctx, px+t*.5, py+t*.52, t*.23, t*.10, "#20242a");
      glow(ctx, px+t*.50, py+t*.45, t*.20, accent === "#9be28d" ? "rgba(155,226,141,1)" : "rgba(255,90,80,1)", 0.22);
      rect(ctx, px+t*.43, py+t*.41, t*.14, t*.08, accent);
      line(ctx, px+t*.27, py+t*.66, px+t*.73, py+t*.66, "#8d8d8d", 2);
      return;
    }
    if (type === "hunter") {
      robotBody(ctx, px, py, t, "#23272e", accent, { glow: .35 });
      rect(ctx, px+t*.43, py+t*.18, t*.17, t*.48, "#1a1d24", "#59616d");
      rect(ctx, px+t*.47, py+t*.25, t*.09, t*.23, accent);
      line(ctx, px+t*.36, py+t*.68, px+t*.22, py+t*.82, "#777", 2);
      line(ctx, px+t*.64, py+t*.68, px+t*.80, py+t*.82, "#777", 2);
      return;
    }
    if (type === "soldier") {
      robotBody(ctx, px, py, t, "#2a2526", accent, { glow: .28 });
      rect(ctx, px+t*.38, py+t*.34, t*.25, t*.19, "#171717", "#777");
      line(ctx, px+t*.62, py+t*.40, px+t*.89, py+t*.33, "#d0d0d0", 3);
      rect(ctx, px+t*.74, py+t*.28, t*.13, t*.10, "#3a3a3a");
      return;
    }
    if (type === "builder") {
      robotBody(ctx, px, py, t, "#3a3320", "#ffcc55");
      line(ctx, px+t*.60, py+t*.42, px+t*.84, py+t*.24, "#e0b44c", 3);
      line(ctx, px+t*.82, py+t*.24, px+t*.88, py+t*.40, "#e0b44c", 3);
      rect(ctx, px+t*.24, py+t*.56, t*.18, t*.09, "#f3c24c");
      return;
    }
    if (type === "dismantler") {
      robotBody(ctx, px, py, t, "#392922", "#ff8a4a");
      poly(ctx, [[px+t*.72,py+t*.35],[px+t*.93,py+t*.44],[px+t*.72,py+t*.54]], "#d9d9d9", "#fff");
      line(ctx, px+t*.67, py+t*.45, px+t*.88, py+t*.45, "#b2b2b2", 3);
      return;
    }
    if (type === "logistics") {
      softShadow(ctx, px, py, t, 0.36);
      poly(ctx, [[px+t*.24,py+t*.48],[px+t*.58,py+t*.35],[px+t*.78,py+t*.53],[px+t*.43,py+t*.70]], "#253649", "#7aa8d8");
      rect(ctx, px+t*.33, py+t*.26, t*.24, t*.19, "#59452b", "#d0a55e");
      ellipse(ctx, px+t*.36, py+t*.70, t*.08, t*.04, "#0a0a0a");
      ellipse(ctx, px+t*.65, py+t*.61, t*.08, t*.04, "#0a0a0a");
      return;
    }
    if (type === "sorter") {
      robotBody(ctx, px, py, t, "#2b2b35", accent);
      line(ctx, px+t*.34, py+t*.58, px+t*.18, py+t*.70, "#ddd", 3);
      line(ctx, px+t*.66, py+t*.55, px+t*.84, py+t*.62, "#ddd", 3);
      return;
    }
    if (type === "medic") {
      robotBody(ctx, px, py, t, "#273536", stun ? "#9be28d" : "#8fffd1", { glow: .25 });
      rect(ctx, px+t*.43, py+t*.31, t*.16, t*.30, "#d9fff4", "#91d8c8");
      line(ctx, px+t*.51, py+t*.35, px+t*.51, py+t*.56, "#1a8f6c", 2);
      line(ctx, px+t*.44, py+t*.46, px+t*.58, py+t*.46, "#1a8f6c", 2);
      return;
    }
    if (type === "guardian") {
      softShadow(ctx, px - t*.10, py, t*1.22, 0.60, 0.45, 0.16);
      glow(ctx, px+t*.52, py+t*.40, t*.65, "rgba(255,70,40,1)", 0.22);
      poly(ctx, [[px+t*.22,py+t*.37],[px+t*.58,py+t*.16],[px+t*.88,py+t*.40],[px+t*.52,py+t*.70]], "#171719", "#8b6c31");
      poly(ctx, [[px+t*.34,py+t*.46],[px+t*.53,py+t*.33],[px+t*.68,py+t*.46],[px+t*.51,py+t*.58]], "#3a241f", "#ffcd52");
      ellipse(ctx, px+t*.52, py+t*.45, t*.11, t*.07, accent, "#fff0a8");
      for (const sx of [-1, 1]) {
        line(ctx, px+t*.50, py+t*.65, px+t*(0.50+sx*.34), py+t*.84, "#7a6a4a", 3);
        line(ctx, px+t*.50, py+t*.42, px+t*(0.50+sx*.38), py+t*.30, "#7a6a4a", 3);
      }
      return;
    }
    robotBody(ctx, px, py, t, "#2c2c32", accent);
  }

  function player(ctx, px, py, t, opts = {}) {
    const spriteKey = opts.spriteKey || "player";
    if (drawSprite(ctx, spriteKey, px, py, t, {
      scale: SPRITE_SCALE[spriteKey] || SPRITE_SCALE.player,
      shadowAlpha: 0.50,
      shadowX: 0.32,
      shadowY: 0.12,
      now: opts.now,
      seed: opts.seed || "player",
      moving: opts.moving,
      moveProgress: opts.moveProgress,
      glowAlpha: 0.11
    })) {
      drawPlayerOverlay(ctx, px, py, t, opts);
      return;
    }
    softShadow(ctx, px, py, t, 0.48, 0.30, 0.12);
    glow(ctx, px + t * 0.62, py + t * 0.36, t * 0.40, "rgba(160,220,255,1)", 0.14);
    // cloak/body
    poly(ctx, [[px+t*.36,py+t*.38],[px+t*.54,py+t*.27],[px+t*.68,py+t*.48],[px+t*.54,py+t*.74],[px+t*.31,py+t*.62]], "#bfc3c7", "#f0f0f0");
    poly(ctx, [[px+t*.28,py+t*.47],[px+t*.42,py+t*.33],[px+t*.46,py+t*.66],[px+t*.24,py+t*.69]], "#6e5a43", "#9c8360");
    // head/hood
    ellipse(ctx, px+t*.51, py+t*.28, t*.13, t*.11, "#d9d9d9", "#ffffff");
    rect(ctx, px+t*.56, py+t*.36, t*.16, t*.08, "#d9f4ff");
    line(ctx, px+t*.35, py+t*.75, px+t*.28, py+t*.90, "#8b8b8b", 2);
    line(ctx, px+t*.58, py+t*.74, px+t*.64, py+t*.89, "#8b8b8b", 2);
    rect(ctx, px+t*.45, py+t*.28, t*.04, t*.04, "#111");
    rect(ctx, px+t*.54, py+t*.28, t*.04, t*.04, "#111");
  }

  function npc(ctx, key, px, py, t, opts = {}) {
    const def = NPC_DEFS[key] || {};
    const spriteKey = NPC_SPRITE_KEYS[key];
    if (spriteKey && drawSprite(ctx, spriteKey, px, py, t, {
      scale: (SPRITE_SCALE[spriteKey] || 1.8) * 0.94,
      shadowAlpha: 0.38,
      shadowX: 0.30,
      shadowY: 0.11,
      now: opts.now,
      seed: opts.seed || key,
      moving: opts.moving,
      moveProgress: opts.moveProgress,
      glowAlpha: 0.08
    })) {
      return;
    }
    const now = opts.now || 0;
    const bob = FEATURES.spriteAnimation ? wave(now, 1700, key) * t * 0.025 : 0;
    py += bob;
    softShadow(ctx, px, py, t, 0.34, 0.27, 0.10);
    const palette = {
      water_keeper: ["#375c64", "#8fd8e8", "水"],
      old_digger: ["#5a4b36", "#d0b47a", "老"],
      mechanic: ["#4c3f30", "#e2a84d", "修"],
      lookout: ["#343f4c", "#9ec8ff", "見"],
      recorder: ["#3d3650", "#c7b6ff", "記"]
    };
    const [body, accent, glyphText] = palette[key] || ["#444", "#ddd", "人"];
    poly(ctx, [[px+t*.34,py+t*.40],[px+t*.51,py+t*.26],[px+t*.67,py+t*.43],[px+t*.57,py+t*.72],[px+t*.31,py+t*.65]], body, "rgba(255,255,255,0.12)");
    ellipse(ctx, px+t*.50, py+t*.30, t*.12, t*.11, "#d8c1a0", "rgba(255,255,255,0.40)");
    rect(ctx, px+t*.41, py+t*.48, t*.18, t*.13, accent, "rgba(255,255,255,0.18)");
    line(ctx, px+t*.39, py+t*.70, px+t*.34, py+t*.86, "#7b6a55", 2);
    line(ctx, px+t*.56, py+t*.70, px+t*.62, py+t*.86, "#7b6a55", 2);
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(px + t*.16, py + t*.02, t*.68, t*.20);
    ctx.fillStyle = accent;
    ctx.font = `${Math.floor(t*.12)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(def.name || glyphText, px + t*.50, py + t*.12);
    ctx.restore();
  }

  function trap(ctx, px, py, t, visible) {
    if (drawIconSprite(ctx, "trap:discovered", px, py, t, 0.84)) return;
    const color = visible ? "#ffcc66" : "#59451c";
    softShadow(ctx, px, py, t, 0.22, 0.20, 0.08);
    poly(ctx, [[px+t*.30,py+t*.72],[px+t*.50,py+t*.25],[px+t*.72,py+t*.72]], "rgba(80,55,14,0.90)", color);
    rect(ctx, px+t*.47, py+t*.42, t*.06, t*.17, color);
    rect(ctx, px+t*.47, py+t*.63, t*.06, t*.06, color);
  }

  function drawFxSprite(ctx, key, cx, cy, t, progress, scale = 1.45, rotation = 0) {
    const img = SPRITES[`fx:${key}`];
    if (!img || !img.complete || img.naturalWidth <= 0) return false;
    const size = t * scale * (0.86 + progress * 0.42);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 0.88);
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawDamagePopup(ctx, cx, cy, t, progress, damage, type) {
    if (!damage) return;
    const pop = Math.sin(Math.min(1, progress * 2.2) * Math.PI);
    const up = t * (0.18 + progress * 0.86);
    const drift = (type === "hurt" || type === "shoot" || type === "laser") ? -t * 0.10 : t * 0.10;
    const alpha = Math.max(0, 1 - progress * 1.08);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.max(14, Math.floor(t * (0.46 + pop * 0.16)))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(4, t * 0.12);
    ctx.strokeStyle = "rgba(0,0,0,0.86)";
    ctx.fillStyle = type === "hurt" || type === "shoot" || type === "laser" ? "#ff6f5f" : "#ffe66d";
    ctx.strokeText(`-${damage}`, cx + drift * progress, cy - up);
    ctx.fillText(`-${damage}`, cx + drift * progress, cy - up);
    ctx.restore();
  }

  function actionVector(cx, cy, from) {
    if (!from) return { angle: -0.35, ux: 1, uy: 0, len: 1 };
    const dx = cx - from.px;
    const dy = cy - from.py;
    const len = Math.max(1, Math.hypot(dx, dy));
    return { angle: Math.atan2(dy, dx), ux: dx / len, uy: dy / len, len };
  }

  function drawCombatOrigin(ctx, type, cx, cy, t, progress, from) {
    if (!from || progress > 0.42) return;
    const v = actionVector(cx, cy, from);
    const alpha = Math.max(0, 1 - progress / 0.42);
    const sx = from.px;
    const sy = from.py;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    glow(ctx, sx, sy, t * (0.22 + progress * 0.40), type === "hit" ? "rgba(120,220,255,1)" : "rgba(255,130,90,1)", 0.16 * alpha);
    ctx.translate(sx, sy);
    ctx.rotate(v.angle);
    ctx.strokeStyle = type === "hit" ? "rgba(190,245,255,0.88)" : "rgba(255,170,100,0.82)";
    ctx.lineWidth = Math.max(2, t * 0.08);
    ctx.beginPath();
    ctx.arc(t * 0.10, 0, t * (0.18 + progress * 0.30), -0.78, 0.78);
    ctx.stroke();
    ctx.restore();
  }

  function drawImpactMarker(ctx, type, cx, cy, t, progress, from) {
    const hit = Math.sin(Math.min(1, progress * 2.0) * Math.PI);
    const alpha = Math.max(0, 0.78 - progress * 0.82);
    const v = actionVector(cx, cy, from);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    glow(ctx, cx, cy, t * (0.28 + hit * 0.42), type === "hit" || type === "throw" ? "rgba(255,235,130,1)" : "rgba(255,80,50,1)", 0.20 * alpha);
    ctx.translate(cx, cy);
    ctx.rotate(v.angle);
    ctx.strokeStyle = type === "hurt" || type === "shoot" || type === "laser" ? "rgba(255,95,70,0.92)" : "rgba(255,245,180,0.92)";
    ctx.lineWidth = Math.max(2, t * 0.075);
    ctx.beginPath();
    ctx.arc(0, 0, t * (0.25 + progress * 0.35), -1.0, 1.0);
    ctx.stroke();
    line(ctx, -t * 0.18, -t * 0.18, t * 0.18, t * 0.18, ctx.strokeStyle, Math.max(2, t * 0.055));
    line(ctx, -t * 0.18, t * 0.18, t * 0.18, -t * 0.18, ctx.strokeStyle, Math.max(2, t * 0.055));
    ctx.restore();
  }

  function drawActionTrail(ctx, type, cx, cy, t, progress, from) {
    if (!from) return;
    const alpha = Math.max(0, 1 - progress * 1.18);
    const sx = from.px;
    const sy = from.py;
    const dx = cx - sx;
    const dy = cy - sy;
    const lead = clamp(progress * 1.65, 0, 1);
    const tail = clamp(lead - (type === "laser" ? 0.70 : 0.42), 0, 1);
    const x1 = sx + dx * tail;
    const y1 = sy + dy * tail;
    const x2 = sx + dx * lead;
    const y2 = sy + dy * lead;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    if (type === "shoot" || type === "laser") {
      const color = type === "laser" ? "rgba(255,70,38,0.95)" : "rgba(255,190,95,0.86)";
      line(ctx, x1, y1, x2, y2, type === "laser" ? "rgba(255,40,20,0.22)" : "rgba(255,170,70,0.20)", type === "laser" ? 10 : 7);
      line(ctx, x1, y1, x2, y2, color, type === "laser" ? 4.5 : 2.8);
      line(ctx, x1, y1, x2, y2, "rgba(255,255,220,0.86)", type === "laser" ? 1.5 : 1);
      glow(ctx, x2, y2, t * 0.42, type === "laser" ? "rgba(255,70,40,1)" : "rgba(255,210,120,1)", 0.18 * alpha);
    } else if (type === "throw") {
      line(ctx, x1, y1, x2, y2, "rgba(120,200,255,0.20)", 6);
      line(ctx, x1, y1, x2, y2, "rgba(220,245,255,0.82)", 2);
      ellipse(ctx, x2, y2, t * 0.12, t * 0.08, "rgba(240,250,255,0.92)");
    } else {
      line(ctx, x1, y1, x2, y2, type === "hurt" ? "rgba(255,80,60,0.20)" : "rgba(100,220,255,0.20)", 8);
      line(ctx, x1, y1, x2, y2, type === "hurt" ? "rgba(255,90,70,0.88)" : "rgba(170,240,255,0.92)", 3.5);
      line(ctx, x1, y1, x2, y2, "rgba(255,255,255,0.72)", 1.2);
    }
    ctx.restore();
  }

  function fx(ctx, type, cx, cy, t, progress, opts = {}) {
    const alpha = Math.max(0, 1 - progress);
    const actionFx = ["hit", "hurt", "throw", "shoot", "laser"].includes(type);
    const v = actionVector(cx, cy, opts.from);
    if (actionFx) {
      drawCombatOrigin(ctx, type, cx, cy, t, progress, opts.from);
      drawActionTrail(ctx, type, cx, cy, t, progress, opts.from);
      drawImpactMarker(ctx, type, cx, cy, t, progress, opts.from);
    }

    let spriteDrawn = false;
    if (type === "hit") spriteDrawn = drawFxSprite(ctx, "slash", cx, cy, t, progress, 1.95, v.angle + 0.45);
    else if (type === "throw") spriteDrawn = drawFxSprite(ctx, "spark", cx, cy, t, progress, 1.20, v.angle);
    else if (type === "shoot" || type === "laser") spriteDrawn = drawFxSprite(ctx, "laser", cx, cy, t, progress, type === "laser" ? 2.45 : 1.75, v.angle);
    else if (type === "terminal") spriteDrawn = drawFxSprite(ctx, "terminal", cx, cy, t, progress, 1.85, 0);
    else if (type === "defeat" || type === "spark") spriteDrawn = drawFxSprite(ctx, "spark", cx, cy, t, progress, 1.75, 0);
    else if (type === "pollution") spriteDrawn = drawFxSprite(ctx, "pollution", cx, cy, t, progress, 1.65, 0);

    if (!spriteDrawn) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "lighter";
      if (type === "hit") {
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * t * 0.08;
          line(ctx, cx - t * 0.48, cy + t * 0.28 + off, cx + t * 0.48, cy - t * 0.28 + off, i === 1 ? "#ffffff" : "#82e8ff", i === 1 ? 3.5 : 1.8);
        }
      } else if (type === "hurt") {
        ctx.strokeStyle = "#ff6b6b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, t * (0.18 + 0.55 * progress), 0, Math.PI * 2);
        ctx.stroke();
        glow(ctx, cx, cy, t * 0.5, "rgba(255,70,70,1)", 0.12 * alpha);
      } else if (type === "defeat") {
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI * 2 * i) / 10 + progress;
          line(ctx, cx, cy, cx + Math.cos(a) * t * (0.18 + progress * 0.52), cy + Math.sin(a) * t * (0.18 + progress * 0.52), i % 2 ? "#ffb347" : "#fff0a0", 2);
        }
      } else if (type === "terminal") {
        ctx.strokeStyle = "#8ce9ff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, t * (0.20 + progress * 0.45 + i * 0.12), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (type === "pollution") {
        glow(ctx, cx, cy, t * (0.4 + progress * 0.5), "rgba(70,230,100,1)", 0.22 * alpha);
      } else if (type === "alert") {
        glow(ctx, cx, cy - t * 0.10, t * (0.38 + progress * 0.42), "rgba(255,75,55,1)", 0.18 * alpha);
        ctx.strokeStyle = "rgba(255,95,70,0.90)";
        ctx.lineWidth = Math.max(2, t * 0.07);
        ctx.beginPath();
        ctx.arc(cx, cy - t * 0.10, t * (0.26 + progress * 0.32), -Math.PI * 0.20, Math.PI * 1.20);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,235,190,0.92)";
        ctx.font = `bold ${Math.max(14, Math.floor(t * 0.58))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", cx, cy - t * (0.26 + progress * 0.24));
      } else {
        ctx.strokeStyle = "#ffe580";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, t * (0.22 + 0.5 * progress), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (type === "hurt") {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.20 - progress * 0.18);
      ctx.fillStyle = "#ff2d20";
      ctx.fillRect(cx - t * 0.52, cy - t * 0.52, t * 1.04, t * 1.04);
      ctx.restore();
    }
    drawDamagePopup(ctx, cx, cy, t, progress, opts.damage, type);
  }

  return { glyph, tile, item, enemy, npc, player, trap, fx, assetStatus, getAsset, drawAssetBackground, drawSceneTile };
})();


// --- render.js ---
function createRenderer(elements) {
  const { canvas, ctx, miniMapCanvas, miniCtx, statusText, logPanel, debugText, inventoryPanel, basePanel, codexPanel, versionText, screenPanel } = elements;

  // 追加DOM（バー・操作盤）はここで直接取得し、起動側の配線を増やさない
  const hpFill = document.getElementById("hpFill");
  const hungerFill = document.getElementById("hungerFill");
  const pollutionFill = document.getElementById("pollutionFill");
  const hpText = document.getElementById("hpText");
  const hungerText = document.getElementById("hungerText");
  const pollutionText = document.getElementById("pollutionText");
  const controls = document.getElementById("controls");
  const actionPickupLabel = document.getElementById("actionPickupLabel");

  const view = { cols: CONFIG.viewportWidth, rows: CONFIG.viewportHeight, tile: CONFIG.tileSize, dpr: 1, mode: "desktop" };
  const pres = new Map();
  let dirtySetup = true;
  let loopRunning = false;
  let lastGame = null;
  let itemSeq = 0;
  let assetLoadingOverlayShown = false;

  function nowMs() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  function clearNode(node) {
    if (node) node.innerHTML = "";
  }

  function appendLine(node, text, className) {
    if (!node) return;
    const p = document.createElement("p");
    p.textContent = text;
    if (className) p.className = className;
    node.appendChild(p);
  }

  function appendSceneCard(node, title, body) {
    if (!node) return;
    const card = document.createElement("div");
    card.className = "scene-card";
    const head = document.createElement("div");
    head.className = "scene-card__title";
    head.textContent = title;
    const text = document.createElement("p");
    text.className = "scene-card__body";
    text.textContent = body;
    card.append(head, text);
    node.appendChild(card);
  }

  function appendNpcPortraitCard(node, npcKey) {
    if (!node || !npcKey) return;
    const spriteKey = NPC_SPRITE_KEYS[npcKey] || "medic";
    const asset = Visuals.getAsset ? Visuals.getAsset(spriteKey) : null;
    const meta = NPC_PORTRAIT_META[npcKey] || { title: NPC_DEFS[npcKey]?.name || npcKey, role: NPC_DEFS[npcKey]?.role || "住人", place: "集落で生活している", note: "" };
    const card = document.createElement("div");
    card.className = "npc-portrait-card";
    const imgWrap = document.createElement("div");
    imgWrap.className = "npc-portrait-card__image";
    const img = document.createElement("img");
    img.alt = meta.title;
    img.src = asset?.src || `assets/characters/${spriteKey}.png?v=${encodeURIComponent(typeof VERSION !== "undefined" ? VERSION : "dev")}`;
    imgWrap.appendChild(img);
    const body = document.createElement("div");
    body.className = "npc-portrait-card__body";
    const name = document.createElement("div");
    name.className = "npc-portrait-card__name";
    name.textContent = `${meta.title}｜${meta.role}`;
    const place = document.createElement("div");
    place.className = "npc-portrait-card__place";
    place.textContent = meta.place;
    const note = document.createElement("p");
    note.className = "npc-portrait-card__note";
    note.textContent = meta.note;
    body.append(name, place, note);
    card.append(imgWrap, body);
    node.appendChild(card);
  }

  function getItemName(game, item) {
    return ItemSystem.getItemName(game, item);
  }

  // ---- レスポンシブ / キャンバス設定 ----
  function pickMode() {
    if (typeof window === "undefined") return "desktop";
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const narrow = (window.innerWidth || 1024) <= CONFIG.mobileBreakpoint;
    return (coarse || narrow) ? "mobile" : "desktop";
  }

  function setupCanvas() {
    const mode = pickMode();
    view.mode = mode;
    view.cols = mode === "mobile" ? CONFIG.viewportWidthMobile : CONFIG.viewportWidth;
    view.rows = mode === "mobile" ? CONFIG.viewportHeightMobile : CONFIG.viewportHeight;
    view.tile = CONFIG.tileSize;
    const dprRaw = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    view.dpr = Math.min(CONFIG.maxDevicePixelRatio, Math.max(1, dprRaw));
    const logicalW = view.cols * view.tile;
    const logicalH = view.rows * view.tile;
    canvas.width = Math.round(logicalW * view.dpr);
    canvas.height = Math.round(logicalH * view.dpr);
    if (canvas.style) {
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.aspectRatio = `${view.cols} / ${view.rows}`;
      canvas.style.maxWidth = mode === "mobile" ? "100%" : `${logicalW}px`;
    }
    dirtySetup = false;
  }

  function ensureSetup() {
    if (dirtySetup) setupCanvas();
  }

  // ---- 表示レジストリ（補間ターゲットの更新） ----
  function entityList(game) {
    const list = [{ id: "player", x: game.player.x, y: game.player.y }];
    for (const e of game.enemies) list.push({ id: e.id, x: e.x, y: e.y });
    for (const npc of (game.npcs || [])) list.push({ id: npc.id, x: npc.x, y: npc.y });
    for (const it of game.items) {
      if (!it.id) it.id = `item-${++itemSeq}`;
      list.push({ id: it.id, x: it.x, y: it.y });
    }
    return list;
  }

  function syncPresentation(game) {
    const now = nowMs();
    const seen = new Set();
    for (const ent of entityList(game)) {
      seen.add(ent.id);
      let p = pres.get(ent.id);
      if (!p) {
        p = { dispX: ent.x, dispY: ent.y, fromX: ent.x, fromY: ent.y, toX: ent.x, toY: ent.y, start: now };
        pres.set(ent.id, p);
      } else if (p.toX !== ent.x || p.toY !== ent.y) {
        p.fromX = p.dispX;
        p.fromY = p.dispY;
        p.toX = ent.x;
        p.toY = ent.y;
        p.start = now;
      }
    }
    for (const id of [...pres.keys()]) if (!seen.has(id)) pres.delete(id);
  }

  function dispOf(id, fallbackX, fallbackY) {
    const p = pres.get(id);
    if (!p) return { x: fallbackX, y: fallbackY, moving: false, moveProgress: 1 };
    const progress = clamp((nowMs() - p.start) / Math.max(1, CONFIG.moveAnimMs), 0, 1);
    const moving = progress < 1 && (p.fromX !== p.toX || p.fromY !== p.toY);
    return { x: p.dispX, y: p.dispY, moving, moveProgress: progress, fromX: p.fromX, fromY: p.fromY, toX: p.toX, toY: p.toY };
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function advanceTweens(now) {
    const dur = Math.max(1, CONFIG.moveAnimMs);
    for (const p of pres.values()) {
      const t = clamp((now - p.start) / dur, 0, 1);
      const e = easeOutQuad(t);
      p.dispX = p.fromX + (p.toX - p.fromX) * e;
      p.dispY = p.fromY + (p.toY - p.fromY) * e;
    }
  }

  function combatProgress(now, fx) {
    return clamp((now - fx.born) / Math.max(1, CONFIG.combatAnimMs || 260), 0, 1);
  }

  function combatOffsetFor(game, id, now) {
    if (!Array.isArray(game.fx)) return { x: 0, y: 0 };
    let ox = 0;
    let oy = 0;
    for (const f of game.fx) {
      if (!f || !["hit", "hurt", "throw", "shoot", "laser"].includes(f.type)) continue;
      if (typeof f.fromX !== "number" || typeof f.fromY !== "number") continue;
      const p = combatProgress(now, f);
      if (p >= 1) continue;
      const dx = (f.x ?? f.fromX) - f.fromX;
      const dy = (f.y ?? f.fromY) - f.fromY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const windup = Math.sin(clamp(p / 0.42, 0, 1) * Math.PI);
      const returnEase = Math.sin(p * Math.PI);
      if (f.actorId === id && (f.type === "hit" || f.type === "hurt")) {
        ox += ux * (0.10 * windup + 0.34 * returnEase);
        oy += uy * (0.10 * windup + 0.34 * returnEase);
      }
      if (f.actorId === id && f.type === "throw") {
        ox += ux * returnEase * 0.14;
        oy += uy * returnEase * 0.14;
      }
      if (f.actorId === id && (f.type === "shoot" || f.type === "laser")) {
        ox -= ux * returnEase * (f.type === "laser" ? 0.18 : 0.11);
        oy -= uy * returnEase * (f.type === "laser" ? 0.18 : 0.11);
      }
      if (f.targetId === id) {
        const recoil = Math.sin(clamp(p / 0.58, 0, 1) * Math.PI) * Math.max(0, 1 - p * 0.35);
        const shake = Math.sin(p * Math.PI * 14) * Math.max(0, 1 - p) * 0.08;
        const power = f.type === "laser" ? 0.30 : f.type === "shoot" ? 0.24 : 0.20;
        ox += ux * recoil * power + ux * shake;
        oy += uy * recoil * power + uy * shake;
      }
    }
    return { x: ox, y: oy };
  }

  function screenShakeFor(game, now) {
    if (!Array.isArray(game.fx)) return { x: 0, y: 0 };
    let power = 0;
    for (const f of game.fx) {
      if (!f || !["hit", "hurt", "defeat", "shoot", "laser"].includes(f.type)) continue;
      const p = combatProgress(now, f);
      if (p >= 1) continue;
      const weight = f.type === "laser" ? 1.25 : f.type === "defeat" ? 1.0 : 0.65;
      power = Math.max(power, (1 - p) * weight);
    }
    if (power <= 0) return { x: 0, y: 0 };
    const amp = (CONFIG.screenShakePx || 0) * power;
    return { x: Math.sin(now * 0.071) * amp, y: Math.cos(now * 0.083) * amp };
  }

  function combatStateFor(game, id, now) {
    const state = { actor: false, target: false, targetProgress: 1, actorProgress: 1, type: null, damage: 0, showHp: false, hpAlpha: 0 };
    if (!Array.isArray(game.fx)) return state;
    for (const f of game.fx) {
      if (!f || !["hit", "hurt", "throw", "shoot", "laser"].includes(f.type)) continue;
      const p = combatProgress(now, f);
      if (p >= 1) continue;
      const fade = Math.max(0, 1 - p);
      if (f.actorId === id) {
        state.actor = true;
        state.actorProgress = Math.min(state.actorProgress, p);
      }
      if (f.targetId === id) {
        state.target = true;
        state.targetProgress = Math.min(state.targetProgress, p);
        state.type = f.type;
        state.damage = Math.max(state.damage, f.damage || 0);
        state.showHp = true;
        state.hpAlpha = Math.max(state.hpAlpha, fade);
      }
    }
    return state;
  }

  function drawEntityCombatOverlay(ctx, px, py, t, state, isPlayer = false) {
    if (!state || (!state.actor && !state.target)) return;
    const cx = px + t * 0.5;
    const cy = py + t * (isPlayer ? 0.48 : 0.46);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (state.actor) {
      const p = clamp(state.actorProgress, 0, 1);
      const alpha = Math.max(0, 0.42 - p * 0.50);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = isPlayer ? "rgba(150,235,255,0.90)" : "rgba(255,155,95,0.85)";
      ctx.lineWidth = Math.max(2, t * 0.055);
      ctx.beginPath();
      ctx.arc(cx, py + t * 0.66, t * (0.30 + p * 0.22), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.target) {
      const p = clamp(state.targetProgress, 0, 1);
      const flash = Math.max(0, 0.56 - p * 0.70);
      ctx.globalAlpha = flash;
      ctx.fillStyle = state.type === "laser" || state.type === "shoot" || state.type === "hurt" ? "rgba(255,55,40,0.95)" : "rgba(255,245,180,0.95)";
      ctx.fillRect(px + t * 0.16, py + t * 0.12, t * 0.68, t * 0.76);
      ctx.globalAlpha = Math.max(0, 0.52 - p * 0.54);
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = Math.max(2, t * 0.06);
      ctx.beginPath();
      ctx.arc(cx, cy, t * (0.30 + p * 0.36), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemyHpChip(ctx, px, py, t, enemy, state) {
    if (!enemy || !state?.showHp || !enemy.maxHp) return;
    const alpha = clamp(0.28 + state.hpAlpha, 0, 1);
    const w = t * 0.78;
    const h = Math.max(4, t * 0.09);
    const x = px + (t - w) / 2;
    const y = py + t * 0.04;
    const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.74)";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = "rgba(80,80,80,0.80)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ratio <= 0.3 ? "rgba(255,84,68,0.95)" : "rgba(255,205,88,0.95)";
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function drawSceneBackdropCell(game, tx, ty, px, py, t, visible) {
    const sceneKey = game.screen === "title" ? "title" : game.screen === "base" ? "base" : "dungeon";
    if (!Visuals.drawSceneTile || !Visuals.drawSceneTile(ctx, sceneKey, tx, ty, px, py, t)) {
      return false;
    }
    ctx.save();
    if (game.screen === "base") {
      ctx.fillStyle = visible ? "rgba(14,10,8,0.04)" : "rgba(0,0,0,0.12)";
    } else {
      ctx.fillStyle = visible ? "rgba(4,10,12,0.14)" : "rgba(0,0,0,0.45)";
    }
    ctx.fillRect(px, py, t, t);
    ctx.restore();
    return true;
  }

  function drawFloorReadabilityOverlay(game, px, py, t, visible) {
    ctx.save();
    if (game.screen === "base") {
      ctx.strokeStyle = visible ? "rgba(220,192,148,0.08)" : "rgba(0,0,0,0.14)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, t - 1, t - 1);
      ctx.fillStyle = visible ? "rgba(255,228,190,0.025)" : "rgba(0,0,0,0.04)";
      ctx.fillRect(px + 1, py + 1, t - 2, t - 2);
    } else {
      ctx.strokeStyle = visible ? "rgba(98,162,176,0.12)" : "rgba(34,58,66,0.10)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, t - 1, t - 1);
      ctx.strokeStyle = visible ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.moveTo(px + t * 0.20, py + t * 0.28);
      ctx.lineTo(px + t * 0.80, py + t * 0.28);
      ctx.moveTo(px + t * 0.20, py + t * 0.72);
      ctx.lineTo(px + t * 0.80, py + t * 0.72);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnhancedTile(game, kind, px, py, t, visible) {
    if (kind === TILE.FLOOR) {
      drawFloorReadabilityOverlay(game, px, py, t, visible);
      return;
    }
    ctx.save();
    if (game.screen === "base") {
      ctx.globalAlpha = kind === TILE.WALL ? 0.56 : kind === TILE.ENTRANCE ? 0.92 : 0.72;
    } else {
      ctx.globalAlpha = kind === TILE.WALL ? 0.90 : 0.96;
    }
    Visuals.tile(ctx, kind, px, py, t, visible);
    ctx.restore();
  }

  function drawSettlementProps(game, toScreen, t, now) {
    if (game.screen !== "base" || !Array.isArray(game.settlementProps)) return;
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 220);
    for (const prop of game.settlementProps) {
      const x = prop.x || 0;
      const y = prop.y || 0;
      const w = Math.max(1, prop.w || 1);
      const h = Math.max(1, prop.h || 1);
      const s = toScreen(x, y);
      const px = s.px;
      const py = s.py;
      const ww = w * t;
      const hh = h * t;
      ctx.save();
      ctx.globalAlpha = prop.type === "campfire" ? 0.92 : prop.type === "water" ? 0.82 : prop.type === "gate" || prop.type === "door" ? 0.74 : 0.28;
      if (prop.type === "house") {
        ctx.fillStyle = "rgba(36,31,28,0.46)";
        ctx.fillRect(px + 3, py + 5, ww - 6, hh - 8);
        ctx.fillStyle = "rgba(118,88,64,0.82)";
        ctx.fillRect(px + 2, py + 6, ww - 4, hh - 10);
        ctx.fillStyle = "rgba(74,55,43,0.85)";
        ctx.beginPath();
        ctx.moveTo(px, py + 8);
        ctx.lineTo(px + ww * 0.5, py - 4);
        ctx.lineTo(px + ww, py + 8);
        ctx.closePath();
        ctx.fill();
      } else if (prop.type === "water") {
        ctx.fillStyle = "rgba(32,48,50,0.52)";
        ctx.fillRect(px, py, ww, hh);
        ctx.fillStyle = `rgba(86,170,176,${0.50 + pulse * 0.18})`;
        ctx.fillRect(px + 3, py + 3, ww - 6, hh - 6);
        ctx.strokeStyle = "rgba(165,220,228,0.55)";
        ctx.strokeRect(px + 2, py + 2, ww - 4, hh - 4);
      } else if (prop.type === "campfire") {
        ctx.fillStyle = "rgba(48,34,20,0.78)";
        ctx.fillRect(px + t * 0.15, py + t * 0.72, t * 0.7, t * 0.14);
        ctx.fillStyle = `rgba(255,150,46,${0.65 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.moveTo(px + t * 0.52, py + t * 0.20);
        ctx.quadraticCurveTo(px + t * 0.74, py + t * 0.56, px + t * 0.48, py + t * 0.80);
        ctx.quadraticCurveTo(px + t * 0.28, py + t * 0.54, px + t * 0.52, py + t * 0.20);
        ctx.fill();
        ctx.fillStyle = `rgba(255,228,138,${0.46 + pulse * 0.18})`;
        ctx.beginPath();
        ctx.arc(px + t * 0.5, py + t * 0.58, t * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === "workbench") {
        ctx.fillStyle = "rgba(93,73,58,0.92)";
        ctx.fillRect(px + 4, py + 7, ww - 8, hh - 10);
        ctx.fillStyle = "rgba(188,170,140,0.44)";
        ctx.fillRect(px + 6, py + 9, ww - 12, Math.max(4, hh * 0.25));
      } else if (prop.type === "scrap") {
        ctx.fillStyle = "rgba(88,83,72,0.78)";
        for (let i = 0; i < 6; i++) {
          const ox = (i % 3) * (ww / 3);
          const oy = Math.floor(i / 3) * (hh / 2);
          ctx.fillRect(px + ox + 2, py + oy + 3, Math.max(5, ww / 4), Math.max(4, hh / 3));
        }
      } else if (prop.type === "camp") {
        ctx.fillStyle = "rgba(72,52,34,0.38)";
        ctx.fillRect(px + 2, py + 4, ww - 4, hh - 8);
        ctx.strokeStyle = "rgba(190,145,82,0.32)";
        ctx.strokeRect(px + 3, py + 5, ww - 6, hh - 10);
      } else if (prop.type === "watchtower") {
        ctx.strokeStyle = "rgba(150,132,106,0.78)";
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 8, py + 4, ww - 16, hh - 12);
        ctx.beginPath();
        ctx.moveTo(px + 10, py + hh - 2);
        ctx.lineTo(px + 16, py + 8);
        ctx.moveTo(px + ww - 10, py + hh - 2);
        ctx.lineTo(px + ww - 16, py + 8);
        ctx.stroke();
      } else if (prop.type === "yard") {
        ctx.fillStyle = "rgba(45,40,38,0.24)";
        ctx.fillRect(px + 1, py + 1, ww - 2, hh - 2);
        ctx.strokeStyle = "rgba(150,120,90,0.36)";
        ctx.strokeRect(px + 1, py + 1, ww - 2, hh - 2);
      } else if (prop.type === "gate") {
        ctx.fillStyle = "rgba(46,42,44,0.60)";
        ctx.fillRect(px, py, ww, hh);
        ctx.strokeStyle = "rgba(194,166,112,0.48)";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, ww - 4, hh - 4);
        ctx.beginPath();
        ctx.moveTo(px + ww * 0.5, py + 3);
        ctx.lineTo(px + ww * 0.5, py + hh - 3);
        ctx.stroke();
      } else if (prop.type === "door") {
        ctx.fillStyle = "rgba(214,184,118,0.88)";
        ctx.fillRect(px + 6, py + 4, t - 12, t - 8);
      }
      ctx.restore();
    }
  }

  function getIntentVisual(enemy) {
    const kind = enemy?.intent?.kind || "melee";
    if (kind === "laser") return { color: "rgba(255,92,72,0.92)", chip: "砲" };
    if (kind === "shoot") return { color: "rgba(255,188,72,0.92)", chip: "射" };
    if (kind === "pounce") return { color: "rgba(255,130,92,0.92)", chip: "跳" };
    if (kind === "slash") return { color: "rgba(255,120,120,0.92)", chip: "斬" };
    return { color: "rgba(255,170,88,0.92)", chip: "危" };
  }

  function drawEnemyIntentOverlay(enemy, px, py, t, toScreen, now) {
    if (!enemy?.intent) return;
    const { color, chip } = getIntentVisual(enemy);
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 140);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5 + pulse * 0.35;
    ctx.lineWidth = Math.max(2, t * 0.05);
    ctx.beginPath();
    ctx.arc(px + t * 0.5, py + t * 0.48, t * (0.36 + pulse * 0.05), 0, Math.PI * 2);
    ctx.stroke();
    const targetX = typeof enemy.intent.targetX === "number" ? enemy.intent.targetX : enemy.x;
    const targetY = typeof enemy.intent.targetY === "number" ? enemy.intent.targetY : enemy.y;
    const s = toScreen(targetX, targetY);
    ctx.beginPath();
    ctx.moveTo(px + t * 0.5, py + t * 0.48);
    ctx.lineTo(s.px + t * 0.5, s.py + t * 0.5);
    ctx.stroke();
    ctx.globalAlpha = 0.45 + pulse * 0.25;
    ctx.strokeRect(s.px + t * 0.18, s.py + t * 0.18, t * 0.64, t * 0.64);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(px + t * 0.18, py - t * 0.22, t * 0.52, t * 0.28);
    ctx.strokeStyle = color;
    ctx.strokeRect(px + t * 0.18, py - t * 0.22, t * 0.52, t * 0.28);
    ctx.fillStyle = "rgba(255,245,224,0.96)";
    ctx.font = `${Math.max(12, Math.floor(t * 0.24))}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, px + t * 0.44, py - t * 0.08);
    ctx.restore();
  }

  function drawEntranceTransitionOverlay(game, width, height, now) {
    if (game.transition?.type !== "entrance") return;
    const step = game.transition.step || "warning";
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) / 180);
    const panelW = Math.min(width - 40, 420);
    const panelH = 160;
    const x = (width - panelW) / 2;
    const y = (height - panelH) / 2;
    const title = step === "warning" ? "高汚染区画 接続前" : step === "mask" ? "マスク装着" : step === "door" ? "隔壁開放" : "廃棄層進入";
    const body = step === "warning" ? "汚染警告を確認。帰還経路と残量を再点検している。" : step === "mask" ? "フィルタを装着し、呼吸音だけが近くなる。" : step === "door" ? "重い扉が軋み、暗い通路が口を開く。" : "暗転の向こうで区画再構成が始まる。";
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.48 + pulse * 0.16})`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(10,10,12,0.86)";
    ctx.fillRect(x, y, panelW, panelH);
    ctx.strokeStyle = step === "door" || step === "descend" ? "rgba(220,180,108,0.80)" : "rgba(140,180,190,0.72)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, panelW - 2, panelH - 2);
    ctx.fillStyle = "rgba(250,236,210,0.96)";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(title, x + 24, y + 38);
    ctx.font = "15px system-ui";
    ctx.fillText(body, x + 24, y + 78);
    ctx.font = "13px system-ui";
    ctx.fillStyle = "rgba(200,210,215,0.88)";
    ctx.fillText("装備確認 → マスク装着 → 隔壁開放", x + 24, y + 126);
    ctx.restore();
  }

  // ---- 世界の描画（毎フレーム） ----

  function drawFloorEventOverlay(game, width, height, now) {
    if (!FEATURES.floorEventVisuals || game.screen !== "run") return;
    const type = game.floorEvent || "normal";
    const phase = (now || 0) / 1000;
    ctx.save();
    if (type === "blackout") {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(0, 0, width, height);
      const g = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.16, width * 0.5, height * 0.5, Math.max(width, height) * 0.62);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.58)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = `rgba(86,190,255,${0.05 + 0.035 * Math.sin(phase * 5)})`;
      for (let y = 0; y < height; y += 18) ctx.fillRect(0, y, width, 1);
    } else if (type === "pollution_leak") {
      const drift = (Math.sin(phase * 0.7) + 1) * 0.5;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(55,210,92,${0.07 + 0.04 * drift})`;
      for (let i = 0; i < 7; i++) {
        const x = ((i * 91 + phase * 18) % (width + 120)) - 60;
        const y = (i * 47) % height;
        ctx.beginPath();
        ctx.ellipse(x, y, 72, 24, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === "security_sweep") {
      const a = 0.16 + 0.08 * Math.max(0, Math.sin(phase * 6));
      ctx.strokeStyle = `rgba(255,65,55,${a})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, width - 10, height - 10);
      ctx.fillStyle = `rgba(255,45,35,${a * 0.45})`;
      ctx.fillRect(0, 0, width, 8);
      ctx.fillRect(0, height - 8, width, 8);
    } else if (type === "dismantle_shift") {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 10; i++) {
        const x = (Math.sin(phase * 2 + i) * 0.5 + 0.5) * width;
        const y = (i * 31 + Math.cos(phase + i) * 18) % height;
        ctx.strokeStyle = `rgba(255,170,70,${0.10 + 0.08 * Math.sin(phase * 7 + i)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 18, y - 8);
        ctx.stroke();
      }
    } else if (type === "supply_scatter") {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,211,92,0.055)";
      ctx.fillRect(0, 0, width, height);
    } else if (type === "quiet") {
      ctx.fillStyle = "rgba(80,130,180,0.06)";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  function drawWorld() {
    if (!lastGame) return;
    ensureSetup();
    const game = lastGame;
    const t = view.tile;
    const cols = view.cols;
    const rows = view.rows;
    const now = nowMs();
    advanceTweens(now);

    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, cols * t, rows * t);
    const shake = screenShakeFor(game, now);
    if (shake.x || shake.y) ctx.translate(shake.x, shake.y);
    const backgroundKey = game.screen === "title" ? "title" : game.screen === "base" ? "base" : "dungeon";
    Visuals.drawAssetBackground(ctx, backgroundKey, 0, 0, cols * t, rows * t, "#05070b", "#020203");
    const backgroundShade = game.screen === "title" ? 0.26 : game.screen === "base" ? 0.10 : 0.18;
    ctx.fillStyle = `rgba(0,0,0,${backgroundShade})`;
    ctx.fillRect(0, 0, cols * t, rows * t);

    const pp = dispOf("player", game.player.x, game.player.y);
    const camX = clamp(pp.x - (cols - 1) / 2, 0, Math.max(0, CONFIG.mapWidth - cols));
    const camY = clamp(pp.y - (rows - 1) / 2, 0, Math.max(0, CONFIG.mapHeight - rows));
    const startTX = Math.floor(camX);
    const startTY = Math.floor(camY);
    const fracX = (camX - startTX) * t;
    const fracY = (camY - startTY) * t;

    for (let sy = 0; sy <= rows; sy++) {
      for (let sx = 0; sx <= cols; sx++) {
        const tx = startTX + sx;
        const ty = startTY + sy;
        if (tx < 0 || ty < 0 || tx >= CONFIG.mapWidth || ty >= CONFIG.mapHeight) continue;
        const px = sx * t - fracX;
        const py = sy * t - fracY;
        if (!game.explored[ty]?.[tx]) {
          ctx.fillStyle = "#020304";
          ctx.fillRect(px, py, t, t);
          ctx.fillStyle = "rgba(12,18,24,0.18)";
          ctx.fillRect(px + 1, py + 1, t - 2, t - 2);
          continue;
        }
        const visible = Boolean(game.visible[ty]?.[tx]);
        drawSceneBackdropCell(game, tx, ty, px, py, t, visible);
        drawEnhancedTile(game, game.map[ty][tx], px, py, t, visible);
      }
    }

    const toScreen = (gx, gy) => ({ px: (gx - camX) * t, py: (gy - camY) * t });

    drawSettlementProps(game, toScreen, t, now);

    for (const trap of game.traps) {
      if (!trap.active || !trap.discovered) continue;
      if (!game.visible[trap.y]?.[trap.x] && !game.explored[trap.y]?.[trap.x]) continue;
      const s = toScreen(trap.x, trap.y);
      Visuals.trap(ctx, s.px, s.py, t, Boolean(game.visible[trap.y]?.[trap.x]));
    }

    for (const it of game.items) {
      if (!game.visible[it.y]?.[it.x]) continue;
      const d = dispOf(it.id, it.x, it.y);
      const s = toScreen(d.x, d.y);
      Visuals.item(ctx, it.kind, s.px, s.py, t, { now, seed: it.id });
    }

    if (game.lure && game.lure.turns > 0 && game.visible[game.lure.y]?.[game.lure.x]) {
      const s = toScreen(game.lure.x, game.lure.y);
      Visuals.glyph(ctx, "o", s.px, s.py, t, "#ffe580", 0.6);
    }

    for (const npc of (game.npcs || [])) {
      if (!game.visible[npc.y]?.[npc.x]) continue;
      const d = dispOf(npc.id, npc.x, npc.y);
      const s = toScreen(d.x, d.y);
      Visuals.npc(ctx, npc.key, s.px, s.py, t, { now, seed: npc.id, moving: d.moving, moveProgress: d.moveProgress });
    }

    for (const enemy of game.enemies) {
      if (!game.visible[enemy.y]?.[enemy.x]) continue;
      const d = dispOf(enemy.id, enemy.x, enemy.y);
      const c = combatOffsetFor(game, enemy.id, now);
      const s = toScreen(d.x + c.x, d.y + c.y);
      const cs = combatStateFor(game, enemy.id, now);
      Visuals.enemy(ctx, enemy.type, s.px, s.py, t, { stun: enemy.stun > 0, now, seed: enemy.id, state: enemy.state, moving: d.moving, moveProgress: d.moveProgress });
      drawEntityCombatOverlay(ctx, s.px, s.py, t, cs, false);
      drawEnemyHpChip(ctx, s.px, s.py, t, enemy, cs);
      drawEnemyIntentOverlay(enemy, s.px, s.py, t, toScreen, now);
    }

    const pc = combatOffsetFor(game, "player", now);
    const ps = toScreen(pp.x + pc.x, pp.y + pc.y);
    const playerCombat = combatStateFor(game, "player", now);
    const playerSpriteKey = game.screen === "base" ? "player_town" : "player_dungeon";
    Visuals.player(ctx, ps.px, ps.py, t, { now, seed: "player", moving: pp.moving, moveProgress: pp.moveProgress, spriteKey: playerSpriteKey });
    drawEntityCombatOverlay(ctx, ps.px, ps.py, t, playerCombat, true);

    if (Array.isArray(game.fx) && game.fx.length) {
      const keep = [];
      for (const f of game.fx) {
        const prog = (now - f.born) / Math.max(1, CONFIG.fxMs);
        if (prog >= 1) continue;
        keep.push(f);
        const s = toScreen(f.x + 0.5, f.y + 0.5);
        const from = (typeof f.fromX === "number" && typeof f.fromY === "number") ? toScreen(f.fromX + 0.5, f.fromY + 0.5) : null;
        Visuals.fx(ctx, f.type, s.px, s.py, t, prog, { damage: f.damage, from, itemKind: f.itemKind });
      }
      game.fx = keep;
    }

    drawFloorEventOverlay(game, cols * t, rows * t, now);
    drawEntranceTransitionOverlay(game, cols * t, rows * t, now);

    const vignette = ctx.createRadialGradient(cols * t * 0.5, rows * t * 0.5, Math.min(cols, rows) * t * 0.2, cols * t * 0.5, rows * t * 0.5, Math.max(cols, rows) * t * 0.62);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cols * t, rows * t);
  }

  function loop() {
    drawWorld();
    const asset = Visuals.assetStatus ? Visuals.assetStatus() : { ready: true };
    if (lastGame && !asset.ready) {
      assetLoadingOverlayShown = true;
      renderScreenPanel(lastGame);
    } else if (lastGame && assetLoadingOverlayShown) {
      assetLoadingOverlayShown = false;
      render(lastGame);
    }
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(loop);
    else loopRunning = false;
  }

  function ensureLoop() {
    if (typeof requestAnimationFrame === "function") {
      if (!loopRunning) {
        loopRunning = true;
        requestAnimationFrame(loop);
      }
    } else {
      drawWorld(); // テスト等 rAF 非対応環境では都度1回描画
    }
  }

  // ---- HUD / パネル ----
  function countExplored(game) {
    let count = 0;
    for (let y = 0; y < CONFIG.mapHeight; y++) {
      for (let x = 0; x < CONFIG.mapWidth; x++) if (game.explored[y]?.[x]) count++;
    }
    return count;
  }

  function setBar(fill, textNode, value, max, lowColor, midColor, highColor) {
    if (!fill) return;
    const ratio = clamp(value / max, 0, 1);
    fill.style.width = `${Math.round(ratio * 100)}%`;
    fill.style.background = ratio <= 0.25 ? lowColor : ratio <= 0.55 ? midColor : highColor;
    if (textNode) textNode.textContent = `${value}/${max}`;
  }

  function renderBars(game) {
    setBar(hpFill, hpText, game.player.hp, game.player.maxHp, "#e05555", "#e0a955", "#5fd06a");
    setBar(hungerFill, hungerText, game.player.hunger, CONFIG.maxHunger, "#e05555", "#e0a955", "#7fb0e0");
    // 汚染は高いほど危険なので色の意味を反転
    if (pollutionFill) {
      const ratio = clamp(game.player.pollution / CONFIG.pollutionLimit, 0, 1);
      pollutionFill.style.width = `${Math.round(ratio * 100)}%`;
      pollutionFill.style.background = ratio >= 0.75 ? "#c65cc6" : ratio >= 0.45 ? "#a06bd0" : "#5e8f5e";
      if (pollutionText) pollutionText.textContent = `${game.player.pollution}/${CONFIG.pollutionLimit}`;
    }
  }

  function renderLog(game) {
    clearNode(logPanel);
    const latest = game.logs.slice(0, 3);
    for (const message of latest) appendLine(logPanel, message);
  }

  function renderStatus(game) {
    if (versionText) versionText.textContent = `Version: ${VERSION}`;
    const state = game.isClear ? " / CLEAR" : game.isGameOver ? " / GAME OVER" : game.isReturned ? " / RETURNED" : "";
    if (game.screen === "base") {
      const ent = game.settlementEntrance || { x: 43, y: 16 };
      const atEntrance = game.player.x === ent.x && game.player.y === ent.y;
      statusText.textContent = game.transition?.type === "entrance"
        ? "外縁集落｜隔壁通過シーケンス進行中"
        : atEntrance
          ? "外縁集落｜廃棄層入口：進入演出を開始"
          : "外縁集落｜住人に話しかけられる生活空間｜東の廃棄層入口へ向かう";
      if (debugText) debugText.textContent = `debug: ${view.mode} ${view.cols}x${view.rows} dpr${view.dpr} / settlement turn ${game.settlementTurn || 0} / npc ${(game.npcs || []).length} / fx ${Array.isArray(game.fx) ? game.fx.length : 0}`;
      return;
    }
    const weapon = game.player.weapon ? ITEM_DEFS[game.player.weapon.kind]?.name : "素手工具";
    const armor = game.player.armor ? ITEM_DEFS[game.player.armor.kind]?.name : "作業服";
    const floorEvent = FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働";
    const terminals = game.terminals?.length ? ` / 端末 ${game.disabledTerminals || 0}/${game.terminals.length}` : "";
    const objective = game.depth >= CONFIG.maxDepth
      ? (game.terminals?.some(t => t.active) ? "目的: 防衛端末を停止" : game.enemies.some(e => e.type === "guardian") ? "目的: 中枢防衛機を停止" : "目的: 浄水コアを回収")
      : "目的: 搬送リフトを探して深度を進める";
    const selected = game.inventory[game.selectedIndex] ? ` / 選択 ${game.selectedIndex + 1}:${getItemName(game, game.inventory[game.selectedIndex])}` : " / 選択 なし";
    if (view.mode === "mobile") {
      statusText.textContent = `${objective}｜深度${game.depth}/${CONFIG.maxDepth}｜敵${game.enemies.length}｜${floorEvent}${terminals}${selected}${state}`;
    } else {
      statusText.textContent = `${objective}｜難易度 ${currentDifficulty().name}｜深度 ${game.depth}/${CONFIG.maxDepth}｜ターン ${game.turn}｜敵 ${game.enemies.length}｜全域 ${floorEvent}${terminals}｜装備 ${weapon}/${armor}｜開拓 ${countExplored(game)}${selected}${state}`;
    }
    if (debugText) {
      debugText.textContent = `debug: ${view.mode} ${view.cols}x${view.rows} dpr${view.dpr} / gen ${game.debug.generationCount} / rooms ${game.rooms.length} / visible ${game.debug.visibleCount} / enemyTurn ${game.debug.enemyTurnCount} / fx ${Array.isArray(game.fx) ? game.fx.length : 0} / traps ${game.traps.length} / path ${game.debug.pathCheckCount}`;
    }
  }

  function renderMiniMap(game) {
    if (!miniMapCanvas || !miniCtx) return;
    miniCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    miniCtx.fillStyle = "#050505";
    miniCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    const scaleX = miniMapCanvas.width / CONFIG.mapWidth;
    const scaleY = miniMapCanvas.height / CONFIG.mapHeight;
    for (let y = 0; y < CONFIG.mapHeight; y++) {
      for (let x = 0; x < CONFIG.mapWidth; x++) {
        if (!game.explored[y]?.[x]) continue;
        const visible = Boolean(game.visible[y]?.[x]);
        const tile = game.map[y][x];
        if (tile === TILE.WALL) miniCtx.fillStyle = visible ? "#777" : "#333";
        else if (tile === TILE.LIFT || tile === TILE.CORE || tile === TILE.ENTRANCE) miniCtx.fillStyle = visible ? "#e6c34a" : "#5e4a10";
        else if (tile === TILE.TERMINAL) miniCtx.fillStyle = visible ? "#aaaaff" : "#42426b";
        else if (tile === TILE.POLLUTION) miniCtx.fillStyle = visible ? "#4fb34f" : "#1e4d1e";
        else miniCtx.fillStyle = visible ? "#bfbfbf" : "#555";
        miniCtx.fillRect(Math.floor(x * scaleX), Math.floor(y * scaleY), Math.max(1, Math.ceil(scaleX)), Math.max(1, Math.ceil(scaleY)));
      }
    }
    miniCtx.fillStyle = "#fff";
    miniCtx.fillRect(Math.floor(game.player.x * scaleX) - 1, Math.floor(game.player.y * scaleY) - 1, 4, 4);
  }

  function renderInventory(game) {
    clearNode(inventoryPanel);
    const h = document.createElement("h2");
    h.textContent = "所持品 / 選択";
    inventoryPanel.appendChild(h);
    if (game.inventory.length === 0) {
      appendLine(inventoryPanel, "なし。足元の遺物は「拾う」で取得。");
      return;
    }
    const selectedItem = game.inventory[game.selectedIndex];
    if (selectedItem) {
      const def = ITEM_DEFS[selectedItem.kind];
      const effect = currentDifficulty().unidentified && def?.hidden && !game.identified[selectedItem.kind] ? "効果不明。鑑定または試用で判明。" : (def?.effectText || "説明なし");
      appendLine(inventoryPanel, `▶ ${game.selectedIndex + 1}. ${getItemName(game, selectedItem)}`, "selected-line");
      appendLine(inventoryPanel, effect, "muted-line");
    }
    const remaining = game.inventory
      .map((item, index) => ({ item, index }))
      .filter(row => row.index !== game.selectedIndex)
      .slice(0, 5);
    for (const row of remaining) appendLine(inventoryPanel, `${row.index + 1}. ${getItemName(game, row.item)}`);
  }

  function renderBase(game) {
    clearNode(basePanel);
    const h = document.createElement("h2");
    h.textContent = game.screen === "base" ? "外縁集落" : "探索情報";
    basePanel.appendChild(h);
    if (game.screen === "base") {
      appendLine(basePanel, "生活の残る固定集落。住人は焚き火と仕事場の間を歩き回る。", "selected-line");
      appendLine(basePanel, "中央の焚き火、左手の水場、右手の作業台と廃材置き場、東側の隔壁入口を見て回れる。");
      appendLine(basePanel, `浄水コア ${game.settlement.cores} / 発掘 ${game.settlement.runs} / 最深 ${game.settlement.bestDepth}`);
      appendLine(basePanel, "会話: 住人のいる方向へ進んでぶつかる", "muted-line");
      appendLine(basePanel, "入口に立つと演出付きで廃棄層へ進入", "muted-line");
      return;
    }
    const floorEvent = FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働";
    appendLine(basePanel, `全域: ${floorEvent}`, "selected-line");
    appendLine(basePanel, game.depth >= CONFIG.maxDepth ? `端末 ${game.disabledTerminals || 0}/${game.terminals?.length || 0}` : `深度 ${game.depth}/${CONFIG.maxDepth}`);
    appendLine(basePanel, `発掘回数 ${game.settlement.runs} / 最深 ${game.settlement.bestDepth}`);
    const open = Object.values(MISSION_DEFS).filter(m => !game.completedMissions[m.key]).slice(0, 2);
    for (const mission of open) appendLine(basePanel, `依頼: ${mission.title}`);
  }

  function renderCodex(game) {
    clearNode(codexPanel);
    const h = document.createElement("h2");
    h.textContent = "発見記録";
    codexPanel.appendChild(h);
    if (!game.codex.length) {
      appendLine(codexPanel, "未記録。詳細はメニューから確認。");
      return;
    }
    for (const entry of game.codex.slice(0, 5)) {
      const prefix = entry.key?.startsWith("enemy:") ? "敵" : entry.key?.startsWith("item:") ? "遺物" : entry.key?.startsWith("trap:") ? "罠" : entry.key?.startsWith("npc:") ? "住人" : "記録";
      appendLine(codexPanel, `[${prefix}] ${entry.title}`);
    }
  }

  // ---- オーバーレイ（タップ操作ボタン付き） ----
  function appendPanelLine(text, className = "") {
    if (!screenPanel) return;
    const p = document.createElement("p");
    p.textContent = text;
    if (className) p.className = className;
    screenPanel.appendChild(p);
  }

  function appendButtons(buttons) {
    if (!screenPanel) return;
    const row = document.createElement("div");
    row.className = "btn-row";
    for (const b of buttons) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "panel-btn" + (b.danger ? " danger" : "");
      btn.textContent = b.label;
      btn.dataset.cmd = b.cmd;
      if (b.arg !== undefined) btn.dataset.arg = String(b.arg);
      row.appendChild(btn);
    }
    screenPanel.appendChild(row);
  }

  function renderScreenPanel(game) {
    if (!screenPanel) return;
    clearNode(screenPanel);
    screenPanel.className = "screen-panel";
    const asset = Visuals.assetStatus ? Visuals.assetStatus() : { ready: true, total: 0, loaded: 0, failed: 0, done: 0, ratio: 1, failedKeys: [] };
    const ended = game.screen === "run" && (game.isGameOver || game.isClear);
    const active = !asset.ready || game.helpOpen || game.tutorialOpen || game.storyOpen || game.endingOpen || game.runRecordOpen || game.inventoryOpen || game.npcDialog || ended || game.screen === "title";
    screenPanel.hidden = !active;
    if (!active) return;

    const h = document.createElement("h2");
    screenPanel.appendChild(h);

    if (!asset.ready) {
      screenPanel.classList.add("loading-screen");
      h.textContent = "旧文明データを読込中";
      appendPanelLine(`画像アセット ${asset.done}/${asset.total} 読み込み中。`, "menu-line");
      appendPanelLine("読み込み完了後に開始する。古いプレースホルダー表示は出さない。", "muted-line");
      const bar = document.createElement("div");
      bar.className = "asset-load-bar";
      const fill = document.createElement("span");
      fill.style.width = `${Math.round((asset.ratio || 0) * 100)}%`;
      bar.appendChild(fill);
      screenPanel.appendChild(bar);
      return;
    }

    if (game.runMenuOpen) {
      screenPanel.classList.add("compact-menu-screen");
      h.textContent = "探索メニュー";
      const floorEvent = FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働";
      const floorDesc = FLOOR_EVENT_DEFS[game.floorEvent]?.desc || "特別な異常はない。";
      const terminals = game.terminals?.length ? `${game.disabledTerminals || 0}/${game.terminals.length}` : "なし";
      appendPanelLine(game.depth >= CONFIG.maxDepth ? "目的: 端末停止 → 防衛機停止 → 浄水コア回収。" : "目的: 搬送リフトを探し、深度を進める。", "menu-line");
      appendPanelLine(`フロアイベント: ${floorEvent} - ${floorDesc}`);
      appendPanelLine(`端末: ${terminals} / 敵: ${game.enemies.length} / 罠発動: ${game.debug.trapTriggeredCount}`);
      appendButtons([
        { label: "所持品", cmd: "inventory" },
        { label: "投げる", cmd: "throw" },
        { label: "調べる", cmd: "search" },
        { label: "途中帰還", cmd: "return" },
        { label: "記録", cmd: "records" },
        { label: "ヘルプ", cmd: "help" },
        { label: "閉じる", cmd: "close" }
      ]);
      return;
    }

    if (game.inventoryOpen) {
      screenPanel.classList.add("compact-menu-screen");
      h.textContent = "所持品一覧";
      if (!game.inventory.length) {
        appendPanelLine("所持品はない。足元の遺物は「拾う」で取得する。", "menu-line");
      } else {
        game.inventory.forEach((item, index) => {
          const def = ITEM_DEFS[item.kind];
          const selected = index === game.selectedIndex ? "▶" : " ";
          const effect = currentDifficulty().unidentified && def?.hidden && !game.identified[item.kind] ? "効果不明。使うか鑑定端末で識別する。" : (def?.effectText || "説明なし");
          const p = document.createElement("button");
          p.type = "button";
          p.className = "panel-btn item-row" + (index === game.selectedIndex ? " selected" : "");
          p.textContent = `${selected}${index + 1}. ${getItemName(game, item)} - ${effect}`;
          p.dataset.cmd = "select";
          p.dataset.arg = String(index);
          screenPanel.appendChild(p);
        });
      }
      appendButtons([
        { label: "使う", cmd: "use" },
        { label: "投げる", cmd: "throw" },
        { label: "置く", cmd: "drop" },
        { label: "閉じる", cmd: "close" }
      ]);
      return;
    }

    if (game.helpOpen) {
      screenPanel.classList.add("compact-menu-screen");
      h.textContent = "ヘルプ / 操作説明";
      appendPanelLine("スマホ: キャンバス全体を見えない9分割エリアとして扱う。押した位置の方向へ移動し、中央は足踏み/足元の遺物取得。", "menu-line");
      appendPanelLine("NPCや敵のいる方向へ進むと、会話または攻撃を自動実行する。");
      appendPanelLine("PC: 矢印/WASDで移動、斜めはQ/E/Z/Cまたはテンキー、.で足踏み。");
      appendPanelLine("足元の遺物: 中央タップまたはG / 所持品: I / 選択: 1〜8または[ ] / 使用: U / 置く: X / 投げる: T / 調べる: F");
      appendPanelLine("拠点: B / 探索メニュー: M / 途中帰還: P / 記録: L / 新規発掘: N");
      appendPanelLine("目的: 深度5で防衛端末を停止し、中枢防衛機を止め、浄水コアを回収する。地図は歩いて開拓する。");
      appendButtons([{ label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.storyOpen) {
      screenPanel.classList.add("story-screen");
      const page = STORY_PAGES[clamp(game.storyPage || 0, 0, STORY_PAGES.length - 1)];
      h.textContent = `${page.title} ${game.storyPage + 1}/${STORY_PAGES.length}`;
      for (const line of page.lines) appendPanelLine(line, "menu-line");
      appendButtons([{ label: "次へ", cmd: "start" }, { label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.endingOpen) {
      screenPanel.classList.add("story-screen");
      const page = ENDING_PAGES[clamp(game.endingPage || 0, 0, ENDING_PAGES.length - 1)];
      h.textContent = `${page.title} ${game.endingPage + 1}/${ENDING_PAGES.length}`;
      for (const line of page.lines) appendPanelLine(line, "menu-line");
      appendButtons([{ label: "次へ", cmd: "start" }, { label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.runRecordOpen) {
      screenPanel.classList.add("compact-menu-screen");
      h.textContent = "発掘記録";
      const logs = Array.isArray(game.settlement.runLogs) ? game.settlement.runLogs : [];
      if (!logs.length) appendPanelLine("まだ発掘記録はない。途中帰還、死亡、クリア時に記録される。", "menu-line");
      for (const entry of logs) {
        appendPanelLine(entry.summary, "menu-line");
        if (entry.cause || entry.floorEvent) appendPanelLine(`  原因: ${entry.cause || "-"} / 区画: ${entry.floorEvent || "-"}`, "muted-line");
      }
      appendButtons([{ label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.npcDialog) {
      screenPanel.classList.add("npc-screen");
      const talk = getNpcDialogue(game, game.npcDialog);
      h.textContent = `${talk.name}`;
      appendNpcPortraitCard(screenPanel, talk.key);
      appendPanelLine(talk.role, "section-line");
      for (const line of talk.lines.slice(0, 3)) appendPanelLine(line, "menu-line");
      appendSceneCard(screenPanel, "集落メモ", NPC_PORTRAIT_META[talk.key]?.place || "この住人は集落の一角で働いている。");
      appendButtons([{ label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.tutorialOpen) {
      screenPanel.classList.add("compact-menu-screen");
      h.textContent = "初回ガイド";
      appendPanelLine("まずは部屋を出て通路を進み、見える範囲を広げる。", "menu-line");
      appendPanelLine("敵は常にこちらを把握しているわけではない。角を曲がる、通路に誘う、アイテムで止める判断が重要。");
      appendPanelLine("落ちている遺物は「拾う」で取得。所持品から選んで使う・投げる・置く。");
      appendPanelLine("浄水コア回収が本目的。途中帰還は記録に残るが、アイテムは持ち帰らない。");
      appendButtons([{ label: "はじめる", cmd: "start" }]);
      return;
    }

    if (game.screen === "base") {
      screenPanel.classList.add("base-screen", "base-menu-screen", "settlement-screen");
      h.textContent = "外縁集落";
      appendPanelLine("AIが作り捨てる廃棄層の外側。住人のいる方向へ進むと会話できる。目的を確認してから発掘へ向かう。", "menu-line");
      appendPanelLine(`浄水コア ${game.settlement.cores} / 発掘 ${game.settlement.runs} / 最深 ${game.settlement.bestDepth}`, "muted-line");
      appendPanelLine("行動", "section-line");
      appendButtons([
        { label: "発掘へ", cmd: "start" },
        { label: "識別設定", cmd: "difficulty" },
        { label: "記録", cmd: "records" },
        { label: "ヘルプ", cmd: "help" }
      ]);
      return;
    }

    if (game.screen === "run" && (game.isGameOver || game.isClear)) {
      screenPanel.classList.add("result-screen");
      h.textContent = game.isClear ? "クリア / 浄水コア回収" : "ゲームオーバー";
      appendPanelLine(game.isClear ? "浄水コアを持ち帰った。集落の水は延命された。" : (game.lastDeathCause || "発掘家は倒れた。"), game.isClear ? "menu-line" : "danger-line");
      appendPanelLine(`深度 ${game.depth} / ${game.turn}ターン / 撃破 ${game.debug.enemyDefeatCount}`);
      appendButtons([
        { label: "新規発掘", cmd: "restart" },
        { label: "拠点", cmd: "base" },
        { label: "発掘記録", cmd: "records" }
      ]);
      return;
    }

    screenPanel.classList.add("title-screen", "title-menu-screen");
    h.textContent = "廃棄層の発掘家";
    appendPanelLine("AIが作り、壊し、捨て続ける巨大廃棄層。水を守るため、発掘家は深部へ潜る。", "menu-line");
    appendPanelLine(`識別設定: ${currentDifficulty().name} / 地図は歩いた範囲だけ開拓される。`, "muted-line");
    appendPanelLine("メインメニュー", "section-line");
    appendButtons([
      { label: "探索開始", cmd: "start" },
      { label: "拠点", cmd: "base" },
      { label: "ヘルプ", cmd: "help" }
    ]);
    appendPanelLine("資料", "section-line");
    appendButtons([
      { label: "ストーリー", cmd: "story" },
      { label: "エンディング", cmd: "ending" },
      { label: "発掘記録", cmd: "records" }
    ]);
  }

  function toggleControlsState(game) {
    if (!controls) return;
    const overlay = game.helpOpen || game.tutorialOpen || game.storyOpen || game.endingOpen || game.runRecordOpen || game.runMenuOpen || game.inventoryOpen || game.npcDialog;
    const playable = (game.screen === "run" || game.screen === "base") && !overlay && !game.isGameOver && !game.isClear;
    controls.classList.toggle("controls-dim", !playable);
    controls.classList.toggle("controls-base", game.screen === "base");
    if (actionPickupLabel) {
      actionPickupLabel.textContent = lastGame && game.screen === "run" && World.getItemAt(game, game.player.x, game.player.y) ? "拾う" : "使う";
    }
  }

  function render(game) {
    lastGame = game;
    syncPresentation(game);
    renderStatus(game);
    renderBars(game);
    renderLog(game);
    renderInventory(game);
    renderBase(game);
    renderCodex(game);
    renderScreenPanel(game);
    renderMiniMap(game);
    toggleControlsState(game);
    ensureLoop();
  }

  if (typeof window !== "undefined" && window.addEventListener) {
    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { dirtySetup = true; if (lastGame) drawWorld(); }, 120);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("haikiso:asset-progress", () => {
      if (lastGame) {
        renderScreenPanel(lastGame);
        drawWorld();
      }
    });
  }

  return { render, renderLog, getItemName };
}


// --- input.js (キーボード) ---
function bindInput(app) {
  window.addEventListener("keydown", event => {
    if (typeof AudioSystem !== "undefined") AudioSystem.unlock();
    const key = event.key.toLowerCase();
    const code = event.code;
    const handled = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "q", "e", "z", "c", ".", "r", "n", "g", "f", "u", "m", "b", "h", "p", "l", "escape", "enter", "o", "[", "]", "t", "x", "1", "2", "3", "4", "5", "6", "7", "8", "i"];
    if (handled.includes(key) || code.startsWith("Numpad")) event.preventDefault();
    if (event.repeat && ["r", "n", "g", "f", "t", "x", "[", "]", "b", "h", "p", "l", "enter", "o", "i", "u", "m"].includes(key)) return;

    if (key === "h") return app.toggleHelp();
    if (key === "escape") return app.closeOverlay();
    if (key === "enter") return app.startExploration();
    if (key === "b") return app.openBaseScreen();
    if (key === "i") return app.toggleInventory();
    if (event.shiftKey && key === "o") return app.resetProgress();

    // S/E はタイトル・拠点ではストーリー/エンディング、探索中は移動（下・右上）
    if (key === "s" && app.openStoryFromMenu()) return;
    if (key === "e" && app.openEndingFromMenu()) return;
    if (key === "l" && app.openRunRecords()) return;

    if (key === "arrowup" || key === "w" || code === "Numpad8") return app.movePlayer(0, -1);
    if (key === "arrowdown" || key === "s" || code === "Numpad2") return app.movePlayer(0, 1);
    if (key === "arrowleft" || key === "a" || code === "Numpad4") return app.movePlayer(-1, 0);
    if (key === "arrowright" || key === "d" || code === "Numpad6") return app.movePlayer(1, 0);
    if (key === "q" || code === "Numpad7") return app.movePlayer(-1, -1);
    if (key === "e" || code === "Numpad9") return app.movePlayer(1, -1);
    if (key === "z" || code === "Numpad1") return app.movePlayer(-1, 1);
    if (key === "c" || code === "Numpad3") return app.movePlayer(1, 1);
    if (key === "." || code === "Numpad5") return app.movePlayer(0, 0);

    if (key === "r") return app.regenerateArea();
    if (key === "n") return app.restartGame();
    if (key === "g") return app.pickupItemAtPlayer();
    if (key === "f") return app.searchAround();
    if (key === "u") return app.useSelectedInventoryItem();
    if (key === "m") return app.menuButton();
    if (key === "p") return app.manualReturn();
    if (key === "[") return app.selectInventory(-1);
    if (key === "]") return app.selectInventory(1);
    if (key === "x") return app.dropSelectedItem();
    if (key === "t") return app.throwSelectedItem();

    const index = Number(key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < 8 && !code.startsWith("Numpad")) return app.selectInventoryIndex(index);
  });
}


// --- touch.js (タッチ操作) ---
function bindTouch(app) {
  if (typeof document !== "undefined") {
    const preventZoom = event => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    };
    let lastTouchEndAt = 0;
    const preventDoubleTapZoom = event => {
      const now = Date.now();
      if (now - lastTouchEndAt <= 360) event.preventDefault();
      lastTouchEndAt = now;
    };
    const preventGestureZoom = event => event.preventDefault();

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
    document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    document.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    document.addEventListener("gestureend", preventGestureZoom, { passive: false });
  }

  const table = {
    move: arg => { const [dx, dy] = String(arg).split(",").map(Number); app.movePlayer(dx, dy); },
    pickup: () => app.contextPickupOrUse(),
    inventory: () => app.toggleInventory(),
    throw: () => app.throwSelectedItem(),
    menu: () => app.menuButton(),
    use: () => app.useSelectedInventoryItem(),
    drop: () => app.dropSelectedItem(),
    search: () => app.searchAround(),
    select: arg => app.selectInventoryIndex(Number(arg)),
    selectPrev: () => app.selectInventory(-1),
    selectNext: () => app.selectInventory(1),
    base: () => app.openBaseScreen(),
    help: () => app.toggleHelp(),
    return: () => app.manualReturn(),
    records: () => app.openRunRecords(),
    story: () => app.openStoryFromMenu(),
    ending: () => app.openEndingFromMenu(),
    restart: () => app.restartGame(),
    reset: () => app.resetProgress(),
    start: () => app.startExploration(),
    close: () => app.closeOverlay(),
    difficulty: () => app.cycleDifficulty()
  };

  function dispatch(target) {
    const el = target.closest && target.closest("[data-cmd]");
    if (!el) return false;
    const cmd = el.dataset.cmd;
    const fn = table[cmd];
    if (!fn) return false;
    if (typeof AudioSystem !== "undefined") AudioSystem.unlock();
    fn(el.dataset.arg);
    return true;
  }

  if (typeof document === "undefined") return;

  const tapZones = document.getElementById("tapZones");
  if (tapZones) {
    const absorbTapDefault = event => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof AudioSystem !== "undefined") AudioSystem.unlock();
    };

    const handleTapZone = event => {
      let dx = 0;
      let dy = 0;
      const zone = event.target && event.target.closest ? event.target.closest("[data-tap-dir]") : null;
      if (zone && tapZones.contains(zone)) {
        const parts = String(zone.dataset.tapDir || "0,0").split(",").map(Number);
        dx = Number.isFinite(parts[0]) ? Math.max(-1, Math.min(1, parts[0])) : 0;
        dy = Number.isFinite(parts[1]) ? Math.max(-1, Math.min(1, parts[1])) : 0;
      } else {
        const rect = tapZones.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height - 1, event.clientY - rect.top));
        const col = Math.max(0, Math.min(2, Math.floor((x / rect.width) * 3)));
        const row = Math.max(0, Math.min(2, Math.floor((y / rect.height) * 3)));
        dx = col - 1;
        dy = row - 1;
      }
      if (typeof AudioSystem !== "undefined") AudioSystem.unlock();
      if (dx === 0 && dy === 0 && app.centerTapAction) app.centerTapAction();
      else app.movePlayer(dx, dy);
      event.preventDefault();
      event.stopPropagation();
    };
    tapZones.addEventListener("dblclick", absorbTapDefault, { passive: false });
    if (window.PointerEvent) {
      tapZones.addEventListener("pointerdown", absorbTapDefault, { passive: false });
      tapZones.addEventListener("pointermove", event => event.preventDefault(), { passive: false });
      tapZones.addEventListener("pointerup", handleTapZone, { passive: false });
    } else {
      tapZones.addEventListener("touchstart", absorbTapDefault, { passive: false });
      tapZones.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
      tapZones.addEventListener("click", handleTapZone, { passive: false });
    }
  }

  // click は mouse/touch の両方で発火する。
  // v11.0.1: pointerdownでpreventDefaultだけを呼ぶと、端末によってclick自体が抑止されるため廃止。
  // タッチの誤作動対策はCSSのtouch-actionとbutton typeで行う。
  document.addEventListener("click", event => {
    if (dispatch(event.target)) event.preventDefault();
  });
}
