function systemSound(name) {
  if (typeof AudioSystem !== "undefined") AudioSystem.play(name);
}

// --- items.js ---
const ItemSystem = (() => {
  function getItemName(game, item) {
    const def = ITEM_DEFS[item.kind];
    if (!def) return "不明な物体";
    if (currentDifficulty().unidentified && def.hidden && !game.identified[item.kind]) return def.alias || "用途不明品";
    return def.name;
  }

  function identify(game, item) {
    const def = ITEM_DEFS[item.kind];
    if (!FEATURES.unidentified || !currentDifficulty().unidentified || !def || !def.hidden || game.identified[item.kind]) return;
    game.identified[item.kind] = true;
    World.addLog(game, `${def.alias}の正体は${def.name}だった。`);
    World.recordCodex(game, `item:${item.kind}`, def.name, def.effectText);
  }

  function placeItems(game, findFreeFloorTile, chooseWeighted) {
    game.items = [];
    if (!FEATURES.items) return;
    const count = Math.min(CONFIG.itemMaxCount, CONFIG.itemBaseCount + Math.floor(game.depth * 1.2));
    for (let i = 0; i < count; i++) {
      const def = chooseWeighted(ITEM_DEFS, item => FEATURES.positionItems || !["signal_jammer", "force_transfer", "swap_beacon", "lure_light", "wall_cutter"].includes(item.kind));
      const pos = findFreeFloorTile(game, { minPlayerDistance: 2, avoidItems: true, avoidTraps: true });
      if (def && pos) game.items.push({ kind: def.kind, x: pos.x, y: pos.y });
    }
  }

  function nearestEnemy(game, maxDistance = 99) {
    let best = null;
    let bestDistance = maxDistance + 1;
    for (const enemy of game.enemies) {
      const distance = manhattan(enemy.x, enemy.y, game.player.x, game.player.y);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return bestDistance <= maxDistance ? best : null;
  }

  function jamEnemies(game) {
    let count = 0;
    for (const enemy of game.enemies) {
      if (manhattan(enemy.x, enemy.y, game.player.x, game.player.y) <= 6) {
        enemy.stun = Math.max(enemy.stun || 0, 4);
        count++;
      }
    }
    World.addLog(game, `信号を乱した。停止 ${count} 体。`);
  }

  function transferNearestEnemy(game) {
    const enemy = nearestEnemy(game, 10);
    if (!enemy) {
      World.addLog(game, "転送対象が見つからなかった。");
      return;
    }
    const tile = MapSystem.findFreeFloorTile(game, { minPlayerDistance: 8, avoidItems: false, avoidTraps: false });
    if (!tile) {
      World.addLog(game, "転送先が見つからなかった。");
      return;
    }
    enemy.x = tile.x;
    enemy.y = tile.y;
    enemy.stun = 2;
    World.addLog(game, `${enemy.name}を別区画へ転送した。`);
  }

  function swapWithNearestEnemy(game) {
    const enemy = nearestEnemy(game, 8);
    if (!enemy) {
      World.addLog(game, "入れ替え対象が見つからなかった。");
      return;
    }
    const px = game.player.x;
    const py = game.player.y;
    game.player.x = enemy.x;
    game.player.y = enemy.y;
    enemy.x = px;
    enemy.y = py;
    enemy.stun = 2;
    World.addLog(game, `${enemy.name}と位置を入れ替えた。`);
  }

  function cutFacingWall(game) {
    const x = game.player.x + game.player.lastDir.x;
    const y = game.player.y + game.player.lastDir.y;
    if (!World.isInsideMap(x, y) || World.isOuterWallPosition(x, y) || World.getTile(game, x, y) !== TILE.WALL) return false;
    game.map[y][x] = TILE.FLOOR;
    World.addLog(game, "正面の壁を削った。構造に穴が開いた。");
    return true;
  }

  function placeBarricade(game) {
    const x = game.player.x + game.player.lastDir.x;
    const y = game.player.y + game.player.lastDir.y;
    if (World.isOuterWallPosition(x, y) || World.getTile(game, x, y) !== TILE.FLOOR || World.isBlockedByEntity(game, x, y) || World.getItemAt(game, x, y) || World.getTrapAt(game, x, y)) return false;
    const original = game.map[y][x];
    game.map[y][x] = TILE.WALL;
    if (!MapSystem.hasPathFromPlayerToGoal(game)) {
      game.map[y][x] = original;
      World.addLog(game, "そこにバリケードを置くと進路が詰む。設置しなかった。");
      return false;
    }
    World.addLog(game, "仮設バリケードを展開した。");
    return true;
  }

  function empBurst(game) {
    let hit = 0;
    for (const enemy of game.enemies) {
      if (chebyshev(enemy.x, enemy.y, game.player.x, game.player.y) > 4) continue;
      enemy.hp -= 2;
      enemy.stun = Math.max(enemy.stun || 0, 3);
      hit++;
    }
    for (const enemy of [...game.enemies]) if (enemy.hp <= 0) EnemySystem.defeatEnemy(game, enemy);
    World.addLog(game, `電磁パルスが拡散した。影響 ${hit} 体。`);
  }

  function equipItem(game, item) {
    const def = ITEM_DEFS[item.kind];
    if (!def || def.category !== "equipment") return false;
    if (def.slot === "weapon") {
      if (game.player.weapon) game.inventory.push(game.player.weapon);
      game.player.weapon = { kind: item.kind };
      World.addLog(game, `${def.name}を装備した。`);
      return true;
    }
    if (def.slot === "armor") {
      if (game.player.armor) game.inventory.push(game.player.armor);
      game.player.armor = { kind: item.kind };
      World.addLog(game, `${def.name}を装備した。`);
      return true;
    }
    return false;
  }

  function applyTerminalEffect(game) {
    const roll = randInt(1, 4);
    if (roll === 1) {
      for (const enemy of game.enemies) enemy.hp = Math.max(1, enemy.hp - 1);
      World.addLog(game, "端末が異常信号を放ち、周囲の機械が揺らいだ。");
    } else if (roll === 2) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 3);
      World.addLog(game, "端末から医療用コマンドが漏れた。HPが少し回復した。");
    } else if (roll === 3) {
      game.player.pollution = Math.min(CONFIG.pollutionLimit, game.player.pollution + 10);
      World.addLog(game, "端末が破裂し、汚染粒子を浴びた。");
    } else {
      const discovered = TrapSystem.discoverNearby(game, 2, true);
      World.addLog(game, discovered > 0 ? `端末が周辺罠 ${discovered} 個を検出した。` : "端末は何かを実行したが、効果は薄かった。");
    }
  }

  function identifyOneInventoryItem(game) {
    const target = game.inventory.find(entry => {
      const def = ITEM_DEFS[entry.kind];
      return def?.hidden && !game.identified[entry.kind];
    });
    if (!target) {
      World.addLog(game, "鑑定できる未識別品はない。消費しなかった。");
      return false;
    }
    game.identified[target.kind] = true;
    const def = ITEM_DEFS[target.kind];
    World.addLog(game, `${def.alias || "未識別品"}の正体は${def.name}だった。`);
    World.recordCodex(game, `item:${target.kind}`, def.name, def.effectText);
    return true;
  }

  function useItemEffect(game, item) {
    switch (item.kind) {
      case "nutrition_block":
        game.player.hunger = Math.min(CONFIG.maxHunger, game.player.hunger + 38);
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + 1);
        World.addLog(game, "栄養を補給した。");
        return true;
      case "med_foam":
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + 6);
        World.addLog(game, `HPが回復した。HP ${game.player.hp}/${game.player.maxHp}。`);
        return true;
      case "detox_kit":
        game.player.pollution = Math.max(0, game.player.pollution - 45);
        World.addLog(game, `汚染を除去した。汚染 ${game.player.pollution}/${CONFIG.pollutionLimit}。`);
        return true;
      case "battery_cell":
        game.player.attackBonus = 2;
        game.player.attackBoostTurns = 24;
        World.addLog(game, "工具に電力を流した。しばらく攻撃力が上がる。");
        return true;
      case "broken_terminal":
        applyTerminalEffect(game);
        return true;
      case "water_filter":
        game.player.pollution = Math.max(0, game.player.pollution - 28);
        game.player.hunger = Math.min(CONFIG.maxHunger, game.player.hunger + 8);
        game.debug.waterFilterUseCount = (game.debug.waterFilterUseCount || 0) + 1;
        World.addLog(game, `浄水フィルタを使った。汚染 ${game.player.pollution}/${CONFIG.pollutionLimit}。`);
        return true;
      case "scrap_parts":
        World.addLog(game, "金属片は使用するより投げる方が有効だ。消費しなかった。");
        return false;
      case "signal_jammer":
        jamEnemies(game);
        return true;
      case "force_transfer":
        transferNearestEnemy(game);
        return true;
      case "swap_beacon":
        swapWithNearestEnemy(game);
        return true;
      case "lure_light":
        game.lure = { x: game.player.x, y: game.player.y, turns: 16 };
        World.addLog(game, "誘導灯を設置した。機械群が光へ引き寄せられる。");
        return true;
      case "wall_cutter":
        if (!cutFacingWall(game)) {
          World.addLog(game, "削れる壁が正面にない。消費しなかった。");
          return false;
        }
        return true;
      case "barricade_kit":
        return placeBarricade(game);
      case "emp_can":
        empBurst(game);
        return true;
      case "return_tag":
        game.pendingExtract = true;
        World.addLog(game, "緊急帰還タグが起動した。拠点へ撤収する。");
        return true;
      case "identify_scanner":
        return identifyOneInventoryItem(game);
      case "utility_blade":
      case "shock_rod":
      case "work_armor":
      case "insulated_coat":
        return equipItem(game, item);
      default:
        return false;
    }
  }

  function pickupAtPlayer(game) {
    const item = World.getItemAt(game, game.player.x, game.player.y);
    if (!item) {
      World.addLog(game, "足元に拾える遺物はない。");
      return false;
    }
    if (game.inventory.length >= CONFIG.inventoryLimit) {
      World.addLog(game, "背負い袋がいっぱいで拾えない。");
      return false;
    }
    game.items = game.items.filter(existing => existing !== item);
    game.inventory.push({ ...item, x: null, y: null });
    game.selectedIndex = game.inventory.length - 1;
    game.debug.pickupCount++;
    World.addLog(game, `${getItemName(game, item)}を拾った。`);
    World.recordCodex(game, `seen:item:${item.kind}`, getItemName(game, item), "廃棄区域で見つかる旧文明品。");
    return true;
  }

  function useInventoryItem(game, index) {
    const item = game.inventory[index];
    if (!item) {
      World.addLog(game, "その番号の所持品はない。");
      return false;
    }
    const def = ITEM_DEFS[item.kind];
    if (!def) return false;
    const beforeName = getItemName(game, item);
    const consumed = useItemEffect(game, item);
    identify(game, item);
    if (consumed !== false) {
      game.inventory.splice(index, 1);
      game.selectedIndex = clamp(game.selectedIndex, 0, Math.max(0, game.inventory.length - 1));
    }
    game.debug.useCount++;
    World.addLog(game, `${beforeName}を使用した。`);
    return consumed !== false;
  }

  function selectInventory(game, delta) {
    if (!game.inventory.length) {
      game.selectedIndex = 0;
      World.addLog(game, "選択できる所持品がない。");
      return;
    }
    game.selectedIndex = (game.selectedIndex + delta + game.inventory.length) % game.inventory.length;
    World.addLog(game, `選択: ${game.selectedIndex + 1}. ${getItemName(game, game.inventory[game.selectedIndex])}`);
  }

  function dropSelected(game) {
    if (!game.inventory.length) {
      World.addLog(game, "置ける所持品がない。");
      return false;
    }
    if (World.getItemAt(game, game.player.x, game.player.y)) {
      World.addLog(game, "足元にはすでに遺物がある。");
      return false;
    }
    const item = game.inventory.splice(game.selectedIndex, 1)[0];
    game.items.push({ ...item, x: game.player.x, y: game.player.y });
    game.selectedIndex = clamp(game.selectedIndex, 0, Math.max(0, game.inventory.length - 1));
    game.debug.dropCount++;
    World.addLog(game, `${getItemName(game, item)}を床に置いた。`);
    return true;
  }

  function throwSelected(game) {
    if (!game.inventory.length) {
      World.addLog(game, "投げる所持品がない。");
      return false;
    }
    const item = game.inventory.splice(game.selectedIndex, 1)[0];
    game.selectedIndex = clamp(game.selectedIndex, 0, Math.max(0, game.inventory.length - 1));
    game.debug.throwCount++;
    let x = game.player.x;
    let y = game.player.y;
    let last = { x, y };
    let hit = null;
    for (let i = 0; i < CONFIG.throwRange; i++) {
      const nx = x + game.player.lastDir.x;
      const ny = y + game.player.lastDir.y;
      if (!World.isInsideMap(nx, ny) || World.getTile(game, nx, ny) === TILE.WALL) break;
      x = nx;
      y = ny;
      last = { x, y };
      const enemy = World.getEnemyAt(game, x, y);
      if (enemy) { hit = enemy; break; }
    }
    if (hit) {
      const damage = ITEM_DEFS[item.kind]?.throwDamage || 1;
      hit.hp -= damage;
      World.addLog(game, `${getItemName(game, item)}を投げ、${hit.name}に${damage}ダメージ。`);
      if (hit.hp <= 0) EnemySystem.defeatEnemy(game, hit);
    } else if (!World.getItemAt(game, last.x, last.y) && !World.isBlockedByEntity(game, last.x, last.y)) {
      game.items.push({ ...item, x: last.x, y: last.y });
      World.addLog(game, `${getItemName(game, item)}を投げた。床に落ちた。`);
    } else {
      World.addLog(game, `${getItemName(game, item)}はどこかへ転がって見失った。`);
    }
    return true;
  }

  return {
    getItemName,
    identify,
    placeItems,
    pickupAtPlayer,
    useInventoryItem,
    selectInventory,
    dropSelected,
    throwSelected,
    nearestEnemy,
    jamEnemies
  };
})();


// --- traps.js ---
const TrapSystem = (() => {
  function placeTraps(game, findFreeFloorTile) {
    game.traps = [];
    if (!FEATURES.traps) return;
    const defs = Object.values(TRAP_DEFS);
    const count = Math.min(CONFIG.trapMaxCount, CONFIG.trapBaseCount + game.depth * 2);
    for (let i = 0; i < count; i++) {
      const def = defs[randInt(0, defs.length - 1)];
      const pos = findFreeFloorTile(game, { minPlayerDistance: 4, avoidItems: true, avoidTraps: true });
      if (def && pos) game.traps.push({ type: def.type, x: pos.x, y: pos.y, active: true, discovered: !FEATURES.hiddenTraps });
    }
  }

  function discoverNearby(game, radius = 1, guaranteed = false) {
    let count = 0;
    for (const trap of game.traps) {
      if (!trap.active || trap.discovered) continue;
      if (chebyshev(game.player.x, game.player.y, trap.x, trap.y) > radius) continue;
      if (guaranteed || chance(0.75)) {
        trap.discovered = true;
        count++;
      }
    }
    return count;
  }

  function searchAround(game) {
    game.debug.searchCount++;
    const found = discoverNearby(game, 1, false);
    World.addLog(game, found > 0 ? `周囲の罠を${found}個発見した。` : "周囲を調べたが、罠は見つからなかった。 ");
    return true;
  }

  function trigger(game, onDeath) {
    const trap = World.getTrapAt(game, game.player.x, game.player.y);
    if (!trap || !trap.active) return false;
    trap.active = false;
    trap.discovered = true;
    game.debug.trapTriggeredCount++;
    const def = TRAP_DEFS[trap.type];
    World.recordCodex(game, `trap:${trap.type}`, def.name, def.desc);
    if (trap.type === "shock") {
      game.player.hp = Math.max(0, game.player.hp - 3);
      systemSound("trap");
      World.addLog(game, `漏電床が発火した。HP ${game.player.hp}/${game.player.maxHp}。`);
    } else if (trap.type === "pollution") {
      game.player.pollution = Math.min(CONFIG.pollutionLimit, game.player.pollution + 20);
      systemSound("pollution");
      World.addLog(game, "汚染カプセルが割れた。汚染度が上昇した。 ");
    } else if (trap.type === "conveyor") {
      const tile = MapSystem.findFreeFloorTile(game, { minPlayerDistance: 7, avoidItems: false, avoidTraps: false });
      if (tile) {
        game.player.x = tile.x;
        game.player.y = tile.y;
        World.addLog(game, "暴走搬送床で別区画へ飛ばされた。 ");
      }
    } else if (trap.type === "shutter") {
      let placed = 0;
      for (const dir of shuffle(World.DIRS4)) {
        const x = game.player.x + dir.x;
        const y = game.player.y + dir.y;
        if (World.isOuterWallPosition(x, y) || World.getTile(game, x, y) !== TILE.FLOOR || World.isBlockedByEntity(game, x, y) || World.getItemAt(game, x, y)) continue;
        const old = game.map[y][x];
        game.map[y][x] = TILE.WALL;
        if (!MapSystem.hasPathFromPlayerToGoal(game)) game.map[y][x] = old;
        else placed++;
        if (placed >= 2) break;
      }
      game.debug.shutterTrapCount++;
      World.addLog(game, placed > 0 ? `封鎖シャッターが降り、周囲 ${placed} 箇所が塞がった。` : "封鎖シャッターは空振りした。");
    } else {
      World.addLog(game, "旧式警報線が作動した。機械の気配が濃くなる。 ");
      for (const enemy of game.enemies) enemy.stun = Math.max(0, enemy.stun - 1);
    }
    if (game.player.hp <= 0 && onDeath) onDeath("発掘家は旧文明の罠で倒れた。Nキーで再開。 ");
    return true;
  }

  return { placeTraps, discoverNearby, searchAround, trigger };
})();


// --- enemies.js ---
const EnemySystem = (() => {
  function enemyTypesForDepth(game) {
    if (!FEATURES.enemyVariants) return [ENEMY_DEFS.cleaner];
    return Object.values(ENEMY_DEFS).filter(def => {
      if (["cleaner", "dismantler", "builder", "hunter"].includes(def.type)) return true;
      if (["logistics", "sorter"].includes(def.type)) return game.depth >= 2;
      if (["medic", "soldier"].includes(def.type)) return game.depth >= 3;
      if (def.type === "guardian") return false;
      return true;
    });
  }

  function createEnemy(game, tile, index) {
    const def = tile || ENEMY_DEFS.cleaner;
    return {
      id: `${def.type}-${game.depth}-${index}-${Date.now()}-${Math.random()}`,
      type: def.type,
      name: def.name,
      x: 1,
      y: 1,
      hp: def.baseHp + Math.floor(game.depth / 2),
      maxHp: def.baseHp + Math.floor(game.depth / 2),
      attack: def.baseAttack + Math.floor((game.depth - 1) / 2),
      stun: 0,
      carriedItem: null,
      state: "idle",
      lastSeen: null,
      memory: 0
    };
  }

  function placeEnemies(game, findFreeFloorTile, chooseWeighted) {
    game.enemies = [];
    let count = Math.min(CONFIG.enemyMaxCount, CONFIG.enemyBaseCount + game.depth * 2);
    if (FEATURES.floorEvents && game.floorEvent === "quiet") count = Math.max(2, Math.floor(count * 0.55));
    if (FEATURES.floorEvents && game.floorEvent === "security_sweep") count = Math.min(CONFIG.enemyMaxCount, count + 3);
    const defs = enemyTypesForDepth(game);
    for (let i = 0; i < count; i++) {
      const def = chooseWeighted(defs.reduce((acc, item) => ({ ...acc, [item.type]: item }), {}));
      const pos = findFreeFloorTile(game, { minPlayerDistance: CONFIG.enemyMinPlayerDistance, avoidItems: false, avoidTraps: false });
      if (!def || !pos) continue;
      const enemy = createEnemy(game, def, i);
      enemy.x = pos.x;
      enemy.y = pos.y;
      game.enemies.push(enemy);
    }
    if (FEATURES.bossFloor && game.depth >= CONFIG.maxDepth && !game.enemies.some(enemy => enemy.type === "guardian")) {
      const pos = findFreeFloorTile(game, { minPlayerDistance: 9, avoidItems: true, avoidTraps: true });
      if (pos) {
        const boss = createEnemy(game, ENEMY_DEFS.guardian, "boss");
        boss.x = pos.x;
        boss.y = pos.y;
        boss.state = "chase";
        game.enemies.push(boss);
      }
    }
  }

  function getPlayerDamage(game) {
    const weaponDef = game.player.weapon ? ITEM_DEFS[game.player.weapon.kind] : null;
    return CONFIG.playerAttackDamage + (game.player.attackBonus || 0) + (weaponDef?.attackBonus || 0);
  }

  function attackEnemy(game, enemy) {
    let damage = getPlayerDamage(game);
    if (enemy.type === "guardian" && FEATURES.bossTerminals && game.terminals.some(t => t.active)) {
      damage = Math.max(1, Math.floor(damage / 2));
      World.addLog(game, "防衛端末が中枢防衛機への攻撃を減衰した。端末停止が必要だ。 ");
    }
    enemy.hp -= damage;
    game.debug.playerAttackCount++;
    World.pushFx(game, "hit", enemy.x, enemy.y);
    systemSound("hit");
    World.addLog(game, `${enemy.name}を攻撃。${damage}ダメージ。`);
    World.recordCodex(game, `enemy:${enemy.type}`, enemy.name, ENEMY_DEFS[enemy.type]?.desc || "自律機械。 ");
    if (enemy.hp <= 0) defeatEnemy(game, enemy);
  }

  function defeatEnemy(game, enemy) {
    game.enemies = game.enemies.filter(existing => existing !== enemy);
    game.debug.enemyDefeatCount++;
    World.pushFx(game, "defeat", enemy.x, enemy.y);
    systemSound("defeat");
    World.addLog(game, `${enemy.name}は沈黙した。`);
    if (enemy.type === "guardian") game.bossDefeated = true;
    if (enemy.carriedItem && !World.getItemAt(game, enemy.x, enemy.y)) {
      game.items.push({ ...enemy.carriedItem, x: enemy.x, y: enemy.y });
      World.addLog(game, `${enemy.name}が運んでいた遺物が落ちた。`);
    }
  }

  function applyContactAbility(game, enemy) {
    if (!FEATURES.enemyAbilities) return;
    if (enemy.type === "sorter" && game.inventory.length && chance(0.35)) {
      const index = randInt(0, game.inventory.length - 1);
      const item = game.inventory.splice(index, 1)[0];
      game.selectedIndex = clamp(game.selectedIndex, 0, Math.max(0, game.inventory.length - 1));
      World.addLog(game, `分別ロボットが${ItemSystem.getItemName(game, item)}を廃棄した。`);
    }
    if (enemy.type === "medic" && chance(0.35)) {
      game.player.immobilizedTurns = Math.max(game.player.immobilizedTurns, 2);
      World.addLog(game, "医療ロボットが強制固定を開始した。しばらく動けない。 ");
    }
  }

  function attackPlayer(game, enemy, onDeath) {
    if (!World.isPlayerAlive(game)) return;
    const armorDef = game.player.armor ? ITEM_DEFS[game.player.armor.kind] : null;
    const rawDamage = Math.max(1, Math.round(enemy.attack * currentDifficulty().enemyAttackMultiplier));
    const damage = Math.max(1, rawDamage - (armorDef?.defenseBonus || 0));
    game.player.hp = Math.max(0, game.player.hp - damage);
    game.debug.enemyAttackCount++;
    World.pushFx(game, "hurt", game.player.x, game.player.y);
    systemSound("hurt");
    World.addLog(game, `${enemy.name}が発掘家を攻撃。HP ${game.player.hp}/${game.player.maxHp}。`);
    applyContactAbility(game, enemy);
    if (game.player.hp <= 0 && onDeath) onDeath("発掘家は自律機械に倒された。Nキーで再開。");
  }

  function canPlaceTemporaryWall(game, x, y) {
    if (World.isOuterWallPosition(x, y)) return false;
    if (World.getTile(game, x, y) !== TILE.FLOOR) return false;
    if (World.isBlockedByEntity(game, x, y) || World.getItemAt(game, x, y) || World.getTrapAt(game, x, y)) return false;
    const original = game.map[y][x];
    game.map[y][x] = TILE.WALL;
    const ok = MapSystem.hasPathFromPlayerToGoal(game);
    game.map[y][x] = original;
    if (!ok) game.debug.buildCancelCount++;
    return ok;
  }

  function tryBuildWall(game, enemy) {
    if (!FEATURES.enemyAbilities || enemy.type !== "builder" || !chance(0.25)) return;
    const positions = shuffle(World.DIRS4.map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y })));
    for (const pos of positions) {
      if (manhattan(pos.x, pos.y, game.player.x, game.player.y) < 2) continue;
      if (!canPlaceTemporaryWall(game, pos.x, pos.y)) continue;
      game.map[pos.y][pos.x] = TILE.WALL;
      World.addLog(game, "建設ロボットが仮設壁を生成した。 ");
      return;
    }
  }

  function tryDismantleWall(game, enemy) {
    if (!FEATURES.enemyAbilities || enemy.type !== "dismantler" || !chance(0.35)) return false;
    const dx = sign(game.player.x - enemy.x);
    const dy = sign(game.player.y - enemy.y);
    const dirs = shuffle([{ x: dx, y: 0 }, { x: 0, y: dy }, ...World.DIRS4]);
    for (const d of dirs) {
      const x = enemy.x + d.x;
      const y = enemy.y + d.y;
      if (World.isInsideMap(x, y) && !World.isOuterWallPosition(x, y) && World.getTile(game, x, y) === TILE.WALL) {
        game.map[y][x] = TILE.FLOOR;
        World.addLog(game, "解体ロボットが壁を削った。構造が変化した。 ");
        return true;
      }
    }
    return false;
  }

  function lineShotPossible(game, enemy) {
    if (enemy.x !== game.player.x && enemy.y !== game.player.y) return false;
    if (manhattan(enemy.x, enemy.y, game.player.x, game.player.y) > 6) return false;
    return VisibilitySystem.hasLineOfSight(game, enemy.x, enemy.y, game.player.x, game.player.y);
  }

  function enemyCanSeePlayer(game, enemy) {
    const dist = manhattan(enemy.x, enemy.y, game.player.x, game.player.y);
    const radius = enemy.type === "hunter" ? CONFIG.enemySightRadius + 2 : CONFIG.enemySightRadius;
    if (dist > radius) return false;
    if (game.roomMap[enemy.y]?.[enemy.x] >= 0 && game.roomMap[enemy.y]?.[enemy.x] === game.roomMap[game.player.y]?.[game.player.x]) return true;
    return VisibilitySystem.hasLineOfSight(game, enemy.x, enemy.y, game.player.x, game.player.y);
  }

  function updateAwareness(game, enemy) {
    if (enemyCanSeePlayer(game, enemy)) {
      if (enemy.state !== "chase" && game.visible[enemy.y]?.[enemy.x]) World.addLog(game, `${enemy.name}が発掘家を捕捉した。`);
      enemy.state = "chase";
      enemy.lastSeen = { x: game.player.x, y: game.player.y };
      enemy.memory = CONFIG.enemyMemoryTurns;
      return;
    }
    if (enemy.memory > 0) {
      enemy.state = "search";
      enemy.memory--;
      return;
    }
    enemy.state = "idle";
    enemy.lastSeen = null;
  }

  function randomPatrolOptions(game, enemy) {
    return shuffle(World.DIRS4)
      .map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y, distance: 0 }))
      .filter(pos => canEnemyMoveTo(game, enemy, pos.x, pos.y));
  }

  function getEnemyTarget(game, enemy) {
    if (enemy.type === "logistics" && enemy.carriedItem) {
      const dx = sign(enemy.x - game.player.x);
      const dy = sign(enemy.y - game.player.y);
      return { x: clamp(enemy.x + dx * 6, 1, CONFIG.mapWidth - 2), y: clamp(enemy.y + dy * 6, 1, CONFIG.mapHeight - 2) };
    }
    if (game.lure && game.lure.turns > 0 && enemy.type !== "soldier") return game.lure;
    if (enemy.state === "search" && enemy.lastSeen) return enemy.lastSeen;
    return game.player;
  }

  function canEnemyMoveTo(game, enemy, x, y) {
    if (!World.isInsideMap(x, y) || ![TILE.FLOOR, TILE.POLLUTION].includes(World.getTile(game, x, y))) return false;
    if (World.isPlayerAt(game, x, y) || World.isLiftAt(game, x, y) || World.isCoreAt(game, x, y)) return false;
    const other = World.getEnemyAt(game, x, y);
    return !(other && other !== enemy);
  }

  function enemyMoveOptions(game, enemy) {
    const target = getEnemyTarget(game, enemy);
    const current = manhattan(enemy.x, enemy.y, target.x, target.y);
    return shuffle(World.DIRS4)
      .map(d => ({ x: enemy.x + d.x, y: enemy.y + d.y, distance: manhattan(enemy.x + d.x, enemy.y + d.y, target.x, target.y) }))
      .filter(pos => pos.distance <= current)
      .sort((a, b) => a.distance - b.distance);
  }

  function logisticsPickup(game, enemy) {
    if (!FEATURES.enemyAbilities || enemy.type !== "logistics" || enemy.carriedItem) return;
    const item = World.getItemAt(game, enemy.x, enemy.y);
    if (!item) return;
    enemy.carriedItem = item;
    game.items = game.items.filter(existing => existing !== item);
    if (game.visible[enemy.y]?.[enemy.x]) World.addLog(game, "物流ロボットが遺物を回収した。 ");
  }

  function moveEnemy(game, enemy, onDeath) {
    if (!enemy || enemy.hp <= 0 || !World.isPlayerAlive(game)) return false;
    if (enemy.stun > 0) {
      enemy.stun--;
      return false;
    }
    updateAwareness(game, enemy);
    if (enemy.state === "idle" && !game.lure) {
      if (!chance(0.25)) return false;
      const options = randomPatrolOptions(game, enemy);
      if (!options.length) return false;
      const pos = options[0];
      enemy.x = pos.x;
      enemy.y = pos.y;
      logisticsPickup(game, enemy);
      return true;
    }
    if (FEATURES.enemyAbilities && enemy.type === "guardian" && chance(game.terminals?.some(t => t.active) ? 0.28 : 0.16)) {
      const nearbyMinions = game.enemies.filter(e => e !== enemy && manhattan(e.x, e.y, enemy.x, enemy.y) <= 7).length;
      const pos = MapSystem.findFreeFloorTile(game, { minPlayerDistance: 5, avoidItems: true, avoidTraps: true });
      if (pos && nearbyMinions < CONFIG.bossMinionLimit) {
        const def = chance(0.5) ? ENEMY_DEFS.hunter : ENEMY_DEFS.cleaner;
        const minion = createEnemy(game, def, `boss-${game.debug.bossActionCount}`);
        minion.x = pos.x;
        minion.y = pos.y;
        minion.state = "chase";
        game.enemies.push(minion);
        game.debug.bossActionCount++;
        World.addLog(game, "中枢防衛機が周辺機械を再起動した。");
      }
    }
    if (FEATURES.enemyAbilities && (enemy.type === "soldier" || enemy.type === "guardian") && lineShotPossible(game, enemy) && chance(enemy.type === "guardian" ? 0.7 : 0.55)) {
      const armorDef = game.player.armor ? ITEM_DEFS[game.player.armor.kind] : null;
    const rawDamage = Math.max(1, Math.round(enemy.attack * currentDifficulty().enemyAttackMultiplier));
    const damage = Math.max(1, rawDamage - (armorDef?.defenseBonus || 0));
    game.player.hp = Math.max(0, game.player.hp - damage);
      game.debug.bossLaserCount += enemy.type === "guardian" ? 1 : 0;
      World.pushFx(game, enemy.type === "guardian" ? "laser" : "shoot", game.player.x, game.player.y);
      systemSound(enemy.type === "guardian" ? "laser" : "shoot");
      World.addLog(game, `${enemy.name}が射撃した。HP ${game.player.hp}/${game.player.maxHp}。`);
      if (game.player.hp <= 0 && onDeath) onDeath("発掘家は旧軍の射撃で倒れた。Nキーで再開。");
      return false;
    }
    if (manhattan(enemy.x, enemy.y, game.player.x, game.player.y) === 1) {
      attackPlayer(game, enemy, onDeath);
      return false;
    }
    logisticsPickup(game, enemy);
    for (const pos of enemyMoveOptions(game, enemy)) {
      if (canEnemyMoveTo(game, enemy, pos.x, pos.y)) {
        enemy.x = pos.x;
        enemy.y = pos.y;
        game.debug.enemyMoveCount++;
        logisticsPickup(game, enemy);
        tryBuildWall(game, enemy);
        return true;
      }
    }
    return tryDismantleWall(game, enemy);
  }

  function processTurns(game, onDeath) {
    if (game.isGameOver || game.isClear) return;
    game.debug.enemyTurnCount++;
    const enemies = [...game.enemies];
    let moved = 0;
    for (const enemy of enemies) {
      if (game.isGameOver || game.isClear) break;
      if (!game.enemies.includes(enemy)) continue;
      if (moveEnemy(game, enemy, onDeath)) moved++;
    }
    if (moved > 0) World.addLog(game, `機械群が接近した。移動 ${moved} 体。`);
  }

  return {
    placeEnemies,
    attackEnemy,
    defeatEnemy,
    attackPlayer,
    processTurns
  };
})();


// --- turn.js ---
const TurnSystem = (() => {
  function applySurvivalTick(game, context = {}, onDeath) {
    if (game.isGameOver || game.isClear) return;
    game.player.hunger = Math.max(0, game.player.hunger - 1);
    if (World.getTile(game, game.player.x, game.player.y) === TILE.POLLUTION) game.player.pollution = Math.min(CONFIG.pollutionLimit, game.player.pollution + 4);
    else if (game.turn % 8 === 0) game.player.pollution = Math.min(CONFIG.pollutionLimit, game.player.pollution + 1);
    if (FEATURES.floorEvents && game.floorEvent === "pollution_leak" && game.turn % 5 === 0) {
      game.player.pollution = Math.min(CONFIG.pollutionLimit, game.player.pollution + 2);
      World.addLog(game, "汚染漏れが続いている。汚染度がじわりと上がった。 ");
    }

    if (game.player.attackBoostTurns > 0) {
      game.player.attackBoostTurns--;
      if (game.player.attackBoostTurns <= 0) {
        game.player.attackBonus = 0;
        World.addLog(game, "工具への給電が切れた。 ");
      }
    }
    if (game.lure && game.lure.turns > 0) {
      game.lure.turns--;
      if (game.lure.turns <= 0) World.addLog(game, "誘導灯が消えた。 ");
    }
    if (game.player.immobilizedTurns > 0 && context.reason !== "blocked") game.player.immobilizedTurns--;
    if (FEATURES.waitRest && context.reason === "wait" && game.turn % 3 === 0 && game.player.hunger > 0 && game.player.hp < game.player.maxHp) {
      game.player.hp++;
      World.addLog(game, `息を整えた。HP ${game.player.hp}/${game.player.maxHp}。`);
    }
    if (game.player.hunger <= 0) {
      game.player.hp = Math.max(0, game.player.hp - 1);
      World.addLog(game, `空腹で体力が削れた。HP ${game.player.hp}/${game.player.maxHp}。`);
    }
    if (game.player.pollution >= CONFIG.pollutionLimit && game.turn % 3 === 0) {
      game.player.hp = Math.max(0, game.player.hp - 1);
      World.addLog(game, "汚染が限界に達し、身体が崩れ始めた。 ");
    }
    if (game.player.hp <= 0 && onDeath) onDeath("発掘家は環境に耐えられなかった。Nキーで再開。 ");
  }

  function playerTurn(game, context = {}, onDeath) {
    if (!game.isGameOver && !game.isClear) {
      game.turn++;
      game.debug.playerActionCount++;
      applySurvivalTick(game, context, onDeath);
      if (!game.isGameOver && !game.isClear) EnemySystem.processTurns(game, onDeath);
    }
    VisibilitySystem.update(game);
  }

  return { applySurvivalTick, playerTurn };
})();
