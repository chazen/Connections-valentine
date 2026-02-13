/* ============================================
   Connections - Valentine's Day Edition
   Game Logic
   ============================================ */

const GROUPS = [
  {
    name: "Maggie's Valentines Gifts",
    words: ["ROSES", "ELMS", "BRACELETS", "BALLOONS"],
    color: "yellow",
    difficulty: 0,
  },
  {
    name: "Maggie's Favorite Things",
    words: ["FOOTBALL", "MASSAGES", "SLEEPING", "HOLIDAYS"],
    color: "green",
    difficulty: 1,
  },
  {
    name: "Love ___",
    words: ["LETTER", "BIRD", "SICK", "STRUCK"],
    color: "blue",
    difficulty: 2,
  },
  {
    name: "Colors of Maggie's Favorite Teams",
    words: ["PURPLE", "BLUE", "RED", "BLACK"],
    color: "purple",
    difficulty: 3,
  },
];

const MAX_MISTAKES = 4;
const MAX_SELECTED = 4;

let selectedWords = [];
let solvedGroups = [];
let mistakes = 0;
let remainingWords = [];
let guessHistory = [];
let isAnimating = false;

// ============================================
// Initialization
// ============================================

function init() {
  remainingWords = GROUPS.flatMap((g) => g.words);
  shuffleArray(remainingWords);
  selectedWords = [];
  solvedGroups = [];
  mistakes = 0;
  guessHistory = [];
  isAnimating = false;

  renderGrid();
  renderMistakes();
  updateSubmitButton();
  createFloatingHearts();

  document.getElementById("shuffle-btn").addEventListener("click", onShuffle);
  document.getElementById("deselect-btn").addEventListener("click", onDeselectAll);
  document.getElementById("submit-btn").addEventListener("click", onSubmit);

  // Hide game over overlay
  document.getElementById("game-over-overlay").classList.remove("show");
}

// ============================================
// Rendering
// ============================================

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  remainingWords.forEach((word) => {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.textContent = word;
    tile.dataset.word = word;

    if (selectedWords.includes(word)) {
      tile.classList.add("selected");
    }

    tile.addEventListener("click", () => onTileClick(word));
    grid.appendChild(tile);
  });
}

function renderMistakes() {
  const dotsContainer = document.getElementById("mistake-dots");
  dotsContainer.innerHTML = "";

  for (let i = 0; i < MAX_MISTAKES; i++) {
    const dot = document.createElement("div");
    dot.className = "mistake-dot";
    if (i < mistakes) {
      dot.classList.add("used");
    }
    dotsContainer.appendChild(dot);
  }
}

function renderSolvedGroup(group) {
  const container = document.getElementById("solved-groups");
  const div = document.createElement("div");
  div.className = `solved-group ${group.color}`;
  div.innerHTML = `
    <div class="group-name">${group.name}</div>
    <div class="group-words">${group.words.join(", ")}</div>
  `;
  container.appendChild(div);
}

function updateSubmitButton() {
  const btn = document.getElementById("submit-btn");
  btn.disabled = selectedWords.length !== MAX_SELECTED;
}

// ============================================
// Event Handlers
// ============================================

function onTileClick(word) {
  if (isAnimating) return;

  if (selectedWords.includes(word)) {
    selectedWords = selectedWords.filter((w) => w !== word);
  } else if (selectedWords.length < MAX_SELECTED) {
    selectedWords.push(word);
  }

  renderGrid();
  updateSubmitButton();
}

function onShuffle() {
  if (isAnimating) return;
  shuffleArray(remainingWords);
  renderGrid();
}

function onDeselectAll() {
  if (isAnimating) return;
  selectedWords = [];
  renderGrid();
  updateSubmitButton();
}

function onSubmit() {
  if (isAnimating || selectedWords.length !== MAX_SELECTED) return;

  const matchedGroup = GROUPS.find(
    (group) =>
      !solvedGroups.includes(group) &&
      group.words.every((w) => selectedWords.includes(w)) &&
      selectedWords.every((w) => group.words.includes(w))
  );

  if (matchedGroup) {
    handleCorrectGuess(matchedGroup);
  } else {
    handleIncorrectGuess();
  }
}

// ============================================
// Game Logic
// ============================================

function handleCorrectGuess(group) {
  isAnimating = true;

  // Record guess
  guessHistory.push({
    words: [...selectedWords],
    correct: true,
    color: group.color,
  });

  // Animate tiles out
  const tiles = document.querySelectorAll(".tile");
  const matchedTiles = Array.from(tiles).filter((t) =>
    selectedWords.includes(t.dataset.word)
  );

  matchedTiles.forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.add("pop-out");
    }, i * 80);
  });

  setTimeout(() => {
    // Remove words from remaining
    remainingWords = remainingWords.filter(
      (w) => !group.words.includes(w)
    );
    solvedGroups.push(group);
    selectedWords = [];

    // Render solved group
    renderSolvedGroup(group);
    renderGrid();
    updateSubmitButton();

    isAnimating = false;

    // Check win
    if (solvedGroups.length === GROUPS.length) {
      setTimeout(() => showGameOver(true), 500);
    }
  }, matchedTiles.length * 80 + 450);
}

function handleIncorrectGuess() {
  isAnimating = true;

  // Check if "one away"
  const oneAway = GROUPS.some(
    (group) =>
      !solvedGroups.includes(group) &&
      group.words.filter((w) => selectedWords.includes(w)).length === 3
  );

  // Record guess
  const guessColors = selectedWords.map((word) => {
    const group = GROUPS.find((g) => g.words.includes(word));
    return group.color;
  });
  guessHistory.push({
    words: [...selectedWords],
    correct: false,
    colors: guessColors,
  });

  // Shake animation
  const tiles = document.querySelectorAll(".tile");
  const selectedTiles = Array.from(tiles).filter((t) =>
    selectedWords.includes(t.dataset.word)
  );
  selectedTiles.forEach((tile) => tile.classList.add("shake"));

  mistakes++;
  renderMistakes();

  if (oneAway) {
    showToast("One away!");
  }

  setTimeout(() => {
    selectedTiles.forEach((tile) => tile.classList.remove("shake"));
    isAnimating = false;

    // Check loss
    if (mistakes >= MAX_MISTAKES) {
      handleGameLoss();
    }
  }, 600);
}

function handleGameLoss() {
  isAnimating = true;

  // Reveal all remaining groups in order
  const unsolvedGroups = GROUPS.filter((g) => !solvedGroups.includes(g)).sort(
    (a, b) => a.difficulty - b.difficulty
  );

  let delay = 0;
  unsolvedGroups.forEach((group) => {
    setTimeout(() => {
      remainingWords = remainingWords.filter(
        (w) => !group.words.includes(w)
      );
      solvedGroups.push(group);
      selectedWords = [];
      renderSolvedGroup(group);
      renderGrid();
    }, delay);
    delay += 600;
  });

  setTimeout(() => {
    isAnimating = false;
    showGameOver(false);
  }, delay + 400);
}

// ============================================
// Toast
// ============================================

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}

// ============================================
// Game Over
// ============================================

function showGameOver(won) {
  const overlay = document.getElementById("game-over-overlay");
  const content = document.getElementById("game-over-content");

  // Build result grid from guess history
  let resultGridHTML = '<div class="result-grid">';
  guessHistory.forEach((guess) => {
    resultGridHTML += '<div class="result-row">';
    if (guess.correct) {
      for (let i = 0; i < 4; i++) {
        resultGridHTML += `<div class="result-dot ${guess.color}"></div>`;
      }
    } else {
      guess.colors.forEach((color) => {
        resultGridHTML += `<div class="result-dot ${color}"></div>`;
      });
    }
    resultGridHTML += "</div>";
  });
  // Add rows for groups solved after incorrect guesses revealed them
  if (won) {
    GROUPS.filter((g) => !guessHistory.some((h) => h.correct && h.color === g.color))
      .sort((a, b) => a.difficulty - b.difficulty)
      .forEach((group) => {
        // These groups were solved but not part of guess history
        // Actually all solved groups should be in guess history if won
      });
  }
  resultGridHTML += "</div>";

  const heading = won ? "Happy Valentine's Day!" : "So Close!";
  const message = won
    ? "You found all the connections!"
    : "Better luck next time, but I still love you!";
  const valentineNote = won
    ? '<p class="valentine-message">I love you, Maggie! &#10084;</p>'
    : '<p class="valentine-message">You\'re still my perfect match &#10084;</p>';

  content.innerHTML = `
    <h2>${heading}</h2>
    <p>${message}</p>
    ${resultGridHTML}
    ${valentineNote}
    <button class="btn-play-again" onclick="restartGame()">Play Again</button>
  `;

  overlay.classList.add("show");
}

function restartGame() {
  document.getElementById("game-over-overlay").classList.remove("show");
  document.getElementById("solved-groups").innerHTML = "";

  // Remove old event listeners by cloning buttons
  replaceButton("shuffle-btn");
  replaceButton("deselect-btn");
  replaceButton("submit-btn");

  init();
}

function replaceButton(id) {
  const old = document.getElementById(id);
  const clone = old.cloneNode(true);
  old.parentNode.replaceChild(clone, old);
}

// ============================================
// Floating Hearts Background
// ============================================

function createFloatingHearts() {
  const container = document.querySelector(".hearts-bg");
  container.innerHTML = "";

  const hearts = ["\u2764", "\u2665", "\u2661", "\uD83D\uDC95", "\uD83D\uDC96", "\uD83D\uDC97"];

  for (let i = 0; i < 15; i++) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${14 + Math.random() * 18}px`;
    heart.style.animationDuration = `${8 + Math.random() * 12}s`;
    heart.style.animationDelay = `${Math.random() * 10}s`;
    container.appendChild(heart);
  }
}

// ============================================
// Utility
// ============================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================
// Start the game
// ============================================

document.addEventListener("DOMContentLoaded", init);
