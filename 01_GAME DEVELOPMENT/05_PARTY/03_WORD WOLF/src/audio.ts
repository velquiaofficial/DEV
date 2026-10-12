let muted = false;
let audio: AudioContext | null = null;

export function setAudioMuted(next: boolean) {
  muted = next;
}

function context(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audio) audio = new Ctx();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

export function unlockAudio() {
  context();
}

function tone(freq: number, duration: number, type: OscillatorType, peak: number, delay = 0) {
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playTap() {
  tone(540, 0.06, "sine", 0.03);
}

export function playFlip() {
  tone(320, 0.12, "triangle", 0.04);
  tone(640, 0.18, "sine", 0.03, 0.05);
}

export function playWarn() {
  tone(440, 0.12, "square", 0.02);
  tone(330, 0.16, "square", 0.02, 0.14);
}

export function playCitizens() {
  tone(523, 0.18, "sine", 0.04);
  tone(659, 0.22, "sine", 0.04, 0.08);
  tone(784, 0.32, "triangle", 0.04, 0.16);
}

export function playWolves() {
  tone(196, 0.28, "triangle", 0.05);
  tone(155, 0.36, "sine", 0.04, 0.12);
}

export function playBlank() {
  tone(392, 0.2, "sine", 0.035);
  tone(494, 0.24, "triangle", 0.03, 0.1);
  tone(587, 0.3, "sine", 0.03, 0.18);
}

export function buzz(ms = 40) {
  if (muted || typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(ms);
}
