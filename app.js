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
  lastLeader: null,
  soundEnabled: true,
  audioContext: null,
  hoofbeatTimer: null,
  crowdTimer: null
};

const choiceButtons = [...document.querySelectorAll(".choice-card")];
const goButton = document.querySelector("#goButton");
const resetButton = document.querySelector("#resetButton");
const soundButton = document.querySelector("#soundButton");
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
soundButton.addEventListener("click", toggleSound);
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

  prepareAudio();
  playStartHorn();
  startRaceAudio();

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
    playCrowdPop();
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
  stopRaceAudio();

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
  playFinishFanfare(selectedWon);
}

function resetGame() {
  state.isRacing = false;
  cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
  state.winner = null;
  state.prize = null;
  state.lastLeader = null;
  stopRaceAudio();

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

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  soundButton.textContent = state.soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(state.soundEnabled));

  if (!state.soundEnabled) {
    stopRaceAudio();
    return;
  }

  prepareAudio();
  playTone({ frequency: 740, duration: 0.08, type: "triangle", gain: 0.08 });
}

function prepareAudio() {
  if (!state.soundEnabled) return null;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    state.soundEnabled = false;
    soundButton.textContent = "Sound Off";
    soundButton.setAttribute("aria-pressed", "false");
    return null;
  }

  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }

  return state.audioContext;
}

function startRaceAudio() {
  if (!state.soundEnabled || state.hoofbeatTimer) return;

  let beat = 0;
  state.hoofbeatTimer = window.setInterval(() => {
    playHoofbeat(beat);
    beat += 1;
  }, 155);

  state.crowdTimer = window.setInterval(() => {
    playCrowdWash(0.035);
  }, 1800);
}

function stopRaceAudio() {
  if (state.hoofbeatTimer) {
    clearInterval(state.hoofbeatTimer);
    state.hoofbeatTimer = null;
  }

  if (state.crowdTimer) {
    clearInterval(state.crowdTimer);
    state.crowdTimer = null;
  }
}

function playStartHorn() {
  const ctx = prepareAudio();
  if (!ctx) return;

  playTone({ frequency: 392, duration: 0.22, type: "sawtooth", gain: 0.11 });
  window.setTimeout(() => playTone({ frequency: 523.25, duration: 0.28, type: "sawtooth", gain: 0.12 }), 170);
  window.setTimeout(() => playTone({ frequency: 659.25, duration: 0.34, type: "sawtooth", gain: 0.13 }), 380);
}

function playFinishFanfare(selectedWon) {
  const ctx = prepareAudio();
  if (!ctx) return;

  const notes = selectedWon
    ? [523.25, 659.25, 783.99, 1046.5]
    : [392, 493.88, 587.33, 783.99];

  notes.forEach((frequency, index) => {
    window.setTimeout(() => {
      playTone({ frequency, duration: 0.18 + index * 0.04, type: "triangle", gain: 0.13 });
    }, index * 125);
  });

  window.setTimeout(() => playCrowdPop(0.18), 220);
}

function playHoofbeat(beat) {
  const ctx = prepareAudio();
  if (!ctx) return;

  const time = ctx.currentTime;
  const mainGain = 0.09 + (beat % 4 === 0 ? 0.035 : 0);

  playPercussion({ time, frequency: 92, duration: 0.055, gain: mainGain });
  playPercussion({ time: time + 0.045, frequency: 128, duration: 0.045, gain: mainGain * 0.78 });
  playNoiseBurst({ time: time + 0.008, duration: 0.035, gain: 0.022 });
}

function playCrowdPop(gain = 0.08) {
  playCrowdWash(gain);
  window.setTimeout(() => playTone({ frequency: 880, duration: 0.08, type: "square", gain: 0.035 }), 70);
}

function playCrowdWash(gain = 0.04) {
  const ctx = prepareAudio();
  if (!ctx) return;

  playNoiseBurst({ time: ctx.currentTime, duration: 0.55, gain, filterFrequency: 950 });
}

function playTone({ frequency, duration, type = "sine", gain = 0.08 }) {
  const ctx = prepareAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.92), now + duration);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(gain, now + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function playPercussion({ time, frequency, duration, gain }) {
  const ctx = prepareAudio();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(38, frequency * 0.48), time + duration);
  volume.gain.setValueAtTime(gain, time);
  volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
}

function playNoiseBurst({ time, duration, gain, filterFrequency = 420 }) {
  const ctx = prepareAudio();
  if (!ctx) return;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();

  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrequency, time);
  volume.gain.setValueAtTime(gain, time);
  volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  source.connect(filter);
  filter.connect(volume);
  volume.connect(ctx.destination);
  source.start(time);
  source.stop(time + duration);
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
