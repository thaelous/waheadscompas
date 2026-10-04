import React, { useEffect, useRef } from 'react';
import { PlayerId } from './engine';

interface ScreenCelebrationProps {
  winner: PlayerId | 'draw' | null;
  winnerColor?: string;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  flipAngle: number;
  vFlip: number;
  shape: 'rect' | 'shard' | 'sparkle';
  wobbleSpeed: number;
  wobblePhase: number;
  wobbleAmp: number;
}

interface WarpStreak {
  angle: number;
  dist: number;
  speed: number;
  length: number;
  color: string;
  width: number;
}

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const ScreenCelebration: React.FC<ScreenCelebrationProps> = ({ winner, winnerColor }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!winner) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const baseColor = winnerColor || (winner === 1 ? '#38bdf8' : winner === 2 ? '#f43f5e' : '#facc15');
    const celebrationPalette = [
      baseColor,
      '#fbbf24', // Gold
      '#38bdf8', // Neon Cyan
      '#f43f5e', // Neon Rose
      '#34d399', // Emerald
      '#c084fc', // Violet
      '#ffffff'  // Pure Starlight
    ];

    // 1. Initialize Confetti & Glowing Debris
    const confettiCount = Math.min(140, Math.floor((width * height) / 8000));
    const confetti: ConfettiPiece[] = [];
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * width,
        y: Math.random() * height - height * 0.4,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2.5 + 1.8,
        size: Math.random() * 7 + 5,
        color: celebrationPalette[Math.floor(Math.random() * celebrationPalette.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.12,
        flipAngle: Math.random() * Math.PI * 2,
        vFlip: Math.random() * 0.1 + 0.05,
        shape: Math.random() < 0.45 ? 'rect' : Math.random() < 0.75 ? 'shard' : 'sparkle',
        wobbleSpeed: Math.random() * 0.05 + 0.03,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: Math.random() * 1.5 + 0.5
      });
    }

    // 2. Initialize Warp-Jump Radiant Streaks
    const warpCount = 65;
    const streaks: WarpStreak[] = [];
    const maxRadius = Math.hypot(width, height) * 0.65;
    for (let i = 0; i < warpCount; i++) {
      streaks.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * maxRadius,
        speed: Math.random() * 5 + 3,
        length: Math.random() * 35 + 20,
        color: celebrationPalette[Math.floor(Math.random() * celebrationPalette.length)],
        width: Math.random() * 2 + 1
      });
    }

    // 3. Firework Starbursts
    const sparks: FireworkSpark[] = [];
    let fireworkTimer = 0;

    const spawnFirework = (x: number, y: number) => {
      const burstColor = celebrationPalette[Math.floor(Math.random() * celebrationPalette.length)];
      const count = 32;
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
        const spd = Math.random() * 4.5 + 2.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: Math.random() * 30 + 40,
          color: Math.random() < 0.35 ? '#ffffff' : burstColor,
          size: Math.random() * 2.2 + 1.2
        });
      }
    };

    // Initial celebratory bursts
    spawnFirework(width * 0.3, height * 0.35);
    spawnFirework(width * 0.7, height * 0.35);

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // --- 1. RENDER WARP-JUMP STREAKS ---
      ctx.save();
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.dist += s.speed;
        s.speed *= 1.025; // Accelerate outward like a hyperspace leap
        s.length = Math.min(100, s.length + 0.8);

        const x1 = centerX + Math.cos(s.angle) * s.dist;
        const y1 = centerY + Math.sin(s.angle) * s.dist;
        const x2 = centerX + Math.cos(s.angle) * Math.max(0, s.dist - s.length);
        const y2 = centerY + Math.sin(s.angle) * Math.max(0, s.dist - s.length);

        const grad = ctx.createLinearGradient(x2, y2, x1, y1);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.7, s.color);
        grad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // Respawn near center when exiting screen
        if (s.dist > maxRadius) {
          s.dist = Math.random() * 60 + 10;
          s.speed = Math.random() * 4 + 2.5;
          s.length = Math.random() * 25 + 10;
          s.angle = Math.random() * Math.PI * 2;
        }
      }
      ctx.restore();

      // --- 2. RENDER PERIODIC FIREWORK BURSTS ---
      fireworkTimer++;
      if (fireworkTimer > 55) {
        fireworkTimer = 0;
        const rx = width * (0.2 + Math.random() * 0.6);
        const ry = height * (0.15 + Math.random() * 0.5);
        spawnFirework(rx, ry);
      }

      ctx.save();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.life++;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.08; // Gravity
        sp.vx *= 0.98;
        sp.vy *= 0.98;

        const alpha = Math.max(0, 1 - sp.life / sp.maxLife);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();

        if (sp.life >= sp.maxLife) {
          sparks.splice(i, 1);
        }
      }
      ctx.restore();

      // --- 3. RENDER GLOWING CONFETTI & COSMIC DEBRIS ---
      ctx.save();
      for (let i = 0; i < confetti.length; i++) {
        const c = confetti[i];
        c.y += c.vy;
        c.x += c.vx + Math.sin(frameCount * c.wobbleSpeed + c.wobblePhase) * c.wobbleAmp;
        c.rotation += c.vRot;
        c.flipAngle += c.vFlip;

        // Reset to top when falling past bottom
        if (c.y > height + 20) {
          c.y = -20;
          c.x = Math.random() * width;
          c.vy = Math.random() * 2.5 + 1.8;
        }

        const scaleX = Math.cos(c.flipAngle);
        const scaleY = 1;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.scale(scaleX, scaleY);
        ctx.fillStyle = c.color;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 8;

        if (c.shape === 'rect') {
          ctx.fillRect(-c.size / 2, -c.size * 0.8, c.size, c.size * 1.6);
        } else if (c.shape === 'shard') {
          ctx.beginPath();
          ctx.moveTo(0, -c.size);
          ctx.lineTo(c.size * 0.7, c.size * 0.7);
          ctx.lineTo(-c.size * 0.7, c.size * 0.7);
          ctx.closePath();
          ctx.fill();
        } else {
          // 4-pointed sparkle diamond
          ctx.beginPath();
          ctx.moveTo(0, -c.size * 1.2);
          ctx.lineTo(c.size * 0.5, 0);
          ctx.lineTo(0, c.size * 1.2);
          ctx.lineTo(-c.size * 0.5, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [winner, winnerColor]);

  if (!winner) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40 w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  );
};
