(() => {
  "use strict";

  const BOARD = Object.freeze({ columns: 21, rows: 12, cellSize: 30 });
  const STORAGE = Object.freeze({
    scores: "monoSerpent.bestRuns.v2",
    legacyHighScore: "snake3310.highScore",
    sound: "snake3310.sound",
    language: "monoSerpent.language",
    palette: "monoSerpent.palette",
    vibration: "monoSerpent.vibration",
    mode: "monoSerpent.mode",
    map: "monoSerpent.map"
  });
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    right: Object.freeze({ x: 1, y: 0 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 })
  });
  const OPPOSITE = Object.freeze({ up: "down", right: "left", down: "up", left: "right" });
  const MAP_KEYS = Object.freeze(["gates", "slalom", "cross"]);
  const BONUS_INTERVAL = 65;
  const BONUS_LIFETIME = 36;
  const PALETTES = Object.freeze({
    sage: Object.freeze({ lcd: "#b7c99d", flash: "#c8d7ae", head: "#172d21", body: "#253b2d", food: "#294431", foodLight: "#6a835d", detail: "#93a980", obstacle: "#506949" }),
    moss: Object.freeze({ lcd: "#b2c58e", flash: "#c5d5a6", head: "#1b3020", body: "#2a4028", food: "#304a2c", foodLight: "#71885a", detail: "#8ea276", obstacle: "#4e6940" }),
    gray: Object.freeze({ lcd: "#c1c9b7", flash: "#d5ddca", head: "#222d25", body: "#303d33", food: "#354638", foodLight: "#7e8a76", detail: "#97a28d", obstacle: "#667362" }),
    amber: Object.freeze({ lcd: "#d0c99d", flash: "#e0d9ae", head: "#352f1c", body: "#494126", food: "#524829", foodLight: "#8d8050", detail: "#aaa06c", obstacle: "#796b3c" })
  });

  const locale = window.MonoSerpentLocale;
  const canvas = document.querySelector("#gameBoard");
  const context = canvas?.getContext("2d", { alpha: false });
  const ui = {
    score: document.querySelector("#scoreValue"),
    highScore: document.querySelector("#highScoreValue"),
    level: document.querySelector("#levelValue"),
    status: document.querySelector("#statusText"),
    overlay: document.querySelector("#gameOverlay"),
    overlayTitle: document.querySelector("#overlayTitle"),
    overlayText: document.querySelector("#overlayText"),
    announcer: document.querySelector("#announcer"),
    startButton: document.querySelector("#startButton"),
    pauseButton: document.querySelector("#pauseButton"),
    dpadPause: document.querySelector("#dpadPause"),
    soundButton: document.querySelector("#soundButton"),
    installButton: document.querySelector("#installButton"),
    modeSelect: document.querySelector("#modeSelect"),
    mapSelect: document.querySelector("#mapSelect"),
    mapPicker: document.querySelector("#mapPicker"),
    languageSelect: document.querySelector("#languageSelect"),
    paletteSelect: document.querySelector("#paletteSelect"),
    vibrationToggle: document.querySelector("#vibrationToggle"),
    bestRuns: document.querySelector("#bestRunsList")
  };

  if (!canvas || !context || !locale) {
    if (ui.status) ui.status.textContent = "GAME BOARD UNAVAILABLE";
    if (ui.announcer) ui.announcer.textContent = "This browser could not load the game.";
    if (ui.startButton) ui.startButton.disabled = true;
    return;
  }

  const game = {
    state: "ready",
    snake: [],
    direction: "right",
    directionQueue: [],
    food: null,
    bonusFood: null,
    bonusTicks: 0,
    growthPending: 0,
    obstacles: new Set(),
    obstacleMap: "gates",
    mapChoice: readChoice(STORAGE.map, "random", ["random", ...MAP_KEYS]),
    mode: readChoice(STORAGE.mode, "endless", ["endless", "obstacle"]),
    score: 0,
    bestRuns: loadBestRuns(),
    highScore: 0,
    foodCount: 0,
    level: 1,
    steps: 0,
    endReason: "collision",
    soundEnabled: readValue(STORAGE.sound, "on") !== "off",
    vibrationEnabled: readValue(STORAGE.vibration, "off") === "on",
    language: validLanguage(readValue(STORAGE.language, "en")),
    palette: readChoice(STORAGE.palette, "sage", Object.keys(PALETTES)),
    soundContext: null,
    accumulator: 0,
    previousFrame: 0,
    flashUntil: 0
  };

  game.highScore = bestScoreFor(game.mode);
  context.imageSmoothingEnabled = false;
  canvas.width = BOARD.columns * BOARD.cellSize;
  canvas.height = BOARD.rows * BOARD.cellSize;
  populateLanguageOptions();
  resetBoard("right");
  applyPalette();
  applyTranslations();
  updateUI();
  renderBestRuns();
  requestAnimationFrame(frame);

  function readValue(key, fallback) {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function readInteger(key) {
    try {
      const value = Number.parseInt(window.localStorage.getItem(key) || "0", 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function saveValue(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // Local storage is optional; the current session still works.
    }
  }

  function validLanguage(code) {
    return locale.languages.some((language) => language.code === code) ? code : "en";
  }

  function readChoice(key, fallback, allowed) {
    const choice = readValue(key, fallback);
    return allowed.includes(choice) ? choice : fallback;
  }

  function loadBestRuns() {
    const empty = { endless: [], obstacle: [] };
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE.scores) || "null");
      if (stored && typeof stored === "object") {
        for (const mode of Object.keys(empty)) {
          if (Array.isArray(stored[mode])) {
            empty[mode] = stored[mode]
              .filter((run) => run && Number.isFinite(run.score) && run.score > 0)
              .map((run) => ({
                score: Math.floor(run.score),
                level: Math.max(1, Math.floor(run.level || 1)),
                foodCount: Math.max(0, Math.floor(run.foodCount || 0)),
                playedAt: Number(run.playedAt) || 0
              }))
              .sort((a, b) => b.score - a.score || b.playedAt - a.playedAt)
              .slice(0, 5);
          }
        }
      }
    } catch {
      // A corrupt or blocked score file should not prevent a new run.
    }
    if (!empty.endless.length && readInteger(STORAGE.legacyHighScore) > 0) {
      empty.endless = [{ score: readInteger(STORAGE.legacyHighScore), level: 1, foodCount: 0, playedAt: 0 }];
    }
    return empty;
  }

  function persistBestRuns() {
    try {
      window.localStorage.setItem(STORAGE.scores, JSON.stringify(game.bestRuns));
    } catch {
      // Scores remain available in memory for this session.
    }
  }

  function bestScoreFor(mode) {
    const saved = game.bestRuns[mode]?.[0]?.score || 0;
    return Math.max(saved, mode === "endless" ? readInteger(STORAGE.legacyHighScore) : 0);
  }

  function recordCompletedRun() {
    if (game.score <= 0) return;
    const record = { score: game.score, level: game.level, foodCount: game.foodCount, playedAt: Date.now() };
    game.bestRuns[game.mode] = [...game.bestRuns[game.mode], record]
      .sort((a, b) => b.score - a.score || b.playedAt - a.playedAt)
      .slice(0, 5);
    persistBestRuns();
    game.highScore = bestScoreFor(game.mode);
  }

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function chooseObstacleMap() {
    if (game.mapChoice !== "random") return game.mapChoice;
    return MAP_KEYS[Math.floor(Math.random() * MAP_KEYS.length)];
  }

  function createObstacles(mapName) {
    const cells = new Set();
    const add = (x, y) => cells.add(keyOf(x, y));
    if (mapName === "gates") {
      for (let y = 2; y <= 9; y += 1) {
        if (y !== 4 && y !== 7) {
          add(5, y);
          add(15, y);
        }
      }
    } else if (mapName === "slalom") {
      for (let x = 2; x <= 8; x += 1) if (x !== 5) add(x, 3);
      for (let x = 12; x <= 18; x += 1) if (x !== 15) add(x, 6);
      for (let x = 2; x <= 8; x += 1) if (x !== 5) add(x, 9);
    } else {
      for (let x = 3; x <= 17; x += 1) if (x !== 10) {
        add(x, 2);
        add(x, 9);
      }
      for (let y = 4; y <= 7; y += 1) if (y !== 6) {
        add(3, y);
        add(17, y);
      }
    }
    return cells;
  }

  function resetBoard(directionName) {
    const direction = DIRECTIONS[directionName] ? directionName : "right";
    const vector = DIRECTIONS[direction];
    const head = { x: Math.floor(BOARD.columns / 2), y: Math.floor(BOARD.rows / 2) };
    game.direction = direction;
    game.directionQueue.length = 0;
    game.snake = [
      head,
      { x: head.x - vector.x, y: head.y - vector.y },
      { x: head.x - vector.x * 2, y: head.y - vector.y * 2 }
    ];
    game.obstacleMap = chooseObstacleMap();
    game.obstacles = game.mode === "obstacle" ? createObstacles(game.obstacleMap) : new Set();
    game.food = null;
    game.bonusFood = null;
    game.bonusTicks = 0;
    game.growthPending = 0;
    game.score = 0;
    game.foodCount = 0;
    game.level = 1;
    game.steps = 0;
    game.accumulator = 0;
    game.food = spawnFood();
  }

  function spawnFood(isBonus = false) {
    const occupied = new Set(game.snake.map((segment) => keyOf(segment.x, segment.y)));
    game.obstacles.forEach((cell) => occupied.add(cell));
    if (game.bonusFood && !isBonus) occupied.add(keyOf(game.bonusFood.x, game.bonusFood.y));
    if (game.food) occupied.add(keyOf(game.food.x, game.food.y));
    const freeCells = [];
    for (let y = 0; y < BOARD.rows; y += 1) {
      for (let x = 0; x < BOARD.columns; x += 1) {
        if (!occupied.has(keyOf(x, y))) freeCells.push({ x, y });
      }
    }
    return freeCells.length ? freeCells[Math.floor(Math.random() * freeCells.length)] : null;
  }

  function startGame(directionName = game.mode === "obstacle" ? "up" : "right") {
    resetBoard(directionName);
    game.highScore = bestScoreFor(game.mode);
    game.state = "playing";
    game.endReason = "collision";
    game.previousFrame = 0;
    updateUI();
    playTone(540, 0.045);
    announce("startAnnouncement");
  }

  function pauseGame(reason = "manual") {
    if (game.state !== "playing") return;
    game.state = "paused";
    game.directionQueue.length = 0;
    game.accumulator = 0;
    game.pauseReason = reason;
    updateUI();
    announce(reason === "focus" ? "focusPauseAnnouncement" : "pauseAnnouncement");
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    game.state = "playing";
    game.accumulator = 0;
    game.previousFrame = 0;
    updateUI();
    playTone(500, 0.04);
    announce("resumeAnnouncement");
  }

  function finishGame(won = false, reason = "collision") {
    game.state = "gameover";
    game.endReason = won ? "won" : reason;
    game.directionQueue.length = 0;
    game.accumulator = 0;
    recordCompletedRun();
    updateUI();
    renderBestRuns();
    if (!won) {
      playGameOverSound();
      vibrate([45, 35, 70]);
      announce(reason === "obstacle" ? "obstacleAnnouncement" : "gameOverAnnouncement", { score: formatScore(game.score) });
    } else {
      playTone(880, 0.12);
      announce("winAnnouncement", { score: formatScore(game.score) });
    }
  }

  function handleDirection(directionName) {
    if (!DIRECTIONS[directionName]) return;
    if (game.state === "ready" || game.state === "gameover") {
      startGame(directionName);
      return;
    }
    if (game.state !== "playing") return;

    const latestDirection = game.directionQueue.at(-1) || game.direction;
    if (directionName === OPPOSITE[latestDirection] || directionName === latestDirection) return;
    if (game.directionQueue.length < 2) game.directionQueue.push(directionName);
  }

  function togglePause() {
    if (game.state === "playing") pauseGame();
    else if (game.state === "paused") resumeGame();
    else if (game.state === "ready" || game.state === "gameover") startGame();
  }

  function currentStepMs() {
    return Math.max(82, 175 - (game.level - 1) * 12);
  }

  function step() {
    game.steps += 1;
    if (game.bonusFood) {
      game.bonusTicks -= 1;
      if (game.bonusTicks <= 0) {
        game.bonusFood = null;
        updateUI();
      }
    }

    if (game.directionQueue.length) {
      const nextDirection = game.directionQueue.shift();
      if (nextDirection !== OPPOSITE[game.direction]) game.direction = nextDirection;
    }

    const vector = DIRECTIONS[game.direction];
    const head = game.snake[0];
    const nextHead = {
      x: (head.x + vector.x + BOARD.columns) % BOARD.columns,
      y: (head.y + vector.y + BOARD.rows) % BOARD.rows
    };
    const eatsRegular = game.food && nextHead.x === game.food.x && nextHead.y === game.food.y;
    const eatsBonus = game.bonusFood && nextHead.x === game.bonusFood.x && nextHead.y === game.bonusFood.y;
    const isEating = Boolean(eatsRegular || eatsBonus);
    const tailWillStay = isEating || game.growthPending > 0;
    const collisionBody = tailWillStay ? game.snake : game.snake.slice(0, -1);
    const hitsSelf = collisionBody.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
    const hitsObstacle = game.obstacles.has(keyOf(nextHead.x, nextHead.y));
    if (hitsSelf || hitsObstacle) {
      finishGame(false, hitsObstacle ? "obstacle" : "collision");
      return;
    }

    game.snake.unshift(nextHead);
    if (!isEating) {
      if (game.growthPending > 0) game.growthPending -= 1;
      else game.snake.pop();
    }

    if (eatsRegular || eatsBonus) {
      game.score += eatsBonus ? 30 : 10;
      game.foodCount += 1;
      game.level = Math.floor(game.foodCount / 5) + 1;
      game.flashUntil = performance.now() + 85;
      if (game.score > game.highScore) {
        game.highScore = game.score;
        if (game.mode === "endless") saveValue(STORAGE.legacyHighScore, game.highScore);
      }

      if (eatsRegular) {
        game.food = null;
        game.food = spawnFood();
        if (!game.food) {
          finishGame(true);
          return;
        }
      } else {
        game.bonusFood = null;
        game.growthPending += 1;
      }

      playTone(eatsBonus ? 920 : 760, 0.055);
      vibrate(eatsBonus ? [24, 22, 36] : 24);
      updateUI();
      announce(eatsBonus ? "bonusAnnouncement" : "foodAnnouncement", { score: formatScore(game.score) });
    }

    if (!game.bonusFood && game.steps % BONUS_INTERVAL === 0) {
      game.bonusFood = spawnFood(true);
      if (game.bonusFood) {
        game.bonusTicks = BONUS_LIFETIME;
        updateUI();
        announce("bonusFoodLabel");
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (game.state !== "playing") {
      game.previousFrame = now;
      game.accumulator = 0;
      draw(now);
      return;
    }

    if (!game.previousFrame) game.previousFrame = now;
    const elapsed = Math.min(now - game.previousFrame, 100);
    game.previousFrame = now;
    game.accumulator += elapsed;
    while (game.accumulator >= currentStepMs() && game.state === "playing") {
      game.accumulator -= currentStepMs();
      step();
    }
    draw(now);
  }

  function draw(now = 0) {
    const cell = BOARD.cellSize;
    const colors = PALETTES[game.palette];
    context.fillStyle = now < game.flashUntil ? colors.flash : colors.lcd;
    context.fillRect(0, 0, canvas.width, canvas.height);

    game.obstacles.forEach((coordinate) => {
      const [x, y] = coordinate.split(",").map(Number);
      context.fillStyle = colors.obstacle;
      context.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
    });
    if (game.food) drawFood(game.food.x * cell, game.food.y * cell, false);
    if (game.bonusFood) drawFood(game.bonusFood.x * cell, game.bonusFood.y * cell, true);
    game.snake.forEach((segment, index) => {
      const inset = index === 0 ? 2 : 3;
      context.fillStyle = index === 0 ? colors.head : colors.body;
      context.fillRect(segment.x * cell + inset, segment.y * cell + inset, cell - inset * 2, cell - inset * 2);
      if (index === 0) drawHeadMark(segment.x * cell, segment.y * cell, colors.detail);
    });
  }

  function drawFood(x, y, isBonus) {
    const pixel = isBonus ? 4 : 5;
    const pattern = isBonus
      ? ["00100", "01110", "11111", "01110", "00100"]
      : ["00100", "11110", "01110", "00100"];
    const startX = isBonus ? 5 : 5;
    const startY = isBonus ? 5 : 5;
    const colors = PALETTES[game.palette];
    context.fillStyle = colors.food;
    pattern.forEach((row, rowIndex) => {
      [...row].forEach((bit, columnIndex) => {
        if (bit === "1") context.fillRect(x + startX + columnIndex * pixel, y + startY + rowIndex * pixel, pixel, pixel);
      });
    });
    if (!isBonus) {
      context.fillRect(x + 21, y + 3, 4, 6);
      context.fillStyle = colors.foodLight;
      context.fillRect(x + 10, y + 10, 5, 5);
    }
  }

  function drawHeadMark(x, y, color) {
    const dot = 4;
    let marks;
    if (game.direction === "right") marks = [[21, 9], [21, 19]];
    else if (game.direction === "left") marks = [[5, 9], [5, 19]];
    else if (game.direction === "up") marks = [[9, 5], [19, 5]];
    else marks = [[9, 21], [19, 21]];
    context.fillStyle = color;
    marks.forEach(([offsetX, offsetY]) => context.fillRect(x + offsetX, y + offsetY, dot, dot));
  }

  function t(key, values = {}) {
    return locale.translate(game.language, key, values);
  }

  function populateLanguageOptions() {
    ui.languageSelect.replaceChildren();
    locale.languages.forEach((language) => {
      const option = document.createElement("option");
      option.value = language.code;
      option.textContent = language.name;
      ui.languageSelect.append(option);
    });
  }

  function applyTranslations() {
    const language = locale.languages.find((item) => item.code === game.language) || locale.languages[0];
    document.documentElement.lang = language.locale;
    document.documentElement.dir = language.direction;
    ui.languageSelect.value = game.language;
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    ui.score.setAttribute("aria-label", t("score"));
    ui.highScore.setAttribute("aria-label", t("best"));
    ui.level.setAttribute("aria-label", t("level"));
    ui.bestRuns.setAttribute("aria-label", t("bestRuns"));
    ui.modeSelect.setAttribute("aria-label", t("gameMode"));
    ui.mapSelect.setAttribute("aria-label", t("map"));
    ui.paletteSelect.setAttribute("aria-label", t("lcdPalette"));
    ui.vibrationToggle.setAttribute("aria-label", t("vibration"));
    canvas.setAttribute("aria-label", `${t("gameMode")}. ${t("controlHelp")}${game.bonusFood ? `. ${t("bonusFoodLabel")}` : ""}`);
    const region = document.querySelector(".handset");
    if (region) region.setAttribute("aria-label", "Mono Serpent");
    updateUI();
    renderBestRuns();
  }

  function applyPalette() {
    document.documentElement.dataset.lcd = game.palette;
    ui.paletteSelect.value = game.palette;
    draw();
  }

  function updateUI() {
    ui.score.textContent = formatScore(game.score);
    ui.highScore.textContent = formatScore(game.highScore);
    ui.level.textContent = String(game.level).padStart(2, "0");
    ui.soundButton.textContent = t(game.soundEnabled ? "soundOn" : "soundOff");
    ui.soundButton.setAttribute("aria-pressed", String(game.soundEnabled));
    ui.soundButton.setAttribute("aria-label", t(game.soundEnabled ? "turnSoundOff" : "turnSoundOn"));
    ui.vibrationToggle.checked = game.vibrationEnabled;
    ui.modeSelect.value = game.mode;
    ui.mapSelect.value = game.mapChoice;
    ui.mapPicker.hidden = game.mode !== "obstacle";

    const copy = {
      ready: { status: "statusReady", title: "overlayReady", text: "pressStart" },
      playing: { status: "statusRunning", title: "", text: "" },
      paused: { status: "statusPaused", title: "overlayPaused", text: game.pauseReason === "focus" ? "pausedFocus" : "pausedResume" },
      gameover: game.endReason === "won"
        ? { status: "statusWon", title: "overlayWon", text: "summaryWin" }
        : { status: "statusGameOver", title: "overlayGameOver", text: "summaryGameOver" }
    }[game.state];

    ui.status.textContent = t(copy.status);
    ui.overlayTitle.textContent = t(copy.title);
    ui.overlayText.textContent = copy.text.startsWith("summary")
      ? t(copy.text, { score: formatScore(game.score), best: formatScore(game.highScore) })
      : t(copy.text);
    ui.overlay.dataset.state = game.state;
    ui.overlay.hidden = game.state === "playing";
    ui.overlay.setAttribute("aria-hidden", String(game.state === "playing"));
    ui.startButton.textContent = t(game.state === "paused" ? "resume" : game.state === "gameover" ? "restart" : "startGame");
    ui.startButton.setAttribute("aria-label", t(game.state === "paused" ? "resume" : game.state === "gameover" ? "restart" : "startGame"));
    ui.pauseButton.textContent = t(game.state === "paused" ? "resume" : "pause");
    ui.pauseButton.setAttribute("aria-label", t(game.state === "paused" ? "resume" : "pause"));
    ui.pauseButton.disabled = game.state === "ready" || game.state === "gameover";
    ui.dpadPause.setAttribute("aria-label", t("pauseOrResume"));
    ui.dpadPause.disabled = game.state === "ready" || game.state === "gameover";
    ui.modeSelect.disabled = game.state === "playing" || game.state === "paused";
    ui.mapSelect.disabled = game.state === "playing" || game.state === "paused";
  }

  function renderBestRuns() {
    ui.bestRuns.replaceChildren();
    const records = game.bestRuns[game.mode];
    if (!records.length) {
      const empty = document.createElement("li");
      empty.textContent = t("noRuns");
      ui.bestRuns.append(empty);
      return;
    }
    records.forEach((record) => {
      const item = document.createElement("li");
      item.textContent = t("bestRunRow", {
        score: formatScore(record.score),
        level: String(record.level).padStart(2, "0"),
        mode: t(game.mode === "endless" ? "modeEndless" : "modeObstacles")
      });
      ui.bestRuns.append(item);
    });
  }

  function formatScore(value) {
    return String(value).padStart(5, "0");
  }

  function announce(key, values = {}) {
    ui.announcer.textContent = "";
    window.setTimeout(() => { ui.announcer.textContent = t(key, values); }, 15);
  }

  function playTone(frequency, duration) {
    if (!game.soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!game.soundContext) game.soundContext = new Audio();
      const audio = game.soundContext;
      if (audio.state === "suspended") {
        audio.resume().then(() => {
          if (game.soundEnabled && audio.state === "running") playTone(frequency, duration);
        }).catch(() => {});
        return;
      }
      if (audio.state !== "running") return;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
      gain.gain.setValueAtTime(0.045, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch {
      // Audio is optional and browser policy can vary.
    }
  }

  function playGameOverSound() {
    playTone(420, 0.09);
    window.setTimeout(() => playTone(300, 0.13), 105);
  }

  function vibrate(pattern) {
    if (!game.vibrationEnabled) return;
    try {
      window.navigator.vibrate?.(pattern);
    } catch {
      // Unsupported vibration hardware is a normal case.
    }
  }

  function activateStart() {
    if (game.state === "paused") resumeGame();
    else if (game.state !== "playing") startGame();
  }

  ui.startButton.addEventListener("click", activateStart);
  ui.pauseButton.addEventListener("click", togglePause);
  ui.dpadPause.addEventListener("click", togglePause);
  ui.soundButton.addEventListener("click", () => {
    game.soundEnabled = !game.soundEnabled;
    saveValue(STORAGE.sound, game.soundEnabled ? "on" : "off");
    updateUI();
    if (game.soundEnabled) playTone(620, 0.04);
  });

  ui.modeSelect.addEventListener("change", () => {
    if (game.state === "playing" || game.state === "paused") return;
    game.mode = ui.modeSelect.value === "obstacle" ? "obstacle" : "endless";
    game.state = "ready";
    resetBoard("right");
    game.highScore = bestScoreFor(game.mode);
    saveValue(STORAGE.mode, game.mode);
    updateUI();
    renderBestRuns();
    draw();
  });

  ui.mapSelect.addEventListener("change", () => {
    game.mapChoice = readChoiceFromSelect(ui.mapSelect, ["random", ...MAP_KEYS], "random");
    saveValue(STORAGE.map, game.mapChoice);
    if (game.state !== "playing" && game.state !== "paused") {
      game.state = "ready";
      resetBoard("right");
      updateUI();
      draw();
    }
  });

  ui.languageSelect.addEventListener("change", () => {
    game.language = validLanguage(ui.languageSelect.value);
    saveValue(STORAGE.language, game.language);
    applyTranslations();
  });

  ui.paletteSelect.addEventListener("change", () => {
    game.palette = readChoiceFromSelect(ui.paletteSelect, Object.keys(PALETTES), "sage");
    saveValue(STORAGE.palette, game.palette);
    applyPalette();
  });

  ui.vibrationToggle.addEventListener("change", () => {
    game.vibrationEnabled = ui.vibrationToggle.checked;
    saveValue(STORAGE.vibration, game.vibrationEnabled ? "on" : "off");
    vibrate(14);
  });

  function readChoiceFromSelect(select, allowed, fallback) {
    return allowed.includes(select.value) ? select.value : fallback;
  }

  document.querySelectorAll(".direction-button").forEach((button) => {
    const move = () => handleDirection(button.dataset.direction);
    button.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      move();
    });
    button.addEventListener("click", (event) => {
      if (event.detail === 0) move();
    });
  });

  let swipeStart = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    swipeStart = { x: event.clientX, y: event.clientY };
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!swipeStart) return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
    handleDirection(Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? "right" : "left")
      : (deltaY > 0 ? "down" : "up"));
  });
  canvas.addEventListener("pointercancel", () => { swipeStart = null; });

  function isTextControl(target) {
    return Boolean(target?.closest?.("input, select, textarea, a, [contenteditable='true']"));
  }

  function isActionButton(target) {
    return Boolean(target?.closest?.("button"));
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const keyDirections = {
      arrowup: "up", w: "up",
      arrowright: "right", d: "right",
      arrowdown: "down", s: "down",
      arrowleft: "left", a: "left"
    };
    if (keyDirections[key]) {
      if (isTextControl(event.target)) return;
      event.preventDefault();
      handleDirection(keyDirections[key]);
      return;
    }
    if ((key === " " || key === "p") && !isTextControl(event.target) && (key !== " " || !isActionButton(event.target))) {
      event.preventDefault();
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
      return;
    }
    if (key === "enter" && !isTextControl(event.target) && !isActionButton(event.target) && (game.state === "ready" || game.state === "gameover" || game.state === "paused")) {
      event.preventDefault();
      activateStart();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame("focus");
  });
  window.addEventListener("blur", () => pauseGame("focus"));

  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    ui.installButton.hidden = false;
  });
  ui.installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    ui.installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    ui.installButton.hidden = true;
  });

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The game remains usable if offline caching is unavailable.
    });
  }
})();
