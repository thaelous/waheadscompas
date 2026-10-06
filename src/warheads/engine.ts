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

export const G_CONSTANT = 2200; // Gravitational constant scale with Plummer softening
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

  // Tactical Manual Zoom & Pan System (100% Player Controlled, 0.6x to 1.6x)
  public userZoom: number = 1.0;
  public panX: number = 0;
  public panY: number = 0;

  public setZoom(zoom: number) {
    this.userZoom = Math.max(0.6, Math.min(1.6, Math.round(zoom * 100) / 100));
    this.onStateUpdate?.();
  }

  public zoomIn(delta: number = 0.15) {
    this.setZoom(this.userZoom + delta);
  }

  public zoomOut(delta: number = 0.15) {
    this.setZoom(this.userZoom - delta);
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

    // 1. Escala espacial amplia y descongestión orbital:
    // Radios entre 28px y 55px (máximo 60px para el planeta gigante central)
    // Distancia mínima garantizada: distancia >= radioA + radioB + 110px
    this.planets = [];
    const targetPlanetCount = this.gameConfig.playerCount >= 3 ? 5 : (Math.floor(rng() * 2) + 3); // 3 a 4 planetas (1-2 jugadores), 5 para 3 jugadores

    const vTop = 90;
    const vBottom = h - 90;
    const vSlice = (vBottom - vTop) / targetPlanetCount;

    for (let i = 0; i < targetPlanetCount; i++) {
      // Radios moderados: entre 28px y 55px (máximo 60px para el central)
      let radius = Math.floor(28 + rng() * 27); // 28px a 54px
      if (i === 1 && targetPlanetCount >= 3) {
        radius = Math.min(60, radius + 8); // Gigante central hasta 60px
      }
      const sliceMinY = vTop + i * vSlice + radius;
      const sliceMaxY = vTop + (i + 1) * vSlice - radius;

      const minX = radius + 60;
      const maxX = Math.max(minX + 30, w - radius - 60);

      let bestX = 0;
      let bestY = 0;
      let placed = false;

      for (let attempt = 0; attempt < 100; attempt++) {
        const sideOffset = (i % 2 === 0) ? (0.15 + rng() * 0.35) : (0.50 + rng() * 0.35);
        const cx = minX + sideOffset * (maxX - minX);
        const cy = sliceMinY + rng() * Math.max(10, sliceMaxY - sliceMinY);

        let overlap = false;
        for (const existing of this.planets) {
          // Distancia mínima garantizada: distancia >= radioA + radioB + 110px
          const minDist = radius + existing.radius + 110;
          if (Math.hypot(cx - existing.x, cy - existing.y) < minDist) {
            overlap = true;
            break;
          }
        }

        if (!overlap) {
          bestX = Math.round(cx);
          bestY = Math.round(cy);
          placed = true;
          break;
        }
      }

      // Si no cabe tras 100 intentos, se descarta para evitar hacinamiento
      if (!placed) {
        continue;
      }

      // Asignación de los 5 materiales canónicos con composición física real:
      // Hielo (0.5x dens, 0.4x dur), Roca (1.0x/1.0x), Hierro (2.2x/2.8x), Gas (0.7x/fluido), Neutrón (3.5x/4.0x)
      const materialPool: PlanetMaterialType[] = [
        'ice', 'ice',
        'rock', 'rock', 'rock',
        'iron', 'iron',
        'gas',
        'neutron'
      ];
      let chosenType: PlanetMaterialType;
      if (radius >= 52 && rng() < 0.65) {
        chosenType = rng() < 0.6 ? 'gas' : 'iron';
      } else {
        chosenType = materialPool[Math.floor(rng() * materialPool.length)];
      }

      const material = PLANET_MATERIALS[chosenType];
      // Gravedad dinámica: Masa = Radio^2 * Densidad_Material * Masa_Base
      const baseMass = Math.max(25, Math.round(160 * Math.pow(radius / 45, 2) * material.density));
      const planetCanvas = generatePlanetCanvas({
        type: chosenType,
        radius,
        seed: Math.floor(rng() * 100000)
      });

      const planetDesignations = ['PLANETA K-9', 'PLANETA TITÁN-IV', 'PLANETA AURA-7', 'PLANETA VORTEX-IX', 'PLANETA OMEGA-2', 'PLANETA ZETA-3', 'PLANETA KRONOS-V'];
      const pName = planetDesignations[this.planets.length % planetDesignations.length];

      this.planets.push({
        id: this.planets.length + 1,
        name: pName,
        x: bestX,
        y: bestY,
        radius,
        initialRadius: radius,
        baseMass,
        currentMass: baseMass,
        type: chosenType,
        material,
        canvas: planetCanvas,
        ctx: planetCanvas.getContext('2d', { willReadFrequently: true })!,
        gravitonInvertedUntil: 0
      });
    }

    // Asegurar entre 3 y 5 planetas bien repartidos a lo largo de toda la columna vertical
    const minNeededPlanets = this.gameConfig.playerCount >= 3 ? 5 : 3;
    const fallbackDesignations = ['PLANETA CYGNUS-X', 'PLANETA HYDRA-1', 'PLANETA ORION-8'];
    while (this.planets.length < minNeededPlanets) {
      const idx = this.planets.length;
      const fallbackRadius = 32;
      const fx = Math.round(w * (idx % 2 === 0 ? 0.28 : 0.72));
      const fy = Math.round(180 + idx * ((h - 360) / (minNeededPlanets - 1)));
      const fallbackType: PlanetMaterialType = (idx % 2 === 0) ? 'ice' : 'iron';
      const fallbackMaterial = PLANET_MATERIALS[fallbackType];
      const fallbackBaseMass = Math.max(25, Math.round(160 * Math.pow(fallbackRadius / 45, 2) * fallbackMaterial.density));
      const pCanvas = generatePlanetCanvas({ type: fallbackType, radius: fallbackRadius, seed: 101 * (idx + 1) });
      const fName = fallbackDesignations[idx % fallbackDesignations.length] || `PLANETA S-${idx + 1}`;
      this.planets.push({
        id: this.planets.length + 1,
        name: fName,
        x: fx,
        y: fy,
        radius: fallbackRadius,
        initialRadius: fallbackRadius,
        baseMass: fallbackBaseMass,
        currentMass: fallbackBaseMass,
        type: fallbackType,
        material: fallbackMaterial,
        canvas: pCanvas,
        ctx: pCanvas.getContext('2d', { willReadFrequently: true })!,
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

    // 3. Place 1 to 3 Ships on distinct, vertically spaced solid planets (NUNCA en gas)
    const count = this.gameConfig.playerCount;
    const solidPlanets = this.planets.filter(p => !p.material.isGas);
    const candidatePlanets = solidPlanets.length >= count ? solidPlanets : this.planets;
    const sortedPlanets = [...candidatePlanets].sort((a, b) => a.y - b.y);

    let chosenPlanets: Planet[] = [];
    if (count === 1 || count === 2) {
      // Extremos opuestos del cuadrante orbital (Top vs Bottom)
      // Con planetas deshabitados en medio: NUNCA en planetas adyacentes
      chosenPlanets = [sortedPlanets[0], sortedPlanets[sortedPlanets.length - 1]];
    } else {
      // 3 Jugadores: NUNCA en planetas adyacentes (índices 0, 2, 4 si hay 5 planetas)
      if (sortedPlanets.length >= 5) {
        chosenPlanets = [sortedPlanets[0], sortedPlanets[2], sortedPlanets[4]];
      } else if (sortedPlanets.length >= 4) {
        chosenPlanets = [sortedPlanets[0], sortedPlanets[2], sortedPlanets[3]];
      } else {
        chosenPlanets = [sortedPlanets[0], sortedPlanets[1], sortedPlanets[2]];
      }
    }

    const shipConfigs = [
      { id: 1 as PlayerId, color: '#38bdf8', name: 'USS ENTERPRISE (P1)', isAI: false },
      { id: 2 as PlayerId, color: '#f43f5e', name: 'HALCÓN MILENARIO (P2)', isAI: !!this.gameConfig.aiPlayers[2] },
      { id: 3 as PlayerId, color: '#eab308', name: 'ALA-X T-65B (P3)', isAI: !!this.gameConfig.aiPlayers[3] }
    ];

    const activeCount = this.gameConfig.mode === 'vs_ai' ? (count === 1 ? 2 : count) : count;

    this.ships = [];
    for (let i = 0; i < activeCount; i++) {
      const pl = chosenPlanets[i % chosenPlanets.length];
      
      let sAngle = -Math.PI / 2;
      if (i === 0) {
        // Planeta superior: la nave mira hacia abajo hacia el centro de combate
        sAngle = Math.PI * 0.5 + (rng() - 0.5) * 0.35;
      } else if (i === 1) {
        // Planeta inferior: la nave mira hacia arriba
        sAngle = -Math.PI * 0.5 + (rng() - 0.5) * 0.35;
      } else {
        // Planeta intermedio: lateral
        sAngle = (rng() > 0.5 ? 0.05 : Math.PI - 0.05) + (rng() - 0.5) * 0.25;
      }

      let sx = pl.x + Math.cos(sAngle) * (pl.radius + 10);
      let sy = pl.y + Math.sin(sAngle) * (pl.radius + 10);

      // Verificación estricta: distancia lineal garantizada >= 450px con todas las naves existentes
      for (const prevShip of this.ships) {
        const d = Math.hypot(sx - prevShip.x, sy - prevShip.y);
        if (d < 450) {
          sAngle += Math.PI; // Rotar 180° al hemisferio opuesto para máxima separación
          sx = pl.x + Math.cos(sAngle) * (pl.radius + 10);
          sy = pl.y + Math.sin(sAngle) * (pl.radius + 10);
        }
      }

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
    const baseSpeed = (currentShip.power * 0.082 + 1.2) * weapon.speedMultiplier;

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
    const jumpSpeed = (currentShip.power * 0.075 + 1.6);

    currentShip.vx = Math.cos(rad) * jumpSpeed;
    currentShip.vy = -Math.sin(rad) * jumpSpeed;
    currentShip.isAirborne = true;
    currentShip.flightTime = 0;
    currentShip.jumpTrail = [];

    currentShip.x += currentShip.vx * 2;
    currentShip.y += currentShip.vy * 2;

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
        // Fórmula de Daño Cuadrático Inverso por Onda Expansiva:
        // Daño = DañoMax * (1 - dist / RadioExplosion)^2
        const ratio = sDist / effectiveRadius;
        const falloff = Math.pow(Math.max(0, 1 - ratio), 2);
        const rawDmg = Math.round(w.damage * falloff);

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
          // Cuántico de Fase: recibe daño doble por antimateria y armas exóticas
          if (ship.shieldType === 'phase' && (w.category === 'exotic' || w.specialBehavior === 'singularity' || w.specialBehavior === 'void')) {
            dmgToApply = Math.round(dmgToApply * 2);
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
            const shieldAbsorbable = Math.round(dmgToApply * 0.7);
            const actualAbsorbed = Math.min(ship.shield, shieldAbsorbable);
            ship.shield -= actualAbsorbed;
            dmgToApply -= actualAbsorbed;
          }

          // Resistencia a Daño Crítico: NINGÚN arma en el juego puede quitar más de 300 a 350 HP de un solo golpe
          dmgToApply = Math.min(320, dmgToApply);
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
