// --- visuals.js ---
const Visuals = (() => {
  function glyph(ctx, ch, px, py, t, color, scale) {
    ctx.fillStyle = color;
    ctx.font = `${Math.floor(t * (scale || 0.66))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, px + t / 2, py + t / 2 + 1);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function poly(ctx, points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function roundedRect(ctx, x, y, w, h, r, fill, stroke) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function linear(ctx, x1, y1, x2, y2, stops) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    for (const stop of stops) g.addColorStop(stop[0], stop[1]);
    return g;
  }

  function glow(ctx, x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function shadow(ctx, px, py, t, alpha, sx = 0.72, sy = 0.22) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(px + t * 0.5, py + t * 0.74, t * sx / 2, t * sy / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function floorPanel(ctx, px, py, t, opts = {}) {
    const dim = opts.dim;
    const base = opts.base || (dim ? "#0c0f10" : "#1c2022");
    const hi = opts.hi || (dim ? "#151819" : "#303438");
    const lo = opts.lo || (dim ? "#070808" : "#101214");
    ctx.fillStyle = "#050607";
    ctx.fillRect(px, py, t, t);
    const g = linear(ctx, px, py, px + t, py + t, [[0, hi], [0.38, base], [1, lo]]);
    poly(ctx, [[px + 2, py + 5], [px + t - 3, py + 2], [px + t - 1, py + t - 5], [px + 3, py + t - 2]], g, dim ? "#161819" : "#343a3d");
    ctx.save();
    ctx.globalAlpha = dim ? 0.18 : 0.32;
    ctx.strokeStyle = opts.line || "#647078";
    ctx.beginPath();
    ctx.moveTo(px + t * 0.18, py + t * 0.52);
    ctx.lineTo(px + t * 0.86, py + t * 0.45);
    ctx.moveTo(px + t * 0.52, py + t * 0.17);
    ctx.lineTo(px + t * 0.55, py + t * 0.86);
    ctx.stroke();
    ctx.restore();
  }

  function wallBlock(ctx, px, py, t, visible) {
    const dim = !visible;
    ctx.fillStyle = dim ? "#050505" : "rgba(0,0,0,0.45)";
    ctx.fillRect(px + 3, py + t * 0.72, t - 2, t * 0.22);
    const top = linear(ctx, px, py, px + t, py + t * 0.45, [[0, dim ? "#181a1b" : "#4d5558"], [1, dim ? "#0e0f10" : "#262b2e"]]);
    const front = linear(ctx, px, py + t * 0.34, px + t, py + t, [[0, dim ? "#0d0e0f" : "#2b3033"], [1, dim ? "#060707" : "#111416"]]);
    const side = linear(ctx, px + t * 0.65, py, px + t, py + t, [[0, dim ? "#111" : "#384044"], [1, dim ? "#050505" : "#0b0d0f"]]);
    poly(ctx, [[px + 4, py + 6], [px + t - 7, py + 3], [px + t - 2, py + t * 0.34], [px + 8, py + t * 0.44]], top, dim ? "#202224" : "#687075");
    poly(ctx, [[px + 8, py + t * 0.44], [px + t - 2, py + t * 0.34], [px + t - 4, py + t - 5], [px + 5, py + t - 2]], front, dim ? "#141516" : "#20272a");
    poly(ctx, [[px + t - 7, py + 3], [px + t - 2, py + t * 0.34], [px + t - 4, py + t - 5], [px + t - 10, py + t * 0.5]], side, dim ? "#151617" : "#485057");
    ctx.save();
    ctx.globalAlpha = dim ? 0.15 : 0.42;
    ctx.strokeStyle = "#9aa2a8";
    ctx.beginPath();
    ctx.moveTo(px + 7, py + 8);
    ctx.lineTo(px + t - 8, py + 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawLift(ctx, px, py, t, dim) {
    floorPanel(ctx, px, py, t, { dim, base: dim ? "#11100b" : "#272319", hi: dim ? "#17140c" : "#443a20", lo: "#090806", line: "#d2a82a" });
    ctx.save();
    ctx.globalAlpha = dim ? 0.32 : 0.82;
    ctx.strokeStyle = "#d7b33a";
    ctx.lineWidth = 2;
    roundedRect(ctx, px + t * 0.2, py + t * 0.24, t * 0.6, t * 0.54, 4, null, "#d7b33a");
    ctx.fillStyle = "#d7b33a";
    for (let i = 0; i < 3; i++) ctx.fillRect(px + t * (0.23 + i * 0.17), py + t * 0.68, t * 0.08, 2);
    ctx.restore();
  }

  function drawTerminal(ctx, px, py, t, dim) {
    floorPanel(ctx, px, py, t, { dim });
    shadow(ctx, px, py, t, dim ? 0.2 : 0.38, 0.5, 0.16);
    const body = linear(ctx, px, py, px, py + t, [[0, dim ? "#1b1e27" : "#263148"], [1, dim ? "#0a0b0e" : "#111827"]]);
    roundedRect(ctx, px + t * 0.34, py + t * 0.16, t * 0.32, t * 0.62, 3, body, dim ? "#25273a" : "#5d72a8");
    ctx.fillStyle = dim ? "#233252" : "#9ed6ff";
    roundedRect(ctx, px + t * 0.39, py + t * 0.24, t * 0.22, t * 0.2, 2, ctx.fillStyle, null);
    if (!dim) glow(ctx, px + t * 0.5, py + t * 0.35, t * 0.5, "#7fc7ff", 0.28);
  }

  function drawCore(ctx, px, py, t, dim) {
    floorPanel(ctx, px, py, t, { dim, base: dim ? "#0a1013" : "#10202a", hi: dim ? "#0e181e" : "#1e4052", lo: "#05080a" });
    if (!dim) glow(ctx, px + t * 0.5, py + t * 0.48, t * 0.82, "#48cfff", 0.32);
    shadow(ctx, px, py, t, 0.28, 0.5, 0.14);
    const capsule = linear(ctx, px, py, px, py + t, [[0, dim ? "#1f3342" : "#dff8ff"], [0.45, dim ? "#254a60" : "#64d7ff"], [1, dim ? "#0b1a22" : "#0e5d81"]]);
    roundedRect(ctx, px + t * 0.34, py + t * 0.18, t * 0.32, t * 0.56, t * 0.16, capsule, dim ? "#375066" : "#e6fbff");
    ctx.save();
    ctx.globalAlpha = dim ? 0.25 : 0.8;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(px + t * 0.43, py + t * 0.27);
    ctx.bezierCurveTo(px + t * 0.62, py + t * 0.4, px + t * 0.38, py + t * 0.49, px + t * 0.57, py + t * 0.66);
    ctx.stroke();
    ctx.restore();
  }

  function drawPollution(ctx, px, py, t, dim) {
    floorPanel(ctx, px, py, t, { dim, base: dim ? "#0d1410" : "#14231a", hi: dim ? "#102015" : "#245c2e", lo: "#060b08", line: "#55b86e" });
    if (!dim) glow(ctx, px + t * 0.5, py + t * 0.55, t * 0.75, "#5cff72", 0.18);
    ctx.save();
    ctx.globalAlpha = dim ? 0.2 : 0.62;
    ctx.strokeStyle = "#77ff7d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px + t * 0.35, py + t * 0.52, t * 0.08, 0, Math.PI * 2);
    ctx.arc(px + t * 0.58, py + t * 0.42, t * 0.055, 0, Math.PI * 2);
    ctx.moveTo(px + t * 0.2, py + t * 0.66);
    ctx.quadraticCurveTo(px + t * 0.42, py + t * 0.58, px + t * 0.75, py + t * 0.67);
    ctx.stroke();
    ctx.restore();
  }

  function tile(ctx, kind, px, py, t, visible) {
    const dim = !visible;
    if (kind === TILE.WALL) return wallBlock(ctx, px, py, t, visible);
    if (kind === TILE.LIFT) return drawLift(ctx, px, py, t, dim);
    if (kind === TILE.CORE) return drawCore(ctx, px, py, t, dim);
    if (kind === TILE.TERMINAL) return drawTerminal(ctx, px, py, t, dim);
    if (kind === TILE.POLLUTION) return drawPollution(ctx, px, py, t, dim);
    return floorPanel(ctx, px, py, t, { dim });
  }

  function item(ctx, kind, px, py, t) {
    const def = ITEM_DEFS[kind] || {};
    shadow(ctx, px, py, t, 0.28, 0.42, 0.12);
    if (def.category === "medicine" || kind === "nutrition_block") {
      const color = kind === "detox_kit" || kind === "water_filter" ? "#8fffd3" : kind === "nutrition_block" ? "#f0c56b" : "#ff7777";
      glow(ctx, px + t * 0.5, py + t * 0.48, t * 0.38, color, 0.18);
      roundedRect(ctx, px + t * 0.35, py + t * 0.3, t * 0.3, t * 0.28, 3, "#1b2428", color);
      ctx.fillStyle = color;
      ctx.fillRect(px + t * 0.43, py + t * 0.25, t * 0.14, t * 0.08);
      return;
    }
    if (def.category === "equipment") {
      const metal = linear(ctx, px, py, px + t, py + t, [[0, "#d9e2e6"], [1, "#59626a"]]);
      ctx.strokeStyle = metal;
      ctx.lineWidth = Math.max(2, t * 0.08);
      ctx.beginPath();
      ctx.moveTo(px + t * 0.28, py + t * 0.67);
      ctx.lineTo(px + t * 0.73, py + t * 0.31);
      ctx.stroke();
      return;
    }
    const color = kind === "scrap_parts" ? "#c7894e" : kind === "return_tag" ? "#ff6a6a" : "#8fd0ff";
    glow(ctx, px + t * 0.5, py + t * 0.52, t * 0.4, color, 0.16);
    roundedRect(ctx, px + t * 0.33, py + t * 0.32, t * 0.34, t * 0.28, 4, "#1a2028", color);
    ctx.fillStyle = color;
    ctx.fillRect(px + t * 0.41, py + t * 0.39, t * 0.18, 2);
  }

  function robotBase(ctx, px, py, t, fill, stroke) {
    shadow(ctx, px, py, t, 0.42, 0.72, 0.18);
    const g = linear(ctx, px, py, px, py + t, [[0, fill], [1, "#121417"]]);
    roundedRect(ctx, px + t * 0.2, py + t * 0.36, t * 0.6, t * 0.34, t * 0.08, g, stroke);
    ctx.fillStyle = stroke;
    ctx.fillRect(px + t * 0.34, py + t * 0.45, t * 0.32, t * 0.07);
  }

  function enemy(ctx, type, px, py, t, opts = {}) {
    if (type === "guardian") {
      shadow(ctx, px, py, t, 0.55, 0.9, 0.28);
      glow(ctx, px + t * 0.5, py + t * 0.43, t * 0.74, "#ff3c22", opts.stun ? 0.18 : 0.28);
      const body = linear(ctx, px, py, px + t, py + t, [[0, "#4c3722"], [0.45, "#1a1a1e"], [1, "#070707"]]);
      roundedRect(ctx, px + t * 0.12, py + t * 0.22, t * 0.76, t * 0.5, 8, body, opts.stun ? "#a2ff92" : "#e4aa32");
      ctx.fillStyle = opts.stun ? "#a2ff92" : "#ff4638";
      ctx.beginPath();
      ctx.arc(px + t * 0.5, py + t * 0.46, t * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0b0b0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + t * 0.12, py + t * 0.35);
      ctx.lineTo(px + t * 0.02, py + t * 0.2);
      ctx.moveTo(px + t * 0.88, py + t * 0.35);
      ctx.lineTo(px + t * 0.98, py + t * 0.2);
      ctx.stroke();
      return;
    }
    const sensor = opts.stun ? "#9be28d" : "#ff5555";
    if (type === "cleaner") {
      robotBase(ctx, px, py, t, "#3b4040", sensor);
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.ellipse(px + t * 0.5, py + t * 0.55, t * 0.28, t * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sensor;
      ctx.beginPath();
      ctx.arc(px + t * 0.5, py + t * 0.44, t * 0.045, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (type === "soldier") {
      robotBase(ctx, px, py, t, "#2c2f36", sensor);
      ctx.fillStyle = "#1b1d22";
      roundedRect(ctx, px + t * 0.42, py + t * 0.22, t * 0.22, t * 0.22, 3, "#222831", sensor);
      ctx.strokeStyle = "#d2d2d2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + t * 0.54, py + t * 0.31);
      ctx.lineTo(px + t * 0.84, py + t * 0.24);
      ctx.stroke();
      return;
    }
    if (type === "builder") {
      robotBase(ctx, px, py, t, "#514424", "#e6b83c");
      ctx.strokeStyle = "#e6b83c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + t * 0.63, py + t * 0.43);
      ctx.lineTo(px + t * 0.86, py + t * 0.22);
      ctx.lineTo(px + t * 0.89, py + t * 0.42);
      ctx.stroke();
      ctx.fillStyle = sensor;
      ctx.fillRect(px + t * 0.43, py + t * 0.39, t * 0.13, t * 0.05);
      return;
    }
    if (type === "dismantler") {
      robotBase(ctx, px, py, t, "#473229", "#d47b4a");
      poly(ctx, [[px + t * 0.63, py + t * 0.42], [px + t * 0.92, py + t * 0.32], [px + t * 0.69, py + t * 0.56]], "#b9c0c4", "#f7d3a5");
      return;
    }
    if (type === "logistics") {
      robotBase(ctx, px, py, t, "#273b49", "#83c7ff");
      roundedRect(ctx, px + t * 0.36, py + t * 0.19, t * 0.28, t * 0.22, 3, "#5c4a2b", "#b99052");
      return;
    }
    if (type === "medic") {
      robotBase(ctx, px, py, t, "#334348", "#b8ffff");
      ctx.fillStyle = "#e8ffff";
      ctx.fillRect(px + t * 0.47, py + t * 0.32, t * 0.06, t * 0.24);
      ctx.fillRect(px + t * 0.38, py + t * 0.41, t * 0.24, t * 0.06);
      return;
    }
    if (type === "sorter") {
      robotBase(ctx, px, py, t, "#3d3345", "#dc92ff");
      roundedRect(ctx, px + t * 0.35, py + t * 0.24, t * 0.3, t * 0.18, 3, "#201927", "#dc92ff");
      return;
    }
    robotBase(ctx, px, py, t, "#30373b", sensor);
    roundedRect(ctx, px + t * 0.4, py + t * 0.2, t * 0.2, t * 0.24, 3, "#1a1f23", sensor);
    ctx.fillStyle = sensor;
    ctx.fillRect(px + t * 0.43, py + t * 0.31, t * 0.14, 2);
  }

  function player(ctx, px, py, t) {
    shadow(ctx, px, py, t, 0.42, 0.58, 0.16);
    ctx.save();
    glow(ctx, px + t * 0.66, py + t * 0.34, t * 0.5, "#d8f3ff", 0.16);
    const coat = linear(ctx, px, py, px + t, py + t, [[0, "#d8d1bf"], [0.45, "#6f665c"], [1, "#2b2928"]]);
    roundedRect(ctx, px + t * 0.34, py + t * 0.3, t * 0.32, t * 0.45, t * 0.08, coat, "#e4dcc8");
    ctx.fillStyle = "#24272c";
    ctx.beginPath();
    ctx.arc(px + t * 0.5, py + t * 0.25, t * 0.15, Math.PI, 0);
    ctx.lineTo(px + t * 0.63, py + t * 0.36);
    ctx.lineTo(px + t * 0.37, py + t * 0.36);
    ctx.closePath();
    ctx.fill();
    roundedRect(ctx, px + t * 0.18, py + t * 0.42, t * 0.16, t * 0.24, 4, "#5a3d27", "#8a6b43");
    ctx.strokeStyle = "#d8f3ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + t * 0.62, py + t * 0.42);
    ctx.lineTo(px + t * 0.8, py + t * 0.34);
    ctx.stroke();
    ctx.fillStyle = "#e8f7ff";
    ctx.beginPath();
    ctx.arc(px + t * 0.82, py + t * 0.33, t * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function trap(ctx, px, py, t, visible) {
    shadow(ctx, px, py, t, 0.2, 0.36, 0.1);
    ctx.save();
    ctx.globalAlpha = visible ? 0.95 : 0.35;
    ctx.strokeStyle = visible ? "#ffcc52" : "#6a5522";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + t * 0.5, py + t * 0.25);
    ctx.lineTo(px + t * 0.76, py + t * 0.7);
    ctx.lineTo(px + t * 0.24, py + t * 0.7);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = visible ? "#ffcc52" : "#6a5522";
    ctx.fillRect(px + t * 0.48, py + t * 0.42, t * 0.04, t * 0.16);
    ctx.fillRect(px + t * 0.48, py + t * 0.61, t * 0.04, t * 0.04);
    ctx.restore();
  }

  function fx(ctx, type, cx, cy, t, progress) {
    const color = type === "hit" ? "#ffffff" : type === "hurt" ? "#ff4242" : type === "defeat" ? "#ffb347" : "#7fd8ff";
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    if (type === "hit") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - t * (0.25 + progress * 0.18), cy + t * 0.16);
      ctx.lineTo(cx + t * (0.28 + progress * 0.22), cy - t * 0.2);
      ctx.stroke();
    } else if (type === "defeat") {
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI * 2 * i) / 7;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * t * (0.2 + progress * 0.5), cy + Math.sin(a) * t * (0.2 + progress * 0.5));
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, t * (0.18 + 0.55 * progress), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  return { glyph, tile, item, enemy, player, trap, fx };
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
    return p ? { x: p.dispX, y: p.dispY } : { x: fallbackX, y: fallbackY };
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

  // ---- 世界の描画（毎フレーム） ----
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
    const bg = ctx.createLinearGradient(0, 0, cols * t, rows * t);
    bg.addColorStop(0, "#05070b");
    bg.addColorStop(0.55, "#080b0d");
    bg.addColorStop(1, "#020203");
    ctx.fillStyle = bg;
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
        Visuals.tile(ctx, game.map[ty][tx], px, py, t, Boolean(game.visible[ty]?.[tx]));
      }
    }

    const toScreen = (gx, gy) => ({ px: (gx - camX) * t, py: (gy - camY) * t });

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
      Visuals.item(ctx, it.kind, s.px, s.py, t);
    }

    if (game.lure && game.lure.turns > 0 && game.visible[game.lure.y]?.[game.lure.x]) {
      const s = toScreen(game.lure.x, game.lure.y);
      Visuals.glyph(ctx, "o", s.px, s.py, t, "#ffe580", 0.6);
    }

    for (const enemy of game.enemies) {
      if (!game.visible[enemy.y]?.[enemy.x]) continue;
      const d = dispOf(enemy.id, enemy.x, enemy.y);
      const s = toScreen(d.x, d.y);
      Visuals.enemy(ctx, enemy.type, s.px, s.py, t, { stun: enemy.stun > 0 });
    }

    const ps = toScreen(pp.x, pp.y);
    Visuals.player(ctx, ps.px, ps.py, t);

    if (Array.isArray(game.fx) && game.fx.length) {
      const keep = [];
      for (const f of game.fx) {
        const prog = (now - f.born) / Math.max(1, CONFIG.fxMs);
        if (prog >= 1) continue;
        keep.push(f);
        const s = toScreen(f.x + 0.5, f.y + 0.5);
        Visuals.fx(ctx, f.type, s.px, s.py, t, prog);
      }
      game.fx = keep;
    }

    const vignette = ctx.createRadialGradient(cols * t * 0.5, rows * t * 0.5, Math.min(cols, rows) * t * 0.2, cols * t * 0.5, rows * t * 0.5, Math.max(cols, rows) * t * 0.62);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cols * t, rows * t);
  }

  function loop() {
    drawWorld();
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
    for (const message of game.logs) appendLine(logPanel, message);
  }

  function renderStatus(game) {
    if (versionText) versionText.textContent = `Version: ${VERSION}`;
    const state = game.isClear ? " / CLEAR" : game.isGameOver ? " / GAME OVER" : game.isReturned ? " / RETURNED" : "";
    const weapon = game.player.weapon ? ITEM_DEFS[game.player.weapon.kind]?.name : "素手工具";
    const armor = game.player.armor ? ITEM_DEFS[game.player.armor.kind]?.name : "作業服";
    const floorEvent = FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働";
    const terminals = game.terminals?.length ? ` / 端末 ${game.disabledTerminals || 0}/${game.terminals.length}` : "";
    const objective = game.depth >= CONFIG.maxDepth
      ? (game.terminals?.some(t => t.active) ? "目的: 防衛端末を停止" : game.enemies.some(e => e.type === "guardian") ? "目的: 中枢防衛機を停止" : "目的: 浄水コアを回収")
      : "目的: 搬送リフトを探して深度を進める";
    const selected = game.inventory[game.selectedIndex] ? ` / 選択 ${game.selectedIndex + 1}:${getItemName(game, game.inventory[game.selectedIndex])}` : " / 選択 なし";
    statusText.textContent = `${objective} / 難易度 ${currentDifficulty().name} / 深度 ${game.depth}/${CONFIG.maxDepth} / ターン ${game.turn} / 敵 ${game.enemies.length} / 全域 ${floorEvent}${terminals} / 装備 ${weapon}/${armor} / 開拓 ${countExplored(game)}${selected}${state}`;
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
        else if (tile === TILE.LIFT || tile === TILE.CORE) miniCtx.fillStyle = visible ? "#e6c34a" : "#5e4a10";
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
    h.textContent = "所持品";
    inventoryPanel.appendChild(h);
    if (game.inventory.length === 0) {
      appendLine(inventoryPanel, "なし");
      return;
    }
    game.inventory.forEach((item, index) => {
      const mark = index === game.selectedIndex ? "▶" : " ";
      const def = ITEM_DEFS[item.kind];
      const effect = currentDifficulty().unidentified && def?.hidden && !game.identified[item.kind] ? "効果不明" : (def?.effectText || "");
      appendLine(inventoryPanel, `${mark}${index + 1}. ${getItemName(game, item)} - ${effect}`);
    });
  }

  function renderBase(game) {
    clearNode(basePanel);
    const h = document.createElement("h2");
    h.textContent = "拠点 / 依頼";
    basePanel.appendChild(h);
    appendLine(basePanel, `浄水コア回収: ${game.settlement.cores}`);
    appendLine(basePanel, `発掘回数: ${game.settlement.runs} / 最深到達: ${game.settlement.bestDepth}`);
    const open = Object.values(MISSION_DEFS).filter(m => !game.completedMissions[m.key]).slice(0, 5);
    for (const mission of open) appendLine(basePanel, `依頼: ${mission.title} - ${mission.desc}`);
    const latest = Array.isArray(game.settlement.runLogs) ? game.settlement.runLogs[0] : null;
    if (latest) appendLine(basePanel, `直近: ${latest.summary}`);
  }

  function renderCodex(game) {
    clearNode(codexPanel);
    const h = document.createElement("h2");
    h.textContent = "記録";
    codexPanel.appendChild(h);
    if (!game.codex.length) {
      appendLine(codexPanel, "未記録");
      return;
    }
    for (const entry of game.codex.slice(0, 10)) {
      const prefix = entry.key?.startsWith("enemy:") ? "敵" : entry.key?.startsWith("item:") ? "遺物" : entry.key?.startsWith("trap:") ? "罠" : entry.key?.startsWith("npc:") ? "住人" : "記録";
      appendLine(codexPanel, `[${prefix}] ${entry.title}: ${entry.body}`);
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
    const ended = game.screen === "run" && (game.isGameOver || game.isClear);
    const active = game.helpOpen || game.tutorialOpen || game.storyOpen || game.endingOpen || game.runRecordOpen || game.runMenuOpen || game.inventoryOpen || game.npcDialog || ended || game.screen === "title" || game.screen === "base";
    screenPanel.hidden = !active;
    if (!active) return;

    const h = document.createElement("h2");
    screenPanel.appendChild(h);

    if (game.runMenuOpen) {
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
      h.textContent = "ヘルプ / 操作説明";
      appendPanelLine("スマホ: 方向パッドで8方向移動、中央で足踏み。下段ボタンで拾う/使う・所持品・投げる・メニュー。", "menu-line");
      appendPanelLine("PC: 矢印/WASDで移動、斜めはQ/E/Z/Cまたはテンキー、.で足踏み。");
      appendPanelLine("拾う: G / 所持品: I / 選択: 1〜8または[ ] / 使用: U / 置く: X / 投げる: T / 調べる: F");
      appendPanelLine("拠点: B / 探索メニュー: M / 途中帰還: P / 記録: L / 新規発掘: N");
      appendPanelLine("目的: 深度5で防衛端末を停止し、中枢防衛機を止め、浄水コアを回収する。地図は歩いて開拓する。");
      appendButtons([{ label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.storyOpen) {
      const page = STORY_PAGES[clamp(game.storyPage || 0, 0, STORY_PAGES.length - 1)];
      h.textContent = `${page.title} ${game.storyPage + 1}/${STORY_PAGES.length}`;
      for (const line of page.lines) appendPanelLine(line, "menu-line");
      appendButtons([{ label: "次へ", cmd: "start" }, { label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.endingOpen) {
      const page = ENDING_PAGES[clamp(game.endingPage || 0, 0, ENDING_PAGES.length - 1)];
      h.textContent = `${page.title} ${game.endingPage + 1}/${ENDING_PAGES.length}`;
      for (const line of page.lines) appendPanelLine(line, "menu-line");
      appendButtons([{ label: "次へ", cmd: "start" }, { label: "閉じる", cmd: "close" }]);
      return;
    }

    if (game.runRecordOpen) {
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
      const talk = getNpcDialogue(game, game.npcDialog);
      h.textContent = `${talk.name} - ${talk.role}`;
      for (const line of talk.lines) appendPanelLine(line, "menu-line");
      appendButtons([
        { label: "水守り", cmd: "talk", arg: 0 },
        { label: "老発掘家", cmd: "talk", arg: 1 },
        { label: "修理屋", cmd: "talk", arg: 2 },
        { label: "見張り", cmd: "talk", arg: 3 },
        { label: "記録係", cmd: "talk", arg: 4 },
        { label: "閉じる", cmd: "close" }
      ]);
      return;
    }

    if (game.tutorialOpen) {
      h.textContent = "初回ガイド";
      appendPanelLine("まずは部屋を出て通路を進み、見える範囲を広げる。", "menu-line");
      appendPanelLine("敵は常にこちらを把握しているわけではない。角を曲がる、通路に誘う、アイテムで止める判断が重要。");
      appendPanelLine("落ちている遺物は「拾う」で取得。所持品から選んで使う・投げる・置く。");
      appendPanelLine("浄水コア回収が本目的。途中帰還は記録に残るが、アイテムは持ち帰らない。");
      appendButtons([{ label: "はじめる", cmd: "start" }]);
      return;
    }

    if (game.screen === "base") {
      h.textContent = "拠点 / 出発準備";
      appendPanelLine(`浄水コア回収 ${game.settlement.cores} / 発掘回数 ${game.settlement.runs} / 最深到達 ${game.settlement.bestDepth}`, "menu-line");
      appendPanelLine(`識別設定 ${currentDifficulty().name}`);
      appendButtons([
        { label: "探索開始", cmd: "start" },
        { label: "識別設定切替", cmd: "difficulty" },
        { label: "ストーリー", cmd: "story" },
        { label: "エンディング", cmd: "ending" },
        { label: "発掘記録", cmd: "records" },
        { label: "ヘルプ", cmd: "help" }
      ]);
      appendPanelLine("住人と話す:", "menu-line");
      appendButtons([
        { label: "水守り", cmd: "talk", arg: 0 },
        { label: "老発掘家", cmd: "talk", arg: 1 },
        { label: "修理屋", cmd: "talk", arg: 2 },
        { label: "見張り", cmd: "talk", arg: 3 },
        { label: "記録係", cmd: "talk", arg: 4 }
      ]);
      appendButtons([{ label: "保存データ初期化", cmd: "reset", danger: true }]);
      return;
    }

    if (game.screen === "run" && (game.isGameOver || game.isClear)) {
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

    h.textContent = "廃棄層の発掘家";
    appendPanelLine("核戦争後、科学を失った人類は、AIが作って捨てる旧文明品を拾って生きている。", "menu-line");
    appendPanelLine("あなたは発掘家。集落の浄水装置を延命するため、再構成され続ける廃棄区域へ潜る。");
    appendPanelLine(`識別設定: ${currentDifficulty().name}`);
    appendButtons([
      { label: "探索開始", cmd: "start" },
      { label: "拠点", cmd: "base" },
      { label: "ストーリー", cmd: "story" },
      { label: "エンディング", cmd: "ending" },
      { label: "発掘記録", cmd: "records" },
      { label: "ヘルプ", cmd: "help" }
    ]);
    appendPanelLine("地図は最初から見えない。歩いた範囲だけが開拓される。", "muted-line");
  }

  function toggleControlsState(game) {
    if (!controls) return;
    const overlay = game.helpOpen || game.tutorialOpen || game.storyOpen || game.endingOpen || game.runRecordOpen || game.runMenuOpen || game.inventoryOpen || game.npcDialog;
    const playable = game.screen === "run" && !overlay && !game.isGameOver && !game.isClear;
    controls.classList.toggle("controls-dim", !playable);
    if (actionPickupLabel) {
      actionPickupLabel.textContent = lastGame && World.getItemAt(game, game.player.x, game.player.y) ? "拾う" : "使う";
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
  }

  return { render, renderLog, getItemName };
}


// --- input.js (キーボード) ---
function bindInput(app) {
  window.addEventListener("keydown", event => {
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
    if (Number.isInteger(index) && index >= 0 && index < 5 && !code.startsWith("Numpad") && app.talkToNpcFromBase(index)) return;
    if (Number.isInteger(index) && index >= 0 && index < 8 && !code.startsWith("Numpad")) return app.selectInventoryIndex(index);
  });
}


// --- touch.js (タッチ操作) ---
function bindTouch(app) {
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
    talk: arg => app.talkToNpcFromBase(Number(arg)),
    difficulty: () => app.cycleDifficulty()
  };

  function dispatch(target) {
    const el = target.closest && target.closest("[data-cmd]");
    if (!el) return false;
    const cmd = el.dataset.cmd;
    const fn = table[cmd];
    if (!fn) return false;
    fn(el.dataset.arg);
    return true;
  }

  if (typeof document === "undefined") return;
  // click は mouse/touch の両方で発火する。
  // v11.0.1: pointerdownでpreventDefaultだけを呼ぶと、端末によってclick自体が抑止されるため廃止。
  // タッチの誤作動対策はCSSのtouch-actionとbutton typeで行う。
  document.addEventListener("click", event => {
    if (dispatch(event.target)) event.preventDefault();
  });
}
