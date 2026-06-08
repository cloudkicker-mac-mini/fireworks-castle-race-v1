const racers = ["red", "white", "blue"];

const prizes = [
  { label: "5% off your fireworks purchase", weight: 45 },
  { label: "Free novelty item", weight: 30 },
  { label: "Mystery bonus at checkout", weight: 15 },
  { label: "10% off one fountain", weight: 10 }
];

const state = {
  selectedColor: "red",
  isRacing: false,
  animationFrame: null,
  raceStartedAt: 0,
  raceDuration: 0,
  winner: null,
  prize: null
};

const choiceButtons = [...document.querySelectorAll(".choice-card")];
const goButton = document.querySelector("#goButton");
const resetButton = document.querySelector("#resetButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const playAgainButton = document.querySelector("#playAgainButton");
const statusText = document.querySelector("#statusText");
const timerText = document.querySelector("#timerText");
const resultOverlay = document.querySelector("#resultOverlay");
const resultTitle = document.querySelector("#resultTitle");
const resultCopy = document.querySelector("#resultCopy");
const track = document.querySelector("#track");
const racerElements = Object.fromEntries(
  racers.map((color) => [color, document.querySelector(`[data-racer="${color}"]`)])
);

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.isRacing) return;
    state.selectedColor = button.dataset.color;
    choiceButtons.forEach((choice) => choice.classList.toggle("selected", choice === button));
    statusText.textContent = `${capitalize(state.selectedColor)} knight selected. Start the tournament.`;
  });
});

goButton.addEventListener("click", startRace);
resetButton.addEventListener("click", resetGame);
playAgainButton.addEventListener("click", resetGame);
fullscreenButton.addEventListener("click", toggleFullscreen);

function startRace() {
  if (state.isRacing) return;

  state.isRacing = true;
  state.winner = pickWinner();
  state.prize = pickPrize();
  state.raceStartedAt = performance.now();
  state.raceDuration = randomBetween(18000, 23000);

  goButton.disabled = true;
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  resultOverlay.hidden = true;
  track.classList.add("racing");
  statusText.textContent = "The tournament is underway!";

  state.animationFrame = requestAnimationFrame(animateRace);
}

function animateRace(now) {
  const elapsed = now - state.raceStartedAt;
  const progress = clamp(elapsed / state.raceDuration, 0, 1);
  const trackWidth = track.getBoundingClientRect().width;
  const finishX = Math.max(0, trackWidth - 220);

  racers.forEach((color, index) => {
    const racer = racerElements[color];
    const base = easeOutCubic(progress) * finishX;
    const drama = Math.sin(progress * Math.PI * 9 + index * 1.7) * 42;
    const surge = Math.sin(progress * Math.PI * 17 + index * 2.4) * 22;
    const laneBias = leadBias(color, progress) * 82;
    const finalPush = color === state.winner ? Math.pow(progress, 7) * 120 : -Math.pow(progress, 6) * 35;
    const x = clamp(base + drama + surge + laneBias + finalPush, 0, finishX + 72);

    racer.style.transform = `translateX(${x}px)`;
  });

  const secondsLeft = Math.max(0, Math.ceil((state.raceDuration - elapsed) / 1000));
  timerText.textContent = secondsLeft > 0 ? `${secondsLeft}s` : "Finish!";

  if (progress < 1) {
    state.animationFrame = requestAnimationFrame(animateRace);
    return;
  }

  finishRace();
}

function finishRace() {
  state.isRacing = false;
  cancelAnimationFrame(state.animationFrame);
  track.classList.remove("racing");

  racers.forEach((color) => {
    const racer = racerElements[color];
    const trackWidth = track.getBoundingClientRect().width;
    const finishX = Math.max(0, trackWidth - 220);
    const offset = color === state.winner ? 72 : color === state.selectedColor ? -18 : -42;
    racer.style.transform = `translateX(${finishX + offset}px)`;
  });

  const selectedWon = state.selectedColor === state.winner;
  resultTitle.textContent = `${capitalize(state.winner)} Wins!`;
  resultCopy.textContent = selectedWon
    ? `You picked the winning knight: ${state.prize.label}.`
    : `You picked ${capitalize(state.selectedColor)}. ${capitalize(state.winner)} takes the crown this round.`;
  statusText.textContent = selectedWon ? "Winning pick!" : "Race complete.";
  timerText.textContent = "Done";
  resultOverlay.hidden = false;
}

function resetGame() {
  state.isRacing = false;
  cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
  state.winner = null;
  state.prize = null;

  racers.forEach((color) => {
    racerElements[color].style.transform = "translateX(0)";
  });

  track.classList.remove("racing");
  resultOverlay.hidden = true;
  goButton.disabled = false;
  choiceButtons.forEach((button) => {
    button.disabled = false;
  });
  timerText.textContent = "Ready";
  statusText.textContent = `${capitalize(state.selectedColor)} knight selected. Start the tournament.`;
}

function pickWinner() {
  return racers[Math.floor(Math.random() * racers.length)];
}

function pickPrize() {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * total;

  for (const prize of prizes) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }

  return prizes[0];
}

function leadBias(color, progress) {
  const phases = [
    { leader: "red", start: 0.08, end: 0.24 },
    { leader: "white", start: 0.26, end: 0.42 },
    { leader: "blue", start: 0.45, end: 0.61 },
    { leader: state.selectedColor, start: 0.62, end: 0.76 },
    { leader: state.winner, start: 0.78, end: 1 }
  ];

  return phases.reduce((bias, phase) => {
    if (color !== phase.leader) return bias;
    const active = progress >= phase.start && progress <= phase.end;
    return active ? bias + 1 : bias;
  }, 0);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    return;
  }

  document.exitFullscreen?.();
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
