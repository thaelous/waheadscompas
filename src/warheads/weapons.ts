/**
 * Full Arsenal of 20 Canonical WarHeads (1997, totalPlay / ionos) Weapons
 * Calibrated with historical credit costs, Plummer softening physics & 1000 HP / 500 Shield system
 */

export interface WeaponDef {
  id: number;
  code: string;
  name: string;
  price: number; // In Credits (CR)
  category: 'ballistic' | 'explosive' | 'special' | 'exotic';
  description: string;
  damage: number;
  craterRadius: number;
  mass: number;
  color: string;
  glowColor: string;
  speedMultiplier: number;
  specialBehavior?: string;
}

export const WEAPON_CATALOG: WeaponDef[] = [
  {
    id: 1,
    code: 'WH-01',
    name: 'Proyectil Estándar',
    price: 0, // 100% Gratis - Munición infinita
    category: 'ballistic',
    description: 'Balística clásica equilibrada. Daño moderado, trayectoria limpia y 100% gratuita.',
    damage: 120,
    craterRadius: 25,
    mass: 1.0,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    speedMultiplier: 1.0
  },
  {
    id: 2,
    code: 'WH-02',
    name: 'Maza de Fragmentación',
    price: 35,
    category: 'ballistic',
    description: 'Proyectil de alta densidad; al golpear roca expulsa metralla cinética en abanico.',
    damage: 140,
    craterRadius: 24,
    mass: 1.1,
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    speedMultiplier: 1.05,
    specialBehavior: 'shrapnel'
  },
  {
    id: 3,
    code: 'WH-03',
    name: 'Dardo Gorrión / Taquiónico',
    price: 50,
    category: 'ballistic',
    description: 'Proyectil ultrarrápido insensible al 90% de la gravedad por inyección taquiónica.',
    damage: 130,
    craterRadius: 12,
    mass: 0.3,
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.9)',
    speedMultiplier: 2.6,
    specialBehavior: 'sniper'
  },
  {
    id: 4,
    code: 'WH-04',
    name: 'Cañón Triple',
    price: 65,
    category: 'ballistic',
    description: 'Tres disparos simultáneos divergentes (-6°, 0°, +6°) en formación de abanico.',
    damage: 60, // 60 HP c/u
    craterRadius: 20,
    mass: 1.0,
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.8)',
    speedMultiplier: 1.0,
    specialBehavior: 'trispread'
  },
  {
    id: 5,
    code: 'WH-05',
    name: 'Ojiva de Rebote',
    price: 80,
    category: 'ballistic',
    description: 'Munición de rebote elástico recubierta de plasma; rebota hasta 3 veces en planetas antes de detonar.',
    damage: 160,
    craterRadius: 25,
    mass: 1.1,
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.8)',
    speedMultiplier: 1.15,
    specialBehavior: 'ricochet'
  },
  {
    id: 6,
    code: 'WH-06',
    name: 'Barrena Perforadora',
    price: 100,
    category: 'special',
    description: 'Barrena la roca excavando un túnel continuo de entrada a salida a través del planeta.',
    damage: 220,
    craterRadius: 22,
    mass: 1.4,
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.8)',
    speedMultiplier: 1.1,
    specialBehavior: 'tunnel'
  },
  {
    id: 7,
    code: 'WH-07',
    name: 'Oruga Rodante',
    price: 120,
    category: 'special',
    description: 'Rueda por la superficie rocosa del planeta hacia el rival hasta detonar por impacto.',
    damage: 190,
    craterRadius: 28,
    mass: 1.2,
    color: '#84cc16',
    glowColor: 'rgba(132, 204, 22, 0.8)',
    speedMultiplier: 0.95,
    specialBehavior: 'crawler'
  },
  {
    id: 8,
    code: 'WH-08',
    name: 'Mina Centinela',
    price: 135,
    category: 'special',
    description: 'Mina orbital estática armada en el vacío que detona por proximidad (80px).',
    damage: 240,
    craterRadius: 35,
    mass: 1.0,
    color: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.9)',
    speedMultiplier: 0.75,
    specialBehavior: 'mine'
  },
  {
    id: 9,
    code: 'WH-09',
    name: 'Pulso PEM',
    price: 150,
    category: 'special',
    description: 'Pulso electromagnético: drena el 100% de escudos y el 60% del combustible de salto rival.',
    damage: 50,
    craterRadius: 20,
    mass: 0.9,
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.9)',
    speedMultiplier: 1.1,
    specialBehavior: 'emp'
  },
  {
    id: 10,
    code: 'WH-10',
    name: 'Onda Repulsora',
    price: 170,
    category: 'ballistic',
    description: 'Fuerza cinética masiva que desancla a la nave rival de la roca y la empuja al espacio.',
    damage: 80,
    craterRadius: 30,
    mass: 1.8,
    color: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.85)',
    speedMultiplier: 1.05,
    specialBehavior: 'repulsor'
  },
  {
    id: 11,
    code: 'WH-11',
    name: 'Enjambre MIRV / Racimo',
    price: 190,
    category: 'explosive',
    description: 'Se fragmenta a los 2 segundos de vuelo en 5 proyectiles orbitales independientes.',
    damage: 70, // 70 HP c/u
    craterRadius: 22,
    mass: 1.2,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    speedMultiplier: 0.95,
    specialBehavior: 'split'
  },
  {
    id: 12,
    code: 'WH-12',
    name: 'Espectro Cuántico',
    price: 210,
    category: 'exotic',
    description: 'Proyectil cuántico de fase que atraviesa el primer planeta sin daño y se solidifica en el segundo.',
    damage: 250,
    craterRadius: 34,
    mass: 0.7,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.9)',
    speedMultiplier: 1.2,
    specialBehavior: 'ghost'
  },
  {
    id: 13,
    code: 'WH-13',
    name: 'Quemador Napalm',
    price: 230,
    category: 'explosive',
    description: 'Fuego persistente de hidracina en la corteza por 10 segundos que quema y daña al contacto.',
    damage: 220,
    craterRadius: 38,
    mass: 1.05,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.9)',
    speedMultiplier: 1.0,
    specialBehavior: 'napalm'
  },
  {
    id: 14,
    code: 'WH-14',
    name: 'Inversor de Gravedad',
    price: 260,
    category: 'exotic',
    description: 'Invierte la gravedad del planeta impactado convirtiéndolo en foco de repulsión por 8 segundos.',
    damage: 75,
    craterRadius: 28,
    mass: 1.3,
    color: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.9)',
    speedMultiplier: 0.95,
    specialBehavior: 'inverter'
  },
  {
    id: 15,
    code: 'WH-15',
    name: 'Mano de la Muerte',
    price: 300,
    category: 'exotic',
    description: 'Ácido químico corrosivo que devora un mordisco geológico masivo de la corteza (cráter de 85px).',
    damage: 160,
    craterRadius: 85,
    mass: 1.1,
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.9)',
    speedMultiplier: 0.9,
    specialBehavior: 'acid'
  },
  {
    id: 16,
    code: 'WH-16',
    name: 'Crucero Cazador',
    price: 340,
    category: 'special',
    description: 'Misil con timón guiado autónomo por micro-toberas vectoriales que busca corregir rumbo al rival.',
    damage: 230,
    craterRadius: 32,
    mass: 1.1,
    color: '#0284c7',
    glowColor: 'rgba(2, 132, 199, 0.9)',
    speedMultiplier: 1.0,
    specialBehavior: 'cruiser'
  },
  {
    id: 17,
    code: 'WH-17',
    name: 'Mega-Bomba Nova',
    price: 380,
    category: 'explosive',
    description: 'Masa inercial enorme, curva orbital cerrada y cráter atómico colosal de destrucción profunda.',
    damage: 360,
    craterRadius: 75,
    mass: 2.5,
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.85)',
    speedMultiplier: 0.85
  },
  {
    id: 18,
    code: 'WH-18',
    name: 'Implosión de Vacío',
    price: 420,
    category: 'exotic',
    description: 'Succión violeta gravitatoria durante 1 segundo antes de la aniquilación gravitacional de masa.',
    damage: 420,
    craterRadius: 45,
    mass: 0.9,
    color: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.95)',
    speedMultiplier: 1.05,
    specialBehavior: 'void'
  },
  {
    id: 19,
    code: 'WH-19',
    name: 'Agujero Negro / Singularidad',
    price: 460,
    category: 'exotic',
    description: 'Micro agujero negro estático durante 10 segundos que curva y desvía todo proyectil en vuelo.',
    damage: 280,
    craterRadius: 40,
    mass: 1.5,
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.9)',
    speedMultiplier: 0.9,
    specialBehavior: 'singularity'
  },
  {
    id: 20,
    code: 'WH-20',
    name: 'Cataclismo del Juicio Final',
    price: 500,
    category: 'exotic',
    description: 'Fractura geológica cataclísmica que aniquila y destruye más del 50% de la masa total del astro.',
    damage: 500,
    craterRadius: 130,
    mass: 3.5,
    color: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.95)',
    speedMultiplier: 0.7,
    specialBehavior: 'doomsday'
  }
];
