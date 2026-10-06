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

export type PlanetMaterialType = 'ice' | 'rock' | 'iron' | 'gas' | 'neutron';

// Backward compatibility alias for existing code
export type PlanetType = PlanetMaterialType | 'rocky' | 'gas_giant' | 'earth' | 'volcanic';

export interface PlanetMaterialInfo {
  type: PlanetMaterialType;
  name: string;
  shortName: string;
  density: number; // Factor de densidad gravitacional
  hardness: number; // Factor de resistencia al minado / cráter
  color: string;
  glowColor: string;
  description: string;
  isGas: boolean;
}

export const PLANET_MATERIALS: Record<PlanetMaterialType, PlanetMaterialInfo> = {
  ice: {
    type: 'ice',
    name: 'Hielo Cristalino / Condensado',
    shortName: 'HIELO',
    density: 0.5,
    hardness: 0.4,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.55)',
    description: 'Muy Frágil, Baja Gravedad. Cráteres 2.5x más grandes.',
    isGas: false
  },
  rock: {
    type: 'rock',
    name: 'Roca Basáltica / Silicatos Estándar',
    shortName: 'ROCA',
    density: 1.0,
    hardness: 1.0,
    color: '#a8a29e',
    glowColor: 'rgba(217, 119, 6, 0.35)',
    description: 'Gravedad y absorción equilibrada.',
    isGas: false
  },
  iron: {
    type: 'iron',
    name: 'Núcleo Metálico / Titanio-Ferroso',
    shortName: 'HIERRO',
    density: 2.2,
    hardness: 2.8,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    description: 'Atracción gravitatoria muy intensa; casi inmune al minado.',
    isGas: false
  },
  gas: {
    type: 'gas',
    name: 'Gigante Gaseoso / Nube de Hidrocarburos',
    shortName: 'GAS',
    density: 0.7,
    hardness: 999,
    color: '#38bdf8',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    description: 'Tiros lo cruzan disipando gas sin cráteres fijos, pero con fricción.',
    isGas: true
  },
  neutron: {
    type: 'neutron',
    name: 'Materia Oscura / Núcleo de Neutrones',
    shortName: 'NEUTRON',
    density: 3.5,
    hardness: 4.0,
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.65)',
    description: 'Planeta diminuto con pozo gravitatorio colosal e indestructible.',
    isGas: false
  }
};

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

  // Pre-generate craters for rock planets
  const craters: { x: number; y: number; r: number; depth: number }[] = [];
  if (type === 'rock' || type === 'rocky') {
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
      const nx = dx / radius;
      const ny = dy / radius;
      const nz = Math.sqrt(Math.max(0, 1.0 - (nx * nx + ny * ny)));

      // 3D Lambertian lighting + rim darkening
      const dot = Math.max(0, nx * nlx + ny * nly + nz * nlz);
      const ambient = 0.18;
      const rim = Math.pow(nz, 0.42);
      const light = (ambient + (1 - ambient) * dot) * rim;

      let r = 0, g = 0, b = 0;

      // 1. TIPO 1: CRISTAL DE HIELO / CONDENSADO
      if (type === 'ice') {
        const n = (fbm((px + offset) * 0.03, (py + offset) * 0.03, 4) + 1) * 0.5;
        const crack = Math.abs(simplex2D((px + offset) * 0.055, (py + offset) * 0.055));
        const crystalline = Math.pow(n, 1.3);

        if (crack < 0.07) {
          // Grieta cian intensa y glint de refracción
          r = 30;
          g = 210;
          b = 255;
        } else {
          // Base blanco-azulada translúcida
          r = Math.floor(180 + 75 * crystalline);
          g = Math.floor(215 + 40 * crystalline);
          b = Math.floor(240 + 15 * crystalline);
        }
      }
      // 2. TIPO 2: ROCA VOLCÁNICA / BASALTO ESTÁNDAR
      else if (type === 'rock' || type === 'rocky') {
        const n = (fbm((px + offset) * 0.035, (py + offset) * 0.035, 4) + 1) * 0.5;
        let craterEffect = 0;
        for (const crater of craters) {
          const cdx = px - crater.x;
          const cdy = py - crater.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < crater.r) {
            const rimDist = Math.abs(cdist - crater.r * 0.85);
            if (rimDist < 2.5) craterEffect += 0.25;
            else craterEffect -= crater.depth * (1 - cdist / crater.r);
          }
        }
        const val = Math.min(1, Math.max(0, n * 0.8 + 0.2 + craterEffect));
        r = Math.floor(val * 168);
        g = Math.floor(val * 158);
        b = Math.floor(val * 148);
      }
      // 3. TIPO 3: NÚCLEO METÁLICO / TITANIO-FERROSO
      else if (type === 'iron') {
        const metalBase = (fbm((px + offset) * 0.04, (py + offset) * 0.04, 3) + 1) * 0.5;
        // Venas magnéticas longitudinales
        const magVein = Math.abs(simplex2D((px + offset * 0.5) * 0.06, (py + offset * 0.5) * 0.02));
        const specGleam = Math.pow(dot, 4) * 0.6; // Reflejo metálico especular pulido

        if (magVein < 0.06) {
          // Veta magnética áurea de alta conductividad
          r = 255;
          g = 185;
          b = 40;
        } else {
          // Acero / bronce ferroso oscuro pulido
          r = Math.floor((140 + 70 * metalBase + 45 * specGleam));
          g = Math.floor((100 + 50 * metalBase + 35 * specGleam));
          b = Math.floor((70 + 40 * metalBase + 40 * specGleam));
        }
      }
      // 4. TIPO 4: GIGANTE GASEOSO / NUBE DE HIDROCARBUROS
      else if (type === 'gas' || type === 'gas_giant') {
        const distortion = simplex2D((px + offset) * 0.015, (py + offset) * 0.02) * 8.0;
        const band = Math.sin((py + distortion) * 0.14) * 0.5 + 0.5;
        const turbulent = (fbm(px * 0.025, py * 0.025, 3) + 1) * 0.5;

        // Bandas onduladas en tonos ámbar y azul cobalto
        if (band > 0.48) {
          // Ámbar cálido con vetas doradas
          r = Math.floor(220 * band + 35 * turbulent);
          g = Math.floor(140 * band + 25 * turbulent);
          b = Math.floor(30 + 35 * turbulent);
        } else {
          // Azul Cobalto profundo
          const cobalto = (0.48 - band) / 0.48;
          r = Math.floor(25 + 35 * turbulent);
          g = Math.floor(65 + 75 * cobalto + 30 * turbulent);
          b = Math.floor(180 + 70 * cobalto);
        }
      }
      // 5. TIPO 5: MATERIA OSCURA / NÚCLEO DE NEUTRONES
      else if (type === 'neutron') {
        const vortex = (fbm((px + offset) * 0.045, (py + offset) * 0.045, 4) + 1) * 0.5;
        const centerDist = Math.hypot(dx, dy) / radius;
        // Núcleo negro ultra-denso con halo de lente gravitatoria púrpura
        if (centerDist < 0.38) {
          r = Math.floor(8 + 12 * vortex);
          g = Math.floor(3 + 6 * vortex);
          b = Math.floor(18 + 15 * vortex);
        } else {
          const edgeIntensity = (centerDist - 0.38) / 0.62;
          r = Math.floor(130 * edgeIntensity + 40 * vortex);
          g = Math.floor(35 * edgeIntensity + 15 * vortex);
          b = Math.floor(245 * edgeIntensity + 10 * vortex);
        }
      }
      // Fallback para otros tipos
      else {
        const n = (fbm((px + offset) * 0.03, (py + offset) * 0.03, 4) + 1) * 0.5;
        r = Math.floor(n * 160);
        g = Math.floor(n * 160);
        b = Math.floor(n * 160);
      }

      // Apply light & spherical projection with baked atmospheric rim haze
      const rimHaze = Math.pow(1.0 - nz, 4.0) * 0.3;
      const glowR = type === 'ice' ? 56 : type === 'iron' ? 245 : type === 'gas' ? 59 : type === 'neutron' ? 192 : 217;
      const glowG = type === 'ice' ? 189 : type === 'iron' ? 158 : type === 'gas' ? 130 : type === 'neutron' ? 132 : 119;
      const glowB = type === 'ice' ? 248 : type === 'iron' ? 11 : type === 'gas' ? 246 : type === 'neutron' ? 252 : 6;

      data[idx] = Math.min(255, Math.floor(r * light + glowR * rimHaze));
      data[idx + 1] = Math.min(255, Math.floor(g * light + glowG * rimHaze));
      data[idx + 2] = Math.min(255, Math.floor(b * light + glowB * rimHaze));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Atmosphere is baked directly into the planet OffscreenCanvas to guarantee
 * 100% clean transparency when carved with destination-out (zero ghost shadows).
 */
export function drawAtmosphereGlow(
  _ctx: CanvasRenderingContext2D,
  _x: number,
  _y: number,
  _radius: number,
  _type: PlanetType
): void {
  // No-op: all lighting and atmosphere is pre-baked in the OffscreenCanvas
}
