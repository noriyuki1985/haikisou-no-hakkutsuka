// --- game.js ---
function playSound(name) {
  if (typeof AudioSystem !== "undefined") AudioSystem.play(name);
}

function createGameApp(elements) {
  const renderer = createRenderer(elements);
  const game = GameState.createInitialGame();

  function render() {
    renderer.render(game);
  }

  function endMessage() {
    World.addLog(game, "Nキーで新しい発掘を開始できる。 ");
    render();
  }

  function persistUiSettings() {
    saveSettings({ difficulty: DIFFICULTY.current, tutorialSeen: game.tutorialSeen, storySeen: game.storySeen, endingSeen: game.endingSeen });
  }

  function appendRunLog(result) {
    if (!FEATURES.runRecords) return;
    const label = result === "clear" ? "浄水コア回収" : result === "return" ? "途中帰還" : "回収不能";
    const floorName = FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働";
    const cause = result === "death" ? (game.lastDeathCause || "原因不明") : result === "return" ? "任意帰還" : "浄水コア回収";
    const detail = [
      `撃破${game.debug.enemyDefeatCount}`,
      `使用${game.debug.useCount}`,
      `投擲${game.debug.throwCount}`,
      `罠${game.debug.trapTriggeredCount}`,
      `最大汚染${game.player.pollution}`,
      `フロア:${floorName}`,
      `結果:${cause}`
    ].join(" / ");
    const entry = {
      version: VERSION,
      result,
      depth: game.depth,
      turns: game.turn,
      floorEvent: floorName,
      cause,
      stats: {
        defeated: game.debug.enemyDefeatCount,
        used: game.debug.useCount,
        thrown: game.debug.throwCount,
        traps: game.debug.trapTriggeredCount,
        searched: game.debug.searchCount,
        maxPollution: game.player.pollution
      },
      detail,
      summary: `${label}: 深度${game.depth} / ${game.turn}ターン / ${detail}`
    };
    if (!Array.isArray(game.settlement.runLogs)) game.settlement.runLogs = [];
    game.settlement.runLogs.unshift(entry);
    game.settlement.runLogs = game.settlement.runLogs.slice(0, CONFIG.runLogMax);
  }

  function runInputAllowed() {
    if (game.helpOpen) {
      World.addLog(game, "ヘルプを閉じてから操作する。 ");
      render();
      return false;
    }
    if (game.tutorialOpen) {
      World.addLog(game, "初回ガイドを閉じてから操作する。 ");
      render();
      return false;
    }
    if (game.storyOpen || game.endingOpen || game.runRecordOpen || game.npcDialog) {
      World.addLog(game, "会話/ストーリーを閉じてから操作する。 ");
      render();
      return false;
    }
    if (game.runMenuOpen) {
      World.addLog(game, "探索メニューを閉じてから操作する。 ");
      render();
      return false;
    }
    if (game.screen !== "run") {
      World.addLog(game, "Enterで探索を開始する。Bで拠点を確認できる。 ");
      render();
      return false;
    }
    return true;
  }

  function openRunScreen() {
    game.screen = "run";
    game.hasStarted = true;
    if (!game.tutorialSeen) game.tutorialOpen = true;
  }

  function applySettlementBonuses() {
    // v10.0.0: 持ち帰り再利用・拠点強化ボーナスは無効。
  }

  function clearOverlays() {
    clearTransitionTimers();
    game.transition = null;
    game.helpOpen = false;
    game.tutorialOpen = false;
    game.storyOpen = false;
    game.endingOpen = false;
    game.runRecordOpen = false;
    game.runMenuOpen = false;
    game.inventoryOpen = false;
    game.npcDialog = null;
  }

  function enterDungeonFromSettlement() {
    if (game.screen !== "base") return false;
    if (game.transition?.type === "entrance") return true;
    clearOverlays();
    clearTransitionTimers();
    const stepMs = CONFIG.entranceSequenceStepMs || 520;
    game.transition = { type: "entrance", step: "warning", startedAt: Date.now() };
    World.addLog(game, "警告: 廃棄層は高汚染区画。装備確認を開始。 ");
    playSound("warning");
    render();

    transitionTimers.push(setTimeout(() => {
      game.transition = { type: "entrance", step: "mask", startedAt: Date.now() };
      World.addLog(game, "マスク装着。シール良好。 ");
      playSound("ui");
      render();
    }, stepMs));

    transitionTimers.push(setTimeout(() => {
      game.transition = { type: "entrance", step: "door", startedAt: Date.now() };
      World.addLog(game, "隔壁を解放。扉機構が軋みながら開く。 ");
      playSound("terminal");
      render();
    }, stepMs * 2));

    transitionTimers.push(setTimeout(() => {
      game.transition = { type: "entrance", step: "descend", startedAt: Date.now() };
      resetRunState(true);
      openRunScreen();
      World.addLog(game, "廃棄層の入口をくぐった。内部構造が再構成される。 ");
      MapSystem.generate(game);
      game.settlement.bestDepth = Math.max(game.settlement.bestDepth, game.depth);
      World.addLog(game, `区画生成完了。部屋数 ${game.rooms.length}。敵 ${game.enemies.length} 体を検出。`);
      if (FEATURES.floorEvents) World.addLog(game, `フロアイベント: ${FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働"}。`);
      game.transition = null;
      clearTransitionTimers();
      playSound("terminal");
      render();
    }, stepMs * 3));
    return true;
  }

  function baseInputBlocked() {
    if (game.transition?.type === "entrance") {
      World.addLog(game, "隔壁通過シーケンス中。 ");
      render();
      return true;
    }
    if (game.helpOpen || game.storyOpen || game.endingOpen || game.runRecordOpen || game.npcDialog || game.tutorialOpen || game.inventoryOpen || game.runMenuOpen) {
      World.addLog(game, "画面を閉じてから集落を歩く。 ");
      render();
      return true;
    }
    return false;
  }

  function settlementEntrancePos() {
    return game.settlementEntrance || { x: 42, y: 16 };
  }

  function playerAtSettlementEntrance() {
    const ent = settlementEntrancePos();
    return game.screen === "base" && game.player.x === ent.x && game.player.y === ent.y;
  }

  function playerNearSettlementEntrance(radius = 3) {
    const ent = settlementEntrancePos();
    return game.screen === "base" && chebyshev(game.player.x, game.player.y, ent.x, ent.y) <= radius;
  }

  function updateEntranceGuidanceAfterMove() {
    if (!FEATURES.settlement || game.screen !== "base") return;
    if (playerAtSettlementEntrance()) {
      game.entrancePromptShown = true;
      World.addLog(game, "廃棄層入口。中央タップで隔壁を開ける。 ");
      return;
    }
    if (!game.entranceHintShown && playerNearSettlementEntrance(4)) {
      game.entranceHintShown = true;
      World.addLog(game, "東の隔壁が近い。入口に立ち、中央タップで廃棄層へ入る。 ");
    }
  }

  function talkAdjacentNpc() {
    if (game.screen !== "base") return false;
    if (playerAtSettlementEntrance()) return enterDungeonFromSettlement();
    const npc = SettlementSystem.adjacentNpc(game);
    if (!npc) {
      if (playerNearSettlementEntrance(4)) {
        World.addLog(game, "廃棄層へ入るには、入口マスに立って中央をタップする。 ");
      } else {
        World.addLog(game, "近くに話せる相手はいない。 ");
      }
      render();
      return true;
    }
    game.npcDialog = npc.key;
    World.recordCodex(game, `npc:${npc.key}`, NPC_DEFS[npc.key].name, NPC_DEFS[npc.key].role);
    playSound("ui");
    render();
    return true;
  }

  function moveSettlementPlayer(dx, dy) {
    if (baseInputBlocked()) return;
    if (dx === 0 && dy === 0) return talkAdjacentNpc();
    const nextX = game.player.x + dx;
    const nextY = game.player.y + dy;
    game.player.lastDir = { x: dx, y: dy };
    if (!World.isWalkable(game, nextX, nextY)) {
      World.addLog(game, "集落の壁や廃材に進路を阻まれた。 ");
      render();
      return;
    }
    const npc = World.getNpcAt(game, nextX, nextY);
    if (npc) {
      game.npcDialog = npc.key;
      World.recordCodex(game, `npc:${npc.key}`, NPC_DEFS[npc.key].name, NPC_DEFS[npc.key].role);
      playSound("ui");
      render();
      return;
    }
    game.player.x = nextX;
    game.player.y = nextY;
    playSound("move");
    updateEntranceGuidanceAfterMove();
    if (playerAtSettlementEntrance()) {
      render();
      return;
    }
    SettlementSystem.stepNpcs(game);
    render();
  }

  function rewardMissions() {
    if (!FEATURES.missions) return;
    for (const mission of Object.values(MISSION_DEFS)) {
      if (game.completedMissions[mission.key]) continue;
      if (!mission.done(game)) continue;
      game.completedMissions[mission.key] = true;
      game.debug.missionRewardCount++;
      World.addLog(game, `依頼達成: ${mission.title}。記録に反映した。`);
    }
  }

  function settleRunResult(result = "death") {
    if (!FEATURES.settlement || game.resultSettled) return;
    game.lastResult = result;
    game.settlement.runs++;
    rewardMissions();
    game.settlement.bestDepth = Math.max(game.settlement.bestDepth, game.depth);
    if (result === "clear") {
      game.settlement.cores++;
      appendRunLog("clear");
      World.addLog(game, "浄水コア回収を発掘記録へ残した。");
    } else if (result === "return") {
      appendRunLog("return");
      World.addLog(game, "途中帰還を発掘記録へ残した。アイテムは持ち帰らない。");
    } else {
      appendRunLog("death");
      World.addLog(game, "今回の発掘は回収不能として記録された。 ");
    }
    game.resultSettled = true;
    saveSettlement(game.settlement);
  }

  function triggerGameOver(message) {
    if (game.isGameOver || game.isClear) return;
    game.isGameOver = true;
    game.lastDeathCause = String(message || "回収不能").replace(/Nキー.*$/, "").trim();
    World.addLog(game, message);
    playSound("hurt");
    settleRunResult("death");
  }

  function finishReturn(message = "発掘を切り上げ、拠点へ帰還した。") {
    if (game.resultSettled || game.isGameOver || game.isClear) return endMessage();
    game.isReturned = true;
    game.lastDeathCause = "任意帰還";
    World.addLog(game, message);
    playSound("return");
    settleRunResult("return");
    SettlementSystem.generate(game);
    render();
  }

  function manualReturn() {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear || game.resultSettled) return endMessage();
    finishReturn("発掘家はこれ以上の深入りをやめ、拠点へ帰還した。");
  }

  function acquireCore() {
    if (!game.core.active || game.core.acquired) return;
    if (game.terminals?.some(t => t.active)) {
      World.addLog(game, "防衛端末が浄水コアの固定を維持している。端末をすべて停止する必要がある。");
      render();
      return;
    }
    if (game.enemies.some(enemy => enemy.type === "guardian")) {
      World.addLog(game, "中枢防衛機がコアの取り外しを妨害している。先に停止させる必要がある。");
      render();
      return;
    }
    game.core.acquired = true;
    game.lastDeathCause = "浄水コア回収";
    game.core.active = false;
    game.map[game.player.y][game.player.x] = TILE.FLOOR;
    game.isClear = true;
    game.debug.clearCount++;
    World.recordCodex(game, "goal:core", "浄水コア", "集落の浄水装置を延命できる中核部品。発掘家が命を賭ける理由。 ");
    World.addLog(game, "浄水コアを回収した。集落へ帰還する。 ");
    playSound("clear");
    settleRunResult("clear");
    game.endingOpen = true;
    game.endingPage = 0;
    game.endingSeen = true;
    persistUiSettings();
    VisibilitySystem.update(game);
    render();
  }

  function operateTerminal() {
    const terminal = game.terminals.find(t => t.active && t.x === game.player.x && t.y === game.player.y);
    if (!terminal) return false;
    terminal.active = false;
    game.disabledTerminals = (game.disabledTerminals || 0) + 1;
    game.debug.terminalUseCount++;
    game.map[terminal.y][terminal.x] = TILE.FLOOR;
    World.pushFx(game, "terminal", terminal.x, terminal.y);
    for (const enemy of game.enemies) {
      if (enemy.type === "guardian") enemy.stun = Math.max(enemy.stun || 0, 2);
    }
    World.addLog(game, `中枢防衛端末を停止した。残り ${game.terminals.filter(t => t.active).length}。`);
    playSound("terminal");
    World.recordCodex(game, "boss:terminal", "中枢防衛端末", "防衛機と浄水コアを守る旧文明端末。全停止でコアを取り外せる。 ");
    return true;
  }

  function moveToNextDepth() {
    game.depth++;
    game.settlement.bestDepth = Math.max(game.settlement.bestDepth, game.depth);
    MapSystem.generate(game);
    World.addLog(game, game.depth >= CONFIG.maxDepth ? "搬送リフトが最深層で停止した。浄水コアを探せ。" : `搬送リフトが稼働した。深度 ${game.depth} へ移動した。`);
    playSound("terminal");
    if (FEATURES.floorEvents) World.addLog(game, `フロアイベント: ${FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働"}。`);
    if (FEATURES.bossTerminals && game.depth >= CONFIG.maxDepth) World.addLog(game, "中枢防衛端末をすべて停止し、防衛機を沈黙させてからコアを回収する。 ");
    game.turn++;
    TurnSystem.applySurvivalTick(game, { reason: "lift" }, triggerGameOver);
    VisibilitySystem.update(game);
    render();
  }

  function canMoveDiagonal(dx, dy) {
    if (dx === 0 || dy === 0) return true;
    if (!FEATURES.diagonal) return false;
    if (World.getTile(game, game.player.x + dx, game.player.y) === TILE.WALL && World.getTile(game, game.player.x, game.player.y + dy) === TILE.WALL) return false;
    return true;
  }

  function commitPlayerTurn(context = {}) {
    TurnSystem.playerTurn(game, context, triggerGameOver);
    render();
  }

  function waitTurn() {
    if (!runInputAllowed()) return;
    if (!FEATURES.waitRest) {
      World.addLog(game, "足踏みはv2.4.0から。 ");
      render();
      return;
    }
    if (game.isGameOver || game.isClear) return endMessage();
    World.addLog(game, "その場で様子を見る。 ");
    commitPlayerTurn({ reason: "wait" });
  }

  function movePlayer(dx, dy) {
    if (game.screen === "base") return moveSettlementPlayer(dx, dy);
    if (dx === 0 && dy === 0) return waitTurn();
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (game.player.immobilizedTurns > 0) {
      World.addLog(game, "身体を固定されて動けない。 ");
      commitPlayerTurn({ reason: "blocked" });
      return;
    }
    if (!canMoveDiagonal(dx, dy)) {
      World.addLog(game, "斜め方向にはまだ動けない、または角が塞がっている。 ");
      render();
      return;
    }
    const nextX = game.player.x + dx;
    const nextY = game.player.y + dy;
    game.player.lastDir = { x: dx, y: dy };
    if (!World.isWalkable(game, nextX, nextY)) {
      World.addLog(game, "壁や廃材に進路を阻まれた。 ");
      render();
      return;
    }
    const enemy = World.getEnemyAt(game, nextX, nextY);
    if (enemy) {
      EnemySystem.attackEnemy(game, enemy);
      commitPlayerTurn({ reason: "attack" });
      return;
    }
    game.player.x = nextX;
    game.player.y = nextY;
    playSound("move");
    MapSystem.handleRoomEntry(game);
    TrapSystem.trigger(game, triggerGameOver);
    if (game.isGameOver || game.isClear) {
      VisibilitySystem.update(game);
      render();
      return;
    }
    const item = World.getItemAt(game, game.player.x, game.player.y);
    if (item) World.addLog(game, `${ItemSystem.getItemName(game, item)}が落ちている。拾うボタンで取得できる。`);
    const tile = World.getTile(game, game.player.x, game.player.y);
    if (tile === TILE.LIFT) return moveToNextDepth();
    if (tile === TILE.CORE) return acquireCore();
    if (tile === TILE.TERMINAL && operateTerminal()) return commitPlayerTurn({ reason: "terminal" });
    commitPlayerTurn({ reason: "move" });
  }

  function pickupItemAtPlayer() {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (ItemSystem.pickupAtPlayer(game)) { playSound("pickup"); commitPlayerTurn({ reason: "pickup" }); }
    else render();
  }

  function contextPickupOrUse() {
    if (game.screen === "base") {
      if (playerAtSettlementEntrance()) return enterDungeonFromSettlement();
      World.addLog(game, "住人のいる方向へ進むと会話。入口に立つと中央タップで廃棄層へ入る。 ");
      render();
      return;
    }
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (World.getItemAt(game, game.player.x, game.player.y)) {
      pickupItemAtPlayer();
    } else {
      useSelectedInventoryItem();
    }
  }

  function centerTapAction() {
    if (game.screen === "base") return talkAdjacentNpc();
    if (game.screen === "run") {
      if (!runInputAllowed()) return;
      if (game.isGameOver || game.isClear) return endMessage();
      if (World.getItemAt(game, game.player.x, game.player.y)) return pickupItemAtPlayer();
      return waitTurn();
    }
    return startExploration();
  }

  function useInventoryItem(index) {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (ItemSystem.useInventoryItem(game, index)) {
      playSound("use");
      if (game.pendingExtract) {
        game.pendingExtract = false;
        finishReturn("緊急帰還タグを使い、発掘を切り上げた。");
        return;
      }
      commitPlayerTurn({ reason: "use" });
    } else render();
  }

  function selectInventory(delta) {
    ItemSystem.selectInventory(game, delta);
    render();
  }

  function dropSelectedItem() {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (ItemSystem.dropSelected(game)) commitPlayerTurn({ reason: "drop" });
    else render();
  }

  function throwSelectedItem() {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (ItemSystem.throwSelected(game)) commitPlayerTurn({ reason: "throw" });
    else render();
  }

  function searchAround() {
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    if (TrapSystem.searchAround(game)) { playSound("ui"); commitPlayerTurn({ reason: "search" }); }
    else render();
  }

  function upgradeBase() {
    World.addLog(game, "v10.0.0では拠点強化とアイテム再利用は無効。発掘中の判断だけで進める。 ");
    render();
  }

  function cycleDifficulty() {
    const order = ["clear", "blind"];
    const next = order[(order.indexOf(DIFFICULTY.current) + 1) % order.length];
    DIFFICULTY.current = next;
    World.addLog(game, `識別設定を${currentDifficulty().name}に変更。次回以降の発掘に反映。`);
    persistUiSettings();
    render();
  }

  function regenerateArea() {
    if (game.screen === "base") {
      World.addLog(game, "集落は固定マップ。構造が変化するのは廃棄層の内部だけ。 ");
      render();
      return;
    }
    if (!runInputAllowed()) return;
    if (game.isGameOver || game.isClear) return endMessage();
    MapSystem.generate(game);
    World.addLog(game, "AIが廃棄区域を再構成した。深度とターンは変化しない。 ");
    render();
  }

  function resetRunState(keepSettlement = true) {
    const settlement = keepSettlement ? game.settlement : createDefaultSettlement();
    const restartCount = game.debug.restartCount + 1;
    const uiState = {
      tutorialSeen: game.tutorialSeen,
      storySeen: game.storySeen,
      endingSeen: game.endingSeen,
      inventoryOpen: game.inventoryOpen,
      runMenuOpen: game.runMenuOpen,
      screen: game.screen,
      hasStarted: game.hasStarted
    };
    GameState.resetRun(game, keepSettlement);
    game.settlement = settlement;
    game.completedMissions = {};
    game.debug.restartCount = restartCount;
    game.tutorialSeen = uiState.tutorialSeen;
    game.storySeen = uiState.storySeen;
    game.endingSeen = uiState.endingSeen;
    game.inventoryOpen = false;
    game.runMenuOpen = false;
    game.screen = uiState.screen;
    game.hasStarted = uiState.hasStarted;
    applySettlementBonuses();
  }

  function restartGame() {
    resetRunState(true);
    openRunScreen();
    World.addLog(game, "新しい発掘を開始した。 ");
    MapSystem.generate(game);
    game.settlement.bestDepth = Math.max(game.settlement.bestDepth, game.depth);
    World.addLog(game, `区画生成完了。部屋数 ${game.rooms.length}。敵 ${game.enemies.length} 体を検出。`);
    if (FEATURES.floorEvents) World.addLog(game, `フロアイベント: ${FLOOR_EVENT_DEFS[game.floorEvent]?.name || "通常稼働"}。`);
    render();
  }

  function init() {
    const settings = loadSettings();
    DIFFICULTY.current = settings.difficulty;
    game.settlement = loadSettlement();
    resetRunState(true);
    game.settlement = loadSettlement();
    game.tutorialSeen = settings.tutorialSeen;
    game.storySeen = settings.storySeen;
    game.endingSeen = settings.endingSeen;
    game.screen = "base";
    game.helpOpen = false;
    game.tutorialOpen = false;
    game.storyOpen = false;
    game.storyPage = 0;
    game.npcDialog = null;
    SettlementSystem.generate(game);
    World.recordCodex(game, "world:waste-zone", "再構成廃棄区域", "AIが作り、壊し、捨て続ける区域。人類はそこから文明の残骸を拾っている。 ");
    World.recordCodex(game, "world:mission", "発掘家の目的", "集落から廃棄層入口へ行き、再構成される内部で浄水コアを探す。 ");
    World.recordCodex(game, "world:settlement", "外縁集落", "東の隔壁から廃棄層へ入る生活圏。水守り、老発掘家、修理屋、見張り、記録係がいる。 ");
    World.addLog(game, "外縁集落。東の隔壁が廃棄層入口。住人にぶつかると話を聞ける。 ");
    render();
  }

  function startExploration() {
    if (game.helpOpen) {
      game.helpOpen = false;
      return render();
    }
    if (game.storyOpen) {
      advanceStory();
      return;
    }
    if (game.endingOpen) {
      advanceEnding();
      return;
    }
    if (game.npcDialog) {
      game.npcDialog = null;
      return render();
    }
    if (game.runMenuOpen) {
      game.runMenuOpen = false;
      return render();
    }
    if (game.inventoryOpen) {
      game.inventoryOpen = false;
      return render();
    }
    if (game.tutorialOpen) {
      game.tutorialOpen = false;
      game.tutorialSeen = true;
      persistUiSettings();
      return render();
    }
    if (game.screen === "base") {
      const ent = game.settlementEntrance || { x: 42, y: 16 };
      if (game.player.x === ent.x && game.player.y === ent.y) return enterDungeonFromSettlement();
      World.addLog(game, "廃棄層へ入るには、東側の入口に立って中央タップ。 ");
      return render();
    }
    if (game.screen !== "run") {
      SettlementSystem.generate(game);
      return render();
    }
    render();
  }

  function openBaseScreen() {
    if (game.screen === "run" && !game.isGameOver && !game.isClear && !game.resultSettled) {
      World.addLog(game, "探索中に集落へ戻るならPで途中帰還する。Bでは戻れない。 ");
      render();
      return;
    }
    if (game.isGameOver || game.isClear || game.resultSettled) resetRunState(true);
    clearOverlays();
    SettlementSystem.generate(game);
    render();
  }

  function toggleHelp() {
    playSound("ui");
    game.helpOpen = !game.helpOpen;
    if (game.helpOpen) {
      game.tutorialOpen = false;
      game.storyOpen = false;
      game.endingOpen = false;
      game.runRecordOpen = false;
      game.runMenuOpen = false;
      game.inventoryOpen = false;
      game.npcDialog = null;
    }
    render();
  }

  function closeOverlay() {
    if (game.helpOpen) {
      game.helpOpen = false;
    } else if (game.storyOpen) {
      game.storyOpen = false;
      game.storySeen = true;
      persistUiSettings();
    } else if (game.endingOpen) {
      game.endingOpen = false;
      game.endingSeen = true;
      persistUiSettings();
    } else if (game.runRecordOpen) {
      game.runRecordOpen = false;
    } else if (game.runMenuOpen) {
      game.runMenuOpen = false;
    } else if (game.inventoryOpen) {
      game.inventoryOpen = false;
    } else if (game.npcDialog) {
      game.npcDialog = null;
    } else if (game.tutorialOpen) {
      game.tutorialOpen = false;
      game.tutorialSeen = true;
      persistUiSettings();
    } else if (game.screen === "base") {
      // 固定集落はプレイ画面なので、Escでは画面遷移しない。
    }
    render();
  }

  function openStoryFromMenu() {
    if (game.screen === "run" && !game.helpOpen && !game.tutorialOpen && !game.storyOpen && !game.endingOpen && !game.npcDialog) return false;
    game.helpOpen = false;
    game.tutorialOpen = false;
    game.npcDialog = null;
    game.runRecordOpen = false;
    game.runMenuOpen = false;
    game.inventoryOpen = false;
    game.endingOpen = false;
    game.runRecordOpen = false;
    game.storyOpen = true;
    game.storyPage = 0;
    render();
    return true;
  }

  function advanceStory() {
    if (!game.storyOpen) return false;
    if (game.storyPage < STORY_PAGES.length - 1) {
      game.storyPage++;
      render();
      return true;
    }
    game.storyOpen = false;
    game.storySeen = true;
    persistUiSettings();
    render();
    return true;
  }

  function openEndingFromMenu() {
    if (game.screen === "run" && !game.helpOpen && !game.tutorialOpen && !game.storyOpen && !game.endingOpen && !game.npcDialog) return false;
    if ((game.settlement?.cores || 0) <= 0 && !game.isClear) {
      World.addLog(game, "エンディングは浄水コア回収後に読める。 ");
      render();
      return true;
    }
    game.helpOpen = false;
    game.tutorialOpen = false;
    game.storyOpen = false;
    game.npcDialog = null;
    game.runRecordOpen = false;
    game.runMenuOpen = false;
    game.inventoryOpen = false;
    game.endingOpen = true;
    game.endingPage = 0;
    render();
    return true;
  }

  function advanceEnding() {
    if (!game.endingOpen) return false;
    if (game.endingPage < ENDING_PAGES.length - 1) {
      game.endingPage++;
      render();
      return true;
    }
    game.endingOpen = false;
    game.endingSeen = true;
    persistUiSettings();
    render();
    return true;
  }

  function talkToNpcFromBase(index) {
    if (game.screen !== "base" || game.helpOpen || game.tutorialOpen || game.storyOpen) return false;
    const keys = ["water_keeper", "old_digger", "mechanic", "lookout", "recorder"];
    const key = keys[index];
    if (!key) return false;
    game.npcDialog = key;
    World.recordCodex(game, `npc:${key}`, NPC_DEFS[key].name, NPC_DEFS[key].role);
    render();
    return true;
  }

  function openRunRecords() {
    if (game.screen === "run" && !game.helpOpen && !game.tutorialOpen && !game.storyOpen && !game.endingOpen && !game.npcDialog && !game.runRecordOpen) return false;
    game.helpOpen = false;
    game.tutorialOpen = false;
    game.storyOpen = false;
    game.endingOpen = false;
    game.npcDialog = null;
    game.runMenuOpen = false;
    game.inventoryOpen = false;
    game.runRecordOpen = true;
    render();
    return true;
  }

  function toggleInventory() {
    if (game.screen !== "run") {
      World.addLog(game, "所持品一覧は探索中に確認できる。 ");
      return render();
    }
    playSound("ui");
    game.inventoryOpen = !game.inventoryOpen;
    if (game.inventoryOpen) {
      game.runMenuOpen = false;
      game.helpOpen = false;
      game.debug.inventoryOpenCount++;
    }
    render();
    return true;
  }

  function toggleRunMenu() {
    if (game.screen !== "run" && !game.runMenuOpen) return false;
    playSound("ui");
    game.runMenuOpen = !game.runMenuOpen;
    if (game.runMenuOpen) {
      game.inventoryOpen = false;
      game.helpOpen = false;
      game.tutorialOpen = false;
      game.storyOpen = false;
      game.endingOpen = false;
      game.runRecordOpen = false;
      game.npcDialog = null;
      game.debug.menuOpenCount++;
    }
    render();
    return true;
  }

  function menuButton() {
    // 探索中はメニュー開閉、集落/タイトルでは識別設定切替
    if (game.screen === "run") return toggleRunMenu();
    return cycleDifficulty();
  }

  function selectInventoryIndex(index) {
    if (game.screen !== "run") return false;
    if (!game.inventory.length) {
      World.addLog(game, "選択できる所持品がない。 ");
      render();
      return true;
    }
    if (index < 0 || index >= game.inventory.length) {
      World.addLog(game, "その番号の所持品はない。 ");
      render();
      return true;
    }
    game.selectedIndex = index;
    World.addLog(game, `選択: ${index + 1}. ${ItemSystem.getItemName(game, game.inventory[index])}`);
    render();
    return true;
  }

  function useSelectedInventoryItem() {
    if (game.screen === "base") return talkAdjacentNpc();
    if (game.screen !== "run") {
      upgradeBase();
      return true;
    }
    return useInventoryItem(game.selectedIndex);
  }

  function resetProgress() {
    clearSaveData();
    DIFFICULTY.current = "clear";
    resetRunState(false);
    game.screen = "base";
    game.tutorialSeen = false;
    game.storySeen = false;
    game.tutorialOpen = false;
    game.storyOpen = false;
    game.storyPage = 0;
    game.endingOpen = false;
    game.endingPage = 0;
    game.runRecordOpen = false;
    game.runMenuOpen = false;
    game.inventoryOpen = false;
    game.npcDialog = null;
    game.runRecordOpen = false;
    game.helpOpen = false;
    SettlementSystem.generate(game);
    World.addLog(game, "保存データを初期化した。外縁集落へ戻った。 ");
    render();
  }

  return {
    init,
    startExploration,
    openBaseScreen,
    toggleHelp,
    closeOverlay,
    openStoryFromMenu,
    advanceStory,
    openEndingFromMenu,
    advanceEnding,
    talkToNpcFromBase,
    resetProgress,
    movePlayer,
    pickupItemAtPlayer,
    contextPickupOrUse,
    centerTapAction,
    useInventoryItem,
    upgradeBase,
    cycleDifficulty,
    regenerateArea,
    restartGame,
    selectInventory,
    dropSelectedItem,
    throwSelectedItem,
    searchAround,
    manualReturn,
    openRunRecords,
    toggleInventory,
    toggleRunMenu,
    menuButton,
    selectInventoryIndex,
    useSelectedInventoryItem,
    __debugGame: game
  };
}


// --- main.js ---
const canvas = document.getElementById("gameCanvas");
const miniMapCanvas = document.getElementById("miniMapCanvas");

if (!canvas) {
  throw new Error("gameCanvas が見つかりません。");
}

const app = createGameApp({
  canvas,
  ctx: canvas.getContext("2d"),
  miniMapCanvas,
  miniCtx: miniMapCanvas ? miniMapCanvas.getContext("2d") : null,
  statusText: document.getElementById("statusText"),
  logPanel: document.getElementById("logPanel"),
  debugText: document.getElementById("debugText"),
  screenPanel: document.getElementById("screenPanel"),
  inventoryPanel: document.getElementById("inventoryPanel"),
  basePanel: document.getElementById("basePanel"),
  codexPanel: document.getElementById("codexPanel"),
  versionText: document.getElementById("versionText")
});

window.__haikisoApp = app;
app.init();
bindInput(app);
bindTouch(app);
