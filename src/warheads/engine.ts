/**
 * WarHeads (1997) Core 2D Orbital Physics & Destructible Engine
 * 100% Fixed Viewport (1280x720), Toroidal Screen Wrap, Real Pixel-Level Carving
 * 1 to 3 Players (Human vs Tactical AI / Pass & Play / Online Firebase)
 * Historical Credit & Coin Mining Economy + 3 Distinct Vector Ship Models
 */

import {
  generatePlanetCanvas,
  PlanetType,
  PlanetMaterialType,
  PlanetMaterialInfo,
  PLANET_MATERIALS
} from './noise';
import { WeaponDef, WEAPON_CATALOG } from './weapons';
import { sound } from './audio';

export const G_CONSTANT = 1100; // Calibrated gravitational constant ensuring escape velocity at >=80% power
export const PLUMMER_EPSILON_SQ = 625; // Plummer softening epsilon = 25 pixels (25^2 = 625)

export type PlayerId = 1 | 2 | 3;
export type ShipModel = 'enterprise' | 'falcon' | 'xwing' | 'interceptor' | 'dreadnought' | 'frigate' | 'quantum';

export type ShieldType =
  | 'deflector'
  | 'ricochet'
  | 'absorb'
  | 'phase'
  | 'repulsor'
  | 'reflector'
  | 'bastion'
  | 'anti_emp';

export interface ShieldDef {
  id: ShieldType;
  name: string;
  price: number;
  description: string;
  effect: string;
  color: string;
}

export const SHIELD_CATALOG: ShieldDef[] = [
  {
    id: 'deflector',
    name: 'Deflector Estándar',
    price: 0,
    description: 'Absorbe 800 SP (el escudo absorbe el 70% del daño antes de tocar el casco).',
    effect: 'Absorbe 70% del daño (800 SP)',
    color: '#38bdf8'
  },
  {
    id: 'ricochet',
    name: 'Rebote / Ricochet',
    price: 40,
    description: 'Los proyectiles balísticos y metralla rebotan elásticamente en ángulo opuesto.',
    effect: 'Rebota proyectiles balísticos',
    color: '#a855f7'
  },
  {
    id: 'absorb',
    name: 'Colector / Absorción',
    price: 60,
    description: 'Convierte el 60% del daño en recarga de combustible de salto y +30 CR.',
    effect: '+60% absorción a combustible y créditos',
    color: '#10b981'
  },
  {
    id: 'phase',
    name: 'Cuántico de Fase',
    price: 75,
    description: 'La nave es semi-incorpórea; proyectiles cinéticos la atraviesan sin daño (vulnerable a PEM y antimateria).',
    effect: 'Intangibilidad ante proyectiles cinéticos',
    color: '#818cf8'
  },
  {
    id: 'repulsor',
    name: 'Gravitatorio Repulsor',
    price: 90,
    description: 'Emite una fuerza de repulsión que curva y desvía bombas pesadas antes del impacto.',
    effect: 'Campo de fuerza de desvío cinético',
    color: '#22d3ee'
  },
  {
    id: 'reflector',
    name: 'Espejo Reflector',
    price: 100,
    description: 'Refleja armas de taquiones y rayos de energía hacia el atacante.',
    effect: 'Devuelve proyectiles de energía',
    color: '#f43f5e'
  },
  {
    id: 'bastion',
    name: 'Bastión Pesado',
    price: 120,
    description: '+1000 SP de protección masiva (+1800 SP total); inmoviliza a la nave ese turno.',
    effect: '+1000 SP de blindaje colosal',
    color: '#f59e0b'
  },
  {
    id: 'anti_emp',
    name: 'Aislante Anti-PEM',
    price: 130,
    description: 'Inmunidad total contra el drenaje de sistemas y combustible provocado por PEM.',
    effect: 'Inmunidad total a interferencias PEM',
    color: '#34d399'
  }
];


export interface Planet {
  id: number;
  name: string;
  x: number;
  y: number;
  radius: number;
  initialRadius: number;
  baseMass: number;
  currentMass: number;
  type: PlanetMaterialType;
  material: PlanetMaterialInfo;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  gravitonInvertedUntil: number; // timestamp
}

export interface Ship {
  id: PlayerId;
  planetId: number;
  surfaceAngle: number; // Angle around planet
  x: number;
  y: number;
  aimAngle: number; // 0-360 degrees
  power: number; // 10-100
  weaponId: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  fuel: number;
  credits: number;
  alive: boolean;
  color: string;
  name: string;
  model: ShipModel;
  isAI: boolean;
  isAirborne: boolean;
  vx: number;
  vy: number;
  flightTime: number;
  jumpTrail: { x: number; y: number; alpha: number }[];
  shieldType: ShieldType;
  lastHitTime?: number;
}


export interface FuelGem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  radius: number;
  spinOffset: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  isBuried: boolean;
  planetId?: number;
  radius: number;
  collected: boolean;
  spinOffset: number;
}

export interface Projectile {
  id: number;
  weapon: WeaponDef;
  ownerId: PlayerId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; alpha: number }[];
  recordedTrail?: { x: number; y: number }[];
  planetsCircled?: Set<number>;
  bouncesLeft?: number;
  ghostPhasePassed?: boolean;
  isBorer?: boolean;
  borerDist?: number;
  isMine?: boolean;
  isCrawler?: boolean;
  crawlerPlanetId?: number;
  crawlerAngle?: number;
  splitTriggered?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Singularity {
  x: number;
  y: number;
  strength: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface NapalmFire {
  planetId: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface FloatingDamageNumber {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GameConfig {
  mode: 'vs_ai' | 'pass_play' | 'online';
  playerCount: 1 | 2 | 3;
  models: { 1: ShipModel; 2: ShipModel; 3: ShipModel };
  aiPlayers: { 2?: boolean; 3?: boolean };
}

function createPRNG(seed: number) {
  let s = (Math.abs(Math.floor(seed)) % 2147483647) || 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class WarHeadsEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  public planets: Planet[] = [];
  public ships: Ship[] = [];
  public coins: Coin[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public singularities: Singularity[] = [];
  public napalms: NapalmFire[] = [];
  public fuelGems: FuelGem[] = [];
  public damageNumbers: FloatingDamageNumber[] = [];
  public selectedPlanetId: number | null = null;
  public scale: number = 1.0;
  public firstBloodClaimed: boolean = false;
  public hasConfiguredDefense: Record<PlayerId, boolean> = { 1: false, 2: false, 3: false };
  public onTacticalBonus?: (text: string, color: string) => void;

  public currentTurn: PlayerId = 1;
  public isSimulating = false;
  public roundWinner: PlayerId | 'draw' | null = null;
  public currentSeed: number = 1001;

  public gameConfig: GameConfig = {
    mode: 'pass_play',
    playerCount: 2,
    models: { 1: 'enterprise', 2: 'falcon', 3: 'xwing' },
    aiPlayers: {}
  };

  public width: number;
  public height: number;

  public onTurnChange?: (turn: PlayerId) => void;
  public onStateUpdate?: () => void;
  public onGameOver?: (winner: PlayerId | 'draw') => void;
  public onCoinCollected?: (playerId: PlayerId, amount: number) => void;

  // Tactical Manual Zoom & Pan System (0.55x to 1.0x - Cero Over-Zoom, tope máximo 100%)
  public userZoom: number = 1.0;
  public panX: number = 0;
  public panY: number = 0;

  public setZoom(zoom: number) {
    // Rango estricto: 0.55x (vista general) a 1.0x (100% nativo). Zoom > 1.0 bloqueado terminantemente.
    this.userZoom = Math.max(0.55, Math.min(1.0, Math.round(zoom * 100) / 100));
    this.onStateUpdate?.();
  }

  public zoomIn(delta: number = 0.15) {
    if (this.userZoom >= 1.0) return;
    this.setZoom(Math.min(1.0, this.userZoom + delta));
  }

  public zoomOut(delta: number = 0.15) {
    if (this.userZoom <= 0.55) return;
    this.setZoom(Math.max(0.55, this.userZoom - delta));
  }

  public resetZoom() {
    this.userZoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.onStateUpdate?.();
  }

  public screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const effectiveScale = this.scale * this.userZoom;
    const wx = (clientX - (cx + this.panX)) / effectiveScale + this.width / 2;
    const wy = (clientY - (cy + this.panY)) / effectiveScale + this.height / 2;
    return { x: wx, y: wy };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const effectiveScale = this.scale * this.userZoom;
    const sx = cx + this.panX + (worldX - this.width / 2) * effectiveScale;
    const sy = cy + this.panY + (worldY - this.height / 2) * effectiveScale;
    return { x: sx, y: sy };
  }

  public spawnDamageNumber(x: number, y: number, text: string, color: string): void {
    this.damageNumbers.push({
      id: Math.random(),
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.9 - Math.random() * 0.3,
      text,
      color,
      alpha: 1.0,
      life: 0,
      maxLife: 48
    });
  }

  public selectPlanet(id: number | null): void {
    this.selectedPlanetId = id;
    this.onStateUpdate?.();
  }

  private stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];
  private lastTime = 0;
  private animFrameId = 0;
  private aiThinkTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const clientW = canvas.clientWidth || 390;
    const clientH = canvas.clientHeight || 650;
    this.scale = clientW / 900;
    this.width = 900;
    this.height = Math.round(clientH / this.scale);
    this.canvas.width = clientW;
    this.canvas.height = clientH;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    this.initStars();
    this.initScenario();
    this.startLoop();
  }

  public resize(clientW: number, clientH: number) {
    if (clientW <= 0 || clientH <= 0) return;
    const newScale = clientW / 900;
    const newHeight = Math.round(clientH / newScale);
    this.scale = newScale;
    this.canvas.width = clientW;
    this.canvas.height = clientH;
    if (Math.abs(this.height - newHeight) > 12) {
      this.height = newHeight;
      this.initStars();
    }
  }

  private initStars() {
    this.stars = [];
    const count = Math.min(260, Math.floor((this.width * this.height) / 3800));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() < 0.85 ? 1 : Math.random() * 2 + 1,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2.0
      });
    }
  }

  /**
   * Procedural Random Level Generator with Coins, Planets, and 1-3 Ships
   */
  public initScenario(seed?: number, config?: GameConfig) {
    if (config) {
      this.gameConfig = config;
    }

    this.projectiles = [];
    this.particles = [];
    this.singularities = [];
    this.napalms = [];
    this.damageNumbers = [];
    this.selectedPlanetId = null;
    this.roundWinner = null;
    this.isSimulating = false;
    this.currentTurn = 1;
    this.aiThinkTimer = 0;
    this.firstBloodClaimed = false;
    this.hasConfiguredDefense = { 1: false, 2: false, 3: false };

    const actualSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);
    this.currentSeed = actualSeed;
    const rng = createPRNG(actualSeed);

    const w = this.width;
    const h = this.height;

    // 1. ALGORITMO DE POISSON DISK SAMPLING MODIFICADO
    // - Distribución equitativa por todo el campo orbital (norte, sur y flancos tácticos)
    // - Distancia mínima estricta de 120px entre bordes: dist >= r1 + r2 + 120
    // - Evita agrupaciones en el centro: máximo 1 planeta en el núcleo central (radio 145px)
    // - Márgenes de seguridad estrictos (75px laterales, 110px superior/inferior)
    this.planets = [];
    const minEdgeDistance = 120; // 120px estrictos garantizados entre bordes
    const marginX = 75;
    const marginY = 110;
    const minX = marginX;
    const maxX = w - marginX;
    const minY = marginY;
    const maxY = h - marginY;
    const arenaCenterX = w / 2;
    const arenaCenterY = h / 2;
    const centerCoreRadius = 145; // Zona de exclusión para evitar amontonamiento en el centro

    interface PoissonSample {
      x: number;
      y: number;
      radius: number;
      type: PlanetMaterialType;
    }

    const samples: PoissonSample[] = [];

    // Verificador de candidato Poisson: cumple bordes de pantalla, distancia >= r1 + r2 + 120px, y sin amontonamiento central
    const isValidSample = (cx: number, cy: number, cr: number): boolean => {
      // Límites de pantalla con márgenes de seguridad
      if (cx - cr < minX || cx + cr > maxX) return false;
      if (cy - cr < minY || cy + cr > maxY) return false;

      // Prevención estricta de agrupaciones en el centro: máximo 1 planeta en el núcleo central
      const distToCenter = Math.hypot(cx - arenaCenterX, cy - arenaCenterY);
      if (distToCenter < centerCoreRadius) {
        const inCenter = samples.filter(s => Math.hypot(s.x - arenaCenterX, s.y - arenaCenterY) < centerCoreRadius);
        if (inCenter.length >= 1) return false;
      }

      // Condición estricta de Poisson Disk con distancia mínima de 120px entre bordes
      for (const s of samples) {
        const d = Math.hypot(cx - s.x, cy - s.y);
        if (d < cr + s.radius + minEdgeDistance) {
          return false;
        }
      }
      return true;
    };

    const targetPlanetCount = this.gameConfig.playerCount >= 3 ? (rng() < 0.5 ? 4 : 5) : (rng() < 0.65 ? 3 : 4);

    // Sectores espaciales para distribución equilibrada en el mapa vertical:
    // Sector 0: Cuadrante Superior Izquierdo (Top-Left - base obligatoria P1)
    // Sector 1: Cuadrante Inferior Derecho (Bottom-Right - base obligatoria P2)
    const sectors = [
      // Sector 0: Cuadrante Superior Izquierdo (Top-Left)
      {
        minX: minX + 15, maxX: Math.min(arenaCenterX - 45, minX + (maxX - minX) * 0.40),
        minY: minY + 15, maxY: Math.min(arenaCenterY - 45, minY + (maxY - minY) * 0.30)
      },
      // Sector 1: Cuadrante Inferior Derecho (Bottom-Right)
      {
        minX: Math.max(arenaCenterX + 45, maxX - (maxX - minX) * 0.40), maxX: maxX - 15,
        minY: Math.max(arenaCenterY + 45, maxY - (maxY - minY) * 0.30), maxY: maxY - 15
      },
      // Sector 2: Flanco Superior Derecho (Cuadrante Noreste)
      {
        minX: Math.max(arenaCenterX + 35, maxX - (maxX - minX) * 0.40), maxX: maxX - 20,
        minY: minY + 20, maxY: Math.min(arenaCenterY - 35, minY + (maxY - minY) * 0.32)
      },
      // Sector 3: Flanco Inferior Izquierdo (Cuadrante Suroeste)
      {
        minX: minX + 20, maxX: Math.min(arenaCenterX - 35, minX + (maxX - minX) * 0.40),
        minY: Math.max(arenaCenterY + 35, maxY - (maxY - minY) * 0.32), maxY: maxY - 20
      },
      // Sector 4: Flanco Central Desplazado
      {
        minX: minX + (maxX - minX) * 0.30, maxX: maxX - (maxX - minX) * 0.30,
        minY: arenaCenterY - 60, maxY: arenaCenterY + 60
      }
    ];

    // Asignación de materiales canónicos con composición física real
    const materialPool: PlanetMaterialType[] = ['ice', 'rock', 'iron', 'gas', 'neutron'];
    const pickMaterial = (radius: number, index: number): PlanetMaterialType => {
      // Garantizar que los planetas 0 y 1 (donde nacen las naves) sean sólidos (hielo, roca, hierro o neutron)
      if (index === 0 || index === 1) {
        const solids: PlanetMaterialType[] = ['rock', 'ice', 'iron', 'neutron'];
        return solids[Math.floor(rng() * solids.length)];
      }
      if (radius >= 48 && rng() < 0.6) return 'gas';
      return materialPool[Math.floor(rng() * materialPool.length)];
    };

    // 1. Sembrado primario en Sector 0 (Top-Left) y Sector 1 (Bottom-Right)
    // Garantiza planetas en esquinas opuestas para P1 y P2 con distancia >= 55% de la diagonal
    const canvasDiagonal = Math.hypot(w, h);
    const minRequiredShipDistance = canvasDiagonal * 0.55;

    // Sembrar P1 en Sector 0 (Top-Left)
    const sec0 = sectors[0];
    for (let attempt = 0; attempt < 80; attempt++) {
      const rad = Math.floor(28 + rng() * 20); // 28px a 48px
      const cx = sec0.minX + rng() * (sec0.maxX - sec0.minX);
      const cy = sec0.minY + rng() * (sec0.maxY - sec0.minY);
      if (isValidSample(cx, cy, rad)) {
        samples.push({ x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) });
        break;
      }
    }

    // Sembrar P2 en Sector 1 (Bottom-Right) con holgura diagonal garantizada
    const sec1 = sectors[1];
    let p2Placed = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      const rad = Math.floor(28 + rng() * 20);
      const cx = sec1.minX + rng() * (sec1.maxX - sec1.minX);
      const cy = sec1.minY + rng() * (sec1.maxY - sec1.minY);
      if (isValidSample(cx, cy, rad)) {
        const centerDist = Math.hypot(cx - samples[0].x, cy - samples[0].y);
        if (centerDist >= minRequiredShipDistance + 60) {
          samples.push({ x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) });
          p2Placed = true;
          break;
        }
      }
    }
    if (!p2Placed) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const rad = Math.floor(28 + rng() * 20);
        const cx = sec1.minX + rng() * (sec1.maxX - sec1.minX);
        const cy = sec1.minY + rng() * (sec1.maxY - sec1.minY);
        if (isValidSample(cx, cy, rad)) {
          samples.push({ x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) });
          break;
        }
      }
    }

    // 2. Muestreo de Poisson Disk anular y por sectores para completar la distribución equitativa
    const activeQueue = [...samples];
    const candidateRadii = [32, 36, 42, 28, 48, 38];

    // Iteración de Poisson mientras haya puntos activos y no alcancemos la meta
    while (activeQueue.length > 0 && samples.length < targetPlanetCount) {
      const activeIdx = Math.floor(rng() * activeQueue.length);
      const active = activeQueue[activeIdx];
      let foundNeighbor = false;

      // Bridson annular candidate sampling: k = 30 intentos alrededor del punto activo
      for (let k = 0; k < 30; k++) {
        const rad = candidateRadii[Math.floor(rng() * candidateRadii.length)];
        const minD = active.radius + rad + minEdgeDistance;
        const maxD = minD + 180;
        const dist = minD + rng() * (maxD - minD);
        const theta = rng() * Math.PI * 2;
        const cx = active.x + Math.cos(theta) * dist;
        const cy = active.y + Math.sin(theta) * dist;

        if (isValidSample(cx, cy, rad)) {
          const newSample = { x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) };
          samples.push(newSample);
          activeQueue.push(newSample);
          foundNeighbor = true;
          break;
        }
      }

      if (!foundNeighbor) {
        // Remover del activeQueue si no se pudieron generar más candidatos viables
        activeQueue.splice(activeIdx, 1);
      }
    }

    // 3. Si la cola anular se agotó antes de alcanzar el mínimo necesario,
    // sembrar en los sectores intermedios (Flancos Este / Oeste) respetando estrictamente los 120px
    if (samples.length < targetPlanetCount) {
      const remainingSectors = [sectors[2], sectors[3], sectors[4]];
      for (const sec of remainingSectors) {
        if (samples.length >= targetPlanetCount) break;
        for (let attempt = 0; attempt < 80; attempt++) {
          const rad = Math.floor(28 + rng() * 20);
          const cx = sec.minX + rng() * (sec.maxX - sec.minX);
          const cy = sec.minY + rng() * (sec.maxY - sec.minY);
          if (isValidSample(cx, cy, rad)) {
            samples.push({ x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) });
            break;
          }
        }
      }
    }

    // Asegurar siempre un mínimo estricto de 3 planetas (o 4 para 3 jugadores)
    const absoluteMinPlanets = this.gameConfig.playerCount >= 3 ? 4 : 3;
    if (samples.length < absoluteMinPlanets) {
      // Búsqueda de cuadrícula fina para encontrar cualquier hueco legal con separación >= 120px
      for (let cy = minY + 40; cy <= maxY - 40 && samples.length < absoluteMinPlanets; cy += 45) {
        for (let cx = minX + 40; cx <= maxX - 40 && samples.length < absoluteMinPlanets; cx += 45) {
          const rad = 28;
          if (isValidSample(cx, cy, rad)) {
            samples.push({ x: Math.round(cx), y: Math.round(cy), radius: rad, type: pickMaterial(rad, samples.length) });
          }
        }
      }
    }

    const planetDesignations = [
      'PLANETA K-9', 'PLANETA TITÁN-IV', 'PLANETA AURA-7',
      'PLANETA VORTEX-IX', 'PLANETA OMEGA-2', 'PLANETA ZETA-3',
      'PLANETA KRONOS-V', 'PLANETA CYGNUS-X', 'PLANETA HYDRA-1'
    ];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const material = PLANET_MATERIALS[s.type];
      const baseMass = Math.max(25, Math.round(160 * Math.pow(s.radius / 45, 2) * material.density));
      const planetCanvas = generatePlanetCanvas({
        type: s.type,
        radius: s.radius,
        seed: Math.floor(rng() * 100000)
      });
      const pName = planetDesignations[i % planetDesignations.length];

      this.planets.push({
        id: i + 1,
        name: pName,
        x: s.x,
        y: s.y,
        radius: s.radius,
        initialRadius: s.radius,
        baseMass,
        currentMass: baseMass,
        type: s.type,
        material,
        canvas: planetCanvas,
        ctx: planetCanvas.getContext('2d', { willReadFrequently: true })!,
        gravitonInvertedUntil: 0
      });
    }

    // 2. Generate Historical WarHeads Gold Coins:
    // (a) Orbital Coins in open space + (b) Geological buried coins in planets
    this.coins = [];
    let coinId = 1;

    // (a) Floating Orbital Coins (6 to 8 coins in vacuum)
    const orbitalCount = Math.floor(5 + rng() * 3);
    for (let c = 0; c < orbitalCount; c++) {
      let cx = 35 + rng() * (w - 70);
      let cy = 40 + rng() * (h - 80);
      let insidePlanet = false;
      for (const p of this.planets) {
        if (Math.hypot(cx - p.x, cy - p.y) < p.radius + 20) {
          insidePlanet = true;
          break;
        }
      }
      if (!insidePlanet) {
        this.coins.push({
          id: coinId++,
          x: Math.round(cx),
          y: Math.round(cy),
          isBuried: false,
          radius: 8,
          collected: false,
          spinOffset: rng() * Math.PI * 2
        });
      }
    }

    // (b) Geological Coins Buried under planetary rock (1-2 per planet)
    for (const p of this.planets) {
      const buriedCount = Math.floor(1 + rng() * 2);
      for (let b = 0; b < buriedCount; b++) {
        const bAngle = rng() * Math.PI * 2;
        const bDist = p.radius * (0.35 + rng() * 0.45);
        this.coins.push({
          id: coinId++,
          x: Math.round(p.x + Math.cos(bAngle) * bDist),
          y: Math.round(p.y + Math.sin(bAngle) * bDist),
          isBuried: true,
          planetId: p.id,
          radius: 8,
          collected: false,
          spinOffset: rng() * Math.PI * 2
        });
      }
    }


    // (c) Gemas de Combustible Verde (+30% Fuel) en órbita estratégica
    this.fuelGems = [];
    let gemId = 1;
    const gemCount = Math.floor(3 + rng() * 2); // 3 a 4 cristales
    for (let g = 0; g < gemCount; g++) {
      let gx = 80 + rng() * (w - 160);
      let gy = 120 + rng() * (h - 240);
      let insidePlanet = false;
      for (const p of this.planets) {
        if (Math.hypot(gx - p.x, gy - p.y) < p.radius + 35) {
          insidePlanet = true;
          break;
        }
      }
      if (!insidePlanet) {
        this.fuelGems.push({
          id: gemId++,
          x: Math.round(gx),
          y: Math.round(gy),
          collected: false,
          radius: 9,
          spinOffset: rng() * Math.PI * 2
        });
      }
    }

    // 3. Spawning Táctico de Naves en Cuadrantes Opuestos (P1 Top-Left, P2 Bottom-Right)
    // - P1 forzado al Cuadrante Superior Izquierdo (Top-Left: x < w/2, y < h/2)
    // - P2 forzado al Cuadrante Inferior Derecho (Bottom-Right: x > w/2, y > h/2)
    // - Planetas distintos garantizados (NUNCA en gigantes gaseosos)
    // - Distancia lineal mínima garantizada de al menos el 55% de la diagonal del canvas
    const count = this.gameConfig.playerCount;
    const solidPlanets = this.planets.filter(p => !p.material.isGas);
    const candidatePlanets = solidPlanets.length >= 2 ? solidPlanets : this.planets;

    // 1. Planeta para Jugador 1: Cuadrante Superior Izquierdo (Top-Left)
    const topLeftPlanets = candidatePlanets.filter(p => p.x < arenaCenterX && p.y < arenaCenterY);
    let p1Planet = topLeftPlanets.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y))[0];
    if (!p1Planet) {
      p1Planet = candidatePlanets.slice().sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y))[0];
    }

    // 2. Planeta para Jugador 2: Cuadrante Inferior Derecho (Bottom-Right), estrictamente DISTINTO a P1
    const bottomRightPlanets = candidatePlanets.filter(p => p.id !== p1Planet.id && p.x > arenaCenterX && p.y > arenaCenterY);
    let p2Planet = bottomRightPlanets.slice().sort((a, b) => (b.x + b.y) - (a.x + a.y))[0];
    if (!p2Planet) {
      p2Planet = candidatePlanets.filter(p => p.id !== p1Planet.id).slice().sort((a, b) => Math.hypot(w - a.x, h - a.y) - Math.hypot(w - b.x, h - b.y))[0] || candidatePlanets[1];
    }

    // 3. Planeta para Jugador 3 (si hay 3 jugadores): planeta distinto a P1 y P2
    let p3Planet: Planet | undefined;
    if (count >= 3) {
      p3Planet = candidatePlanets.find(p => p.id !== p1Planet.id && p.id !== p2Planet.id) || candidatePlanets[0];
    }

    // Optimización de ángulos orbitales para P1 y P2:
    // Asegura que P1 quede en Top-Left, P2 en Bottom-Right, y dist(P1, P2) >= 55% diagonal
    let sAngle1 = Math.PI * 0.25;
    let sAngle2 = -Math.PI * 0.75;
    let bestScore = -Infinity;

    for (let a1 = 0; a1 < Math.PI * 2; a1 += Math.PI / 36) {
      const x1 = p1Planet.x + Math.cos(a1) * (p1Planet.radius + 10);
      const y1 = p1Planet.y + Math.sin(a1) * (p1Planet.radius + 10);
      if (x1 >= arenaCenterX || y1 >= arenaCenterY) continue; // P1 en cuadrante superior izquierdo

      for (let a2 = 0; a2 < Math.PI * 2; a2 += Math.PI / 36) {
        const x2 = p2Planet.x + Math.cos(a2) * (p2Planet.radius + 10);
        const y2 = p2Planet.y + Math.sin(a2) * (p2Planet.radius + 10);
        if (x2 <= arenaCenterX || y2 <= arenaCenterY) continue; // P2 en cuadrante inferior derecho

        const d = Math.hypot(x2 - x1, y2 - y1);
        if (d >= minRequiredShipDistance + 1.0) {
          const inward1 = Math.cos(a1 - Math.atan2(arenaCenterY - p1Planet.y, arenaCenterX - p1Planet.x));
          const inward2 = Math.cos(a2 - Math.atan2(arenaCenterY - p2Planet.y, arenaCenterX - p2Planet.x));
          const score = d + (inward1 + inward2) * 50;
          if (score > bestScore) {
            bestScore = score;
            sAngle1 = a1;
            sAngle2 = a2;
          }
        }
      }
    }

    // Fallback de seguridad: maximizar distancia lineal garantizada
    if (bestScore === -Infinity) {
      let maxDistFound = 0;
      for (let a1 = 0; a1 < Math.PI * 2; a1 += Math.PI / 36) {
        const x1 = p1Planet.x + Math.cos(a1) * (p1Planet.radius + 10);
        const y1 = p1Planet.y + Math.sin(a1) * (p1Planet.radius + 10);
        for (let a2 = 0; a2 < Math.PI * 2; a2 += Math.PI / 36) {
          const x2 = p2Planet.x + Math.cos(a2) * (p2Planet.radius + 10);
          const y2 = p2Planet.y + Math.sin(a2) * (p2Planet.radius + 10);
          const d = Math.hypot(x2 - x1, y2 - y1);
          if (d > maxDistFound) {
            maxDistFound = d;
            sAngle1 = a1;
            sAngle2 = a2;
          }
        }
      }
    }

    const sAngle3 = (rng() > 0.5 ? 0.05 : Math.PI - 0.05) + (rng() - 0.5) * 0.25;

    const shipConfigs = [
      { id: 1 as PlayerId, color: '#38bdf8', name: 'USS ENTERPRISE (P1)', isAI: false },
      { id: 2 as PlayerId, color: '#f43f5e', name: 'HALCÓN MILENARIO (P2)', isAI: !!this.gameConfig.aiPlayers[2] },
      { id: 3 as PlayerId, color: '#eab308', name: 'ALA-X T-65B (P3)', isAI: !!this.gameConfig.aiPlayers[3] }
    ];

    const activeCount = this.gameConfig.mode === 'vs_ai' ? (count === 1 ? 2 : count) : count;

    this.ships = [];
    for (let i = 0; i < activeCount; i++) {
      let pl: Planet;
      let sAngle: number;

      if (i === 0) {
        pl = p1Planet;
        sAngle = sAngle1;
      } else if (i === 1) {
        pl = p2Planet;
        sAngle = sAngle2;
      } else {
        pl = p3Planet || candidatePlanets[2 % candidatePlanets.length];
        sAngle = sAngle3;
      }

      const sx = Math.round(pl.x + Math.cos(sAngle) * (pl.radius + 10));
      const sy = Math.round(pl.y + Math.sin(sAngle) * (pl.radius + 10));

      // Aim towards arena center
      const targetX = this.width / 2;
      const targetY = this.height / 2;
      const aimDeg = Math.round(((Math.atan2(sy - targetY, targetX - sx) * 180) / Math.PI + 360) % 360);

      const pid = (i + 1) as PlayerId;
      const sc = shipConfigs[i];

      this.ships.push({
        id: pid,
        planetId: pl.id,
        surfaceAngle: sAngle,
        x: sx,
        y: sy,
        aimAngle: aimDeg,
        power: 65,
        weaponId: 1, // Standard Warhead (Free)
        hp: 1800,
        maxHp: 1800,
        shield: 800,
        maxShield: 800,
        fuel: 100,
        credits: 300, // Starting Credits
        alive: true,
        color: sc.color,
        name: sc.name,
        model: this.gameConfig.models[pid] || (pid === 1 ? 'enterprise' : pid === 2 ? 'falcon' : 'xwing'),
        isAI: this.gameConfig.mode === 'vs_ai' ? (pid >= 2) : !!this.gameConfig.aiPlayers[pid as 2 | 3],
        isAirborne: false,
        vx: 0,
        vy: 0,
        flightTime: 0,
        jumpTrail: [],
        shieldType: 'deflector',
        lastHitTime: 0
      });
    }

    this.onStateUpdate?.();
  }


  public selectShield(shieldId: ShieldType): boolean {
    if (this.isSimulating || this.roundWinner) return false;
    const currentShip = this.ships.find(s => s.id === this.currentTurn);
    if (!currentShip || !currentShip.alive) return false;
    const def = SHIELD_CATALOG.find(s => s.id === shieldId);
    if (!def) return false;
    if (currentShip.shieldType === shieldId) return true;

    if (def.price > 0 && currentShip.credits < def.price) {
      sound.playBeep(180, 0.1);
      return false;
    }

    if (def.price > 0) {
      currentShip.credits -= def.price;
    }

    currentShip.shieldType = shieldId;
    if (shieldId === 'bastion') {
      currentShip.maxShield = 1800;
      currentShip.shield = Math.min(1800, currentShip.shield + 1000);
    }
    sound.playBeep(960, 0.1);
    this.onStateUpdate?.();
    return true;
  }

  public fireCurrentWeapon(): boolean {
    if (this.isSimulating || this.roundWinner) return false;
    const currentShip = this.ships.find(s => s.id === this.currentTurn);
    if (!currentShip || !currentShip.alive || currentShip.isAirborne) return false;

    const weapon = WEAPON_CATALOG.find(w => w.id === currentShip.weaponId) || WEAPON_CATALOG[0];

    // Check Credits
    if (currentShip.credits < weapon.price) {
      sound.playBeep(180, 0.1);
      return false;
    }

    // Deduct cost
    currentShip.credits -= weapon.price;

    const rad = (currentShip.aimAngle * Math.PI) / 180;
    // Calibrated Power Curve:
    // 10%-40%: suborbital arcs; 50%-75%: stable slingshots/orbits; >=80%: guaranteed hyperbolic escape velocity
    const baseSpeed = (currentShip.power * 0.165 + 2.2) * weapon.speedMultiplier;

    const barrelLen = 22;
    const startX = currentShip.x + Math.cos(rad) * barrelLen;
    const startY = currentShip.y - Math.sin(rad) * barrelLen;

    const vx = Math.cos(rad) * baseSpeed;
    const vy = -Math.sin(rad) * baseSpeed;

    sound.playLaunch(weapon.speedMultiplier, weapon.id === 15 || weapon.id === 20);

    if (weapon.specialBehavior === 'trispread') {
      for (const offsetDeg of [-6, 0, 6]) {
        const offRad = ((currentShip.aimAngle + offsetDeg) * Math.PI) / 180;
        const px = currentShip.x + Math.cos(offRad) * barrelLen;
        const py = currentShip.y - Math.sin(offRad) * barrelLen;
        this.projectiles.push({
          id: Math.random(),
          weapon,
          ownerId: currentShip.id,
          x: px,
          y: py,
          vx: Math.cos(offRad) * baseSpeed,
          vy: -Math.sin(offRad) * baseSpeed,
          life: 0,
          maxLife: 900,
          trail: [],
          recordedTrail: offsetDeg === 0 ? [{ x: px, y: py }] : undefined
        });
      }
    } else {
      this.projectiles.push({
        id: Math.random(),
        weapon,
        ownerId: currentShip.id,
        x: startX,
        y: startY,
        vx,
        vy,
        life: 0,
        maxLife: 900,
        trail: [],
        recordedTrail: [{ x: startX, y: startY }],
        bouncesLeft: weapon.specialBehavior === 'ricochet' ? 3 : 0,
        isBorer: weapon.specialBehavior === 'tunnel',
        borerDist: 0,
        isMine: weapon.specialBehavior === 'mine',
        isCrawler: weapon.specialBehavior === 'crawler'
      });
    }

    // Muzzle flash particles
    for (let i = 0; i < 16; i++) {
      const pRad = rad + (Math.random() - 0.5) * 0.6;
      const pSpeed = Math.random() * 3 + 1;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(pRad) * pSpeed,
        vy: -Math.sin(pRad) * pSpeed,
        life: 0,
        maxLife: 18 + Math.random() * 12,
        color: weapon.color,
        size: Math.random() * 3 + 1.5
      });
    }

    this.isSimulating = true;
    this.onStateUpdate?.();
    return true;
  }

  public executeHyperJump(): boolean {
    if (this.isSimulating || this.roundWinner) return false;
    const currentShip = this.ships.find(s => s.id === this.currentTurn);
    if (!currentShip || !currentShip.alive || currentShip.isAirborne) return false;

    // Bastión Pesado: +800 SP pero anula el salto en ese turno
    if (currentShip.shieldType === 'bastion') {
      sound.playBeep(180, 0.15);
      this.onTacticalBonus?.('BASTIÓN: SALTO INHIBIDO', '#f59e0b');
      return false;
    }

    if (currentShip.fuel < 25) {
      sound.playBeep(220, 0.1);
      return false;
    }

    currentShip.fuel = Math.max(0, currentShip.fuel - 30);

    const rad = (currentShip.aimAngle * Math.PI) / 180;
    // Calibración de impulso hiperbólico para salto orbital
    const jumpSpeed = currentShip.power * 0.155 + 3.5;
    const liftoffMargin = 16 + (currentShip.power >= 70 ? 8 : 4);
    const liftoffVel = 2.5 + (currentShip.power >= 70 ? 3.0 : 1.0);

    // Bonificación base de despegue vertical para vencer la inercia estática inicial
    currentShip.x += Math.cos(currentShip.surfaceAngle) * liftoffMargin;
    currentShip.y += Math.sin(currentShip.surfaceAngle) * liftoffMargin;

    currentShip.vx = Math.cos(rad) * jumpSpeed + Math.cos(currentShip.surfaceAngle) * liftoffVel;
    currentShip.vy = -Math.sin(rad) * jumpSpeed + Math.sin(currentShip.surfaceAngle) * liftoffVel;
    currentShip.isAirborne = true;
    currentShip.flightTime = 0;
    currentShip.jumpTrail = [];

    currentShip.x += currentShip.vx * 1.5;
    currentShip.y += currentShip.vy * 1.5;

    sound.playHyperJump();

    for (let i = 0; i < 24; i++) {
      const pRad = rad + Math.PI + (Math.random() - 0.5) * 0.8;
      const pSpeed = Math.random() * 4.5 + 1.5;
      this.particles.push({
        x: currentShip.x,
        y: currentShip.y,
        vx: Math.cos(pRad) * pSpeed,
        vy: Math.sin(pRad) * pSpeed,
        life: 0,
        maxLife: 28 + Math.random() * 16,
        color: Math.random() < 0.5 ? currentShip.color : '#f97316',
        size: Math.random() * 3.5 + 2
      });
    }

    this.isSimulating = true;
    this.onStateUpdate?.();
    return true;
  }

  /**
   * Destructible Carving con Dureza Estructural de Material:
   * Radio_Cráter = R_blast / Dureza_Material
   * Gas Giants no sufren huecos permanentes, disipan nubes de gas.
   */
  public carvePlanet(planet: Planet, worldX: number, worldY: number, blastRadius: number): void {
    if (planet.material.isGas) {
      sound.playRockCrumble();
      for (let d = 0; d < 18; d++) {
        const dAngle = Math.random() * Math.PI * 2;
        const dSpeed = Math.random() * 2.8 + 0.6;
        this.particles.push({
          x: worldX,
          y: worldY,
          vx: Math.cos(dAngle) * dSpeed,
          vy: Math.sin(dAngle) * dSpeed,
          life: 0,
          maxLife: 20 + Math.random() * 15,
          color: Math.random() < 0.6 ? '#fb923c' : '#fdba74',
          size: Math.random() * 3.5 + 1.8
        });
      }
      return;
    }

    // Fórmula de Resistencia al Minado: Radio_Cráter = R_blast / Dureza_Material
    const effRadius = Math.max(3, Math.round(blastRadius / planet.material.hardness));

    const lx = worldX - (planet.x - planet.radius);
    const ly = worldY - (planet.y - planet.radius);

    planet.ctx.save();
    planet.ctx.globalCompositeOperation = 'destination-out';
    planet.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    planet.ctx.beginPath();
    planet.ctx.arc(lx, ly, effRadius, 0, Math.PI * 2);
    planet.ctx.fill();

    const fringes = 6;
    for (let i = 0; i < fringes; i++) {
      const fAngle = Math.random() * Math.PI * 2;
      const fDist = effRadius * 0.85 + Math.random() * (effRadius * 0.35);
      const fRad = effRadius * 0.28 + Math.random() * (effRadius * 0.2);
      planet.ctx.beginPath();
      planet.ctx.arc(lx + Math.cos(fAngle) * fDist, ly + Math.sin(fAngle) * fDist, fRad, 0, Math.PI * 2);
      planet.ctx.fill();
    }
    planet.ctx.restore();

    const massReduction = Math.min(planet.currentMass * 0.45, (effRadius / planet.initialRadius) * 25);
    planet.currentMass = Math.max(20, planet.currentMass - massReduction);

    sound.playRockCrumble();

    // Spawn debris particles according to material composition
    const debrisCount = Math.floor(effRadius * 0.8);
    let debrisColor = '#a8a29e';
    if (planet.type === 'ice') debrisColor = Math.random() < 0.5 ? '#e0f2fe' : '#38bdf8';
    else if (planet.type === 'iron') debrisColor = Math.random() < 0.5 ? '#fbbf24' : '#71717a';
    else if (planet.type === 'neutron') debrisColor = Math.random() < 0.5 ? '#c084fc' : '#a855f7';

    for (let d = 0; d < debrisCount; d++) {
      const dAngle = Math.random() * Math.PI * 2;
      const dSpeed = Math.random() * 3.5 + 0.8;
      this.particles.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(dAngle) * dSpeed,
        vy: Math.sin(dAngle) * dSpeed,
        life: 0,
        maxLife: 30 + Math.random() * 25,
        color: debrisColor,
        size: Math.random() * 3.2 + 1.2
      });
    }

    this.settleShips(planet);
  }

  private settleShips(planet: Planet): void {
    for (const ship of this.ships) {
      if (!ship.alive || ship.isAirborne || ship.planetId !== planet.id) continue;

      let curDist = Math.hypot(ship.x - planet.x, ship.y - planet.y);
      const minAllowableDist = 18;

      while (curDist > minAllowableDist) {
        const lx = Math.floor(ship.x - (planet.x - planet.radius));
        const ly = Math.floor(ship.y - (planet.y - planet.radius));

        if (lx >= 0 && lx < planet.canvas.width && ly >= 0 && ly < planet.canvas.height) {
          const pixel = planet.ctx.getImageData(lx, ly, 1, 1).data;
          if (pixel[3] > 20) {
            break;
          }
        }

        curDist -= 3;
        ship.x = planet.x + Math.cos(ship.surfaceAngle) * curDist;
        ship.y = planet.y + Math.sin(ship.surfaceAngle) * curDist;

        if (curDist <= minAllowableDist) {
          ship.hp = 0;
          ship.alive = false;
          sound.playExplosion(40);
          break;
        }
      }
    }
  }

  public checkPlanetSolid(planet: Planet, wx: number, wy: number): boolean {
    const dx = wx - planet.x;
    const dy = wy - planet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > planet.radius) return false;

    // Los Gigantes Gaseosos son fluidos: solo su diminuto núcleo central (< 12px) es sólido
    if (planet.material.isGas) {
      return dist < 12;
    }

    const lx = Math.floor(wx - (planet.x - planet.radius));
    const ly = Math.floor(wy - (planet.y - planet.radius));

    if (lx < 0 || lx >= planet.canvas.width || ly < 0 || ly >= planet.canvas.height) return false;
    const pixel = planet.ctx.getImageData(lx, ly, 1, 1).data;
    return pixel[3] > 20;
  }

  private detonate(proj: Projectile, hitX: number, hitY: number, hitPlanet?: Planet): void {
    const w = proj.weapon;
    sound.playExplosion(w.craterRadius, w.category === 'exotic');

    for (const p of this.planets) {
      const dist = Math.hypot(hitX - p.x, hitY - p.y);
      const effectiveCrater = p.material.isGas ? 0 : Math.round(w.craterRadius / p.material.hardness);
      if (dist < p.radius + (p.material.isGas ? 20 : effectiveCrater)) {
        this.carvePlanet(p, hitX, hitY, w.craterRadius);
      }
    }

    if (w.specialBehavior === 'singularity') {
      this.singularities.push({
        x: hitX,
        y: hitY,
        strength: 3200,
        radius: 220,
        life: 0,
        maxLife: 600 // 10 seconds at 60 FPS
      });
    } else if (w.specialBehavior === 'napalm' && hitPlanet) {
      for (let n = 0; n < 12; n++) {
        const offAngle = Math.random() * Math.PI * 2;
        const offDist = Math.random() * w.craterRadius * 0.8;
        this.napalms.push({
          planetId: hitPlanet.id,
          x: hitX + Math.cos(offAngle) * offDist,
          y: hitY + Math.sin(offAngle) * offDist,
          life: 0,
          maxLife: 720 // 12 seconds
        });
      }
    } else if (w.specialBehavior === 'inverter' && hitPlanet) {
      hitPlanet.gravitonInvertedUntil = Date.now() + 8000; // 8 seconds net repulsive gravity
    } else if (w.specialBehavior === 'doomsday' && hitPlanet) {
      // Pulverizes >60% of planet mass
      hitPlanet.currentMass = Math.max(15, Math.round(hitPlanet.currentMass * 0.35));
    } else if (w.specialBehavior === 'void') {
      // Antimatter Implosion: suction particles toward center
      for (let i = 0; i < 35; i++) {
        const rad = Math.random() * Math.PI * 2;
        const dist = Math.random() * 85 + 25;
        this.particles.push({
          x: hitX + Math.cos(rad) * dist,
          y: hitY + Math.sin(rad) * dist,
          vx: -Math.cos(rad) * 4.2,
          vy: -Math.sin(rad) * 4.2,
          life: 0,
          maxLife: 28,
          color: '#7c3aed',
          size: Math.random() * 3.5 + 2
        });
      }
    } else if (w.specialBehavior === 'shrapnel') {
      for (let s = 0; s < 12; s++) {
        const shrapAngle = (s / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const shrapSpeed = Math.random() * 5.5 + 4.5;
        this.projectiles.push({
          id: Math.random(),
          weapon: {
            ...w,
            name: 'Dardo de Metralla',
            damage: 12,
            craterRadius: 10,
            specialBehavior: undefined
          },
          ownerId: proj.ownerId,
          x: hitX,
          y: hitY,
          vx: Math.cos(shrapAngle) * shrapSpeed,
          vy: Math.sin(shrapAngle) * shrapSpeed,
          life: 0,
          maxLife: 150,
          trail: [],
          bouncesLeft: 3
        });
      }
    }

    // Damage ships & credit bounty for damage (+2 CR per 1 HP drained)
    const shooter = this.ships.find(s => s.id === proj.ownerId);

    for (const ship of this.ships) {
      if (!ship.alive) continue;
      const sDist = Math.hypot(hitX - ship.x, hitY - ship.y);
      const effectiveRadius = w.craterRadius * 1.5 + 24;

      if (sDist < effectiveRadius) {
        // ZONAS DE IMPACTO Y DAÑO DIFERENCIADO:
        // 1. Direct Hit (sDist <= 14px): 100% daño base
        // 2. Glancing Hit (14px < sDist <= 28px): 50%-65% daño base (58%)
        // 3. Blast Radius (sDist > 28px): Onda expansiva cuadrática inversa suave
        // 4. Metralla / Esquirla: Daños ligeros de entre 15 y 30 HP
        let zoneMultiplier = 1.0;
        const isShrapnel = w.specialBehavior === 'shrapnel' || w.name === 'Dardo de Metralla';

        if (isShrapnel) {
          zoneMultiplier = 1.0;
        } else if (sDist <= 14) {
          zoneMultiplier = 1.0; // Direct Hit
        } else if (sDist <= 28) {
          zoneMultiplier = 0.58; // Glancing Hit
        } else {
          const ratio = (sDist - 28) / Math.max(1, effectiveRadius - 28);
          zoneMultiplier = Math.pow(Math.max(0, 1 - ratio), 2) * 0.50; // Blast Radius
        }

        // LÍMITE DE DAÑO ABSOLUTO (DAMAGE CAP):
        // Ningún impacto individual puede infligir más de 450 HP de daño total.
        // Imposible matar de 1 disparo (se requieren entre 5 y 9 impactos certeros).
        const maxDamageCap = isShrapnel ? 30 : 450;
        const calculatedDmg = Math.round(w.damage * zoneMultiplier);
        const rawDmg = Math.min(maxDamageCap, calculatedDmg);

        ship.lastHitTime = performance.now();
        const prevShield = ship.shield;
        const prevHp = ship.hp;
        let finalHpLoss = 0;

        // Inmunidad Anti-PEM: Inmunidad total contra drenaje de sistemas y combustible
        if (w.specialBehavior === 'emp' && ship.shieldType === 'anti_emp') {
          sound.playBeep(1280, 0.06);
          continue;
        }

        if (w.specialBehavior === 'emp') {
          // Pulso PEM: Daño a casco casi nulo (20 HP), pero neutraliza escudos y 50% del combustible
          ship.shield = 0;
          ship.fuel = Math.max(0, Math.round(ship.fuel * 0.5));
          const empDmg = Math.min(50, ship.shieldType === 'phase' ? 40 : 20);
          finalHpLoss = Math.min(ship.hp, empDmg);
          ship.hp = Math.max(0, ship.hp - empDmg);
        } else if (w.specialBehavior === 'repulsor') {
          // Onda Repulsora: 40 HP (desancla a la nave rival de la roca y la empuja al vacío)
          if (ship.shieldType !== 'bastion') {
            const pushAngle = Math.atan2(ship.y - hitY, ship.x - hitX);
            const pushForce = 9.5;
            ship.vx = Math.cos(pushAngle) * pushForce;
            ship.vy = Math.sin(pushAngle) * pushForce;
            ship.isAirborne = true;
            ship.flightTime = 0;
            ship.jumpTrail = [];
            sound.playHyperJump();
          }
          finalHpLoss = Math.min(ship.hp, Math.min(40, rawDmg));
          ship.hp = Math.max(0, ship.hp - finalHpLoss);
        } else {
          let dmgToApply = rawDmg;

          // Cuántico de Fase: inmune a metralla y explosiones balísticas cinéticas
          if (ship.shieldType === 'phase' && w.category === 'ballistic') {
            continue; // Atraviesa sin daño
          }
          // Cuántico de Fase: recibe daño aumentado por antimateria y armas exóticas
          if (ship.shieldType === 'phase' && (w.category === 'exotic' || w.specialBehavior === 'singularity' || w.specialBehavior === 'void')) {
            dmgToApply = Math.min(maxDamageCap, Math.round(dmgToApply * 1.6));
          }

          // Colector / Absorción: Convierte 60% del daño en recarga de combustible (+35%) y +30 CR
          if (ship.shieldType === 'absorb') {
            const absorbedDmg = Math.round(dmgToApply * 0.6);
            dmgToApply -= absorbedDmg;
            ship.fuel = Math.min(100, ship.fuel + 35);
            ship.credits += 30;
          }

          // Bastión Pesado: absorbe 85% del daño con sus 1800 SP
          if (ship.shieldType === 'bastion' && ship.shield > 0) {
            const bastionAbsorb = Math.round(dmgToApply * 0.85);
            const actualAbsorbed = Math.min(ship.shield, bastionAbsorb);
            ship.shield -= actualAbsorbed;
            dmgToApply -= actualAbsorbed;
          } else if (ship.shield > 0) {
            // Deflector Estándar y escudos normales absorben el 70% del daño entrante antes de tocar el casco
            const shieldAbsorbable = Math.round(dmgToApply * 0.70);
            const actualAbsorbed = Math.min(ship.shield, shieldAbsorbable);
            ship.shield -= actualAbsorbed;
            dmgToApply -= actualAbsorbed;
          }

          // Tope máximo por impacto individual: nunca excede 450 HP (cero one-hit kills)
          dmgToApply = Math.min(450, dmgToApply);
          finalHpLoss = Math.min(ship.hp, dmgToApply);
          ship.hp = Math.max(0, ship.hp - dmgToApply);
        }

        const shieldLost = Math.round(prevShield - ship.shield);
        const hullLost = Math.round(prevHp - ship.hp);

        // Sistema de números flotantes temporales de daño (Cyan: Escudo #38bdf8, Rojo: Casco #ef4444)
        if (shieldLost > 0 && hullLost > 0) {
          this.spawnDamageNumber(ship.x - 14, ship.y - 25, `-${shieldLost}`, '#38bdf8');
          this.spawnDamageNumber(ship.x + 14, ship.y - 25, `-${hullLost}`, '#ef4444');
        } else if (shieldLost > 0) {
          this.spawnDamageNumber(ship.x, ship.y - 25, `-${shieldLost}`, '#38bdf8');
        } else if (hullLost > 0) {
          this.spawnDamageNumber(ship.x, ship.y - 25, `-${hullLost}`, '#ef4444');
        }

        // Bounty & Bonificaciones de Impacto Táctico (+2 CR por HP infligido)
        if (shooter && ship.id !== proj.ownerId && finalHpLoss > 0) {
          let totalBounty = finalHpLoss * 2;

          // First Blood (+100 CR al primero en conectar un disparo directo)
          if (!this.firstBloodClaimed) {
            this.firstBloodClaimed = true;
            shooter.credits += 100;
            this.onCoinCollected?.(shooter.id, 100);
            this.onTacticalBonus?.('¡FIRST BLOOD! +100 CR', shooter.color);
            sound.playVictory();
          }

          // Tirachinas Magistral (+50 CR acrobático si el proyectil rodea más de 1 astro)
          if (proj.planetsCircled && proj.planetsCircled.size >= 2) {
            shooter.credits += 50;
            this.onCoinCollected?.(shooter.id, 50);
            this.onTacticalBonus?.('¡TIRACHINAS MAGISTRAL! +50 CR', '#38bdf8');
            sound.playCoin();
          }

          shooter.credits += totalBounty;
          this.onCoinCollected?.(shooter.id, totalBounty);
        }

        if (ship.hp <= 0) {
          ship.alive = false;
          sound.playExplosion(50);
          for (let p = 0; p < 40; p++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 1;
            this.particles.push({
              x: ship.x,
              y: ship.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 0,
              maxLife: 45 + Math.random() * 30,
              color: ship.color,
              size: Math.random() * 4 + 2
            });
          }
        }
      }
    }

    const pCount = Math.floor(w.craterRadius * 1.2);
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 0.8;
      this.particles.push({
        x: hitX,
        y: hitY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 25 + Math.random() * 25,
        color: w.color,
        size: Math.random() * 4 + 1.5
      });
    }

    // Check winner among remaining alive ships
    const aliveShips = this.ships.filter(s => s.alive);
    if (aliveShips.length === 0) {
      this.roundWinner = 'draw';
      this.onGameOver?.('draw');
    } else if (aliveShips.length === 1 && this.ships.length > 1) {
      this.roundWinner = aliveShips[0].id;
      this.onGameOver?.(aliveShips[0].id);
    }
  }

  private updateAI() {
    if (this.isSimulating || this.roundWinner) return;
    const currentShip = this.ships.find(s => s.id === this.currentTurn);
    if (!currentShip || !currentShip.alive || !currentShip.isAI) return;

    this.aiThinkTimer++;
    if (this.aiThinkTimer < 55) return; // 0.9s thinking delay
    this.aiThinkTimer = 0;

    // Fase de Defensa Inicial inteligente para la IA en Turno 1
    if (!this.hasConfiguredDefense[currentShip.id]) {
      this.hasConfiguredDefense[currentShip.id] = true;
      const rivals = this.ships.filter(s => s.alive && s.id !== currentShip.id);
      const closest = rivals[0];
      const dist = closest ? Math.hypot(closest.x - currentShip.x, closest.y - currentShip.y) : 700;
      if (dist < 550 && currentShip.credits >= 40) {
        this.selectShield('ricochet');
      } else if (dist >= 700 && currentShip.credits >= 60) {
        this.selectShield('absorb');
      } else if (currentShip.credits >= 90 && Math.random() < 0.4) {
        this.selectShield('repulsor');
      } else {
        this.selectShield('deflector');
      }
      const activeDef = SHIELD_CATALOG.find(s => s.id === currentShip.shieldType);
      this.onTacticalBonus?.(`IA: ESCUDO ${activeDef?.name.toUpperCase() || 'DEFLECTOR'}`, currentShip.color);
    }

    const rivals = this.ships.filter(s => s.alive && s.id !== currentShip.id);
    if (rivals.length === 0) return;
    // Prefer aiming at lowest HP rival or first human
    const target = rivals.find(s => !s.isAI) || rivals[0];

    const dx = target.x - currentShip.x;
    const dy = currentShip.y - target.y; // Standard Cartesian
    let directAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (directAngle < 0) directAngle += 360;

    const dist = Math.hypot(dx, dy);
    // Add realistic elevation arc for gravity pull
    const elevation = Math.min(22, dist * 0.035);
    const aimVariation = (Math.random() - 0.5) * 6;
    currentShip.aimAngle = Math.round(((directAngle + elevation + aimVariation) % 360) * 10) / 10;
    currentShip.power = Math.min(100, Math.max(35, Math.round(dist * 0.11 + 25 + (Math.random() - 0.5) * 8)));

    // Select best affordable weapon
    const affordable = WEAPON_CATALOG.filter(w => w.price <= currentShip.credits);
    if (currentShip.credits >= 120 && Math.random() < 0.6) {
      const advanced = affordable.filter(w => w.price > 0);
      currentShip.weaponId = advanced.length > 0 ? advanced[Math.floor(Math.random() * advanced.length)].id : 1;
    } else {
      currentShip.weaponId = 1;
    }

    // High ground or desperate leap
    if (currentShip.hp < 30 && currentShip.fuel >= 30 && Math.random() < 0.35) {
      this.executeHyperJump();
    } else {
      this.fireCurrentWeapon();
    }
  }

  public updatePhysics(dt: number) {
    this.updateAI();

    // 1. Update Singularities
    for (let i = this.singularities.length - 1; i >= 0; i--) {
      const s = this.singularities[i];
      s.life++;
      if (s.life >= s.maxLife) {
        this.singularities.splice(i, 1);
        continue;
      }
      if (Math.random() < 0.6) {
        const swAngle = Math.random() * Math.PI * 2;
        const swDist = s.radius * (0.3 + Math.random() * 0.7);
        this.particles.push({
          x: s.x + Math.cos(swAngle) * swDist,
          y: s.y + Math.sin(swAngle) * swDist,
          vx: -Math.sin(swAngle) * 2.5 - Math.cos(swAngle) * 1.2,
          vy: Math.cos(swAngle) * 2.5 - Math.sin(swAngle) * 1.2,
          life: 0,
          maxLife: 20,
          color: '#818cf8',
          size: 2.2
        });
      }
    }

    // 2. Update Napalm fire
    for (let i = this.napalms.length - 1; i >= 0; i--) {
      const nap = this.napalms[i];
      nap.life++;
      if (nap.life >= nap.maxLife) {
        this.napalms.splice(i, 1);
        continue;
      }
      if (Math.random() < 0.4) {
        this.particles.push({
          x: nap.x + (Math.random() - 0.5) * 8,
          y: nap.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.6 - 0.5,
          life: 0,
          maxLife: 18,
          color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
          size: Math.random() * 2.8 + 1
        });
      }

      // Napalm persistent burning damage (12 HP/sec = ~0.20 HP/frame)
      for (const ship of this.ships) {
        if (!ship.alive || ship.isAirborne) continue;
        if (Math.hypot(ship.x - nap.x, ship.y - nap.y) < 32) {
          ship.hp = Math.max(0, ship.hp - 0.20);
          if (ship.hp <= 0) {
            ship.alive = false;
            sound.playExplosion(45);
          }
        }
      }
    }

    // 3. Update Projectiles
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];
      p.life++;

      // Estela activa efímera: partículas volátiles cortas (fade out completo en menos de 0.25s)
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: -p.vx * 0.12 + (Math.random() - 0.5) * 0.8,
        vy: -p.vy * 0.12 + (Math.random() - 0.5) * 0.8,
        color: p.weapon.color,
        size: Math.random() * 2.2 + 1.2,
        life: 0,
        maxLife: 9 + Math.random() * 5
      });

      // Check coin collection by projectile (+50 CR)
      for (const coin of this.coins) {
        if (!coin.collected && !coin.isBuried) {
          if (Math.hypot(p.x - coin.x, p.y - coin.y) < 18) {
            coin.collected = true;
            const collector = this.ships.find(s => s.id === p.ownerId);
            if (collector) collector.credits += 50;
            sound.playCoin();
            this.onCoinCollected?.(p.ownerId, 50);
            for (let sp = 0; sp < 12; sp++) {
              this.particles.push({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0,
                maxLife: 24,
                color: '#facc15',
                size: 2.5
              });
            }
          }
        }
      }

      // Cluster MIRV Split
      if (p.weapon.specialBehavior === 'split' && !p.splitTriggered && p.life > 75) {
        p.splitTriggered = true;
        sound.playExplosion(18);
        for (let m = 0; m < 5; m++) {
          const spreadAngle = Math.atan2(p.vy, p.vx) + ((m - 2) * 0.18);
          const curSpd = Math.hypot(p.vx, p.vy);
          this.projectiles.push({
            id: Math.random(),
            weapon: {
              ...p.weapon,
              name: 'MIRV Submunition',
              damage: 80, // 80 HP per submunition
              craterRadius: 18,
              specialBehavior: undefined
            },
            ownerId: p.ownerId,
            x: p.x,
            y: p.y,
            vx: Math.cos(spreadAngle) * curSpd,
            vy: Math.sin(spreadAngle) * curSpd,
            life: 0,
            maxLife: 600,
            trail: []
          });
        }
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      // Crawler walking along planet surface toward enemy
      if (p.isCrawler && p.crawlerPlanetId) {
        const planet = this.planets.find(pl => pl.id === p.crawlerPlanetId);
        if (planet) {
          const enemy = this.ships.find(s => s.alive && s.id !== p.ownerId);
          let dir = 0.04;
          if (enemy && enemy.planetId === planet.id) {
            let diff = enemy.surfaceAngle - (p.crawlerAngle || 0);
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            dir = diff > 0 ? 0.045 : -0.045;
          }
          p.crawlerAngle = (p.crawlerAngle || 0) + dir;
          p.x = planet.x + Math.cos(p.crawlerAngle) * (planet.radius + 4);
          p.y = planet.y + Math.sin(p.crawlerAngle) * (planet.radius + 4);

          if (enemy && Math.hypot(p.x - enemy.x, p.y - enemy.y) < 26) {
            this.detonate(p, p.x, p.y, planet);
            this.projectiles.splice(pIdx, 1);
            continue;
          }
          if (p.life > 400) {
            this.detonate(p, p.x, p.y, planet);
            this.projectiles.splice(pIdx, 1);
            continue;
          }
          continue;
        }
      }

      let destroyed = false;
      const gravImmunity = p.weapon.specialBehavior === 'sniper' ? 0.1 : 1.0;
      const SUBSTEPS = 6;
      const subDt = dt / SUBSTEPS;

      // Deterministic 6-substep integration with Plummer softening (epsilon = 25px)
      for (let sub = 0; sub < SUBSTEPS; sub++) {
        let totalAx = 0;
        let totalAy = 0;

        // Plummer Softened Gravity Law: ax = sum(G * M * dx / (r^2 + epsilon^2)^1.5)
        if (!p.planetsCircled) p.planetsCircled = new Set();
        for (const planet of this.planets) {
          const dx = planet.x - p.x;
          const dy = planet.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < Math.pow(planet.radius + 75, 2)) {
            p.planetsCircled.add(planet.id);
          }
          const denom = Math.pow(distSq + PLUMMER_EPSILON_SQ, 1.5);

          const isInverted = Date.now() < planet.gravitonInvertedUntil;
          const sign = isInverted ? -1 : 1;

          const forceFactor = (G_CONSTANT * planet.currentMass * sign) / (denom * p.weapon.mass);
          totalAx += dx * forceFactor * gravImmunity;
          totalAy += dy * forceFactor * gravImmunity;
        }

        for (const sing of this.singularities) {
          const dx = sing.x - p.x;
          const dy = sing.y - p.y;
          const distSq = dx * dx + dy * dy;
          const denom = Math.pow(distSq + 400, 1.5);
          const forceFactor = (sing.strength * 2.5) / denom;
          totalAx += dx * forceFactor;
          totalAy += dy * forceFactor;
        }

        // Guided Cruiser Autonomous Homing Steering
        if (p.weapon.specialBehavior === 'cruiser' && p.life > 10) {
          const rival = this.ships.find(s => s.alive && s.id !== p.ownerId);
          if (rival) {
            const steerX = rival.x - p.x;
            const steerY = rival.y - p.y;
            const steerDist = Math.hypot(steerX, steerY);
            if (steerDist > 15) {
              totalAx += (steerX / steerDist) * 140;
              totalAy += (steerY / steerDist) * 140;
            }
          }
        }


        // Escudo Gravitatorio Repulsor: desvía proyectiles aproximándose a menos de 85px de naves rivales
        for (const ship of this.ships) {
          if (ship.alive && ship.shieldType === 'repulsor' && ship.id !== p.ownerId) {
            const repDx = p.x - ship.x;
            const repDy = p.y - ship.y;
            const repDist = Math.hypot(repDx, repDy);
            if (repDist > 0 && repDist < 85) {
              const repForce = (1 - repDist / 85) * 350;
              totalAx += (repDx / repDist) * repForce;
              totalAy += (repDy / repDist) * repForce;
            }
          }
        }

        p.vx += totalAx * subDt;
        p.vy += totalAy * subDt;

        if (p.isMine) {
          p.vx *= 0.997;
          p.vy *= 0.997;
          for (const ship of this.ships) {
            if (ship.alive && Math.hypot(p.x - ship.x, p.y - ship.y) < 80) {
              this.detonate(p, p.x, p.y);
              this.projectiles.splice(pIdx, 1);
              destroyed = true;
              break;
            }
          }
          if (destroyed) break;
        }


        // Colección de gemas de combustible verde (+30% Fuel)
        for (const gem of this.fuelGems) {
          if (!gem.collected && Math.hypot(p.x - gem.x, p.y - gem.y) < gem.radius + 18) {
            gem.collected = true;
            const owner = this.ships.find(s => s.id === p.ownerId);
            if (owner) {
              owner.fuel = Math.min(100, owner.fuel + 30);
              this.onTacticalBonus?.('¡GEMA DE COMBUSTIBLE! +30% COMB', '#10b981');
              sound.playCoin();
            }
          }
        }

        p.x += p.vx * subDt * 60;
        p.y += p.vy * subDt * 60;

        // Toroidal Screen Wrap (Clean wrap with trail reset to avoid cross-screen lines)
        let didWrap = false;
        if (p.x < 0) { p.x += this.width; didWrap = true; }
        else if (p.x >= this.width) { p.x -= this.width; didWrap = true; }
        if (p.y < 0) { p.y += this.height; didWrap = true; }
        else if (p.y >= this.height) { p.y -= this.height; didWrap = true; }

        if (didWrap) {
          p.trail = [];
        }

        // Direct impact against ships with reactive shields
        let hitShip = false;
        for (const ship of this.ships) {
          if (!ship.alive) continue;
          if (Math.hypot(p.x - ship.x, p.y - ship.y) < 18) {
            // 1. Cuántico de Fase: la nave es semi-incorpórea; proyectiles cinéticos la atraviesan sin daño
            if (ship.shieldType === 'phase' && p.weapon.specialBehavior !== 'emp' && p.weapon.specialBehavior !== 'singularity') {
              for (let pt = 0; pt < 4; pt++) {
                this.particles.push({
                  x: p.x, y: p.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  color: '#818cf8', size: 2.5, life: 0, maxLife: 15
                });
              }
              continue; // Atraviesa sin detonar
            }

            // 2. Rebote / Ricochet: proyectiles balísticos y metralla rebotan elásticamente en ángulo opuesto
            if (ship.shieldType === 'ricochet' && p.weapon.category !== 'exotic' && p.weapon.specialBehavior !== 'singularity') {
              p.vx = -p.vx * 1.1;
              p.vy = -p.vy * 1.1;
              p.ownerId = ship.id;
              sound.playRockCrumble();
              for (let pt = 0; pt < 8; pt++) {
                this.particles.push({
                  x: p.x, y: p.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#a855f7', size: 3, life: 0, maxLife: 20
                });
              }
              continue; // Rebota elásticamente
            }

            // 3. Espejo Reflector: refleja armas de taquiones y rayos de energía hacia el atacante
            if (ship.shieldType === 'reflector' && (p.weapon.specialBehavior === 'tachyon' || p.weapon.specialBehavior === 'sparrow' || p.weapon.specialBehavior === 'laser')) {
              p.vx = -p.vx * 1.25;
              p.vy = -p.vy * 1.25;
              p.ownerId = ship.id;
              sound.playBeep(1280, 0.06);
              for (let pt = 0; pt < 10; pt++) {
                this.particles.push({
                  x: p.x, y: p.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: '#f43f5e', size: 3.5, life: 0, maxLife: 25
                });
              }
              continue; // Refleja hacia el atacante
            }

            this.detonate(p, p.x, p.y);
            this.projectiles.splice(pIdx, 1);
            hitShip = true;
            destroyed = true;
            break;
          }
        }
        if (hitShip) break;

        // Fluid drag & Collision with planets
        let hitPlanetSolid = false;
        for (const planet of this.planets) {
          // Gigante Gaseoso: frena ligeramente el proyectil disipando gases sin cráteres fijos
          if (planet.material.isGas) {
            const dist = Math.hypot(p.x - planet.x, p.y - planet.y);
            if (dist < planet.radius) {
              p.vx *= 0.985;
              p.vy *= 0.985;
              if (Math.random() < 0.45) {
                this.particles.push({
                  x: p.x + (Math.random() - 0.5) * 4,
                  y: p.y + (Math.random() - 0.5) * 4,
                  vx: -p.vx * 0.12 + (Math.random() - 0.5) * 0.8,
                  vy: -p.vy * 0.12 + (Math.random() - 0.5) * 0.8,
                  color: Math.random() < 0.5 ? '#38bdf8' : '#f59e0b',
                  size: 2.8,
                  life: 0,
                  maxLife: 15
                });
              }
            }
            continue;
          }

          if (this.checkPlanetSolid(planet, p.x, p.y)) {
            if (p.isBorer) {
              this.carvePlanet(planet, p.x, p.y, 14);
              p.borerDist = (p.borerDist || 0) + 1;
              p.x += p.vx * 1.5;
              p.y += p.vy * 1.5;
              if (p.borerDist > 36 || !this.checkPlanetSolid(planet, p.x, p.y)) {
                this.detonate(p, p.x, p.y, planet);
                this.projectiles.splice(pIdx, 1);
                hitPlanetSolid = true;
                destroyed = true;
                break;
              }
              continue;
            }

            if (p.bouncesLeft && p.bouncesLeft > 0) {
              p.bouncesLeft--;
              const nx = (p.x - planet.x) / planet.radius;
              const ny = (p.y - planet.y) / planet.radius;
              const dot = p.vx * nx + p.vy * ny;
              p.vx = (p.vx - 2 * dot * nx) * 0.85;
              p.vy = (p.vy - 2 * dot * ny) * 0.85;
              sound.playRockCrumble();
              hitPlanetSolid = false;
              break;
            }

            if (p.weapon.specialBehavior === 'ghost' && !p.ghostPhasePassed) {
              p.ghostPhasePassed = true;
              for (let g = 0; g < 12; g++) {
                this.particles.push({
                  x: p.x,
                  y: p.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  life: 0,
                  maxLife: 20,
                  color: '#06b6d4',
                  size: 2.5
                });
              }
              continue;
            }

            if (p.weapon.specialBehavior === 'crawler' && !p.isCrawler) {
              p.isCrawler = true;
              p.crawlerPlanetId = planet.id;
              p.crawlerAngle = Math.atan2(p.y - planet.y, p.x - planet.x);
              continue;
            }

            this.detonate(p, p.x, p.y, planet);
            this.projectiles.splice(pIdx, 1);
            hitPlanetSolid = true;
            destroyed = true;
            break;
          }
        }
        if (hitPlanetSolid) break;
      }

      if (destroyed) continue;

      if (p.life > p.maxLife) {
        this.projectiles.splice(pIdx, 1);
      }
    }

    // 4. Update Airborne Ships (Hyper-Jump Physics)
    for (const ship of this.ships) {
      if (!ship.alive || !ship.isAirborne) continue;
      ship.flightTime++;

      // Propulsión efímera de nave en salto: partículas de tobera cortas (fade out en < 0.25s)
      if (Math.random() < 0.8) {
        this.particles.push({
          x: ship.x,
          y: ship.y,
          vx: -ship.vx * 0.15 + (Math.random() - 0.5) * 1.5,
          vy: -ship.vy * 0.15 + (Math.random() - 0.5) * 1.5,
          color: ship.color,
          size: Math.random() * 2.2 + 1.2,
          life: 0,
          maxLife: 10 + Math.random() * 5
        });
      }

      // Coin collection while in orbital flight (+50 CR)
      for (const coin of this.coins) {
        if (!coin.collected && !coin.isBuried) {
          if (Math.hypot(ship.x - coin.x, ship.y - coin.y) < 22) {
            coin.collected = true;
            ship.credits += 50;
            sound.playCoin();
            this.onCoinCollected?.(ship.id, 50);
            for (let sp = 0; sp < 12; sp++) {
              this.particles.push({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0,
                maxLife: 24,
                color: '#facc15',
                size: 2.5
              });
            }
          }
        }
      }

      // Exhaust plume according to model
      const heading = Math.atan2(ship.vy, ship.vx);
      if (Math.random() < 0.85) {
        let plumeColor = '#f97316';
        if (ship.model === 'enterprise') plumeColor = '#38bdf8';
        else if (ship.model === 'falcon') plumeColor = '#00e5ff';
        else if (ship.model === 'xwing') plumeColor = Math.random() < 0.5 ? '#f97316' : '#ea580c';
        else if (ship.model === 'frigate') plumeColor = '#10b981';
        else if (ship.model === 'interceptor') plumeColor = '#38bdf8';
        else if (ship.model === 'quantum') plumeColor = '#c084fc';

        this.particles.push({
          x: ship.x - Math.cos(heading) * 12,
          y: ship.y - Math.sin(heading) * 12,
          vx: -Math.cos(heading) * (Math.random() * 2 + 1) + (Math.random() - 0.5),
          vy: -Math.sin(heading) * (Math.random() * 2 + 1) + (Math.random() - 0.5),
          life: 0,
          maxLife: 20,
          color: plumeColor,
          size: Math.random() * 3 + 1
        });
      }

      // 6 Substeps with Plummer Softening for Airborne Ships
      const SUBSTEPS = 6;
      const subDt = dt / SUBSTEPS;

      for (let sub = 0; sub < SUBSTEPS; sub++) {
        let ax = 0;
        let ay = 0;
        for (const planet of this.planets) {
          const dx = planet.x - ship.x;
          const dy = planet.y - ship.y;
          const distSq = dx * dx + dy * dy;
          const denom = Math.pow(distSq + PLUMMER_EPSILON_SQ, 1.5);
          const isInverted = Date.now() < planet.gravitonInvertedUntil;
          const sign = isInverted ? -1 : 1;
          const forceFactor = (G_CONSTANT * planet.currentMass * sign) / (denom * 1.3);
          ax += dx * forceFactor;
          ay += dy * forceFactor;
        }

        for (const sing of this.singularities) {
          const dx = sing.x - ship.x;
          const dy = sing.y - ship.y;
          const distSq = dx * dx + dy * dy;
          const denom = Math.pow(distSq + 400, 1.5);
          const forceFactor = (sing.strength * 2.2) / denom;
          ax += dx * forceFactor;
          ay += dy * forceFactor;
        }

        ship.vx += ax * subDt;
        ship.vy += ay * subDt;

        ship.x += ship.vx * subDt * 60;
        ship.y += ship.vy * subDt * 60;

        // Toroidal Screen Wrap (Clean wrap with trail reset to avoid cross-screen lines)
        let shipWrapped = false;
        if (ship.x < 0) { ship.x += this.width; shipWrapped = true; }
        else if (ship.x >= this.width) { ship.x -= this.width; shipWrapped = true; }
        if (ship.y < 0) { ship.y += this.height; shipWrapped = true; }
        else if (ship.y >= this.height) { ship.y -= this.height; shipWrapped = true; }

        if (shipWrapped) {
          // BREAK TRAIL to avoid cross-screen streak
          ship.jumpTrail = [];
        }

        // ATERRIZAJE LIMPIO (NO DESTRUCTIVO)
        if (ship.flightTime > 16) {
          let landed = false;
          for (const planet of this.planets) {
            if (this.checkPlanetSolid(planet, ship.x, ship.y)) {
              ship.isAirborne = false;
              ship.vx = 0;
              ship.vy = 0;
              ship.planetId = planet.id;
              ship.surfaceAngle = Math.atan2(ship.y - planet.y, ship.x - planet.x);
              sound.playBeep(520, 0.08);

              this.settleShips(planet);
              landed = true;
              break;
            }
          }
  
        for (const gem of this.fuelGems) {
          if (!gem.collected && Math.hypot(ship.x - gem.x, ship.y - gem.y) < gem.radius + 24) {
            gem.collected = true;
            ship.fuel = Math.min(100, ship.fuel + 30);
            this.onTacticalBonus?.('¡GEMA DE COMBUSTIBLE! +30% COMB', '#10b981');
            sound.playCoin();
          }
        }

        if (landed) break;
        }
      }

      // Drift timeout
      if (ship.isAirborne && ship.flightTime > 750) {
        let closest = this.planets[0];
        let cDist = Infinity;
        for (const p of this.planets) {
          const d = Math.hypot(ship.x - p.x, ship.y - p.y);
          if (d < cDist) { cDist = d; closest = p; }
        }
        ship.isAirborne = false;
        ship.planetId = closest.id;
        ship.surfaceAngle = Math.atan2(ship.y - closest.y, ship.x - closest.x);
        this.settleShips(closest);
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.x < 0) pt.x += this.width;
      else if (pt.x >= this.width) pt.x -= this.width;
      if (pt.y < 0) pt.y += this.height;
      else if (pt.y >= this.height) pt.y -= this.height;

      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 5.5. Update Floating Damage Numbers (Temporales sobre las naves)
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life++;
      dn.x += dn.vx;
      dn.y += dn.vy;
      dn.vy *= 0.96;
      dn.alpha = Math.max(0, 1 - Math.pow(dn.life / dn.maxLife, 1.4));
      if (dn.life >= dn.maxLife) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // Check Turn Transition (1 -> 2 -> 3 -> 1 cycle)
    const anyAirborne = this.ships.some(s => s.alive && s.isAirborne);
    if (this.isSimulating && this.projectiles.length === 0 && !anyAirborne && this.particles.length < 8) {
      this.isSimulating = false;
      if (!this.roundWinner) {
        const total = this.ships.length;
        let nextTurn = (this.currentTurn % total) + 1;
        // Skip dead ships
        for (let tries = 0; tries < total; tries++) {
          const nextShip = this.ships.find(s => s.id === nextTurn);
          if (nextShip && nextShip.alive) break;
          nextTurn = (nextTurn % total) + 1;
        }
        this.currentTurn = nextTurn as PlayerId;
        this.onTurnChange?.(this.currentTurn);
      }
      this.onStateUpdate?.();
    }
  }

  public render() {
    const ctx = this.ctx;
    // Clear whole screen with deep space background
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    // Center-anchored zoom & pan transform (100% user controlled, never auto-zoom on fire)
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const effectiveScale = this.scale * this.userZoom;
    ctx.translate(cx + this.panX, cy + this.panY);
    ctx.scale(effectiveScale, effectiveScale);
    ctx.translate(-this.width / 2, -this.height / 2);

    // 1. Deep Space Vacuum Background (Fixed 900 x height)
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    // Tactical Radar Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Stars
    ctx.save();
    const t = performance.now() * 0.001;
    for (const s of this.stars) {
      const alpha = s.alpha * (0.8 + 0.2 * Math.sin(t * s.twinkleSpeed));
      ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.restore();

    // 3. Render Celestial Bodies (Cero sombras fantasma globales en el canvas principal)
    for (const planet of this.planets) {
      if (Date.now() < planet.gravitonInvertedUntil) {
        ctx.save();
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius + 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.drawImage(
        planet.canvas,
        planet.x - planet.radius,
        planet.y - planet.radius,
        planet.radius * 2,
        planet.radius * 2
      );

      // INDICADOR TÁCTICO EN EL HUD:
      // Ficha técnica militar seleccionada o micro-etiqueta no intrusiva
      const isSelected = planet.id === this.selectedPlanetId;

      if (isSelected) {
        // Retícula táctica de selección
        ctx.save();
        ctx.strokeStyle = planet.material.color;
        ctx.lineWidth = 1.5;
        const boxSize = planet.radius + 8;
        ctx.strokeRect(planet.x - boxSize, planet.y - boxSize, boxSize * 2, boxSize * 2);

        // Ficha técnica militar destacada
        const tagText = `[ ${planet.material.shortName}: DENS ${planet.material.density}x | DUREZA ${planet.material.isGas ? 'FLUIDO' : planet.material.hardness + 'x'} ]`;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const tagY = planet.y - planet.radius - 12;

        const textWidth = ctx.measureText(tagText).width;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.strokeStyle = planet.material.color;
        ctx.lineWidth = 1;
        ctx.fillRect(planet.x - textWidth / 2 - 6, tagY - 14, textWidth + 12, 18);
        ctx.strokeRect(planet.x - textWidth / 2 - 6, tagY - 14, textWidth + 12, 18);

        ctx.fillStyle = planet.material.color;
        ctx.fillText(tagText, planet.x, tagY);
        ctx.restore();
      } else {
        // Micro-etiqueta táctica minimalista inferior (transparente, no estorba)
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = planet.material.color;
        ctx.fillText(`${planet.material.shortName} • ${planet.material.density}x`, planet.x, planet.y + planet.radius + 4);
        ctx.restore();
      }
    }

    // 4. Render WarHeads 3D Gold Coins (Orbital & Excavated)
    const now = performance.now();
    for (const coin of this.coins) {
      if (coin.collected) continue;

      // Check if buried coin is excavated by crater
      if (coin.isBuried && coin.planetId) {
        const pl = this.planets.find(p => p.id === coin.planetId);
        if (pl && !this.checkPlanetSolid(pl, coin.x, coin.y)) {
          coin.isBuried = false;
        }
      }

      if (coin.isBuried) {
        // Faint subterranean shimmer
        ctx.save();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 3D Spinning Gold Coin
      const spinScale = Math.abs(Math.sin(now * 0.0035 + coin.spinOffset));
      const coinWidth = Math.max(2.5, 9 * spinScale);
      const coinHeight = 11;

      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;

      const grad = ctx.createLinearGradient(-coinWidth, -coinHeight / 2, coinWidth, coinHeight / 2);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(0, 0, coinWidth, coinHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (spinScale > 0.4) {
        ctx.fillStyle = '#713f12';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0.5);
      }
      ctx.restore();
    }


    // 4.5. Render Floating Emerald Fuel Crystals (+30% Fuel)
    for (const gem of this.fuelGems) {
      if (gem.collected) continue;
      const spinScale = Math.abs(Math.sin(now * 0.0035 + gem.spinOffset));
      const gemW = Math.max(3, 8 * spinScale);
      const gemH = 12;

      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#10b981';

      ctx.beginPath();
      ctx.moveTo(0, -gemH / 2);
      ctx.lineTo(gemW, 0);
      ctx.lineTo(0, gemH / 2);
      ctx.lineTo(-gemW, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // 5. Render Singularities
    for (const s of this.singularities) {
      ctx.save();
      const sGrad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.radius * 0.6);
      sGrad.addColorStop(0, '#000000');
      sGrad.addColorStop(0.4, 'rgba(79, 70, 229, 0.7)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(165, 180, 252, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius * 0.45, s.radius * 0.18, performance.now() * 0.002, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Render Ships
    for (const ship of this.ships) {
      if (!ship.alive) continue;
      this.renderShip(ctx, ship);
    }

    // 7. Render Projectiles (cabeza luminosa sin estelas de líneas residuales)
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.weapon.color;
      ctx.shadowColor = p.weapon.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.weapon.category === 'explosive' ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (p.isMine) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 + (Math.sin(performance.now() * 0.01) * 3), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 8. Render Particles (estelas volátiles efímeras con desvanecimiento rápido)
    for (const pt of this.particles) {
      const alpha = 1.0 - pt.life / pt.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Render Floating Damage Numbers (Temporales sobre las naves: Cyan para escudo, Rojo para casco)
    if (this.damageNumbers.length > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const dn of this.damageNumbers) {
        ctx.save();
        ctx.globalAlpha = dn.alpha;
        const fontSize = Math.round(11 + (1 - dn.life / dn.maxLife) * 3);
        ctx.font = `900 ${fontSize}px monospace`;
        ctx.shadowColor = dn.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
        ctx.strokeText(dn.text, dn.x, dn.y);
        ctx.fillStyle = dn.color;
        ctx.fillText(dn.text, dn.x, dn.y);
        ctx.restore();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Detailed Vector Rendering of the 3 Distinct WarHeads Ship Models
   */
  private renderShip(ctx: CanvasRenderingContext2D, ship: Ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    let shipAngle: number;
    if (ship.isAirborne) {
      shipAngle = Math.atan2(ship.vy, ship.vx) + Math.PI * 0.5;
    } else {
      const planet = this.planets.find(p => p.id === ship.planetId);
      const normalAngle = planet ? Math.atan2(ship.y - planet.y, ship.x - planet.x) : ship.surfaceAngle;
      shipAngle = normalAngle + Math.PI * 0.5;
    }
    ctx.rotate(shipAngle);

    // Visual Reactive Shield Perimeter Contour
    const shieldDef = SHIELD_CATALOG.find(s => s.id === ship.shieldType) || SHIELD_CATALOG[0];
    ctx.save();
    ctx.strokeStyle = shieldDef.color;
    ctx.lineWidth = ship.shieldType === 'bastion' ? 2.5 : 1.5;
    ctx.setLineDash(ship.shieldType === 'ricochet' ? [2, 2] : [4, 4]);
    ctx.beginPath();
    ctx.arc(0, -6, 23, 0, Math.PI * 2);
    ctx.stroke();
    if (ship.shield > 0) {
      ctx.globalAlpha = ship.shieldType === 'bastion' ? 0.35 : 0.22;
      ctx.fillStyle = shieldDef.color;
      ctx.fill();
    }
    ctx.restore();

    // Landing gear (retracted when airborne, extended when on planet)
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    if (ship.isAirborne) {
      ctx.fillRect(-11, 2, 4, 3);
      ctx.fillRect(7, 2, 4, 3);
    } else {
      ctx.fillRect(-15, 2, 4, 7);
      ctx.fillRect(-17, 8, 8, 2);
      ctx.fillRect(11, 2, 4, 7);
      ctx.fillRect(9, 8, 8, 2);
    }

    // 1. USS ENTERPRISE (NCC-1701 - STAR TREK)
    if (ship.model === 'enterprise') {
      const hullColor = '#e2e8f0';
      const detailColor = '#64748b';
      const darkColor = '#0f172a';

      // Nacelle Pylons (Angled support struts connecting engineering hull to nacelles)
      ctx.fillStyle = detailColor;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-12, -2);
      ctx.lineTo(-12, 1);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.lineTo(12, -2);
      ctx.lineTo(12, 1);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();

      // Left Cylindrical Warp Nacelle
      ctx.fillStyle = hullColor;
      ctx.fillRect(-14, -13, 4, 18);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(-14, -13, 4, 18);
      // Bussard Collector (Glowing red cap)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-12, -13, 2, Math.PI, 0);
      ctx.fill();
      // Warp Grill (Interior luminous cyan glow)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-11.5, -9, 1.2, 11);

      // Right Cylindrical Warp Nacelle
      ctx.fillStyle = hullColor;
      ctx.fillRect(10, -13, 4, 18);
      ctx.strokeRect(10, -13, 4, 18);
      // Bussard Collector
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(12, -13, 2, Math.PI, 0);
      ctx.fill();
      // Warp Grill
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10.3, -9, 1.2, 11);

      // Secondary Engineering Hull
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(-3.5, -4);
      ctx.lineTo(-3.5, 4);
      ctx.lineTo(0, 7);
      ctx.lineTo(3.5, 4);
      ctx.lineTo(3.5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Navigational Deflector (Glowing amber central dish)
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, -3.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Dorsal Neck
      ctx.fillStyle = detailColor;
      ctx.fillRect(-2, -11, 4, 8);
      ctx.strokeRect(-2, -11, 4, 8);

      // Primary Hull (Saucer Section - Front Elliptical Dish)
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.ellipse(0, -16, 14, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Team Colored Accent Ring
      ctx.strokeStyle = ship.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, -16, 10, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Bridge Dome
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, -16, 2, 0, Math.PI * 2);
      ctx.fill();

      // Propulsion Effect: Brilliant sky-blue warp impulse at nacelle tips
      if (ship.isAirborne) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        // Left nacelle warp plume
        ctx.beginPath();
        ctx.moveTo(-14, 5);
        ctx.lineTo(-12, 17);
        ctx.lineTo(-10, 5);
        ctx.fill();
        // Right nacelle warp plume
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(12, 17);
        ctx.lineTo(14, 5);
        ctx.fill();
        // Central sublight impulse engine
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-1.5, 6, 3, 4);
        ctx.restore();
      }
    }
    // 2. HALCÓN MILENARIO (MILLENNIUM FALCON - YT-1300)
    else if (ship.model === 'falcon') {
      const hullColor = '#cbd5e1';
      const darkColor = '#0f172a';
      const plateColor = '#64748b';

      // Flattened Saucer Hull
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.ellipse(0, -1, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Forward Mandibles (Wedge cargo jaws)
      ctx.fillStyle = hullColor;
      // Left Mandible
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-8, -21);
      ctx.lineTo(-2.5, -21);
      ctx.lineTo(-2.5, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Mandible
      ctx.beginPath();
      ctx.moveTo(2.5, -10);
      ctx.lineTo(2.5, -21);
      ctx.lineTo(8, -21);
      ctx.lineTo(8, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Starboard Cockpit (Offset to the right)
      // Connecting corridor
      ctx.fillStyle = hullColor;
      ctx.fillRect(8, -8, 7, 5);
      ctx.strokeRect(8, -8, 7, 5);
      // Conical Cockpit
      ctx.beginPath();
      ctx.moveTo(13, -4);
      ctx.lineTo(17, -4);
      ctx.lineTo(16, -14);
      ctx.lineTo(14, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Canopy panes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(14, -13, 2.5, 3.5);

      // Radar Sensor Dish on port side
      ctx.fillStyle = plateColor;
      ctx.beginPath();
      ctx.arc(-6, -7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Armor plating panels & player color accents
      ctx.fillStyle = ship.color;
      ctx.fillRect(-7, -2, 4, 3);
      ctx.fillRect(3, -2, 4, 3);

      // 6 Circular heat exhaust vents on rear deck
      ctx.fillStyle = darkColor;
      for (let v = -8; v <= 8; v += 3.2) {
        ctx.beginPath();
        ctx.arc(v, 4.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dorsal Quad-Laser Turret Hub
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Propulsion Effect: Continuous horizontal sublight neon-blue engine strip across rear
      ctx.save();
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 9, 10, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (ship.isAirborne) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(-8, 22);
        ctx.lineTo(8, 22);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    // 3. ALA-X / X-WING STARFIGHTER (T-65B)
    else if (ship.model === 'xwing') {
      const hullColor = '#e2e8f0';
      const darkColor = '#0f172a';

      // Four S-Foils (Wings locked in X-formation)
      ctx.fillStyle = hullColor;
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 1.2;

      // Top-Left Wing
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(-17, -13);
      ctx.lineTo(-17, -10);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Laser Cannon on Top-Left wingtip
      ctx.fillStyle = '#475569';
      ctx.fillRect(-18, -20, 2, 14);

      // Top-Right Wing
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(3, -3);
      ctx.lineTo(17, -13);
      ctx.lineTo(17, -10);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Laser Cannon on Top-Right wingtip
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, -20, 2, 14);

      // Bottom-Left Wing
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.lineTo(-17, 3);
      ctx.lineTo(-17, 6);
      ctx.lineTo(-3, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Laser Cannon on Bottom-Left wingtip
      ctx.fillStyle = '#475569';
      ctx.fillRect(-18, -4, 2, 14);

      // Bottom-Right Wing
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(3, 2);
      ctx.lineTo(17, 3);
      ctx.lineTo(17, 6);
      ctx.lineTo(3, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Laser Cannon on Bottom-Right wingtip
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, -4, 2, 14);

      // Elongated Pointed Fuselage
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(0, -22); // Pointed tactical nose
      ctx.lineTo(-3.5, 4);
      ctx.lineTo(3.5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Squadron Color Stripes (Player color)
      ctx.fillStyle = ship.color;
      ctx.fillRect(-3, -12, 1.5, 8);
      ctx.fillRect(1.5, -12, 1.5, 8);

      // Cockpit Canopy (Tinted glass)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(-2, -3);
      ctx.lineTo(2, -3);
      ctx.closePath();
      ctx.fill();

      // Astromech Droid Socket (R2 Unit Dome)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -1, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 4 Independent Engine Exhaust Nozzles
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7.5, 3, 3, 3);
      ctx.fillRect(-3.5, 4, 3, 3);
      ctx.fillRect(0.5, 4, 3, 3);
      ctx.fillRect(4.5, 3, 3, 3);

      // Propulsion Effect: 4 independent reddish/orange afterburners
      if (ship.isAirborne) {
        ctx.save();
        ctx.fillStyle = '#ea580c';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillRect(-7, 6, 2, 11);
        ctx.fillRect(-3, 7, 2, 13);
        ctx.fillRect(1, 7, 2, 13);
        ctx.fillRect(5, 6, 2, 11);
        ctx.restore();
      }
    }
    // 4. CAZA LIGERO (INTERCEPTOR)
    else if (ship.model === 'interceptor') {
      // Slender triangular fuselage
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.moveTo(-12, 4);
      ctx.lineTo(0, -18);
      ctx.lineTo(12, 4);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sharp double stabilizers
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-6, 2);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(6, -4);
      ctx.lineTo(6, 2);
      ctx.closePath();
      ctx.fill();

      // Sharp illuminated canopy
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(-2.5, -4);
      ctx.lineTo(2.5, -4);
      ctx.closePath();
      ctx.fill();

      // Blue plasma exhaust
      if (ship.isAirborne) {
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(0, 18);
        ctx.lineTo(3, 3);
        ctx.fill();
      }
    }
    // MODEL 2: CRUCERO PESADO (DREADNOUGHT)
    else if (ship.model === 'dreadnought') {
      // Broad armored chassis with hexagonal modules
      ctx.fillStyle = ship.color;
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(-14, -6);
      ctx.lineTo(-6, -15);
      ctx.lineTo(6, -15);
      ctx.lineTo(14, -6);
      ctx.lineTo(14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hexagonal armored side-pods
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-17, -8, 5, 10);
      ctx.fillRect(12, -8, 5, 10);

      // Heavy command bridge window
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-4, -10, 8, 3.5);

      // Dual heavy rocket fire
      if (ship.isAirborne) {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(-9, 4, 4, 14);
        ctx.fillRect(5, 4, 4, 14);
      }
    }
    // MODEL 3: FRAGATA TÁCTICA (FRIGATE) & QUANTUM
    else if (ship.model === 'frigate') {
      // Symmetrical twin-hull design
      ctx.fillStyle = ship.color;
      // Left Fuselage
      ctx.beginPath();
      ctx.moveTo(-15, 4);
      ctx.lineTo(-13, -16);
      ctx.lineTo(-7, -16);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Right Fuselage
      ctx.beginPath();
      ctx.moveTo(5, 4);
      ctx.lineTo(7, -16);
      ctx.lineTo(13, -16);
      ctx.lineTo(15, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reinforced central cross-strut
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -7, 12, 5);
      ctx.strokeRect(-6, -7, 12, 5);

      // Electromagnetic energy coils between hulls
      const coilPulse = Math.sin(performance.now() * 0.01) * 0.5 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 + coilPulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      // 3 glowing electromagnetic rings/lines
      for (let c = -14; c <= -8; c += 3) {
        ctx.beginPath();
        ctx.moveTo(-5, c);
        ctx.lineTo(5, c);
        ctx.stroke();
      }
      ctx.restore();

      // Dual emerald-green plasma thrusters
      if (ship.isAirborne) {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 8;
        // Left thruster flame
        ctx.beginPath();
        ctx.moveTo(-13, 4);
        ctx.lineTo(-9, 17);
        ctx.lineTo(-5, 4);
        ctx.fill();
        // Right thruster flame
        ctx.beginPath();
        ctx.moveTo(5, 4);
        ctx.lineTo(9, 17);
        ctx.lineTo(13, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    // MODEL 4 / FALLBACK: QUANTUM
    else {
      // Toroidal circular ring structure
      ctx.strokeStyle = ship.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -6, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -6, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing floating energy core
      const pulse = 4 + Math.sin(performance.now() * 0.008) * 1.5;
      ctx.fillStyle = '#f3e8ff';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -6, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Violet stardust engine
      if (ship.isAirborne) {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Rotating Artillery Cannon Barrel
    const localAimRad = -((ship.aimAngle * Math.PI) / 180) - shipAngle;
    ctx.save();
    ctx.translate(0, -5);
    ctx.rotate(localAimRad);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, -2, 17, 4);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -2, 17, 4);
    ctx.restore();

    // Overhead micro-indicador minimalista (Cero textos gigantes que tapen el juego)
    ctx.restore();
    ctx.save();

    // 1. Triángulo diminuto del color del jugador (P1: Cian, P2: Carmesí, P3: Ámbar)
    const triY = ship.y - 18;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x - 3.5, triY);
    ctx.lineTo(ship.x + 3.5, triY);
    ctx.lineTo(ship.x, triY + 4.5);
    ctx.closePath();
    ctx.fill();

    // 2. Mini-barra de vida (24px de ancho x 3px de alto) que solo se ilumina al recibir daño
    const isDamaged = ship.hp < ship.maxHp;
    const isRecentHit = (performance.now() - (ship.lastHitTime || 0)) < 3000;
    if (isDamaged && isRecentHit) {
      const barW = 24;
      const barH = 3;
      const bx = ship.x - barW / 2;
      const by = ship.y - 25;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = ship.hp > 300 ? ship.color : '#ef4444';
      ctx.fillRect(bx, by, Math.max(1, (ship.hp / ship.maxHp) * barW), barH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx, by, barW, barH);
    }
    ctx.restore();
  }

  private startLoop() {
    const loop = (time: number) => {
      if (!this.lastTime) this.lastTime = time;
      const dt = Math.min(0.04, (time - this.lastTime) * 0.001);
      this.lastTime = time;

      this.updatePhysics(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
  }
}
