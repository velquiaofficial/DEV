const SFX = (() => {
  const KEY = "musuking-mute";
  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem(KEY) === "1";
  } catch (e) {
    muted = false;
  }

  function ac() {
    if (muted) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type, gainValue, delay = 0) {
    const context = ac();
    if (!context) return;
    const t = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem(KEY, muted ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
      return muted;
    },
    ui() {
      beep(740, 0.07, "square", 0.04);
    },
    pick() {
      beep(520, 0.05, "square", 0.05);
      beep(780, 0.08, "square", 0.04, 0.05);
    },
    advantage() {
      [523, 659, 784, 1046].forEach((freq, i) => beep(freq, 0.12, "square", 0.05, i * 0.07));
    },
    clash() {
      beep(180, 0.12, "sawtooth", 0.04);
      beep(140, 0.16, "square", 0.03, 0.04);
    },
    bad() {
      beep(220, 0.14, "triangle", 0.05);
      beep(160, 0.18, "triangle", 0.04, 0.08);
    },
    hit() {
      beep(90, 0.15, "sawtooth", 0.06);
    },
    superFan() {
      [659, 880, 1175, 1568].forEach((freq, i) => beep(freq, 0.14, "square", 0.05, i * 0.06));
    },
    win() {
      [523, 659, 784, 1046, 784, 1175].forEach((freq, i) => beep(freq, 0.14, "triangle", 0.05, i * 0.09));
    },
    lose() {
      [440, 349, 294, 220].forEach((freq, i) => beep(freq, 0.18, "triangle", 0.05, i * 0.12));
    },
    scan() {
      beep(980, 0.05, "square", 0.03);
      beep(1200, 0.08, "square", 0.03, 0.1);
    },
  };
})();
