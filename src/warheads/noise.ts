/**
 * Simplex & Fractal Noise Engine for Procedural 3D Planetary Textures
 * WarHeads (1997) WebGL/Canvas Physics Clone
 */

// 2D Simplex Noise implementation
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = p[i & 255];
  permMod12[i] = perm[i] % 12;
}

const grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
]);

export function simplex2D(xin: number, yin: number): number {
  let n0 = 0, n1 = 0, n2 = 0;
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  let i1 = 0, j1 = 0;
  if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) {
    t0 *= t0;
    const gi0 = permMod12[ii + perm[jj]] * 3;
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) {
    t1 *= t1;
    const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) {
    t2 *= t2;
    const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
  }

  return 70.0 * (n0 + n1 + n2);
}

export function fbm(x: number, y: number, octaves = 5, lacunarity = 2.0, gain = 0.5): number {
  let total = 0;
  let frequency = 1.0;
  let amplitude = 1.0;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += simplex2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return total / maxValue;
}

export type PlanetType = 'rocky' | 'gas_giant' | 'earth' | 'volcanic';

export interface PlanetTextureConfig {
  type: PlanetType;
  radius: number;
  seed: number;
}

/**
 * Procedural generation of a 3D spherical rendered planet on an OffscreenCanvas
 */
export function generatePlanetCanvas(config: PlanetTextureConfig): HTMLCanvasElement {
  const { type, radius } = config;
  const size = Math.ceil(radius * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Directional star light vector from top-left (WarHeads style)
  const lx = -0.55;
  const ly = -0.65;
  const lz = 0.52;
  const lightLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const nlx = lx / lightLen;
  const nly = ly / lightLen;
  const nlz = lz / lightLen;

  const r2 = radius * radius;
  const offset = Math.random() * 500;

  // Pre-generate craters for rocky planets
  const craters: { x: number; y: number; r: number; depth: number }[] = [];
  if (type === 'rocky') {
    const numCraters = Math.floor(6 + Math.random() * 8);
    for (let c = 0; c < numCraters; c++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.82);
      craters.push({
        x: radius + Math.cos(angle) * dist,
        y: radius + Math.sin(angle) * dist,
        r: 6 + Math.random() * (radius * 0.22),
        depth: 0.35 + Math.random() * 0.4
      });
    }
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = px - radius;
      const dy = py - radius;
      const distSq = dx * dx + dy * dy;

      if (distSq > r2) continue; // Outside planet sphere

      const idx = (py * size + px) * 4;
      const dist = Math.sqrt(distSq);
      const nx = dx / radius;
      const ny = dy / radius;
      const nz = Math.sqrt(Math.max(0, 1.0 - (nx * nx + ny * ny)));

      // 3D Lambertian lighting + rim darkening
      const dot = Math.max(0, nx * nlx + ny * nly + nz * nlz);
      const ambient = 0.16;
      const rim = Math.pow(nz, 0.45);
      const light = (ambient + (1 - ambient) * dot) * rim;

      let r = 0, g = 0, b = 0;

      if (type === 'rocky') {
        // Lunar / Rocky: High-frequency fractal regolith with crater impressions
        const n = (fbm((px + offset) * 0.035, (py + offset) * 0.035, 4) + 1) * 0.5;
        let craterEffect = 0;
        for (const crater of craters) {
          const cdx = px - crater.x;
          const cdy = py - crater.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < crater.r) {
            const rimDist = Math.abs(cdist - crater.r * 0.85);
            if (rimDist < 2.5) craterEffect += 0.25; // Crater ridge
            else craterEffect -= crater.depth * (1 - cdist / crater.r);
          }
        }
        const val = Math.min(1, Math.max(0, n * 0.8 + 0.2 + craterEffect));
        // Ochre / Moon grey shading
        r = Math.floor(val * 175);
        g = Math.floor(val * 165);
        b = Math.floor(val * 155);
      } else if (type === 'gas_giant') {
        // Jovian / Gas Giant: horizontal turbulence bands & great storm
        const distortion = simplex2D((px + offset) * 0.015, (py + offset) * 0.02) * 8.0;
        const band = Math.sin((py + distortion) * 0.12) * 0.5 + 0.5;
        const turbulent = (fbm(px * 0.02, py * 0.02, 3) + 1) * 0.5;
        // Check for Great Storm spot
        const spotDx = (px - radius * 1.3) / (radius * 0.35);
        const spotDy = (py - radius * 1.1) / (radius * 0.18);
        const inSpot = spotDx * spotDx + spotDy * spotDy < 1.0;

        if (inSpot) {
          r = 230; g = 85; b = 45;
        } else {
          // Amber & ochre banded atmosphere
          r = Math.floor(210 * band + 40 * turbulent);
          g = Math.floor(140 * band + 30 * turbulent);
          b = Math.floor(80 * (1 - band) + 40);
        }
      } else if (type === 'earth') {
        // Terrestrial: continents, coastlines, deep oceans, and swirling cloud layer
        const elevation = (fbm((px + offset) * 0.02, (py + offset) * 0.02, 5) + 1) * 0.5;
        const clouds = Math.max(0, fbm((px - offset * 0.5) * 0.03, (py + offset * 0.3) * 0.03, 3) * 1.2 - 0.2);

        if (elevation < 0.44) {
          // Deep ocean to shallow water
          const depth = elevation / 0.44;
          r = Math.floor(10 + 20 * depth);
          g = Math.floor(45 + 50 * depth);
          b = Math.floor(130 + 80 * depth);
        } else if (elevation < 0.48) {
          // Sand beaches
          r = 210; g = 195; b = 130;
        } else if (elevation < 0.72) {
          // Green plains & forests
          const veg = (elevation - 0.48) / 0.24;
          r = Math.floor(35 + 45 * veg);
          g = Math.floor(125 - 20 * veg);
          b = Math.floor(40 + 10 * veg);
        } else {
          // Snowy mountain peaks
          r = 200; g = 205; b = 215;
        }

        // Blend translucent clouds
        if (clouds > 0) {
          r = Math.floor(r * (1 - clouds) + 245 * clouds);
          g = Math.floor(g * (1 - clouds) + 248 * clouds);
          b = Math.floor(b * (1 - clouds) + 255 * clouds);
        }
      } else {
        // Volcanic / Magmatic: Dark basaltic crust with incandescent lava veins
        const veinNoise = Math.abs(simplex2D((px + offset) * 0.035, (py + offset) * 0.035));
        const rockNoise = (fbm(px * 0.04, py * 0.04, 3) + 1) * 0.5;

        if (veinNoise < 0.09) {
          // Intense lava core vein
          const lavaIntensity = 1.0 - veinNoise / 0.09;
          r = Math.floor(255);
          g = Math.floor(110 + 120 * lavaIntensity);
          b = Math.floor(20 * lavaIntensity);
        } else if (veinNoise < 0.17) {
          // Cooling basalt lava crust
          const heat = 1.0 - (veinNoise - 0.09) / 0.08;
          r = Math.floor(180 * heat + 40);
          g = Math.floor(40 * heat + 20);
          b = 20;
        } else {
          // Dark charcoal basalt
          r = Math.floor(32 + 25 * rockNoise);
          g = Math.floor(30 + 20 * rockNoise);
          b = Math.floor(35 + 20 * rockNoise);
        }
      }

      // Apply light & spherical projection
      data[idx] = Math.min(255, Math.floor(r * light));
      data[idx + 1] = Math.min(255, Math.floor(g * light));
      data[idx + 2] = Math.min(255, Math.floor(b * light));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Draws atmospheric glow around planet on main canvas
 */
export function drawAtmosphereGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  type: PlanetType
): void {
  const glowRadius = radius * 1.25;
  const grad = ctx.createRadialGradient(x, y, radius * 0.95, x, y, glowRadius);

  let colorInner = 'rgba(100, 180, 255, 0.4)';
  let colorOuter = 'rgba(50, 130, 255, 0)';

  if (type === 'gas_giant') {
    colorInner = 'rgba(255, 170, 70, 0.45)';
    colorOuter = 'rgba(210, 110, 30, 0)';
  } else if (type === 'volcanic') {
    colorInner = 'rgba(255, 60, 20, 0.5)';
    colorOuter = 'rgba(180, 20, 0, 0)';
  } else if (type === 'rocky') {
    colorInner = 'rgba(190, 200, 220, 0.28)';
    colorOuter = 'rgba(130, 140, 160, 0)';
  }

  grad.addColorStop(0, colorInner);
  grad.addColorStop(1, colorOuter);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
