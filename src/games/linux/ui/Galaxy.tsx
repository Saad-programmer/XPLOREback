'use client';

import { useEffect, useRef } from 'react';
import {
  cursorPulse,
  DEFAULT_GALAXY,
  generateGalaxy,
  generateStarLayers,
  type GalaxyParticle,
} from '../galaxy';
import styles from './Galaxy.module.css';

/** Disc tilt: the galaxy is seen at an angle. */
const TILT = 0.52;
/** Radians per second: one turn in about 9 minutes. */
const SPIN = 0.0118;
const BACKGROUND = '#0c0d18';

function paintGalaxy(particles: GalaxyParticle[], radius: number, dpr: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  const size = Math.ceil(radius * 2 * dpr);
  sprite.width = sprite.height = size;
  const sharp = document.createElement('canvas');
  sharp.width = sharp.height = size;
  const sharpCtx = sharp.getContext('2d')!;
  sharpCtx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    sharpCtx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
    const s = p.size * dpr;
    sharpCtx.fillRect(
      size / 2 + p.x * radius * dpr - s / 2,
      size / 2 + p.y * radius * dpr - s / 2,
      s,
      s,
    );
  }
  // Soft glow: a blurred copy under the sharp stars makes the arms read from afar.
  const ctx = sprite.getContext('2d')!;
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(${Math.round(6 * dpr)}px)`;
  ctx.drawImage(sharp, 0, 0);
  ctx.drawImage(sharp, 0, 0);
  ctx.filter = 'none';
  ctx.drawImage(sharp, 0, 0);
  return sprite;
}

function paintNebula(width: number, height: number, dpr: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  const size = Math.ceil(Math.hypot(width, height) * dpr);
  sprite.width = sprite.height = size;
  const ctx = sprite.getContext('2d')!;
  const clouds: [number, number, number, string][] = [
    [0.38, 0.42, 0.42, '187,154,247'],
    [0.62, 0.55, 0.38, '122,162,247'],
    [0.5, 0.36, 0.3, '247,118,142'],
    [0.3, 0.64, 0.3, '125,207,255'],
    [0.7, 0.32, 0.26, '187,154,247'],
  ];
  for (const [x, y, r, rgb] of clouds) {
    const gradient = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, r * size);
    gradient.addColorStop(0, `rgba(${rgb},0.16)`);
    gradient.addColorStop(0.5, `rgba(${rgb},0.05)`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Animated galaxy background drawn on a canvas (PRD section 8): rotating spiral,
 * nebula, parallax star layers and a rare shooting star. Stops when the tab is
 * hidden or `paused`; one still frame with reduced motion.
 */
export function Galaxy({
  paused = false,
  reducedMotion = false,
}: {
  paused?: boolean;
  reducedMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = generateGalaxy(DEFAULT_GALAXY);
    const layers = generateStarLayers(DEFAULT_GALAXY.seed);
    let width = 0;
    let height = 0;
    let dpr = 1;
    let radius = 0;
    let galaxy: HTMLCanvasElement | null = null;
    let nebula: HTMLCanvasElement | null = null;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let shooting: ShootingStar | null = null;
    let nextShootingStar = 6 + Math.random() * 8;
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      radius = Math.max(width, height) * 0.52;
      galaxy = paintGalaxy(particles, radius, dpr);
      nebula = paintNebula(width, height, dpr);
    };

    const draw = (time: number, dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 2);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 2);
      const cx = width * (width > height ? 0.66 : 0.5);
      const cy = height * (width > height ? 0.3 : 0.24);

      ctx.globalCompositeOperation = 'lighter';
      if (nebula) {
        const n = nebula.width / dpr;
        ctx.save();
        ctx.translate(cx + mouse.x * 6, cy + mouse.y * 6);
        ctx.rotate(-time * SPIN * 0.35);
        ctx.drawImage(nebula, -n / 2, -n / 2, n, n);
        ctx.restore();
      }

      for (const layer of layers) {
        const ox = mouse.x * layer.depth * width;
        const oy = mouse.y * layer.depth * height;
        for (const star of layer.stars) {
          const twinkle = 0.65 + 0.35 * Math.sin(time * star.twinkleSpeed + star.phase);
          ctx.fillStyle = `rgba(214,222,255,${star.alpha * twinkle})`;
          const x = (((star.x * width + ox) % width) + width) % width;
          const y = (((star.y * height + oy) % height) + height) % height;
          ctx.fillRect(x, y, star.size, star.size);
        }
      }

      if (galaxy) {
        ctx.save();
        ctx.translate(cx + mouse.x * 14, cy + mouse.y * 10);
        ctx.rotate(-0.38);
        ctx.scale(1, TILT);
        ctx.rotate(time * SPIN);
        ctx.drawImage(galaxy, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.26);
        const pulse = 0.5 + 0.12 * cursorPulse(time);
        glow.addColorStop(0, `rgba(255,236,246,${pulse})`);
        glow.addColorStop(0.4, `rgba(187,154,247,${pulse * 0.3})`);
        glow.addColorStop(1, 'rgba(122,162,247,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }

      // A rare shooting star.
      if (!shooting && time > nextShootingStar && !reducedMotion) {
        const angle = Math.PI * (0.12 + Math.random() * 0.12);
        shooting = {
          x: width * (0.1 + Math.random() * 0.6),
          y: height * Math.random() * 0.35,
          vx: Math.cos(angle) * width * 0.9,
          vy: Math.sin(angle) * width * 0.9,
          life: 1,
        };
        nextShootingStar = time + 9 + Math.random() * 14;
      }
      if (shooting) {
        shooting.x += shooting.vx * dt;
        shooting.y += shooting.vy * dt;
        shooting.life -= dt * 1.4;
        const tail = 0.12;
        const gradient = ctx.createLinearGradient(
          shooting.x,
          shooting.y,
          shooting.x - shooting.vx * tail,
          shooting.y - shooting.vy * tail,
        );
        gradient.addColorStop(0, `rgba(255,255,255,${Math.max(0, shooting.life)})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - shooting.vx * tail, shooting.y - shooting.vy * tail);
        ctx.stroke();
        if (shooting.life <= 0) shooting = null;
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      draw(elapsed, dt);
      frame = requestAnimationFrame(tick);
    };

    const running = () => !paused && !reducedMotion && document.visibilityState === 'visible';
    const start = () => {
      if (frame || !running()) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
      canvas.dataset.running = 'true';
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      canvas.dataset.running = 'false';
    };

    const onResize = () => {
      resize();
      if (!frame) draw(elapsed, 0);
    };
    const onVisibility = () => (running() ? start() : stop());
    const onMouse = (event: PointerEvent) => {
      mouse.tx = event.clientX / window.innerWidth - 0.5;
      mouse.ty = event.clientY / window.innerHeight - 0.5;
    };

    resize();
    draw(elapsed, 0);
    stop();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reducedMotion) window.addEventListener('pointermove', onMouse);
    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMouse);
    };
  }, [paused, reducedMotion]);

  return <canvas ref={canvasRef} className={styles.galaxy} aria-hidden="true" />;
}
