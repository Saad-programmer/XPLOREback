/**
 * Generates the placeholder sound effects (original, synthesized: no license
 * issues). Replace any file in public/games/linux/sounds/ with a real recording
 * of the same name.
 *
 *   node scripts/make-sounds.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RATE = 22050;
const out = join(process.cwd(), 'public/games/linux/sounds');

/** Deterministic noise, so the files do not change on every run. */
let seed = 42;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const square = (f, t) => (sine(f, t) >= 0 ? 1 : -1);
const saw = (f, t) => 2 * ((f * t) % 1) - 1;
const triangle = (f, t) => 2 * Math.abs(saw(f, t)) - 1;
const env = (t, attack, length) =>
  t < attack ? t / attack : Math.max(0, Math.exp((-(t - attack) * 5) / length));

function render(seconds, fn) {
  const samples = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < samples.length; i++) samples[i] = fn(i / RATE, i);
  return samples;
}

/** Notes one after the other: [frequency, duration] with a shared voice. */
function sequence(notes, voice, gap = 0) {
  const total = notes.reduce((sum, [, d]) => sum + d + gap, 0);
  return render(total, (t) => {
    let start = 0;
    for (const [f, d] of notes) {
      if (t < start + d) return f ? voice(f, t - start, d) : 0;
      start += d + gap;
    }
    return 0;
  });
}

function lowpass(samples, amount) {
  let last = 0;
  return samples.map((x) => (last += amount * (x - last)));
}

function wav(name, samples, volume = 0.6) {
  const peak = Math.max(...samples.map(Math.abs)) || 1;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round((s / peak) * volume * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(join(out, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`${name}.wav  ${((44 + data.length) / 1024).toFixed(0)} KB`);
}

mkdirSync(out, { recursive: true });

// Success ding: two bell partials.
wav(
  'ding',
  render(0.7, (t) => (sine(1318, t) + 0.5 * sine(1976, t)) * env(t, 0.005, 0.25)),
);

// Error bonk: falling low tone.
wav(
  'bonk',
  render(0.2, (t) => sine(220 - 600 * t, t) * env(t, 0.003, 0.08)),
  0.5,
);

// Combo for pipe chains: quick rising notes.
wav(
  'combo',
  sequence(
    [
      [660, 0.07],
      [880, 0.07],
      [1320, 0.12],
    ],
    (f, t, d) => triangle(f, t) * env(t, 0.004, d),
  ),
  0.45,
);

// Zone / mission victory: arpeggio.
wav(
  'victory',
  sequence(
    [
      [523, 0.11],
      [659, 0.11],
      [784, 0.11],
      [1046, 0.5],
    ],
    (f, t, d) => (triangle(f, t) + 0.3 * sine(f * 2, t)) * env(t, 0.005, d * 0.6),
  ),
);

// Penguin talk blip: short, high and cute.
wav(
  'blip',
  render(0.035, (t) => square(1250, t) * env(t, 0.002, 0.015)),
  0.18,
);

// Dramatic: low falling rumble.
wav(
  'dramatic',
  lowpass(
    render(
      1.3,
      (t) => (saw(110 - 50 * t, t) + 0.6 * noise()) * (0.6 + 0.4 * sine(6, t)) * env(t, 0.02, 0.5),
    ),
    0.15,
  ),
);

// Sad violin: slow descending notes with vibrato.
wav(
  'sad-violin',
  lowpass(
    sequence(
      [
        [392, 0.45],
        [370, 0.45],
        [349, 0.45],
        [330, 0.9],
      ],
      (f, t, d) =>
        saw(f * (1 + 0.012 * sine(5.5, t)), t) * Math.min(1, t * 8) * Math.min(1, (d - t) * 6),
    ),
    0.08,
  ),
  0.5,
);

// Applause: noise with random claps.
const claps = Array.from({ length: 28 }, () => Math.abs(noise()) * 1.4);
wav(
  'applause',
  lowpass(
    render(1.6, (t) => {
      let amp = 0;
      for (const at of claps) if (t >= at && t < at + 0.03) amp += 1 - (t - at) / 0.03;
      return noise() * (0.25 + amp) * Math.min(1, (1.6 - t) * 2);
    }),
    0.5,
  ),
  0.5,
);

// Giggle: bouncing chirps.
wav(
  'giggle',
  sequence(
    [
      [700, 0.08],
      [0, 0.03],
      [820, 0.08],
      [0, 0.03],
      [760, 0.08],
      [0, 0.03],
      [900, 0.12],
    ],
    (f, t, d) => sine(f * (1 + 0.15 * sine(30, t)), t) * env(t, 0.004, d),
  ),
  0.5,
);

// Snore: slow breathing noise.
wav(
  'snore',
  lowpass(
    render(
      1.8,
      (t) =>
        noise() * Math.max(0, Math.sin(Math.PI * (t / 0.9))) ** 2 * (0.6 + 0.4 * square(38, t)),
    ),
    0.06,
  ),
  0.5,
);

// Train: chuffs, then a two-tone whistle.
wav(
  'train',
  render(1.4, (t) => {
    const chuff = t < 0.8 ? noise() * Math.max(0, Math.sin(Math.PI * ((t * 5) % 1))) ** 4 : 0;
    const whistle = t >= 0.8 ? (sine(740, t) + sine(880, t)) * 0.4 * Math.min(1, (1.4 - t) * 5) : 0;
    return chuff + whistle;
  }),
  0.5,
);

// Door slam (permission denied): thump and rattle.
wav(
  'door',
  render(0.35, (t) => sine(80, t) * env(t, 0.002, 0.08) + noise() * 0.4 * env(t, 0.002, 0.04)),
  0.6,
);
