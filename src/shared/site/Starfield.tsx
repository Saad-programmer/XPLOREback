'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../ui/use-reduced-motion';
import { generateStarfield, STAR_TILE, starPosition, twinkle } from './stars';
import styles from './Starfield.module.css';

/** The drift is slow: 30 frames per second look the same and cost half. */
const FRAME_MS = 1000 / 30;

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Background of the website pages: deep brand blue, slow nebula glows (CSS)
 * and a canvas of drifting, twinkling stars with a rare shooting star.
 * Stops when the tab is hidden or the page is left (Next.js hides visited
 * pages and cleans up their effects); one still frame with reduced motion.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const stars = generateStarfield();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let shooting: ShootingStar | null = null;
    // Random is fine here: this runs in an effect, never during render.
    let nextShootingStar = 8 + Math.random() * 10;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = (dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const scrollY = window.scrollY;

      for (const star of stars) {
        const { x, y } = starPosition(star, elapsed, scrollY);
        const [r, g, b] = star.color;
        ctx.fillStyle = `rgba(${r},${g},${b},${twinkle(star, elapsed)})`;
        // Repeat the tile across the screen.
        for (let tx = x; tx < width; tx += STAR_TILE) {
          for (let ty = y; ty < height; ty += STAR_TILE) {
            const s = Math.round(star.size);
            if (star.sparkle) {
              // A pixel "+": the centre and its four neighbours.
              ctx.fillRect(Math.round(tx) - s, Math.round(ty), s * 3, s);
              ctx.fillRect(Math.round(tx), Math.round(ty) - s, s, s * 3);
            } else {
              ctx.fillRect(tx, ty, star.size, star.size);
            }
          }
        }
      }

      if (reducedMotion) return;
      if (!shooting && elapsed > nextShootingStar) {
        const angle = Math.PI * (0.08 + Math.random() * 0.1);
        shooting = {
          x: width * (0.05 + Math.random() * 0.6),
          y: height * Math.random() * 0.4,
          vx: Math.cos(angle) * 700,
          vy: Math.sin(angle) * 700,
          life: 1,
        };
        nextShootingStar = elapsed + 18 + Math.random() * 20;
      }
      if (shooting) {
        shooting.x += shooting.vx * dt;
        shooting.y += shooting.vy * dt;
        shooting.life -= dt * 1.5;
        const tail = 0.14;
        const gradient = ctx.createLinearGradient(
          shooting.x,
          shooting.y,
          shooting.x - shooting.vx * tail,
          shooting.y - shooting.vy * tail,
        );
        gradient.addColorStop(0, `rgba(222,230,255,${Math.max(0, shooting.life) * 0.8})`);
        gradient.addColorStop(1, 'rgba(122,162,247,0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(shooting.x, shooting.y);
        ctx.lineTo(shooting.x - shooting.vx * tail, shooting.y - shooting.vy * tail);
        ctx.stroke();
        if (shooting.life <= 0) shooting = null;
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;
      draw(dt);
    };

    const running = () => !reducedMotion && document.visibilityState === 'visible';
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
    const redraw = () => {
      // Still frame (reduced motion): follow resizes and the scroll by hand.
      if (!frame) draw(0);
    };
    const onResize = () => {
      resize();
      redraw();
    };
    const onVisibility = () => (running() ? start() : stop());

    resize();
    draw(0);
    stop();
    start();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', redraw, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', redraw);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return (
    <div className={styles.sky} aria-hidden="true">
      <div className={styles.nebula} data-still={reducedMotion || undefined} />
      <canvas ref={canvasRef} className={styles.stars} />
    </div>
  );
}
