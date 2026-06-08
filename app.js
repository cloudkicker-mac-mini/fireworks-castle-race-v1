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
  prize: null,
  lastLeader: null
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
const laneOrder = { red: 0, white: 1, blue: 2 };

placeRacersAtStart();
window.addEventListener("resize", () => {
  if (!state.isRacing) placeRacersAtStart();
});

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
  state.lastLeader = null;
  state.raceStartedAt = performance.now();
  state.raceDuration = randomBetween(19000, 24000);

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
  const standings = [];

  racers.forEach((color, index) => {
    const drama = Math.sin(progress * Math.PI * 8 + index * 1.85) * 0.018;
    const surge = Math.sin(progress * Math.PI * 15 + index * 2.35) * 0.009;
    const phaseBoost = leadBias(color, progress) * 0.032;
    const finalPush = color === state.winner ? Math.pow(progress, 7) * 0.08 : -Math.pow(progress, 6) * 0.022;
    const lapProgress = clamp(progress + drama + surge + phaseBoost + finalPush, 0, color === state.winner ? 1.02 : 0.985);

    positionRacer(color, lapProgress);
    standings.push({ color, lapProgress });
  });

  standings.sort((a, b) => b.lapProgress - a.lapProgress);
  if (standings[0]?.color && standings[0].color !== state.lastLeader && progress > 0.08 && progress < 0.92) {
    state.lastLeader = standings[0].color;
    statusText.textContent = `${capitalize(state.lastLeader)} takes the lead!`;
  }

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
    const finishProgress = color === state.winner ? 1.02 : color === state.selectedColor ? 0.985 : 0.972;
    positionRacer(color, finishProgress);
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
  state.lastLeader = null;

  placeRacersAtStart();

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

function placeRacersAtStart() {
  racers.forEach((color) => {
    positionRacer(color, 0);
  });
}

function positionRacer(color, lapProgress) {
  const racer = racerElements[color];
  const bounds = track.getBoundingClientRect();
  const lane = laneOrder[color];
  const centerX = bounds.width * 0.5;
  const centerY = bounds.height * 0.55;
  const rx = Math.max(120, bounds.width * 0.385 - lane * 30);
  const ry = Math.max(86, bounds.height * 0.305 - lane * 22);
  const startAngle = degreesToRadians(142);
  const angle = startAngle - lapProgress * Math.PI * 2;
  const nextAngle = startAngle - Math.min(lapProgress + 0.006, 1.03) * Math.PI * 2;
  const x = centerX + Math.cos(angle) * rx;
  const y = centerY + Math.sin(angle) * ry;
  const nextX = centerX + Math.cos(nextAngle) * rx;
  const nextY = centerY + Math.sin(nextAngle) * ry;
  const rotation = Math.atan2(nextY - y, nextX - x);
  const depthScale = 0.86 + (y / bounds.height) * 0.34;
  const z = Math.round(20 + y);

  racer.style.zIndex = z;
  racer.style.filter = `brightness(${0.92 + depthScale * 0.12})`;
  racer.style.transform = `translate(${x - 78}px, ${y - 44}px) rotate(${rotation}rad) scale(${depthScale})`;
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

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
