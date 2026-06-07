// --- config.js ---
const VERSION = "v17.5.2";
const FEATURE_LEVEL = 1752;

const FEATURES = {
  items: true,
  inventory: true,
  survival: true,
  unidentified: true,
  enemyVariants: true,
  settlement: true,
  basePanel: true,
  traps: true,
  codex: true,
  visibility: true,
  minimap: true,
  roomVision: true,
  waitRest: true,
  diagonal: true,
  throwDrop: true,
  positionItems: true,
  enemyAbilities: true,
  hiddenTraps: true,
  turnEngine: true,
  roomEvents: true,
  equipment: true,
  missions: true,
  bossFloor: true,
  enhancedUi: true,
  storySystem: true,
  missionBoard: true,
  runRecords: true,
  manualExtract: true,
  floorEvents: true,
  bossTerminals: true,
  runRecordDetails: true,
  explorationV9: true,
  explorationMenu: true,
  inventoryOverlay: true,
  improvedRecords: true,
  inputCleanupV10: true,
  debugV1531: true,
  floorEventVisuals: true,
  audioSystem: true,
  narrativePresentationV156: true,
  uiRefactorV16: true,
  mobileUi: true,
  touchControls: true,
  renderLoop: true,
  animationReady: true,
  pseudo25dArt: true,
  vectorSpriteFallback: true,
  cinematicUiV12: true,
  imageSprites: true,
  spriteAnimation: true,
  animatedHudV14: true,
  assetManagerV15: true,
  richTitleV15: true,
  richBaseV15: true,
  enhancedCombatFxV15: true,
  mobileFirstV17: true,
  settlementStartV17: true,
  toastLogV17: true,
  combatReadabilityV1742: true,
  settlementWalkMapV1743: true,
  settlementLifeSceneV1750: true,
  entranceSequenceV1750: true,
  attackTelegraphV1750: true
};

const TILE = {
  WALL: "#",
  FLOOR: ".",
  LIFT: ">",
  CORE: "*",
  TERMINAL: "T",
  POLLUTION: "~",
  ENTRANCE: "E"
};

const CONFIG = {
  tileSize: 32,
  mapWidth: 48,
  mapHeight: 32,
  viewportWidth: 21,
  viewportHeight: 15,
  viewportWidthMobile: 9,
  viewportHeightMobile: 9,
  mobileBreakpoint: 760,
  moveAnimMs: 135,
  fxMs: 720,
  combatAnimMs: 360,
  screenShakePx: 4.0,
  idleAnimMs: 1800,
  enemyAnimMs: 1500,
  spriteAnimStrength: 1.0,
  maxDevicePixelRatio: 2,
  sightRadius: 7,
  corridorSightRadius: 2,
  roomTargetCount: 12,
  roomMinSize: 4,
  roomMaxSize: 10,
  roomAttemptLimit: 260,
  mapGenerateRetryLimit: 16,
  minRequiredRooms: 4,
  maxLogLines: 9,
  enemyBaseCount: 5,
  enemyMaxCount: 16,
  enemyMinPlayerDistance: 6,
  playerAttackDamage: 2,
  maxDepth: 5,
  inventoryLimit: 8,
  itemBaseCount: 9,
  itemMaxCount: 15,
  maxHunger: 100,
  pollutionLimit: 100,
  settlementStorageKey: "haikiso-no-hakkutsuka-runmeta-v10",
  settingsStorageKey: "haikiso-no-hakkutsuka-settings-v10",
  runLogMax: 8,
  trapBaseCount: 5,
  trapMaxCount: 14,
  throwRange: 7,
  enemySightRadius: 7,
  enemyMemoryTurns: 8,
  baseUpgradeCost: 12,
  maxBaseLevel: 5,
  roomEventChance: 0.72,
  bossMinionLimit: 3,
  floorEventChance: 0.85,
  bossTerminalCount: 3,
  maxRecentFloorEvents: 6,
  settlementNpcStepChance: 0.55,
  entranceSequenceStepMs: 520
};


const DIFFICULTY = {
  current: "clear",
  presets: {
    clear: { name: "通常 / 識別済み", enemyAttackMultiplier: 1.0, hungerMultiplier: 1.0, pollutionMultiplier: 1.0, unidentified: false },
    blind: { name: "未識別 / 鑑定制", enemyAttackMultiplier: 1.0, hungerMultiplier: 1.0, pollutionMultiplier: 1.0, unidentified: true }
  }
};

function currentDifficulty() {
  return DIFFICULTY.presets[DIFFICULTY.current] || DIFFICULTY.presets.clear;
}


const AudioSystem = (() => {
  let ctx = null;
  let muted = false;
  let last = 0;

  const PRESETS = {
    ui: [520, 0.035, "sine"],
    move: [190, 0.025, "triangle"],
    pickup: [740, 0.045, "sine"],
    use: [620, 0.05, "sine"],
    hit: [310, 0.065, "square"],
    hurt: [150, 0.065, "sawtooth"],
    defeat: [90, 0.08, "triangle"],
    shoot: [430, 0.06, "square"],
    laser: [780, 0.06, "sawtooth"],
    terminal: [880, 0.055, "sine"],
    pollution: [120, 0.045, "sawtooth"],
    trap: [260, 0.06, "square"],
    clear: [980, 0.065, "sine"],
    return: [420, 0.045, "triangle"],
    warning: [210, 0.06, "square"]
  };

  function unlock() {
    if (muted || ctx) return Boolean(ctx);
    const AC = typeof window !== "undefined" ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!AC) return false;
    try {
      ctx = new AC();
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      return true;
    } catch (_) {
      muted = true;
      return false;
    }
  }

  function play(name) {
    if (!FEATURES.audioSystem || muted) return;
    if (!unlock() || !ctx) return;
    const now = ctx.currentTime;
    if (Date.now() - last < 22 && name !== "laser") return;
    last = Date.now();
    const [freq, gainValue, type] = PRESETS[name] || PRESETS.ui;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.58), now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (_) {}
  }

  function setMuted(value) {
    muted = Boolean(value);
  }

  return { unlock, play, setMuted };
})();


// --- data.js ---
const ITEM_DEFS = {
  nutrition_block: { kind: "nutrition_block", name: "栄養ブロック", glyph: "%", hidden: false, category: "food", weight: 18, effectText: "空腹を回復する", salvage: 0, throwDamage: 1 },
  med_foam: { kind: "med_foam", name: "止血フォーム", alias: "赤い薬剤", glyph: "!", hidden: true, category: "medicine", weight: 14, effectText: "HPを大きく回復する", salvage: 0, throwDamage: 1 },
  detox_kit: { kind: "detox_kit", name: "除染キット", alias: "白い薬剤", glyph: "!", hidden: true, category: "medicine", weight: 11, effectText: "汚染度を下げる", salvage: 0, throwDamage: 1 },
  battery_cell: { kind: "battery_cell", name: "小型電池", alias: "青い円筒", glyph: "+", hidden: true, category: "device", weight: 13, effectText: "しばらく攻撃力を上げる", salvage: 0, throwDamage: 4 },
  broken_terminal: { kind: "broken_terminal", name: "壊れた端末", alias: "用途不明端末", glyph: "?", hidden: true, category: "device", weight: 9, effectText: "ランダムな旧文明効果が起きる", salvage: 0, throwDamage: 2 },
  scrap_parts: { kind: "scrap_parts", name: "金属片", glyph: "$", hidden: false, category: "tactical", weight: 16, effectText: "投げると小さなダメージを与える。持ち帰り資源ではない", salvage: 0, throwDamage: 3 },
  water_filter: { kind: "water_filter", name: "浄水フィルタ", alias: "密封カートリッジ", glyph: "=", hidden: true, category: "medicine", weight: 7, effectText: "その場で簡易浄化し、汚染度を下げる。持ち帰り資源ではない", salvage: 0, throwDamage: 1 },
  signal_jammer: { kind: "signal_jammer", name: "信号妨害機", alias: "角ばった装置", glyph: "&", hidden: true, category: "tactical", weight: 8, effectText: "周囲の敵を数ターン停止させる", salvage: 0, throwDamage: 1 },
  force_transfer: { kind: "force_transfer", name: "強制転送端末", alias: "黒い端末", glyph: "?", hidden: true, category: "tactical", weight: 7, effectText: "近い敵を別区画へ転送する", salvage: 0, throwDamage: 1 },
  swap_beacon: { kind: "swap_beacon", name: "搬送ビーコン", alias: "点滅ビーコン", glyph: "*", hidden: true, category: "tactical", weight: 6, effectText: "近い敵と位置を入れ替える", salvage: 0, throwDamage: 1 },
  lure_light: { kind: "lure_light", name: "誘導灯", alias: "光る筒", glyph: ":", hidden: true, category: "tactical", weight: 7, effectText: "機械群を光源へ誘導する", salvage: 0, throwDamage: 1 },
  wall_cutter: { kind: "wall_cutter", name: "解体指示書", alias: "古い命令紙", glyph: "/", hidden: true, category: "tactical", weight: 6, effectText: "向いている方向の壁を削る", salvage: 0, throwDamage: 2 },
  barricade_kit: { kind: "barricade_kit", name: "仮設バリケード", alias: "折畳み資材", glyph: "#", hidden: true, category: "tactical", weight: 7, effectText: "正面に一時壁を作る", salvage: 0, throwDamage: 1 },
  emp_can: { kind: "emp_can", name: "電磁パルス缶", alias: "銀色の缶", glyph: "*", hidden: true, category: "tactical", weight: 8, effectText: "周囲の機械に小ダメージと停止を与える", salvage: 0, throwDamage: 3 },
  return_tag: { kind: "return_tag", name: "緊急帰還タグ", alias: "赤い札", glyph: "!", hidden: true, category: "tactical", weight: 5, effectText: "探索を切り上げて拠点へ帰還する", salvage: 0, throwDamage: 1 },
  identify_scanner: { kind: "identify_scanner", name: "鑑定端末", alias: "小型端末", glyph: "?", hidden: true, category: "tactical", weight: 6, effectText: "未識別の所持品を1つ識別する", salvage: 0, throwDamage: 1 },
  utility_blade: { kind: "utility_blade", name: "多目的カッター", glyph: ")", hidden: false, category: "equipment", slot: "weapon", attackBonus: 1, weight: 5, effectText: "装備すると攻撃力が少し上がる", salvage: 0, throwDamage: 4 },
  shock_rod: { kind: "shock_rod", name: "通電ロッド", glyph: ")", hidden: false, category: "equipment", slot: "weapon", attackBonus: 2, weight: 3, effectText: "装備すると攻撃力が上がる", salvage: 0, throwDamage: 5 },
  work_armor: { kind: "work_armor", name: "作業外骨格", glyph: "]", hidden: false, category: "equipment", slot: "armor", defenseBonus: 1, weight: 4, effectText: "装備すると被ダメージを少し抑える", salvage: 0, throwDamage: 2 },
  insulated_coat: { kind: "insulated_coat", name: "絶縁コート", glyph: "]", hidden: false, category: "equipment", slot: "armor", defenseBonus: 2, weight: 2, effectText: "装備すると被ダメージを抑える", salvage: 0, throwDamage: 2 }
};

const ENEMY_DEFS = {
  cleaner: { type: "cleaner", name: "清掃ロボット", glyph: "C", baseHp: 3, baseAttack: 1, weight: 35, desc: "人間を汚染源として排除する。" },
  dismantler: { type: "dismantler", name: "解体ロボット", glyph: "D", baseHp: 4, baseAttack: 1, weight: 15, desc: "壁を削って区画を作り替える。" },
  builder: { type: "builder", name: "建設ロボット", glyph: "B", baseHp: 4, baseAttack: 1, weight: 12, desc: "進路に仮設壁を立てる。" },
  hunter: { type: "hunter", name: "警備ロボット", glyph: "H", baseHp: 5, baseAttack: 2, weight: 10, desc: "認証不能者を追跡する。" },
  logistics: { type: "logistics", name: "物流ロボット", glyph: "L", baseHp: 3, baseAttack: 1, weight: 8, desc: "床の遺物を拾って運び去る。" },
  sorter: { type: "sorter", name: "分別ロボット", glyph: "S", baseHp: 4, baseAttack: 1, weight: 6, desc: "所持品を廃棄物として破壊する。" },
  medic: { type: "medic", name: "医療ロボット", glyph: "M", baseHp: 4, baseAttack: 1, weight: 5, desc: "救護の名目で拘束してくる。" },
  soldier: { type: "soldier", name: "軍事ロボット", glyph: "G", baseHp: 6, baseAttack: 2, weight: 4, desc: "明確な殺傷命令で射撃する。" },
  guardian: { type: "guardian", name: "中枢防衛機", glyph: "Q", baseHp: 16, baseAttack: 3, weight: 0, desc: "浄水コアを守る中枢接続機。停止させない限りコアへ近づけない。" }
};

const TRAP_DEFS = {
  alarm: { type: "alarm", name: "旧式警報線", glyph: "^", desc: "踏むと警報で敵が寄る。" },
  pollution: { type: "pollution", name: "汚染カプセル", glyph: "^", desc: "踏むと汚染度が上がる。" },
  conveyor: { type: "conveyor", name: "暴走搬送床", glyph: "^", desc: "踏むと別地点へ飛ばされる。" },
  shock: { type: "shock", name: "漏電床", glyph: "^", desc: "踏むとHPを失う。" },
  shutter: { type: "shutter", name: "封鎖シャッター", glyph: "^", desc: "踏むと周囲の通路が一時的に塞がる。" }
};

const ROOM_EVENT_DEFS = {
  supply: { type: "supply", name: "資材部屋", desc: "廃棄資材が多い。遺物を見つけやすい。" },
  polluted: { type: "polluted", name: "汚染部屋", desc: "汚染が濃いが、価値のある残骸も混ざる。" },
  security: { type: "security", name: "警備部屋", desc: "侵入者検知で警備機械が起動する。" },
  blackout: { type: "blackout", name: "停電区画", desc: "照明が死んで視界が狭い。" },
  storage: { type: "storage", name: "保管庫", desc: "部品類が比較的まとまって残る。" },
  dismantle: { type: "dismantle", name: "解体中区画", desc: "壁や通路が不安定で、構造が少しずつ変わる。" }
};

const FLOOR_EVENT_DEFS = {
  normal: { type: "normal", name: "通常稼働", desc: "廃棄区域は通常の再構成状態にある。" },
  blackout: { type: "blackout", name: "全域停電", desc: "フロア全体の視界が狭くなる。" },
  pollution_leak: { type: "pollution_leak", name: "汚染漏れ", desc: "一定ターンごとに汚染が濃くなる。" },
  dismantle_shift: { type: "dismantle_shift", name: "解体作業中", desc: "区画内の壁や通路が再加工されている。" },
  security_sweep: { type: "security_sweep", name: "警備強化", desc: "警備系ロボットの起動数が増える。" },
  supply_scatter: { type: "supply_scatter", name: "資材散乱", desc: "遺物が多いが、罠も混ざりやすい。" },
  quiet: { type: "quiet", name: "静かな区画", desc: "敵影は少ないが、遺物も少ない。" }
};

const MISSION_DEFS = {
  reach_depth3: { key: "reach_depth3", title: "深度3到達", desc: "深度3まで到達する。", done(game) { return game.depth >= 3; } },
  use_filter: { key: "use_filter", title: "浄水フィルタ実地使用", desc: "浄水フィルタを探索中に使う。", done(game) { return (game.debug.waterFilterUseCount || 0) >= 1; } },
  study_traps: { key: "study_traps", title: "罠の調査", desc: "周囲確認または罠発動を合計2回以上記録する。", done(game) { return (game.debug.searchCount + game.debug.trapTriggeredCount) >= 2; } },
  silence_machines: { key: "silence_machines", title: "自律機械の停止", desc: "ロボットを3体以上停止させる。", done(game) { return game.debug.enemyDefeatCount >= 3; } },
  return_alive: { key: "return_alive", title: "生還報告", desc: "途中帰還またはクリアで生きて戻る。", done(game) { return game.isReturned || game.isClear; } },
  disable_terminals: { key: "disable_terminals", title: "中枢端末の停止", desc: "最深部で防衛端末をすべて停止する。", done(game) { return (game.disabledTerminals || 0) >= CONFIG.bossTerminalCount; } },
  defeat_guardian: { key: "defeat_guardian", title: "中枢防衛機の停止", desc: "最深部の防衛機を停止する。", done(game) { return game.bossDefeated; } }
};

const STORY_PAGES = [
  {
    title: "核の冬のあと",
    lines: [
      "核戦争から長い年月が過ぎた。人類は高度な科学を失い、旧時代の機械の仕組みすら説明できなくなっていた。",
      "それでも、戦前に残された自律AIだけは止まらなかった。"
    ]
  },
  {
    title: "作って、壊して、捨てるもの",
    lines: [
      "AIは命令の意味を失ったまま、建物を建て、解体し、部品を作り、不要物として吐き出し続けている。",
      "人間はそれを拾い、直し、使い回すことで、かろうじて集落を維持している。"
    ]
  },
  {
    title: "発掘家",
    lines: [
      "主人公は発掘家。再構成される廃棄区域へ潜り、AIが作り捨てた遺物を現場で見極める仕事だ。",
      "ロボットの多くに悪意はない。ただ、命令の邪魔になるものを排除しているだけだ。"
    ]
  },
  {
    title: "水が尽きる前に",
    lines: [
      "集落の浄水装置が限界を迎えた。必要なのは旧文明の浄水コア。深部の中枢区画でしか見つからない。",
      "あなたは集落を生かすため、今日も廃棄層へ向かう。"
    ]
  }
];

const ENDING_PAGES = [
  {
    title: "水の音",
    lines: [
      "浄水コアが外れると、中枢区画の照明がひとつずつ落ちた。防衛機の残骸だけが、まだ命令を待つように震えている。",
      "あなたはコアを抱え、再構成が始まる前に廃棄層を引き返した。"
    ]
  },
  {
    title: "帰還",
    lines: [
      "集落の門が開く。水守りは何も言わず、あなたの手から旧文明の心臓部を受け取った。",
      "修理屋が祈るような手つきで配線をつなぎ、古い浄水装置は長い沈黙のあと、低く唸り始める。"
    ]
  },
  {
    title: "まだ終わらない世界",
    lines: [
      "水は戻った。子どもたちは桶を持って走り、老発掘家は黙って壁にもたれたまま目を閉じた。",
      "だが遠くの地平では、AIの建設塔がまた新しい建物を組み上げ、すぐに壊し始めている。"
    ]
  },
  {
    title: "発掘家",
    lines: [
      "世界は救われていない。AIも止まっていない。人類は今も、理解できない科学の残骸にすがって生きている。",
      "それでも今日、集落は水を得た。だから明日も誰かが廃棄層へ潜る。あなたの仕事は、まだ終わらない。"
    ]
  }
];

const NPC_DEFS = {
  water_keeper: {
    key: "water_keeper",
    name: "水守り",
    role: "浄水装置の管理者",
    lines: [
      "浄水装置の音が昨日から濁っている。水が止まれば、この集落は数日もたない。",
      "浄水フィルタでも延命はできる。だが本当に必要なのは、深部に残る浄水コアだ。",
      "浄水フィルタは持ち帰る資源ではなく、現場で使い方を判断する道具だ。命に直結するからな。"
    ],
    depth3: ["深度3まで行けたなら、もう浅層の発掘家ではない。だが中枢に近いほど、機械は人間を障害物として見る。"],
    core: ["浄水コアがあれば、集落はしばらく保つ。だがAIの廃棄層そのものは止まらない。次の問題は必ず来る。"]
  },
  old_digger: {
    key: "old_digger",
    name: "老発掘家",
    role: "引退した発掘家",
    lines: [
      "部屋で囲まれるな。通路へ下がれ。通路なら相手は一体ずつしか来られん。",
      "地図は歩いたところだけ信用しろ。見えない場所に突っ込むのは発掘じゃない、投棄だ。",
      "欲張って死ぬ発掘家は多い。戻る判断も仕事のうちだ。"
    ],
    depth3: ["深く潜るほど帰り道の価値が上がる。勝つことより戻ることを考えろ。"],
    core: ["コアを見たなら覚えておけ。あれは宝じゃない。集落全員の命綱だ。"]
  },
  mechanic: {
    key: "mechanic",
    name: "修理屋",
    role: "遺物の修理と鑑定担当",
    lines: [
      "信号妨害機は囲まれてからでは遅い。囲まれそうだと思った瞬間に使え。",
      "強制転送端末は強敵を消す道具じゃない。時間を買う道具だ。",
      "解体指示書は逃げ道を作る時に強い。壁を壊せるというだけで生存率が変わる。"
    ],
    depth3: ["軍事ロボットの射線に立つな。角を曲がれば、古い銃口もただの鉄くずだ。"],
    core: ["中枢の部品は規格が違う。触る前に周囲の機械を止めろ。"]
  },
  lookout: {
    key: "lookout",
    name: "見張り",
    role: "廃棄層の監視役",
    lines: [
      "清掃ロボットは人を汚染源と見る。悪意じゃない。だから止まらない。",
      "警備ロボットは見つけると速い。視線を切れ。追跡の記憶は長くは続かない。",
      "物流ロボットは遺物を持っていく。放っておくと、拾う前に消えるぞ。"
    ],
    depth3: ["深部では警報線に気をつけろ。踏めば、こちらの位置を機械に教えることになる。"],
    core: ["中枢防衛機が止まった時、廃棄層の動きが一瞬だけ鈍った。あれはただの敵じゃない。"]
  },
  recorder: {
    key: "recorder",
    name: "記録係",
    role: "発掘記録の管理者",
    lines: [
      "見たものは記録する。名前をつければ、次に出会った時に対処できる。",
      "発見記録は記憶の代用品だ。科学を失った私たちには、それが必要だ。",
      "知らないものを拾い、使い方を残す。文明はたぶん、そうやって一度始まった。"
    ],
    depth3: ["深度3以降の記録は少ない。戻った発掘家が少ないからだ。"],
    core: ["浄水コアの記録は残しておく。次世代が、ただの神話だと思わないように。"]
  }
};

function getNpcDialogue(game, key) {
  const npc = NPC_DEFS[key] || NPC_DEFS.water_keeper;
  const lines = [...npc.lines];
  if ((game.settlement?.bestDepth || 0) >= 3 && npc.depth3) lines.push(...npc.depth3);
  if ((game.settlement?.cores || 0) > 0 && npc.core) lines.push(...npc.core);
  const runLogs = Array.isArray(game.settlement?.runLogs) ? game.settlement.runLogs : [];
  if (key === "old_digger") lines.push("途中で戻ることは敗北じゃない。Pキーで帰還判断をする。深くで倒れるより、生きて情報を持ち戻る方が価値がある。");
  if (key === "mechanic") lines.push("緊急帰還タグはクリア道具じゃない。探索を切り上げるための保険だ。危険なら使え。");
  if (key === "recorder" && runLogs.length) lines.push(`直近の発掘記録: ${runLogs[0].summary}`);
  if (key === "water_keeper" && (game.settlement?.water || 0) <= 0) lines.push("浄水フィルタは現場で使え。深部に進む前に汚染を落とせるかどうかで生存率が変わる。");
  return { key: npc.key, name: npc.name, role: npc.role, lines };
}



// --- utils.js ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(p) {
  return Math.random() < p;
}

function manhattan(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function chebyshev(x1, y1, x2, y2) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sign(value) {
  return value === 0 ? 0 : value > 0 ? 1 : -1;
}


// --- storage.js ---
function createDefaultSettlement() {
  return { cores: 0, runs: 0, bestDepth: 0, runLogs: [] };
}

function sanitizeSettlement(value) {
  const base = createDefaultSettlement();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const result = { ...base };
  for (const key of Object.keys(base)) {
    if (key === "runLogs") continue;
    const next = Number(value[key]);
    result[key] = Number.isFinite(next) && next >= 0 ? Math.floor(next) : base[key];
  }
  if (Array.isArray(value.runLogs)) {
    result.runLogs = value.runLogs.slice(0, CONFIG.runLogMax).map(entry => ({
      version: String(entry.version || VERSION),
      result: String(entry.result || "unknown"),
      depth: Math.max(1, Math.floor(Number(entry.depth) || 1)),
      turns: Math.max(0, Math.floor(Number(entry.turns) || 0)),
      summary: String(entry.summary || "記録なし").slice(0, 120)
    }));
  }
  return result;
}

function loadSettlement() {
  if (!FEATURES.settlement || typeof localStorage === "undefined") return createDefaultSettlement();
  try {
    const raw = localStorage.getItem(CONFIG.settlementStorageKey);
    if (!raw) return createDefaultSettlement();
    return sanitizeSettlement(JSON.parse(raw));
  } catch (_) {
    return createDefaultSettlement();
  }
}

function saveSettlement(settlement) {
  if (!FEATURES.settlement || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CONFIG.settlementStorageKey, JSON.stringify(sanitizeSettlement(settlement)));
  } catch (_) {}
}

function createDefaultSettings() {
  return { difficulty: "clear", tutorialSeen: false, storySeen: false, endingSeen: false };
}

function sanitizeSettings(value) {
  const base = createDefaultSettings();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const difficulty = Object.prototype.hasOwnProperty.call(DIFFICULTY.presets, value.difficulty) ? value.difficulty : base.difficulty;
  return { difficulty, tutorialSeen: Boolean(value.tutorialSeen), storySeen: Boolean(value.storySeen), endingSeen: Boolean(value.endingSeen) };
}

function loadSettings() {
  if (typeof localStorage === "undefined") return createDefaultSettings();
  try {
    const raw = localStorage.getItem(CONFIG.settingsStorageKey);
    if (!raw) return createDefaultSettings();
    return sanitizeSettings(JSON.parse(raw));
  } catch (_) {
    return createDefaultSettings();
  }
}

function saveSettings(settings) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CONFIG.settingsStorageKey, JSON.stringify(sanitizeSettings(settings)));
  } catch (_) {}
}

function clearSaveData() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CONFIG.settlementStorageKey);
    localStorage.removeItem(CONFIG.settingsStorageKey);
  } catch (_) {}
}


// --- state.js ---
const GameState = (() => {
  function createDebugState() {
    return {
      generationCount: 0,
      retryCount: 0,
      floorCount: 0,
      roomAttempts: 0,
      visibleCount: 0,
      enemyTurnCount: 0,
      enemyMoveCount: 0,
      enemyAttackCount: 0,
      enemyDefeatCount: 0,
      playerAttackCount: 0,
      playerActionCount: 0,
      pickupCount: 0,
      useCount: 0,
      dropCount: 0,
      throwCount: 0,
      searchCount: 0,
      trapTriggeredCount: 0,
      pathCheckCount: 0,
      buildCancelCount: 0,
      boundaryRepairCount: 0,
      restartCount: 0,
      clearCount: 0,
      roomEventCount: 0,
      missionRewardCount: 0,
      waterFilterUseCount: 0,
      bossActionCount: 0,
      floorEventCount: 0,
      terminalUseCount: 0,
      bossLaserCount: 0,
      shutterTrapCount: 0,
      menuOpenCount: 0,
      inventoryOpenCount: 0
    };
  }

  function createPlayer() {
    return {
      x: 1,
      y: 1,
      hp: 10,
      maxHp: 10,
      hunger: CONFIG.maxHunger,
      pollution: 0,
      attackBonus: 0,
      attackBoostTurns: 0,
      immobilizedTurns: 0,
      weapon: null,
      armor: null,
      lastDir: { x: 1, y: 0 }
    };
  }

  function createInitialGame() {
    return {
      depth: 1,
      turn: 0,
      map: [],
      roomMap: [],
      visible: [],
      explored: [],
      rooms: [],
      logs: [],
      enemies: [],
      npcs: [],
      items: [],
      traps: [],
      inventory: [],
      identified: {},
      codex: [],
      fx: [],
      selectedIndex: 0,
      isGameOver: false,
      isClear: false,
      resultSettled: false,
      isReturned: false,
      debug: createDebugState(),
      player: createPlayer(),
      lift: { x: 1, y: 1, active: true },
      settlementEntrance: { x: 43, y: 16 },
      settlementStart: { x: 8, y: 16 },
      settlementTurn: 0,
      settlementProps: [],
      transition: null,
      core: { x: 1, y: 1, active: false, acquired: false },
      terminals: [],
      disabledTerminals: 0,
      floorEvent: "normal",
      recentFloorEvents: [],
      lure: null,
      currentRoomId: -1,
      visitedRoomEvents: {},
      bossDefeated: false,
      pendingExtract: false,
      lastDeathCause: "",
      lastResult: "none",
      screen: "title",
      helpOpen: false,
      tutorialOpen: false,
      tutorialSeen: false,
      storyOpen: false,
      storySeen: false,
      storyPage: 0,
      endingOpen: false,
      endingSeen: false,
      runRecordOpen: false,
      runMenuOpen: false,
      inventoryOpen: false,
      endingPage: 0,
      npcDialog: null,
      hasStarted: false,
      missions: Object.values(MISSION_DEFS).map(m => m.key),
      completedMissions: {},
      settlement: createDefaultSettlement()
    };
  }

  function createBoolMap(value) {
    return Array.from({ length: CONFIG.mapHeight }, () => Array.from({ length: CONFIG.mapWidth }, () => Boolean(value)));
  }

  function createEmptyMap() {
    return Array.from({ length: CONFIG.mapHeight }, () => Array.from({ length: CONFIG.mapWidth }, () => TILE.WALL));
  }

  function createRoomMap() {
    return Array.from({ length: CONFIG.mapHeight }, () => Array.from({ length: CONFIG.mapWidth }, () => -1));
  }

  function resetRun(game, keepSettlement = true) {
    const settlement = keepSettlement ? game.settlement : createDefaultSettlement();
    const debug = createDebugState();
    debug.restartCount = game.debug.restartCount;
    Object.assign(game, createInitialGame());
    game.debug = debug;
    game.settlement = settlement;
  }

  return {
    createDebugState,
    createPlayer,
    createInitialGame,
    createBoolMap,
    createEmptyMap,
    createRoomMap,
    resetRun
  };
})();


// --- world.js ---
const World = (() => {
  const DIRS4 = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  const DIRS8 = [
    ...DIRS4,
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 }
  ];

  function isInsideMap(x, y) {
    return x >= 0 && y >= 0 && x < CONFIG.mapWidth && y < CONFIG.mapHeight;
  }

  function isOuterWallPosition(x, y) {
    return x <= 0 || y <= 0 || x >= CONFIG.mapWidth - 1 || y >= CONFIG.mapHeight - 1;
  }

  function getTile(game, x, y) {
    return isInsideMap(x, y) ? game.map[y][x] : TILE.WALL;
  }

  function isWalkable(game, x, y) {
    return [TILE.FLOOR, TILE.LIFT, TILE.CORE, TILE.TERMINAL, TILE.POLLUTION, TILE.ENTRANCE].includes(getTile(game, x, y));
  }

  function isPlayerAt(game, x, y) {
    return game.player.x === x && game.player.y === y;
  }

  function isLiftAt(game, x, y) {
    return game.lift.active && game.lift.x === x && game.lift.y === y;
  }

  function isCoreAt(game, x, y) {
    return game.core.active && game.core.x === x && game.core.y === y;
  }

  function isTerminalAt(game, x, y) {
    return Array.isArray(game.terminals) && game.terminals.some(t => t.active && t.x === x && t.y === y);
  }

  function getEnemyAt(game, x, y) {
    return game.enemies.find(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0) || null;
  }

  function getItemAt(game, x, y) {
    return game.items.find(item => item.x === x && item.y === y) || null;
  }

  function getNpcAt(game, x, y) {
    return Array.isArray(game.npcs) ? (game.npcs.find(npc => npc.x === x && npc.y === y) || null) : null;
  }

  function getTrapAt(game, x, y) {
    return game.traps.find(trap => trap.x === x && trap.y === y && trap.active) || null;
  }

  function isBlockedByEntity(game, x, y) {
    return isPlayerAt(game, x, y) || isLiftAt(game, x, y) || isCoreAt(game, x, y) || isTerminalAt(game, x, y) || Boolean(getEnemyAt(game, x, y)) || Boolean(getNpcAt(game, x, y));
  }

  function isBlockedByEntityExceptEnemy(game, x, y, target) {
    if (isPlayerAt(game, x, y) || isLiftAt(game, x, y) || isCoreAt(game, x, y) || isTerminalAt(game, x, y)) return true;
    return game.enemies.some(enemy => enemy !== target && enemy.hp > 0 && enemy.x === x && enemy.y === y);
  }

  function isPlayerAlive(game) {
    return game.player.hp > 0 && !game.isGameOver && !game.isClear;
  }

  function addLog(game, message) {
    game.logs.unshift(message);
    game.logs = game.logs.slice(0, CONFIG.maxLogLines);
  }

  function recordCodex(game, key, title, body) {
    if (!FEATURES.codex || game.codex.some(entry => entry.key === key)) return;
    game.codex.unshift({ key, title, body });
    game.codex = game.codex.slice(0, 18);
  }

  function createRoom(x, y, width, height) {
    return { x, y, width, height, centerX: Math.floor(x + width / 2), centerY: Math.floor(y + height / 2), event: null, eventVisited: false };
  }

  function roomsOverlap(a, b) {
    return !(a.x + a.width + 1 < b.x || b.x + b.width + 1 < a.x || a.y + a.height + 1 < b.y || b.y + b.height + 1 < a.y);
  }

  let idSeq = 0;
  function nextId(prefix = "e") {
    idSeq += 1;
    return `${prefix}${idSeq}`;
  }

  function pushFx(game, type, x, y, extra = {}) {
    if (!Array.isArray(game.fx)) game.fx = [];
    game.fx.push({ type, x, y, born: (typeof performance !== "undefined" ? performance.now() : Date.now()), ...extra });
    if (game.fx.length > 48) game.fx = game.fx.slice(-48);
  }

  return {
    DIRS4,
    DIRS8,
    isInsideMap,
    isOuterWallPosition,
    getTile,
    isWalkable,
    isPlayerAt,
    isLiftAt,
    isCoreAt,
    isTerminalAt,
    getEnemyAt,
    getItemAt,
    getNpcAt,
    getTrapAt,
    isBlockedByEntity,
    isBlockedByEntityExceptEnemy,
    isPlayerAlive,
    addLog,
    recordCodex,
    createRoom,
    roomsOverlap,
    nextId,
    pushFx
  };
})();


// --- settlement_map.js ---
const SettlementSystem = (() => {
  const START = { x: 7, y: 16 };
  const ENTRANCE = { x: 42, y: 16 };

  const NPC_STARTS = [
    { key: "water_keeper", x: 12, y: 10, homeX: 12, homeY: 10, radius: 3 },
    { key: "old_digger", x: 10, y: 22, homeX: 10, homeY: 22, radius: 4 },
    { key: "mechanic", x: 25, y: 12, homeX: 25, homeY: 12, radius: 4 },
    { key: "lookout", x: 36, y: 10, homeX: 36, homeY: 10, radius: 5 },
    { key: "recorder", x: 23, y: 23, homeX: 23, homeY: 23, radius: 3 }
  ];

  function setTile(map, x, y, tile) {
    if (x >= 0 && y >= 0 && x < CONFIG.mapWidth && y < CONFIG.mapHeight) map[y][x] = tile;
  }

  function fillRect(map, x, y, w, h, tile) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) setTile(map, xx, yy, tile);
    }
  }

  function addBuilding(map, x, y, w, h, doors = []) {
    fillRect(map, x, y, w, h, TILE.WALL);
    fillRect(map, x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2), TILE.FLOOR);
    for (const door of doors) setTile(map, door.x, door.y, TILE.FLOOR);
  }

  function addFence(map, x1, y1, x2, y2) {
    if (x1 === x2) {
      const [from, to] = y1 <= y2 ? [y1, y2] : [y2, y1];
      for (let y = from; y <= to; y++) setTile(map, x1, y, TILE.WALL);
      return;
    }
    if (y1 === y2) {
      const [from, to] = x1 <= x2 ? [x1, x2] : [x2, x1];
      for (let x = from; x <= to; x++) setTile(map, x, y1, TILE.WALL);
    }
  }

  function createSettlementProps() {
    return [
      { type: "house", x: 8, y: 7, w: 8, h: 5, label: "水守の小屋" },
      { type: "water", x: 12, y: 13, w: 4, h: 2, label: "水場" },
      { type: "house", x: 20, y: 7, w: 10, h: 7, label: "修理屋工房" },
      { type: "workbench", x: 25, y: 14, w: 3, h: 1, label: "作業台" },
      { type: "scrap", x: 29, y: 14, w: 4, h: 2, label: "廃材置き場" },
      { type: "campfire", x: 18, y: 16, w: 2, h: 2, label: "焚き火" },
      { type: "camp", x: 16, y: 18, w: 7, h: 3, label: "共有広場" },
      { type: "house", x: 7, y: 20, w: 8, h: 6, label: "老発掘家の寝床" },
      { type: "house", x: 20, y: 20, w: 8, h: 6, label: "記録係の小屋" },
      { type: "watchtower", x: 34, y: 6, w: 6, h: 4, label: "見張り台" },
      { type: "yard", x: 31, y: 20, w: 7, h: 5, label: "選別ヤード" },
      { type: "scrap", x: 33, y: 21, w: 4, h: 2, label: "廃材置き場" },
      { type: "gate", x: 38, y: 13, w: 6, h: 7, label: "廃棄層入口" },
      { type: "door", x: ENTRANCE.x, y: ENTRANCE.y, w: 1, h: 1, label: "隔壁" }
    ];
  }

  function createMap() {
    const map = GameState.createEmptyMap();
    fillRect(map, 3, 4, 42, 24, TILE.FLOOR);
    fillRect(map, 2, 3, 44, 1, TILE.WALL);
    fillRect(map, 2, 28, 44, 1, TILE.WALL);
    fillRect(map, 2, 3, 1, 26, TILE.WALL);
    fillRect(map, 45, 3, 1, 26, TILE.WALL);

    addBuilding(map, 8, 7, 8, 5, [{ x: 12, y: 11 }]);
    addBuilding(map, 20, 7, 10, 7, [{ x: 25, y: 13 }]);
    addBuilding(map, 7, 20, 8, 6, [{ x: 11, y: 20 }]);
    addBuilding(map, 20, 20, 8, 6, [{ x: 23, y: 20 }]);
    addBuilding(map, 34, 6, 6, 4, [{ x: 36, y: 9 }]);

    addFence(map, 31, 20, 37, 20);
    addFence(map, 31, 24, 37, 24);
    addFence(map, 31, 20, 31, 24);
    addFence(map, 37, 20, 37, 24);
    setTile(map, 34, 20, TILE.FLOOR);

    fillRect(map, 38, 13, 6, 7, TILE.FLOOR);
    addFence(map, 38, 13, 43, 13);
    addFence(map, 38, 19, 43, 19);
    addFence(map, 38, 13, 38, 19);
    addFence(map, 43, 13, 43, 19);
    setTile(map, 40, 13, TILE.FLOOR);
    setTile(map, 40, 19, TILE.FLOOR);
    setTile(map, ENTRANCE.x, ENTRANCE.y, TILE.ENTRANCE);

    fillRect(map, 11, 13, 5, 3, TILE.FLOOR);
    fillRect(map, 12, 13, 3, 2, TILE.POLLUTION);

    fillRect(map, 4, 15, 39, 3, TILE.FLOOR);
    fillRect(map, 17, 12, 3, 8, TILE.FLOOR);
    fillRect(map, 24, 13, 4, 3, TILE.FLOOR);
    fillRect(map, 30, 20, 8, 5, TILE.FLOOR);

    setTile(map, 5, 16, TILE.FLOOR);
    setTile(map, 6, 16, TILE.FLOOR);
    setTile(map, 41, 16, TILE.FLOOR);
    return map;
  }

  function revealAll(game) {
    game.visible = GameState.createBoolMap(true);
    game.explored = GameState.createBoolMap(true);
    game.debug.visibleCount = CONFIG.mapWidth * CONFIG.mapHeight;
  }

  function generate(game) {
    game.screen = "base";
    game.depth = 0;
    game.turn = 0;
    game.map = createMap();
    game.roomMap = GameState.createRoomMap();
    game.rooms = [];
    game.enemies = [];
    game.items = [];
    game.traps = [];
    game.lure = null;
    game.floorEvent = "normal";
    game.currentRoomId = -1;
    game.lift = { x: ENTRANCE.x, y: ENTRANCE.y, active: false };
    game.core = { x: 1, y: 1, active: false, acquired: false };
    game.terminals = [];
    game.disabledTerminals = 0;
    game.bossDefeated = false;
    game.pendingExtract = false;
    game.transition = null;
    game.settlementStart = { ...START };
    game.settlementEntrance = { ...ENTRANCE };
    game.settlementProps = createSettlementProps();
    game.player.x = START.x;
    game.player.y = START.y;
    game.player.lastDir = { x: 1, y: 0 };
    game.npcs = NPC_STARTS.map(n => ({
      id: `npc:${n.key}`,
      key: n.key,
      x: n.x,
      y: n.y,
      homeX: n.homeX,
      homeY: n.homeY,
      radius: n.radius,
      stepPhase: Math.random()
    }));
    revealAll(game);
  }

  function isEntrance(game, x, y) {
    const ent = game.settlementEntrance || ENTRANCE;
    return x === ent.x && y === ent.y;
  }

  function canNpcMove(game, npc, x, y) {
    if (!World.isWalkable(game, x, y)) return false;
    if (isEntrance(game, x, y)) return false;
    if (game.player.x === x && game.player.y === y) return false;
    if (Array.isArray(game.npcs) && game.npcs.some(other => other !== npc && other.x === x && other.y === y)) return false;
    if (chebyshev(x, y, npc.homeX, npc.homeY) > npc.radius) return false;
    return true;
  }

  function stepNpcs(game) {
    if (!Array.isArray(game.npcs)) return;
    game.settlementTurn = (game.settlementTurn || 0) + 1;
    for (const npc of game.npcs) {
      if (Math.random() > CONFIG.settlementNpcStepChance) continue;
      const dirs = shuffle([{ x: 0, y: 0 }, ...World.DIRS4]);
      for (const dir of dirs) {
        const nx = npc.x + dir.x;
        const ny = npc.y + dir.y;
        if (!canNpcMove(game, npc, nx, ny)) continue;
        npc.x = nx;
        npc.y = ny;
        break;
      }
    }
    revealAll(game);
  }

  function adjacentNpc(game) {
    if (!Array.isArray(game.npcs)) return null;
    return game.npcs.find(npc => chebyshev(game.player.x, game.player.y, npc.x, npc.y) <= 1) || null;
  }

  return { generate, revealAll, stepNpcs, adjacentNpc, isEntrance };
})();


// --- visibility.js ---
const VisibilitySystem = (() => {
  function reset(game) {
    game.visible = GameState.createBoolMap(false);
    game.explored = GameState.createBoolMap(false);
    game.debug.visibleCount = 0;
  }

  function hasLineOfSight(game, x1, y1, x2, y2) {
    let x = x1;
    let y = y1;
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    while (!(x === x2 && y === y2)) {
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      if (x === x2 && y === y2) return true;
      if (!World.isInsideMap(x, y)) return false;
      if (World.getTile(game, x, y) === TILE.WALL) return false;
    }
    return true;
  }

  function revealTile(game, x, y) {
    if (!World.isInsideMap(x, y)) return;
    if (!game.visible[y][x]) game.debug.visibleCount++;
    game.visible[y][x] = true;
    game.explored[y][x] = true;
  }

  function revealAreaWithLos(game, radius) {
    for (let y = Math.max(0, game.player.y - radius); y <= Math.min(CONFIG.mapHeight - 1, game.player.y + radius); y++) {
      for (let x = Math.max(0, game.player.x - radius); x <= Math.min(CONFIG.mapWidth - 1, game.player.x + radius); x++) {
        if (chebyshev(game.player.x, game.player.y, x, y) > radius) continue;
        if (hasLineOfSight(game, game.player.x, game.player.y, x, y)) revealTile(game, x, y);
      }
    }
  }

  function revealRoom(game, roomIndex) {
    if (roomIndex < 0) return false;
    const room = game.rooms[roomIndex];
    if (!room) return false;
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) revealTile(game, x, y);
    }
    return true;
  }

  function update(game) {
    game.visible = GameState.createBoolMap(false);
    game.debug.visibleCount = 0;
    const currentRoom = game.roomMap[game.player.y]?.[game.player.x] ?? -1;
    const currentRoomData = game.rooms[currentRoom];
    if ((FEATURES.floorEvents && game.floorEvent === "blackout") || (FEATURES.roomEvents && currentRoomData?.event === "blackout")) {
      revealAreaWithLos(game, CONFIG.corridorSightRadius);
    } else if (FEATURES.roomVision && revealRoom(game, currentRoom)) {
      revealAreaWithLos(game, CONFIG.corridorSightRadius + 1);
    } else {
      revealAreaWithLos(game, FEATURES.roomVision ? CONFIG.corridorSightRadius : CONFIG.sightRadius);
    }
  }

  return { reset, update, hasLineOfSight, revealTile, revealRoom };
})();


// --- map.js ---
const MapSystem = (() => {
  function carveRoom(game, room, roomIndex) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (!World.isInsideMap(x, y)) continue;
        game.map[y][x] = TILE.FLOOR;
        game.roomMap[y][x] = roomIndex;
      }
    }
  }

  function carveHorizontalTunnel(game, x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      if (World.isInsideMap(x, y)) game.map[y][x] = TILE.FLOOR;
    }
  }

  function carveVerticalTunnel(game, y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      if (World.isInsideMap(x, y)) game.map[y][x] = TILE.FLOOR;
    }
  }

  function connectRooms(game, a, b) {
    if (chance(0.5)) {
      carveHorizontalTunnel(game, a.centerX, b.centerX, a.centerY);
      carveVerticalTunnel(game, a.centerY, b.centerY, b.centerX);
    } else {
      carveVerticalTunnel(game, a.centerY, b.centerY, a.centerX);
      carveHorizontalTunnel(game, a.centerX, b.centerX, b.centerY);
    }
  }

  function countFloors(game) {
    let count = 0;
    for (let y = 0; y < CONFIG.mapHeight; y++) {
      for (let x = 0; x < CONFIG.mapWidth; x++) if (World.isWalkable(game, x, y)) count++;
    }
    return count;
  }

  function buildFallbackMap(game) {
    game.map = GameState.createEmptyMap();
    game.roomMap = GameState.createRoomMap();
    game.rooms = [];
    const fallbackRooms = [
      World.createRoom(3, 3, 11, 7),
      World.createRoom(27, 4, 13, 7),
      World.createRoom(7, 19, 14, 7),
      World.createRoom(29, 21, 12, 6),
      World.createRoom(20, 13, 9, 5)
    ];
    for (const room of fallbackRooms) {
      const index = game.rooms.length;
      carveRoom(game, room, index);
      if (game.rooms.length > 0) connectRooms(game, game.rooms[game.rooms.length - 1], room);
      game.rooms.push(room);
    }
  }

  function tryGenerateMap(game) {
    game.map = GameState.createEmptyMap();
    game.roomMap = GameState.createRoomMap();
    game.rooms = [];
    game.debug.roomAttempts = 0;
    while (game.rooms.length < CONFIG.roomTargetCount && game.debug.roomAttempts < CONFIG.roomAttemptLimit) {
      game.debug.roomAttempts++;
      const width = randInt(CONFIG.roomMinSize, CONFIG.roomMaxSize);
      const height = randInt(CONFIG.roomMinSize, CONFIG.roomMaxSize);
      const x = randInt(1, CONFIG.mapWidth - width - 2);
      const y = randInt(1, CONFIG.mapHeight - height - 2);
      const room = World.createRoom(x, y, width, height);
      if (game.rooms.some(existing => World.roomsOverlap(room, existing))) continue;
      const index = game.rooms.length;
      carveRoom(game, room, index);
      if (game.rooms.length > 0) connectRooms(game, game.rooms[game.rooms.length - 1], room);
      game.rooms.push(room);
    }
    return game.rooms.length >= CONFIG.minRequiredRooms && countFloors(game) > 0;
  }

  function getCurrentGoal(game) {
    if (game.core.active && !game.core.acquired) return { x: game.core.x, y: game.core.y };
    return { x: game.lift.x, y: game.lift.y };
  }

  function hasPathFromPlayerToGoal(game) {
    game.debug.pathCheckCount++;
    const goal = getCurrentGoal(game);
    const queue = [{ x: game.player.x, y: game.player.y }];
    const seen = new Set([`${game.player.x},${game.player.y}`]);
    while (queue.length) {
      const current = queue.shift();
      if (current.x === goal.x && current.y === goal.y) return true;
      for (const dir of World.DIRS4) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        const key = `${nx},${ny}`;
        if (seen.has(key)) continue;
        if (!World.isWalkable(game, nx, ny)) continue;
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
    return false;
  }

  function getGoalRoom(game) {
    if (game.rooms.length <= 1) return game.rooms[0];
    let best = game.rooms[game.rooms.length - 1];
    let bestDistance = -1;
    const start = game.rooms[0];
    for (const room of game.rooms.slice(1)) {
      const distance = manhattan(start.centerX, start.centerY, room.centerX, room.centerY);
      if (distance > bestDistance) {
        best = room;
        bestDistance = distance;
      }
    }
    return best;
  }

  function placePlayer(game) {
    const startRoom = game.rooms[0];
    game.player.x = startRoom.centerX;
    game.player.y = startRoom.centerY;
    game.player.lastDir = { x: 1, y: 0 };
  }

  function safeTileInRoom(game, room) {
    const candidates = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (!World.isWalkable(game, x, y)) continue;
        if (World.isPlayerAt(game, x, y)) continue;
        candidates.push({ x, y });
      }
    }
    return candidates.length ? candidates[randInt(0, candidates.length - 1)] : { x: room.centerX, y: room.centerY };
  }

  function placeLiftOrCore(game) {
    const goalRoom = getGoalRoom(game);
    const pos = safeTileInRoom(game, goalRoom);
    game.core.active = game.depth >= CONFIG.maxDepth;
    game.core.acquired = false;
    game.lift.active = !game.core.active;
    if (game.core.active) {
      game.core.x = pos.x;
      game.core.y = pos.y;
      game.map[pos.y][pos.x] = TILE.CORE;
    } else {
      game.lift.x = pos.x;
      game.lift.y = pos.y;
      game.map[pos.y][pos.x] = TILE.LIFT;
    }
  }


  function placeBossTerminals(game) {
    game.terminals = [];
    game.disabledTerminals = 0;
    if (!FEATURES.bossTerminals || !game.core.active) return;
    const goalRoom = getGoalRoom(game);
    const preferredRooms = shuffle(game.rooms.filter(room => room !== game.rooms[0] && room !== goalRoom));
    const rooms = [...preferredRooms, goalRoom];
    for (const room of rooms) {
      if (game.terminals.length >= CONFIG.bossTerminalCount) break;
      const pos = randomFloorInRoom(game, room);
      if (!pos) continue;
      game.map[pos.y][pos.x] = TILE.TERMINAL;
      game.terminals.push({ x: pos.x, y: pos.y, active: true });
    }
    while (game.terminals.length < CONFIG.bossTerminalCount) {
      const pos = findFreeFloorTile(game, { minPlayerDistance: 6, avoidItems: true, avoidTraps: true });
      if (!pos) break;
      game.map[pos.y][pos.x] = TILE.TERMINAL;
      game.terminals.push({ x: pos.x, y: pos.y, active: true });
    }
  }

  function findFreeFloorTile(game, options = {}) {
    const minPlayerDistance = options.minPlayerDistance ?? 0;
    const avoidLift = options.avoidLift ?? true;
    const avoidCore = options.avoidCore ?? true;
    const avoidItems = options.avoidItems ?? false;
    const avoidTraps = options.avoidTraps ?? false;
    const candidates = [];
    for (let y = 1; y < CONFIG.mapHeight - 1; y++) {
      for (let x = 1; x < CONFIG.mapWidth - 1; x++) {
        if (!World.isWalkable(game, x, y)) continue;
        if (World.getTile(game, x, y) !== TILE.FLOOR && World.getTile(game, x, y) !== TILE.POLLUTION) continue;
        if (World.isPlayerAt(game, x, y)) continue;
        if (avoidLift && World.isLiftAt(game, x, y)) continue;
        if (avoidCore && World.isCoreAt(game, x, y)) continue;
        if (World.isTerminalAt(game, x, y)) continue;
        if (World.getEnemyAt(game, x, y)) continue;
        if (avoidItems && World.getItemAt(game, x, y)) continue;
        if (avoidTraps && World.getTrapAt(game, x, y)) continue;
        if (manhattan(game.player.x, game.player.y, x, y) < minPlayerDistance) continue;
        candidates.push({ x, y });
      }
    }
    return candidates.length ? candidates[randInt(0, candidates.length - 1)] : null;
  }

  function chooseWeighted(defs, predicate = () => true) {
    const entries = Object.values(defs).filter(predicate);
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return entries[0];
  }

  function addPollutionTiles(game) {
    const count = Math.min(18, 3 + game.depth * 2);
    for (let i = 0; i < count; i++) {
      const pos = findFreeFloorTile(game, { avoidItems: true, avoidTraps: true });
      if (pos) game.map[pos.y][pos.x] = TILE.POLLUTION;
    }
  }

  function validateBoundary(game) {
    let repaired = 0;
    for (let x = 0; x < CONFIG.mapWidth; x++) {
      if (game.map[0][x] !== TILE.WALL) { game.map[0][x] = TILE.WALL; repaired++; }
      if (game.map[CONFIG.mapHeight - 1][x] !== TILE.WALL) { game.map[CONFIG.mapHeight - 1][x] = TILE.WALL; repaired++; }
    }
    for (let y = 0; y < CONFIG.mapHeight; y++) {
      if (game.map[y][0] !== TILE.WALL) { game.map[y][0] = TILE.WALL; repaired++; }
      if (game.map[y][CONFIG.mapWidth - 1] !== TILE.WALL) { game.map[y][CONFIG.mapWidth - 1] = TILE.WALL; repaired++; }
    }
    game.debug.boundaryRepairCount += repaired;
  }

  function randomFloorInRoom(game, room) {
    const candidates = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (!World.isWalkable(game, x, y)) continue;
        if (World.getTile(game, x, y) !== TILE.FLOOR && World.getTile(game, x, y) !== TILE.POLLUTION) continue;
        if (World.isBlockedByEntity(game, x, y) || World.getItemAt(game, x, y) || World.getTrapAt(game, x, y)) continue;
        candidates.push({ x, y });
      }
    }
    return candidates.length ? candidates[randInt(0, candidates.length - 1)] : null;
  }

  function assignFloorEvent(game) {
    game.floorEvent = "normal";
    if (!FEATURES.floorEvents || !chance(CONFIG.floorEventChance)) return;
    const candidates = game.depth >= CONFIG.maxDepth
      ? ["security_sweep", "blackout", "pollution_leak"]
      : ["blackout", "pollution_leak", "dismantle_shift", "security_sweep", "supply_scatter", "quiet"];
    game.floorEvent = candidates[randInt(0, candidates.length - 1)] || "normal";
    game.debug.floorEventCount++;
    const def = FLOOR_EVENT_DEFS[game.floorEvent];
    if (def) {
      game.recentFloorEvents.unshift(`${def.name}: ${def.desc}`);
      game.recentFloorEvents = game.recentFloorEvents.slice(0, CONFIG.maxRecentFloorEvents);
    }
  }

  function weakenRandomWalls(game, limit = 4) {
    let changed = 0;
    const candidates = [];
    for (let y = 1; y < CONFIG.mapHeight - 1; y++) {
      for (let x = 1; x < CONFIG.mapWidth - 1; x++) {
        if (World.getTile(game, x, y) !== TILE.WALL) continue;
        if (World.DIRS4.some(d => World.getTile(game, x + d.x, y + d.y) === TILE.FLOOR)) candidates.push({ x, y });
      }
    }
    for (const pos of shuffle(candidates).slice(0, limit)) {
      game.map[pos.y][pos.x] = TILE.FLOOR;
      changed++;
    }
    return changed;
  }

  function applyFloorEvent(game) {
    if (!FEATURES.floorEvents) return;
    const event = game.floorEvent;
    if (event === "supply_scatter") {
      for (let i = 0; i < 4; i++) {
        const pos = findFreeFloorTile(game, { minPlayerDistance: 3, avoidItems: true, avoidTraps: true });
        if (pos) game.items.push({ kind: chance(0.5) ? "nutrition_block" : "identify_scanner", x: pos.x, y: pos.y });
      }
      for (let i = 0; i < 3; i++) {
        const pos = findFreeFloorTile(game, { minPlayerDistance: 4, avoidItems: true, avoidTraps: true });
        if (pos) game.traps.push({ type: chance(0.5) ? "shutter" : "alarm", x: pos.x, y: pos.y, active: true, discovered: !FEATURES.hiddenTraps });
      }
    } else if (event === "pollution_leak") {
      for (let i = 0; i < 8; i++) {
        const pos = findFreeFloorTile(game, { minPlayerDistance: 4, avoidItems: true, avoidTraps: true });
        if (pos) game.map[pos.y][pos.x] = TILE.POLLUTION;
      }
    } else if (event === "dismantle_shift") {
      weakenRandomWalls(game, 6);
    } else if (event === "security_sweep") {
      for (let i = 0; i < 2; i++) {
        const room = game.rooms[randInt(1, Math.max(1, game.rooms.length - 1))];
        if (room) addEnemyToRoom(game, room, chance(0.5) ? "hunter" : "soldier");
      }
    } else if (event === "quiet") {
      game.enemies = game.enemies.filter((_, index) => index % 2 === 0);
    }
  }

  function assignRoomEvents(game) {
    if (!FEATURES.roomEvents) return;
    const eventTypes = Object.keys(ROOM_EVENT_DEFS);
    const goalRoom = getGoalRoom(game);
    for (let i = 0; i < game.rooms.length; i++) {
      const room = game.rooms[i];
      if (i === 0 || room === goalRoom) continue;
      if (chance(CONFIG.roomEventChance)) room.event = eventTypes[randInt(0, eventTypes.length - 1)];
    }
  }

  function addItemToRoom(game, room, kind) {
    const pos = randomFloorInRoom(game, room);
    if (pos) game.items.push({ kind, x: pos.x, y: pos.y });
  }

  function addEnemyToRoom(game, room, type) {
    const pos = randomFloorInRoom(game, room);
    if (!pos) return;
    const def = ENEMY_DEFS[type] || ENEMY_DEFS.cleaner;
    const hp = def.baseHp + Math.floor(game.depth / 2);
    const attack = def.baseAttack + Math.floor(game.depth / 4);
    game.enemies.push({ type: def.type, name: def.name, glyph: def.glyph, x: pos.x, y: pos.y, hp, maxHp: hp, attack, stun: 0, state: "idle", memory: 0, lastSeen: null, carriedItem: null });
  }

  function applyRoomEvents(game) {
    if (!FEATURES.roomEvents) return;
    for (const room of game.rooms) {
      if (!room.event) continue;
      if (room.event === "supply") {
        addItemToRoom(game, room, chance(0.5) ? "scrap_parts" : "nutrition_block");
        addItemToRoom(game, room, chance(0.5) ? "battery_cell" : "water_filter");
      } else if (room.event === "polluted") {
        for (let i = 0; i < 5; i++) {
          const pos = randomFloorInRoom(game, room);
          if (pos) game.map[pos.y][pos.x] = TILE.POLLUTION;
        }
        addItemToRoom(game, room, chance(0.5) ? "detox_kit" : "scrap_parts");
      } else if (room.event === "security") {
        addEnemyToRoom(game, room, chance(0.5) ? "hunter" : "soldier");
      } else if (room.event === "storage") {
        addItemToRoom(game, room, "scrap_parts");
        addItemToRoom(game, room, chance(0.5) ? "utility_blade" : "work_armor");
      } else if (room.event === "dismantle") {
        weakenRandomWalls(game, 3);
      }
    }
  }

  function handleRoomEntry(game) {
    const roomId = game.roomMap[game.player.y]?.[game.player.x] ?? -1;
    if (roomId < 0 || roomId === game.currentRoomId) return;
    game.currentRoomId = roomId;
    const room = game.rooms[roomId];
    if (!room || !room.event || game.visitedRoomEvents[roomId]) return;
    game.visitedRoomEvents[roomId] = true;
    const def = ROOM_EVENT_DEFS[room.event];
    if (!def) return;
    game.debug.roomEventCount++;
    World.addLog(game, `${def.name}: ${def.desc}`);
    World.recordCodex(game, `room:${room.event}`, def.name, def.desc);
    if (room.event === "security") {
      for (const enemy of game.enemies) {
        if (game.roomMap[enemy.y]?.[enemy.x] === roomId) enemy.state = "chase";
      }
      World.addLog(game, "警備信号が走り、室内の機械が起動した。");
    }
  }

  function validateGeneratedState(game) {
    validateBoundary(game);
    const seenEnemies = new Set();
    game.enemies = game.enemies.filter(enemy => {
      const key = `${enemy.x},${enemy.y}`;
      if (seenEnemies.has(key)) return false;
      seenEnemies.add(key);
      return enemy.hp > 0 && World.isWalkable(game, enemy.x, enemy.y) && !World.isPlayerAt(game, enemy.x, enemy.y) && !World.isLiftAt(game, enemy.x, enemy.y) && !World.isCoreAt(game, enemy.x, enemy.y) && !World.isTerminalAt(game, enemy.x, enemy.y);
    });
    const seenItems = new Set();
    game.items = game.items.filter(item => {
      const key = `${item.x},${item.y}`;
      if (seenItems.has(key)) return false;
      seenItems.add(key);
      return World.isWalkable(game, item.x, item.y) && !World.isPlayerAt(game, item.x, item.y) && !World.isLiftAt(game, item.x, item.y) && !World.isCoreAt(game, item.x, item.y) && !World.isTerminalAt(game, item.x, item.y);
    });
    const seenTraps = new Set();
    game.traps = game.traps.filter(trap => {
      const key = `${trap.x},${trap.y}`;
      if (seenTraps.has(key)) return false;
      seenTraps.add(key);
      return trap.active && World.isWalkable(game, trap.x, trap.y) && !World.isPlayerAt(game, trap.x, trap.y) && !World.isLiftAt(game, trap.x, trap.y) && !World.isCoreAt(game, trap.x, trap.y) && !World.isTerminalAt(game, trap.x, trap.y);
    });
    return hasPathFromPlayerToGoal(game);
  }

  function generate(game) {
    game.debug.generationCount++;
    game.enemies = [];
    game.items = [];
    game.traps = [];
    game.lure = null;
    game.currentRoomId = -1;
    game.visitedRoomEvents = {};
    game.pendingExtract = false;
    game.terminals = [];
    game.disabledTerminals = 0;
    assignFloorEvent(game);
    let success = false;
    for (let attempt = 0; attempt < CONFIG.mapGenerateRetryLimit; attempt++) {
      game.debug.retryCount = attempt;
      success = tryGenerateMap(game);
      if (success) break;
    }
    if (!success) buildFallbackMap(game);
    placePlayer(game);
    placeLiftOrCore(game);
    placeBossTerminals(game);
    assignRoomEvents(game);
    addPollutionTiles(game);
    ItemSystem.placeItems(game, findFreeFloorTile, chooseWeighted);
    TrapSystem.placeTraps(game, findFreeFloorTile);
    EnemySystem.placeEnemies(game, findFreeFloorTile, chooseWeighted);
    applyRoomEvents(game);
    applyFloorEvent(game);
    game.debug.floorCount = countFloors(game);
    if (!validateGeneratedState(game)) {
      buildFallbackMap(game);
      placePlayer(game);
      placeLiftOrCore(game);
      placeBossTerminals(game);
      assignRoomEvents(game);
      ItemSystem.placeItems(game, findFreeFloorTile, chooseWeighted);
      TrapSystem.placeTraps(game, findFreeFloorTile);
      EnemySystem.placeEnemies(game, findFreeFloorTile, chooseWeighted);
      applyRoomEvents(game);
      validateGeneratedState(game);
    }
    VisibilitySystem.reset(game);
    VisibilitySystem.update(game);
  }

  return {
    generate,
    countFloors,
    findFreeFloorTile,
    chooseWeighted,
    hasPathFromPlayerToGoal,
    validateGeneratedState,
    handleRoomEntry
  };
})();
