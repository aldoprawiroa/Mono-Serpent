(() => {
  "use strict";

  const BOARD = Object.freeze({ columns: 21, rows: 12, cellSize: 30 });
  const STORAGE = Object.freeze({ highScore: "snake3310.highScore", sound: "snake3310.sound" });
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    right: Object.freeze({ x: 1, y: 0 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 })
  });
  const OPPOSITE = Object.freeze({ up: "down", right: "left", down: "up", left: "right" });
  const canvas = document.querySelector("#gameBoard");
  const context = canvas.getContext("2d", { alpha: false });
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
    soundButton: document.querySelector("#soundButton")
  };

  const game = {
    state: "ready",
    snake: [],
    direction: "right",
    directionQueue: [],
    food: null,
    score: 0,
    highScore: readInteger(STORAGE.highScore),
    foodCount: 0,
    level: 1,
    endReason: "collision",
    soundEnabled: readSoundPreference(),
    soundContext: null,
    accumulator: 0,
    previousFrame: 0,
    flashUntil: 0
  };

  if (!context) {
    ui.status.textContent = "CANVAS NOT AVAILABLE";
    ui.announcer.textContent = "This browser could not create the game board.";
    ui.startButton.disabled = true;
    return;
  }

  context.imageSmoothingEnabled = false;
  canvas.width = BOARD.columns * BOARD.cellSize;
  canvas.height = BOARD.rows * BOARD.cellSize;
  resetBoard("right");
  updateUI();
  requestAnimationFrame(frame);

  function readInteger(key) {
    try {
      const value = Number.parseInt(window.localStorage.getItem(key) || "0", 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function readSoundPreference() {
    try {
      return window.localStorage.getItem(STORAGE.sound) !== "off";
    } catch {
      return true;
    }
  }

  function saveValue(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // The game remains playable if storage is blocked or full.
    }
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
    game.food = spawnFood();
    game.score = 0;
    game.foodCount = 0;
    game.level = 1;
    game.accumulator = 0;
  }

  function spawnFood() {
    const occupied = new Set(game.snake.map((segment) => `${segment.x},${segment.y}`));
    const freeCells = [];
    for (let y = 0; y < BOARD.rows; y += 1) {
      for (let x = 0; x < BOARD.columns; x += 1) {
        if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
      }
    }
    return freeCells.length ? freeCells[Math.floor(Math.random() * freeCells.length)] : null;
  }

  function startGame(directionName = "right") {
    resetBoard(directionName);
    game.state = "playing";
    game.endReason = "collision";
    game.previousFrame = 0;
    updateUI();
    playTone(540, 0.045);
    announce("Game started. Use the direction controls to move.");
  }

  function pauseGame(reason = "manual") {
    if (game.state !== "playing") return;
    game.state = "paused";
    game.directionQueue.length = 0;
    game.accumulator = 0;
    game.pauseReason = reason;
    updateUI();
    announce(reason === "focus" ? "Game paused because the page lost focus." : "Game paused.");
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    game.state = "playing";
    game.accumulator = 0;
    game.previousFrame = 0;
    updateUI();
    playTone(500, 0.04);
    announce("Game resumed.");
  }

  function finishGame(won = false) {
    game.state = "gameover";
    game.endReason = won ? "won" : "collision";
    game.directionQueue.length = 0;
    game.accumulator = 0;
    updateUI();
    if (!won) playGameOverSound();
    announce(won ? `Board cleared. Final score ${game.score}.` : `Game over. Final score ${game.score}.`);
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
    const isEating = game.food && nextHead.x === game.food.x && nextHead.y === game.food.y;
    const collisionBody = isEating ? game.snake : game.snake.slice(0, -1);
    if (collisionBody.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
      finishGame(false);
      return;
    }

    game.snake.unshift(nextHead);
    if (isEating) {
      game.score += 10;
      game.foodCount += 1;
      game.level = Math.floor(game.foodCount / 5) + 1;
      game.flashUntil = performance.now() + 85;
      if (game.score > game.highScore) {
        game.highScore = game.score;
        saveValue(STORAGE.highScore, game.highScore);
      }
      playTone(760, 0.055);
      game.food = spawnFood();
      if (!game.food) {
        finishGame(true);
        return;
      }
      updateUI();
      announce(`Food eaten. Score ${game.score}. Level ${game.level}.`);
    } else {
      game.snake.pop();
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
    context.fillStyle = now < game.flashUntil ? "#c8d7ae" : "#b7c99d";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (game.food) drawFood(game.food.x * cell, game.food.y * cell);
    game.snake.forEach((segment, index) => {
      const inset = index === 0 ? 2 : 3;
      context.fillStyle = index === 0 ? "#172d21" : "#253b2d";
      context.fillRect(segment.x * cell + inset, segment.y * cell + inset, cell - inset * 2, cell - inset * 2);
      if (index === 0) drawHeadMark(segment.x * cell, segment.y * cell);
    });
  }

  function drawFood(x, y) {
    const pixel = 5;
    const pattern = ["00100", "11110", "01110", "00100"];
    context.fillStyle = "#294431";
    pattern.forEach((row, rowIndex) => {
      [...row].forEach((bit, columnIndex) => {
        if (bit === "1") context.fillRect(x + 5 + columnIndex * pixel, y + 5 + rowIndex * pixel, pixel, pixel);
      });
    });
    context.fillRect(x + 21, y + 3, 4, 6);
    context.fillStyle = "#6a835d";
    context.fillRect(x + 10, y + 10, 5, 5);
  }

  function drawHeadMark(x, y) {
    const dot = 4;
    let marks;
    if (game.direction === "right") marks = [[21, 9], [21, 19]];
    else if (game.direction === "left") marks = [[5, 9], [5, 19]];
    else if (game.direction === "up") marks = [[9, 5], [19, 5]];
    else marks = [[9, 21], [19, 21]];
    context.fillStyle = "#93a980";
    marks.forEach(([offsetX, offsetY]) => context.fillRect(x + offsetX, y + offsetY, dot, dot));
  }

  function updateUI() {
    ui.score.textContent = formatScore(game.score);
    ui.highScore.textContent = formatScore(game.highScore);
    ui.level.textContent = String(game.level).padStart(2, "0");
    ui.soundButton.textContent = game.soundEnabled ? "SOUND ON" : "SOUND OFF";
    ui.soundButton.setAttribute("aria-pressed", String(game.soundEnabled));
    ui.soundButton.setAttribute("aria-label", game.soundEnabled ? "Turn sound off" : "Turn sound on");

    const copy = {
      ready: { status: "PRESS START", title: "MONO SERPENT", text: "PRESS START" },
      playing: { status: "RUNNING", title: "", text: "" },
      paused: { status: "PAUSED", title: "PAUSED", text: game.pauseReason === "focus" ? "PAGE LOST FOCUS · TAP RESUME" : "PRESS SPACE OR RESUME" },
      gameover: game.endReason === "won"
        ? { status: "BOARD CLEARED", title: "YOU WIN", text: `SCORE ${formatScore(game.score)} · HI ${formatScore(game.highScore)}` }
        : { status: "GAME OVER", title: "GAME OVER", text: `SCORE ${formatScore(game.score)} · HI ${formatScore(game.highScore)}` }
    }[game.state];

    ui.status.textContent = copy.status;
    ui.overlayTitle.textContent = copy.title;
    ui.overlayText.textContent = copy.text;
    ui.overlay.dataset.state = game.state;
    ui.overlay.hidden = game.state === "playing";
    ui.startButton.textContent = game.state === "paused" ? "RESUME" : game.state === "gameover" ? "RESTART" : "START GAME";
    ui.startButton.setAttribute("aria-label", game.state === "paused" ? "Resume game" : game.state === "gameover" ? "Restart game" : "Start game");
    ui.pauseButton.textContent = game.state === "paused" ? "RESUME" : "PAUSE";
    ui.pauseButton.setAttribute("aria-label", game.state === "paused" ? "Resume game" : "Pause game");
    ui.pauseButton.disabled = game.state === "ready" || game.state === "gameover";
    ui.dpadPause.setAttribute("aria-label", game.state === "paused" ? "Resume game" : "Pause game");
    ui.dpadPause.disabled = game.state === "ready" || game.state === "gameover";
  }

  function formatScore(value) {
    return String(value).padStart(5, "0");
  }

  function announce(message) {
    ui.announcer.textContent = "";
    window.setTimeout(() => { ui.announcer.textContent = message; }, 15);
  }

  function playTone(frequency, duration) {
    if (!game.soundEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!game.soundContext) game.soundContext = new Audio();
      const audio = game.soundContext;
      if (audio.state === "suspended") audio.resume().catch(() => {});
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
      // Audio is optional; browser policies and missing devices must not stop play.
    }
  }

  function playGameOverSound() {
    playTone(420, 0.09);
    window.setTimeout(() => playTone(300, 0.13), 105);
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

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const keyDirections = {
      arrowup: "up", w: "up",
      arrowright: "right", d: "right",
      arrowdown: "down", s: "down",
      arrowleft: "left", a: "left"
    };
    if (keyDirections[key]) {
      event.preventDefault();
      handleDirection(keyDirections[key]);
      return;
    }
    if (key === " " || key === "p") {
      event.preventDefault();
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
      return;
    }
    if (key === "enter" && !event.target?.closest?.("button") && (game.state === "ready" || game.state === "gameover" || game.state === "paused")) {
      event.preventDefault();
      activateStart();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame("focus");
  });
  window.addEventListener("blur", () => pauseGame("focus"));
})();
