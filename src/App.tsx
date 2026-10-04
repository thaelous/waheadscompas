/**
 * WarHeads (1997) Tactical Military HUD & Viewport Container
 * Authentic 1997 totalPlay / ionos Military Radar Aesthetic
 * 1 to 3 Players (Human vs Tactical AI / Pass & Play / Online Firebase)
 * Credit Economy (Coins, Bounties, Weapon Purchases) & Hangar Ship Models
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  WarHeadsEngine,
  VIEW_WIDTH,
  VIEW_HEIGHT,
  Ship,
  PlayerId,
  ShipModel,
  GameConfig
} from './warheads/engine';
import { WEAPON_CATALOG, WeaponDef } from './warheads/weapons';
import { sound } from './warheads/audio';
import { network, NetworkShotEvent } from './warheads/network';
import { ScreenCelebration } from './warheads/ScreenCelebration';
import {
  Crosshair,
  Zap,
  Shield,
  Fuel,
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  Wifi,
  X,
  Target,
  Coins,
  Bot,
  Layers,
  ChevronRight,
  Smartphone,
  Sliders,
  Maximize,
  Minimize,
  Share2,
  Copy,
  Check,
  Compass,
  Sparkles
} from 'lucide-react';

interface TouchAimData {
  shipScreenX: number;
  shipScreenY: number;
  touchScreenX: number;
  touchScreenY: number;
  angle: number;
  distance: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<WarHeadsEngine | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  // Tactical HUD State
  const [currentTurn, setCurrentTurn] = useState<PlayerId>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [ships, setShips] = useState<Ship[]>([]);
  const [winner, setWinner] = useState<PlayerId | 'draw' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [coinNotification, setCoinNotification] = useState<{ text: string; id: number } | null>(null);

  // Mobile & Touch States
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileLandscapeLayout, setMobileLandscapeLayout] = useState<'dock' | 'overlay'>('dock');
  const [copySuccess, setCopySuccess] = useState(false);
  const [dismissRotateTip, setDismissRotateTip] = useState(false);
  const [isTouchAiming, setIsTouchAiming] = useState(false);
  const [touchAimData, setTouchAimData] = useState<TouchAimData | null>(null);
  const [selectedWeaponCategory, setSelectedWeaponCategory] = useState<'all' | 'ballistic' | 'explosive' | 'special' | 'exotic'>('all');

  // PWA Install States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Weapon Matrix Dialog
  const [showWeaponMatrix, setShowWeaponMatrix] = useState(false);

  // Splash Screen & Modals
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showHangarModal, setShowHangarModal] = useState(false);

  const [gameConfig, setGameConfig] = useState<GameConfig>({
    mode: 'pass_play',
    playerCount: 2,
    models: { 1: 'enterprise', 2: 'falcon', 3: 'xwing' },
    aiPlayers: {}
  });

  const [roomCode, setRoomCode] = useState(network.getRoomId() || '');
  const [isOnlineMode, setIsOnlineMode] = useState(network.isOnline());
  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>(network.getLocalPlayerId());

  // Dial drag state
  const dialRef = useRef<SVGSVGElement | null>(null);
  const mobileDialRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingDial, setIsDraggingDial] = useState(false);

  // Current active ship
  const activeShip = ships.find(s => s.id === currentTurn) || ships[0];
  const activeWeapon = WEAPON_CATALOG.find(w => w.id === activeShip?.weaponId) || WEAPON_CATALOG[0];

  // Mobile Haptic Vibration Feedback
  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }, []);

  // Unlock Audio on First User Interaction (essential for iOS Safari & Android Chrome)
  useEffect(() => {
    const handleFirstTouch = () => {
      sound.unlock();
    };
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('pointerdown', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  // Strict Mobile Gesture Lock (prevents dblclick zoom, pinch gesture, overscroll)
  useEffect(() => {
    const preventDblClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    const preventTouchPinch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('dblclick', preventDblClick, { passive: false });
    window.addEventListener('gesturestart', preventGesture, { passive: false });
    window.addEventListener('gesturechange', preventGesture, { passive: false });
    window.addEventListener('gestureend', preventGesture, { passive: false });
    window.addEventListener('touchmove', preventTouchPinch, { passive: false });

    return () => {
      window.removeEventListener('dblclick', preventDblClick);
      window.removeEventListener('gesturestart', preventGesture);
      window.removeEventListener('gesturechange', preventGesture);
      window.removeEventListener('gestureend', preventGesture);
      window.removeEventListener('touchmove', preventTouchPinch);
    };
  }, []);

  // Fullscreen state tracker
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    triggerHaptic(15);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Device & Orientation Detection
  useEffect(() => {
    const checkLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 840 || h < 600 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
      setIsPortrait(h > w && w < 840);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    window.addEventListener('orientationchange', checkLayout);
    return () => {
      window.removeEventListener('resize', checkLayout);
      window.removeEventListener('orientationchange', checkLayout);
    };
  }, []);

  // PWA Install Event Listener & Safari iOS detection
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    triggerHaptic(20);
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(prev => !prev);
    }
  };

  // Initialize WarHeads Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new WarHeadsEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onTurnChange = (newTurn) => {
      setCurrentTurn(newTurn);
      setIsSimulating(false);
      setShips([...engine.ships]);
    };

    engine.onStateUpdate = () => {
      setIsSimulating(engine.isSimulating);
      setShips([...engine.ships]);
    };

    engine.onGameOver = (win) => {
      setWinner(win);
      setIsSimulating(false);
      setShips([...engine.ships]);
      if (win) {
        sound.playVictory();
        triggerHaptic([60, 40, 60, 40, 140]);
      }
    };

    engine.onCoinCollected = (playerId, amount) => {
      setCoinNotification({
        text: `+${amount} CR`,
        id: Date.now()
      });
      setTimeout(() => setCoinNotification(null), 1800);
      setShips([...engine.ships]);
    };

    setShips([...engine.ships]);

    // Handle Network shots
    network.onShot((shot: NetworkShotEvent) => {
      if (engineRef.current && shot.playerId === engineRef.current.currentTurn) {
        const targetShip = engineRef.current.ships.find(s => s.id === shot.playerId);
        if (targetShip) {
          targetShip.aimAngle = shot.angle;
          targetShip.power = shot.power;
          targetShip.weaponId = shot.weaponId;
          if (shot.actionType === 'JUMP') {
            engineRef.current.executeHyperJump();
          } else {
            engineRef.current.fireCurrentWeapon();
          }
          setShips([...engineRef.current.ships]);
        }
      }
    });

    // Handle Network new procedural level seed sync
    network.onNewRound((seed: number) => {
      if (engineRef.current) {
        engineRef.current.initScenario(seed);
        setCurrentTurn(1);
        setWinner(null);
        setIsSimulating(false);
        setShips([...engineRef.current.ships]);
        sound.playBeep(880, 0.08);
      }
    });

    return () => {
      engine.destroy();
    };
  }, []);

  // Update QR Code when room modal opens
  useEffect(() => {
    if (showRoomModal && qrContainerRef.current && roomCode) {
      const roomUrl = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
      network.renderQRCode(qrContainerRef.current, roomUrl);
    }
  }, [showRoomModal, roomCode]);

  // Adjust angle
  const adjustAngle = useCallback((delta: number) => {
    if (!engineRef.current || isSimulating || winner) return;
    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (!ship || ship.isAI) return;
    let newAngle = (ship.aimAngle + delta) % 360;
    if (newAngle < 0) newAngle += 360;
    ship.aimAngle = Math.round(newAngle * 10) / 10;
    triggerHaptic(10);
    sound.playDialTick();
    setShips([...engineRef.current.ships]);
  }, [currentTurn, isSimulating, winner, triggerHaptic]);

  // Adjust power
  const adjustPower = useCallback((val: number) => {
    if (!engineRef.current || isSimulating || winner) return;
    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (!ship || ship.isAI) return;
    ship.power = Math.min(100, Math.max(10, Math.round(val)));
    triggerHaptic(8);
    sound.playDialTick();
    setShips([...engineRef.current.ships]);
  }, [currentTurn, isSimulating, winner, triggerHaptic]);

  // Select weapon
  const selectWeapon = useCallback((weaponId: number) => {
    if (!engineRef.current || isSimulating || winner) return;
    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (!ship) return;
    const weapon = WEAPON_CATALOG.find(w => w.id === weaponId);
    if (!weapon || ship.credits < weapon.price) {
      triggerHaptic([30, 30]);
      sound.playBeep(180, 0.1);
      return;
    }
    ship.weaponId = weaponId;
    triggerHaptic(15);
    sound.playBeep(720, 0.05);
    setShowWeaponMatrix(false);
    setShips([...engineRef.current.ships]);
  }, [currentTurn, isSimulating, winner, triggerHaptic]);

  // Fire Weapon
  const handleFire = useCallback(() => {
    if (!engineRef.current || isSimulating || winner) return;
    if (isOnlineMode && currentTurn !== localPlayerId) {
      sound.playBeep(240, 0.1);
      return;
    }

    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (!ship || ship.isAI) return;

    const weapon = WEAPON_CATALOG.find(w => w.id === ship.weaponId) || WEAPON_CATALOG[0];
    if (ship.credits < weapon.price) {
      triggerHaptic([30, 40]);
      sound.playBeep(180, 0.1);
      return;
    }

    triggerHaptic([30, 20, 45]);
    if (isOnlineMode) {
      network.sendShot(ship.aimAngle, ship.power, ship.weaponId, 'FIRE');
    }

    const fired = engineRef.current.fireCurrentWeapon();
    if (fired) {
      setIsSimulating(true);
      setShips([...engineRef.current.ships]);
    }
  }, [isSimulating, winner, isOnlineMode, currentTurn, localPlayerId, triggerHaptic]);

  // Hyper-Jump / Orbital Leap Action
  const handleHyperJump = useCallback(() => {
    if (!engineRef.current || isSimulating || winner) return;
    if (isOnlineMode && currentTurn !== localPlayerId) {
      sound.playBeep(240, 0.1);
      return;
    }

    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (!ship || ship.isAI || ship.fuel < 25) {
      triggerHaptic([30, 40]);
      sound.playBeep(200, 0.1);
      return;
    }

    triggerHaptic([25, 30, 60]);
    if (isOnlineMode) {
      network.sendShot(ship.aimAngle, ship.power, ship.weaponId, 'JUMP');
    }

    const jumped = engineRef.current.executeHyperJump();
    if (jumped) {
      setIsSimulating(true);
      setShips([...engineRef.current.ships]);
    }
  }, [isSimulating, winner, isOnlineMode, currentTurn, localPlayerId, triggerHaptic]);

  // Reset Match / Generate New Procedural Star System
  const handleRestart = useCallback((customSeed?: number, config?: GameConfig) => {
    if (!engineRef.current) return;
    const newSeed = customSeed !== undefined ? customSeed : Math.floor(Math.random() * 1000000);
    const activeCfg = config || gameConfig;
    if (isOnlineMode) {
      network.sendNewRound(newSeed);
    }
    triggerHaptic(20);
    engineRef.current.initScenario(newSeed, activeCfg);
    setCurrentTurn(1);
    setWinner(null);
    setIsSimulating(false);
    setShips([...engineRef.current.ships]);
    sound.playBeep(660, 0.1);
  }, [isOnlineMode, gameConfig, triggerHaptic]);

  // Apply new hangar config
  const handleApplyConfig = (newCfg: GameConfig) => {
    setGameConfig(newCfg);
    setShowHangarModal(false);
    setShowSplashScreen(false);
    handleRestart(undefined, newCfg);
  };

  // Web Share or Clipboard Copy for Multiplayer Room
  const handleShareRoom = async () => {
    const roomUrl = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WarHeads 1997 - Batalla Orbital',
          text: `¡Únete a mi sala ${roomCode} en WarHeads 1997 para un combate balístico espacial!`,
          url: roomUrl
        });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopySuccess(true);
      triggerHaptic(20);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch (_) {}
  };

  // Dial dragging math (supports both desktop and mobile circular rotary dial)
  const handleDialPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isSimulating || winner || activeShip?.isAI) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDraggingDial(true);
    triggerHaptic(10);
    handleDialPointerMove(e);
  };

  const handleDialPointerMove = (e: React.PointerEvent<SVGSVGElement> | PointerEvent) => {
    if (!isDraggingDial && e.type !== 'pointerdown') return;
    const currentDial = (e.currentTarget instanceof SVGSVGElement ? e.currentTarget : null) || dialRef.current || mobileDialRef.current;
    if (!currentDial || !engineRef.current) return;
    const rect = currentDial.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = cy - e.clientY;

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    const ship = engineRef.current.ships.find(s => s.id === currentTurn);
    if (ship && !ship.isAI) {
      const prevAngle = ship.aimAngle;
      ship.aimAngle = Math.round(deg * 10) / 10;
      if (Math.abs(prevAngle - ship.aimAngle) >= 1) {
        triggerHaptic(8);
        sound.playDialTick();
      }
      setShips([...engineRef.current.ships]);
    }
  };

  const handleDialPointerUp = (e?: React.PointerEvent<SVGSVGElement> | PointerEvent) => {
    if (e && e.currentTarget && 'releasePointerCapture' in e.currentTarget && typeof (e.currentTarget as Element).releasePointerCapture === 'function') {
      try {
        (e.currentTarget as Element).releasePointerCapture((e as any).pointerId);
      } catch (_) {}
    }
    setIsDraggingDial(false);
  };

  // Direct Canvas Touch-To-Aim for Mobile & Pointer devices
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isSimulating || winner || activeShip?.isAI) return;
    if (isOnlineMode && currentTurn !== localPlayerId) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsTouchAiming(true);
    triggerHaptic(12);
    updateAimFromPointer(e);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTouchAiming) return;
    updateAimFromPointer(e);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTouchAiming) return;
    setIsTouchAiming(false);
    setTouchAimData(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const updateAimFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current || !activeShip) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const container = canvasRef.current.parentElement;
    let shipScreenX = 0;
    let shipScreenY = 0;
    let touchScreenX = 0;
    let touchScreenY = 0;

    if (container) {
      const cRect = container.getBoundingClientRect();
      shipScreenX = (activeShip.x / scaleX) + (rect.left - cRect.left);
      shipScreenY = (activeShip.y / scaleY) + (rect.top - cRect.top);
      touchScreenX = e.clientX - cRect.left;
      touchScreenY = e.clientY - cRect.top;
    }

    const dx = canvasX - activeShip.x;
    const dy = activeShip.y - canvasY; // Standard Cartesian (up is positive)
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    const rounded = Math.round(deg * 10) / 10;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(activeShip.aimAngle - rounded) >= 0.5) {
      activeShip.aimAngle = rounded;
      triggerHaptic(8);
      sound.playDialTick();
      setShips([...engineRef.current.ships]);
    }

    setTouchAimData({
      shipScreenX,
      shipScreenY,
      touchScreenX,
      touchScreenY,
      angle: rounded,
      distance: Math.round(dist)
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleFire();
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        handleHyperJump();
      } else if (e.code === 'ArrowLeft') {
        adjustAngle(e.shiftKey ? 5 : 1);
      } else if (e.code === 'ArrowRight') {
        adjustAngle(e.shiftKey ? -5 : -1);
      } else if (e.code === 'ArrowUp') {
        if (activeShip) adjustPower(activeShip.power + (e.shiftKey ? 5 : 1));
      } else if (e.code === 'ArrowDown') {
        if (activeShip) adjustPower(activeShip.power - (e.shiftKey ? 5 : 1));
      } else if (e.code === 'KeyW') {
        setShowWeaponMatrix(prev => !prev);
      }
    };

    const handleWindowPointerUp = () => {
      setIsDraggingDial(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [handleFire, handleHyperJump, adjustAngle, adjustPower, activeShip]);

  return (
    <div id="game-container" className="fixed inset-0 w-full h-full overflow-hidden bg-black font-sans text-slate-200 select-none flex flex-col touch-none">
      {/* 1. PANTALLA DE PRESENTACIÓN (SPLASH SCREEN RETRO-SCIFI EN ESPAÑOL) */}
      {showSplashScreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 select-none overflow-hidden font-mono">
          {/* Fondo animado de campo estelar con nebulosas sutiles y siluetas orbitales */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950/90 to-black" />
            
            {/* Siluetas orbitales concéntricas tenues */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-cyan-500/20 animate-spin-slow pointer-events-none" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-cyan-700/10 pointer-events-none" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-dashed border-amber-500/25 pointer-events-none" />

            {/* Planeta decorativo central con atmósfera tenue */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-cyan-900/50 border border-cyan-500/30 shadow-[0_0_90px_rgba(6,182,212,0.2)] opacity-70" />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
            {/* Encabezado */}
            <div className="mb-2">
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.35em] text-cyan-400 uppercase">
                TOTALPLAY SOFTWARE // IONOS // 1997-2026
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_40px_rgba(6,182,212,0.85)] mb-3">
              WARHEADS
            </h1>

            {/* Subtítulo Destacado en cian/ámbar */}
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-amber-500/70 bg-amber-950/50 text-amber-300 text-xs sm:text-sm font-black tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.35)] mb-8">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>VERSIÓN COMPAS</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mb-8 px-2 font-sans">
              Artillería orbital táctica en dos dimensiones con física gravitatoria de Plummer, destrucción volumétrica de planetas, 20 armas canónicas y topología toroidal.
            </p>

            {/* Botón interactivo central con efecto de brillo */}
            <button
              onClick={() => {
                sound.unlock();
                sound.playBeep(660, 0.08);
                triggerHaptic([30, 20, 40]);
                setShowSplashScreen(false);
                setShowHangarModal(true);
              }}
              className="glow-btn relative group px-6 sm:px-8 py-4 bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600 hover:from-cyan-500 hover:to-teal-400 text-white font-black text-sm sm:text-base tracking-widest uppercase rounded-xl border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_45px_rgba(6,182,212,0.9)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              <Target className="w-5 h-5 text-cyan-200 animate-spin-slow" />
              <span>[ ENTRAR AL SISTEMA / CONFIGURAR COMBATE ]</span>
            </button>

            {/* Botón de Instalación Táctil PWA */}
            {!isInstalled && (deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallPWA}
                className="mt-3 px-6 py-3 bg-slate-900/90 border border-emerald-500 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 w-full sm:w-auto"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>[ 📲 INSTALAR EN EL DISPOSITIVO ]</span>
              </button>
            )}

            {/* Micro-tooltip para Safari en iOS */}
            {isIOS && !isInstalled && (
              <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg max-w-sm">
                Pulsa <strong className="text-cyan-300">Compartir</strong> (⎋) y luego <strong className="text-cyan-300">'Agregar al inicio'</strong> para instalar.
              </div>
            )}

            {/* Botón secundario rápido */}
            <button
              onClick={() => {
                sound.unlock();
                sound.playBeep(440, 0.08);
                triggerHaptic(20);
                setShowSplashScreen(false);
                setShowHangarModal(false);
              }}
              className="mt-4 text-xs text-slate-400 hover:text-cyan-300 transition-colors uppercase tracking-wider underline underline-offset-4 cursor-pointer"
            >
              DESPLIEGUE RÁPIDO DIRECTO A LA ARENA
            </button>

            {/* Badges militares inferiores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8 w-full text-[10px] text-slate-400">
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-cyan-300 font-bold block">1-3 JUGADORES</span>
                <span>Humano / IA / QR</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-amber-300 font-bold block">20 ARMAS</span>
                <span>Balística & Exóticas</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-emerald-300 font-bold block">GRAVEDAD</span>
                <span>Plummer Runge-Kutta</span>
              </div>
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                <span className="text-purple-300 font-bold block">CÁMARA FIJA</span>
                <span>1280x720 Móvil-Lock</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP MILITARY STATUS BAR */}
      <header className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-900/60 shadow-lg z-20 shrink-0 font-mono">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setShowSplashScreen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 rounded text-cyan-400 text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
            title="Volver a la Pantalla de Presentación"
          >
            <Crosshair className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="hidden xs:inline">WARHEADS</span>
            <span className="xs:hidden">WH97</span>
          </button>

          {/* Turno activo */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-slate-900 text-[10px] sm:text-xs font-black shadow"
            style={{ borderColor: activeShip?.color || '#38bdf8' }}
          >
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeShip?.color || '#38bdf8' }} />
            <span style={{ color: activeShip?.color || '#38bdf8' }}>
              TURNO: JUGADOR {activeShip?.id || 1}{activeShip?.isAI ? ' [IA]' : ' [HUMANO]'}
            </span>
          </div>
        </div>

        {/* Telemetría activa: Blindaje, Escudo, Combustible y Créditos */}
        <div className="flex items-center gap-2 sm:gap-3.5 text-[10px] sm:text-xs font-bold">
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="text-slate-400 hidden sm:inline">BLINDAJE:</span>
            <span>{activeShip?.hp ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="text-slate-400 hidden sm:inline">ESCUDO:</span>
            <span>{activeShip?.shield ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-sky-400">
            <span className="text-slate-400 hidden sm:inline">COMBUSTIBLE:</span>
            <span>{activeShip?.fuel ?? 0}%</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-black bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>CRÉDITOS: {activeShip?.credits ?? 0} CR</span>
          </div>
        </div>

        {/* SYSTEM ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* MOBILE LANDSCAPE LAYOUT TOGGLE */}
          {!isPortrait && isMobile && (
            <button
              onClick={() => {
                setMobileLandscapeLayout(prev => prev === 'dock' ? 'overlay' : 'dock');
                triggerHaptic(15);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-cyan-800 bg-slate-900 text-cyan-300 hover:border-cyan-500"
              title="Alternar entre Barra Inferior y Mandos Flotantes para Móvil"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mobileLandscapeLayout === 'dock' ? 'MANDOS FLOTANTES' : 'BARRA DOCK'}</span>
            </button>
          )}

          {/* FULLSCREEN TOGGLE */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900 border border-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa Móvil'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* HANGAR & MODE CONFIG BUTTON */}
          <button
            onClick={() => setShowHangarModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded border border-cyan-800 bg-slate-900 hover:bg-cyan-950/60 hover:border-cyan-500 text-cyan-300 transition-colors"
            title="Configurar Modo de Juego y Hangar de Naves"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CONFIGURAR</span>
          </button>

          {/* ONLINE ROOM */}
          <button
            onClick={() => setShowRoomModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded border border-cyan-800 bg-slate-900 hover:bg-cyan-950/60 hover:border-cyan-500 text-cyan-300 transition-colors"
            title="Multijugador Online con QR"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isOnlineMode ? `SALA ${roomCode}` : 'SALA QR'}</span>
          </button>

          {/* SOUND TOGGLE */}
          <button
            onClick={() => {
              const muted = sound.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-800 rounded transition-colors"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* NUEVO MAPA */}
          <button
            onClick={() => handleRestart()}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded border border-amber-800/80 bg-slate-900 hover:bg-amber-950/60 hover:border-amber-500 text-amber-300 transition-colors"
            title="Generar un nuevo sistema estelar aleatorio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NUEVO MAPA</span>
          </button>
        </div>
      </header>

      {/* 100% FIXED TACTICAL VIEWPORT (1280x720 internal resolution, object-fit: contain) */}
      <div className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center overflow-hidden p-0.5 sm:p-2 select-none touch-none">
        {/* Mobile Portrait Rotation Helper */}
        {isPortrait && !dismissRotateTip && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-cyan-950/95 border border-cyan-500/80 rounded-full shadow-lg text-[11px] font-mono text-cyan-200">
            <Smartphone className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Gira a horizontal para vista apaisada</span>
            <button
              onClick={() => setDismissRotateTip(true)}
              className="ml-1 p-0.5 hover:text-white rounded-full bg-cyan-900/60"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          className="max-h-full max-w-full aspect-[16/9] object-contain shadow-2xl block touch-none cursor-crosshair"
          style={{ imageRendering: 'auto' }}
        />

        {/* Dynamic Ballistic Targeting Vector from Ship to Touch */}
        {isTouchAiming && touchAimData && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {/* Dashed laser trajectory vector */}
            <line
              x1={touchAimData.shipScreenX}
              y1={touchAimData.shipScreenY}
              x2={touchAimData.touchScreenX}
              y2={touchAimData.touchScreenY}
              stroke={activeShip?.color || '#38bdf8'}
              strokeWidth="2"
              strokeDasharray="4,4"
              strokeOpacity="0.85"
            />
            {/* Targeting reticle at touch point */}
            <circle
              cx={touchAimData.touchScreenX}
              cy={touchAimData.touchScreenY}
              r="18"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2,3"
            />
            <circle
              cx={touchAimData.touchScreenX}
              cy={touchAimData.touchScreenY}
              r="4"
              fill="#f43f5e"
              fillOpacity="0.8"
            />
          </svg>
        )}

        {/* Touch Aim Reticle Telemetry Tag */}
        {isTouchAiming && touchAimData && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ left: touchAimData.touchScreenX, top: Math.max(25, touchAimData.touchScreenY - 32) }}
          >
            <div className="text-[10px] font-mono font-bold text-cyan-300 bg-black/90 px-2 py-0.5 rounded-full border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)] whitespace-nowrap">
              {touchAimData.angle.toFixed(1)}° • {activeShip?.power}%
            </div>
          </div>
        )}

        {/* Floating Coin Pickup Notification */}
        {coinNotification && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none font-mono text-xs sm:text-sm font-black text-amber-300 bg-amber-950/80 border border-amber-400 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce flex items-center gap-1.5 z-20">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coinNotification.text}</span>
          </div>
        )}

        {/* Telemetry Corner Readout */}
        <div className="absolute top-2 left-2 pointer-events-none font-mono text-[9px] sm:text-[11px] text-cyan-500/80 bg-black/60 backdrop-blur-sm border border-cyan-900/60 p-1.5 sm:p-2 rounded shadow">
          <div>SISTEMA: #{engineRef.current?.currentSeed || '1001'} [{engineRef.current?.planets.length || 0} CUERPOS]</div>
          <div>MODO: {gameConfig.mode.toUpperCase()} ({ships.length} NAVES)</div>
          <div className="hidden xs:block">CÁMARA: FIJA 100% INMUTABLE</div>
          {isSimulating && <div className="text-amber-400 animate-pulse font-bold">BALÍSTICA EN CURSO...</div>}
        </div>

        {/* FLOATING THUMB CONTROLS OVERLAY FOR MOBILE LANDSCAPE MODE */}
        {!isPortrait && isMobile && mobileLandscapeLayout === 'overlay' && (
          <div className="absolute inset-0 pointer-events-none z-20 flex justify-between p-2">
            {/* Left Thumb Bay: Compact Angle & Power */}
            <div className="pointer-events-auto flex flex-col justify-end gap-1.5 bg-slate-950/85 backdrop-blur-sm border border-cyan-900/80 p-2 rounded-xl max-w-[170px] shadow-2xl">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold">
                <span>ÁNGULO:</span>
                <span className="text-sm font-black text-cyan-400">{activeShip?.aimAngle.toFixed(1)}°</span>
              </div>
              <div className="flex items-center gap-1 font-mono">
                <button
                  onClick={() => adjustAngle(5)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 py-1.5 bg-slate-900 active:bg-cyan-800 border border-slate-700 text-xs font-bold text-slate-200 rounded disabled:opacity-40"
                >
                  +5°
                </button>
                <button
                  onClick={() => adjustAngle(1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 py-1.5 bg-slate-900 active:bg-cyan-800 border border-slate-700 text-xs font-bold text-slate-200 rounded disabled:opacity-40"
                >
                  +1°
                </button>
                <button
                  onClick={() => adjustAngle(-1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 py-1.5 bg-slate-900 active:bg-cyan-800 border border-slate-700 text-xs font-bold text-slate-200 rounded disabled:opacity-40"
                >
                  -1°
                </button>
                <button
                  onClick={() => adjustAngle(-5)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 py-1.5 bg-slate-900 active:bg-cyan-800 border border-slate-700 text-xs font-bold text-slate-200 rounded disabled:opacity-40"
                >
                  -5°
                </button>
              </div>
              <div className="flex items-center gap-1 font-mono mt-1">
                <span className="text-[10px] text-amber-400 font-bold">POT: {activeShip?.power}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={activeShip?.power || 50}
                  onChange={(e) => adjustPower(Number(e.target.value))}
                  disabled={isSimulating || activeShip?.isAI}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Right Thumb Bay: Launch, Jump & Active Weapon */}
            <div className="pointer-events-auto flex flex-col justify-end gap-1.5 bg-slate-950/85 backdrop-blur-sm border border-cyan-900/80 p-2 rounded-xl shadow-2xl max-w-[200px]">
              <button
                onClick={() => setShowWeaponMatrix(true)}
                disabled={isSimulating || activeShip?.isAI}
                className="flex items-center justify-between px-2 py-1.5 bg-slate-900 border border-cyan-700 rounded text-left font-mono"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeWeapon.color }} />
                  <span className="text-xs font-bold text-slate-100 truncate">{activeWeapon.name}</span>
                </div>
                <span className="text-[10px] text-amber-400 shrink-0 font-bold ml-1">
                  {activeWeapon.price === 0 ? '0 CR' : `${activeWeapon.price} CR`}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleHyperJump}
                  disabled={isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI}
                  className={`flex-1 py-2.5 font-mono text-xs font-bold uppercase rounded border transition-all active:scale-95 ${
                    isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI
                      ? 'bg-slate-900 border-slate-800 text-slate-600'
                      : 'bg-gradient-to-b from-amber-600 to-amber-900 border-amber-400 text-white shadow-lg'
                  }`}
                >
                  SALTO ORBITAL
                </button>

                <button
                  onClick={handleFire}
                  disabled={isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI}
                  className={`flex-[1.4] py-2.5 font-mono text-xs font-black tracking-wider uppercase rounded-lg border shadow-xl transition-all active:scale-95 ${
                    isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI
                      ? 'bg-slate-900 border-slate-800 text-slate-600'
                      : 'bg-gradient-to-r from-rose-600 to-red-700 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                  }`}
                >
                  {isSimulating ? 'EN VUELO' : 'DISPARAR'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. DESKTOP RETRO MILITARY HUD DASHBOARD (hidden on mobile, block on md+) */}
      <footer className="hidden md:block w-full bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t-2 border-cyan-900/80 p-2 sm:p-3 shadow-2xl z-20 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-4 items-center">

          {/* 1. TACTICAL 360-DEGREE ANGLE DIAL */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2 rounded-lg shadow-inner">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0">
              <svg
                ref={dialRef}
                viewBox="-50 -50 100 100"
                className="w-full h-full cursor-pointer select-none touch-none"
                onPointerDown={handleDialPointerDown}
                onPointerMove={handleDialPointerMove}
                onPointerUp={handleDialPointerUp}
              >
                <circle cx="0" cy="0" r="46" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
                <circle cx="0" cy="0" r="42" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,4" />
                <line x1="0" y1="-44" x2="0" y2="-38" stroke="#38bdf8" strokeWidth="2" />
                <line x1="44" y1="0" x2="38" y2="0" stroke="#38bdf8" strokeWidth="2" />
                <line x1="0" y1="44" x2="0" y2="38" stroke="#38bdf8" strokeWidth="2" />
                <line x1="-44" y1="0" x2="-38" y2="0" stroke="#38bdf8" strokeWidth="2" />

                {activeShip && (
                  <g transform={`rotate(${-activeShip.aimAngle})`}>
                    <line x1="0" y1="0" x2="36" y2="0" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="36" cy="0" r="3" fill="#f43f5e" />
                  </g>
                )}
                <circle cx="0" cy="0" r="5" fill="#38bdf8" />
              </svg>
            </div>

            <div className="flex flex-col gap-1 flex-1 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">ÁNGULO DE TIRO</span>
                <span className="text-sm font-bold text-cyan-400 tabular-nums">
                  {activeShip?.aimAngle.toFixed(1)}°
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => adjustAngle(-1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 active:bg-cyan-900 text-lg font-black text-cyan-300 rounded-lg transition-colors disabled:opacity-40 cursor-pointer shadow"
                  title="Reducir 1 grado [-]"
                >
                  [-]
                </button>
                <button
                  onClick={() => adjustAngle(1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="flex-1 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 active:bg-cyan-900 text-lg font-black text-cyan-300 rounded-lg transition-colors disabled:opacity-40 cursor-pointer shadow"
                  title="Aumentar 1 grado [+]"
                >
                  [+]
                </button>
              </div>
            </div>
          </div>

          {/* 2. PROPULSION POWER GAUGE */}
          <div className="flex flex-col gap-1.5 bg-slate-950/80 border border-slate-800 p-2 rounded-lg font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">IMPULSO PROPELENTE</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {activeShip?.power}%
              </span>
            </div>

            <div className="relative w-full h-4 bg-slate-900 border border-slate-700 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                style={{ width: `${activeShip?.power || 50}%` }}
              />
            </div>

            <div className="flex items-center gap-1">
              <input
                type="range"
                min="10"
                max="100"
                value={activeShip?.power || 50}
                onChange={(e) => adjustPower(Number(e.target.value))}
                disabled={isSimulating || activeShip?.isAI}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* 3. TACTICAL WEAPON MATRIX WITH PRICES & BALANCE */}
          <div className="flex flex-col gap-1 bg-slate-950/80 border border-slate-800 p-2 rounded-lg font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">OJIVA ACTIVA</span>
              <span className="text-[11px] font-bold text-amber-400">
                {activeWeapon.price === 0 ? 'GRATIS (0 CR)' : `${activeWeapon.price} CR`}
              </span>
            </div>

            <button
              onClick={() => setShowWeaponMatrix(true)}
              disabled={isSimulating || activeShip?.isAI}
              className="flex items-center justify-between w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 hover:border-cyan-500 rounded-lg text-left transition-colors group disabled:opacity-40 cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeWeapon.color }} />
                <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300">
                  {activeWeapon.name}
                </span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold uppercase px-2 py-0.5 bg-cyan-950/80 border border-cyan-700/60 rounded shrink-0">
                [ SELECCIONAR ARMA ]
              </span>
            </button>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>DAÑO: {activeWeapon.damage} HP</span>
              <span>CRÁTER: {activeWeapon.craterRadius}px</span>
            </div>
          </div>

          {/* 4. ACTIONS & SHIP STATUS */}
          <div className="flex items-center gap-2">
            {/* Ship Status: Hull, Shield & Credits */}
            <div className="flex flex-col gap-1 flex-1 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">BLINDAJE:</span>
                <span className="font-bold text-emerald-400">{activeShip?.hp || 0} / {activeShip?.maxHp || 1000} HP</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, ((activeShip?.hp || 0) / (activeShip?.maxHp || 1000)) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">ESCUDO DEFLECTOR:</span>
                <span className="font-bold text-cyan-400">{activeShip?.shield || 0} / 500 SP</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${Math.min(100, ((activeShip?.shield || 0) / 500) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">FONDOS:</span>
                <span className="font-bold text-amber-400">{activeShip?.credits || 0} CR</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(100, ((activeShip?.credits || 0) / 600) * 100)}%` }}
                />
              </div>
            </div>

            {/* BUTTONS: HYPER-JUMP & FIRE */}
            <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
              <button
                onClick={handleHyperJump}
                disabled={isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI}
                className={`relative px-4 h-12 font-mono text-xs font-bold tracking-wider uppercase rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                  isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-amber-400 text-white shadow-[0_0_14px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer'
                }`}
                title="Salto Orbital balístico hacia otro planeta (-30 Fuel) [Tecla J]"
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>SALTO ORBITAL</span>
                </div>
              </button>

              <button
                onClick={handleFire}
                disabled={isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI}
                className={`relative px-5 h-12 font-mono text-xs font-black tracking-wider uppercase rounded-xl border shadow-xl transition-all active:scale-95 flex items-center justify-center ${
                  isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-b from-rose-600 via-rose-700 to-rose-900 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_26px_rgba(244,63,94,0.7)] cursor-pointer'
                }`}
                title={`Disparar arma (${activeWeapon.price === 0 ? 'Gratis' : `${activeWeapon.price} CR`}) [Espacio]`}
              >
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 animate-spin-slow" />
                  <span>{isSimulating ? 'EN VUELO' : 'DISPARAR'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 2. MOBILE DEDICATED CONTROLLER (block on mobile, hidden on md+) */}
      {/* 2A. MOBILE PORTRAIT TACTICAL BATTLE COCKPIT */}
      {isPortrait ? (
        <footer className="block md:hidden w-full bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-cyan-900/80 p-2 shadow-2xl z-20 shrink-0 font-mono select-none">
          <div className="flex flex-col gap-2 max-w-md mx-auto">
            {/* Status Strip: Active Player, HP, SP, Fuel & CR */}
            <div className="flex items-center justify-between px-2 py-1 bg-slate-950/90 border border-slate-800 rounded-lg text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeShip?.color }} />
                <span className="font-bold text-white uppercase">TURNO P{activeShip?.id}</span>
                <span className="text-emerald-400 font-bold">{activeShip?.hp} HP</span>
                <span className="text-cyan-300 font-bold">{activeShip?.shield} SP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sky-400 font-bold">{activeShip?.fuel}% F</span>
                <span className="text-amber-400 font-black">{activeShip?.credits} CR</span>
              </div>
            </div>

            {/* Main Tactical Deck: Circular Touch Dial (Left) & Power/Launch Center (Right) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/95 border border-slate-800/80 p-2 rounded-xl shadow-inner">
              {/* Left Bay: 360° Circular Rotary Dial & Stepper Buttons */}
              <div className="flex flex-col items-center justify-between gap-1.5 p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between w-full px-1 text-[10px]">
                  <span className="text-slate-400 uppercase font-bold">ÁNGULO</span>
                  <span className="text-sm font-black text-cyan-400 tabular-nums">
                    {activeShip?.aimAngle.toFixed(1)}°
                  </span>
                </div>

                {/* Rotary Dial */}
                <div className="relative w-20 h-20 shrink-0 touch-none">
                  <svg
                    ref={mobileDialRef}
                    viewBox="-50 -50 100 100"
                    className="w-full h-full cursor-pointer select-none touch-none drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]"
                    onPointerDown={handleDialPointerDown}
                    onPointerMove={handleDialPointerMove}
                    onPointerUp={handleDialPointerUp}
                  >
                    <circle cx="0" cy="0" r="46" fill="#090d16" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="0" cy="0" r="42" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2,4" />
                    <line x1="0" y1="-44" x2="0" y2="-38" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="44" y1="0" x2="38" y2="0" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="0" y1="44" x2="0" y2="38" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="-44" y1="0" x2="-38" y2="0" stroke="#38bdf8" strokeWidth="2" />

                    {activeShip && (
                      <g transform={`rotate(${-activeShip.aimAngle})`}>
                        <line x1="0" y1="0" x2="36" y2="0" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="36" cy="0" r="3.5" fill="#f43f5e" />
                      </g>
                    )}
                    <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                  </svg>
                </div>

                {/* Angle Precision Stepper Buttons (Min 48px Height) */}
                <div className="flex items-center gap-1.5 w-full mt-1">
                  <button
                    onClick={() => adjustAngle(-1)}
                    disabled={isSimulating || activeShip?.isAI}
                    className="flex-1 h-12 flex items-center justify-center bg-slate-900 active:bg-cyan-800 border-2 border-slate-700 text-lg font-black text-cyan-300 rounded-lg shadow disabled:opacity-40"
                    title="Disminuir 1 grado [-]"
                  >
                    [-]
                  </button>
                  <button
                    onClick={() => adjustAngle(1)}
                    disabled={isSimulating || activeShip?.isAI}
                    className="flex-1 h-12 flex items-center justify-center bg-slate-900 active:bg-cyan-800 border-2 border-slate-700 text-lg font-black text-cyan-300 rounded-lg shadow disabled:opacity-40"
                    title="Aumentar 1 grado [+]"
                  >
                    [+]
                  </button>
                </div>
              </div>

              {/* Right Bay: Propulsion & Big Launch Action Buttons (Min 48px Height) */}
              <div className="flex flex-col justify-between gap-1.5 p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 uppercase font-bold">IMPULSO</span>
                    <span className="text-sm font-black text-amber-400 tabular-nums">
                      {activeShip?.power}%
                    </span>
                  </div>

                  {/* Power Slider */}
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={activeShip?.power || 50}
                    onChange={(e) => adjustPower(Number(e.target.value))}
                    disabled={isSimulating || activeShip?.isAI}
                    className="w-full accent-amber-500 h-2 bg-slate-800 rounded cursor-pointer disabled:opacity-40"
                  />

                  {/* Quick Power Presets */}
                  <div className="flex items-center gap-1">
                    {[25, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => adjustPower(preset)}
                        disabled={isSimulating || activeShip?.isAI}
                        className={`flex-1 py-1 rounded text-[9px] font-bold border transition-colors ${
                          activeShip?.power === preset
                            ? 'bg-amber-600/90 border-amber-400 text-white shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Big Action Buttons: Retro Amber SALTO ORBITAL & Retro Red DISPARAR (48px) */}
                <div className="flex flex-col gap-1.5 mt-auto">
                  <button
                    onClick={handleHyperJump}
                    disabled={isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI}
                    className={`flex items-center justify-center gap-1.5 h-12 font-mono text-xs font-black uppercase rounded-xl border-2 transition-all active:scale-95 ${
                      isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] active:from-amber-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>SALTO ORBITAL</span>
                  </button>

                  <button
                    onClick={handleFire}
                    disabled={isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI}
                    className={`flex items-center justify-center gap-2 h-12 font-mono text-sm font-black tracking-widest uppercase rounded-xl border-2 shadow-2xl transition-all active:scale-95 ${
                      isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] active:from-rose-700'
                    }`}
                  >
                    <Target className="w-5 h-5 animate-spin-slow" />
                    <span>{isSimulating ? 'EN VUELO' : 'DISPARAR'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Horizontal Weapon Carousel (Swipeable 20 Weapons) */}
            <div className="flex flex-col gap-1 bg-slate-950/80 border border-slate-800 p-1.5 rounded-lg">
              <div className="flex items-center justify-between text-[10px] px-1">
                <span className="text-slate-400 font-bold uppercase">OJIVA: {activeWeapon.name}</span>
                <span className="text-amber-400 font-bold">
                  {activeWeapon.price === 0 ? 'GRATIS (0 CR)' : `${activeWeapon.price} CR`} • DAÑO {activeWeapon.damage} HP
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 select-none scroll-smooth">
                {WEAPON_CATALOG.map((w) => {
                  const isSelected = activeShip?.weaponId === w.id;
                  const canAfford = (activeShip?.credits ?? 0) >= w.price;
                  return (
                    <button
                      key={w.id}
                      onClick={() => selectWeapon(w.id)}
                      disabled={!canAfford || isSimulating || activeShip?.isAI}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono shrink-0 transition-all ${
                        isSelected
                          ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_8px_rgba(56,189,248,0.4)] scale-105'
                          : canAfford
                            ? 'bg-slate-900 border-slate-800 text-slate-300 active:bg-slate-800'
                            : 'bg-slate-950/50 border-slate-900 text-slate-600 opacity-40'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                      <span className="font-bold truncate max-w-[90px]">{w.name}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${w.price === 0 ? 'text-emerald-400 bg-emerald-950/50' : 'text-amber-400 bg-amber-950/50'}`}>
                        {w.price === 0 ? '0' : `${w.price}`}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowWeaponMatrix(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 rounded text-[10px] font-mono font-bold shrink-0 shadow cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>[ SELECCIONAR ARMA ]</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      ) : (
        /* 2B. MOBILE LANDSCAPE COMPACT DOCK (When in landscape dock mode) */
        mobileLandscapeLayout === 'dock' && (
          <footer className="block md:hidden w-full bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-cyan-900/80 px-2 py-1 shadow-2xl z-20 shrink-0 font-mono select-none">
            <div className="flex items-center justify-between gap-1.5 max-w-3xl mx-auto">
              {/* Quick Angle Stepper */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-1.5 py-1 rounded">
                <span className="text-[10px] text-cyan-400 font-bold">ÁNG:</span>
                <button
                  onClick={() => adjustAngle(5)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold text-slate-200 rounded"
                >
                  +5°
                </button>
                <button
                  onClick={() => adjustAngle(1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold text-slate-200 rounded"
                >
                  +1°
                </button>
                <span className="text-xs font-black text-cyan-300 tabular-nums px-1">
                  {activeShip?.aimAngle.toFixed(1)}°
                </span>
                <button
                  onClick={() => adjustAngle(-1)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold text-slate-200 rounded"
                >
                  -1°
                </button>
                <button
                  onClick={() => adjustAngle(-5)}
                  disabled={isSimulating || activeShip?.isAI}
                  className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-bold text-slate-200 rounded"
                >
                  -5°
                </button>
              </div>

              {/* Power Slider */}
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-1.5 py-1 rounded">
                <span className="text-[10px] text-amber-400 font-bold">POT:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={activeShip?.power || 50}
                  onChange={(e) => adjustPower(Number(e.target.value))}
                  disabled={isSimulating || activeShip?.isAI}
                  className="w-16 accent-amber-500 h-1.5 bg-slate-800 rounded"
                />
                <span className="text-xs font-black text-amber-400 tabular-nums">
                  {activeShip?.power}%
                </span>
              </div>

              {/* Active Weapon button */}
              <button
                onClick={() => setShowWeaponMatrix(true)}
                disabled={isSimulating || activeShip?.isAI}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-cyan-700/80 rounded max-w-[140px] truncate"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeWeapon.color }} />
                <span className="text-[10px] font-bold text-slate-100 truncate">{activeWeapon.name}</span>
                <span className="text-[9px] text-amber-400 font-bold">{activeWeapon.price} CR</span>
              </button>

              {/* Action Buttons: Salto & Fuego */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleHyperJump}
                  disabled={isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI}
                  className={`px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase rounded border transition-all active:scale-95 ${
                    isSimulating || !!winner || (activeShip?.fuel ?? 0) < 25 || activeShip?.isAI
                      ? 'bg-slate-900 border-slate-800 text-slate-600'
                      : 'bg-amber-600 border-amber-400 text-white shadow'
                  }`}
                >
                  SALTO ORBITAL
                </button>

                <button
                  onClick={handleFire}
                  disabled={isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI}
                  className={`px-3 py-1.5 font-mono text-xs font-black tracking-wider uppercase rounded border shadow-lg transition-all active:scale-95 ${
                    isSimulating || !!winner || (activeShip?.credits ?? 0) < activeWeapon.price || activeShip?.isAI
                      ? 'bg-slate-900 border-slate-800 text-slate-600'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  }`}
                >
                  {isSimulating ? 'EN VUELO' : 'DISPARAR'}
                </button>
              </div>
            </div>
          </footer>
        )
      )}

      {/* WEAPON SELECTION MATRIX MODAL (20 WEAPONS WITH ECONOMY PRICES) */}
      {showWeaponMatrix && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-slate-950 border-2 border-cyan-800 rounded-xl max-w-4xl w-full max-h-[90dvh] flex flex-col shadow-[0_0_40px_rgba(56,189,248,0.2)] font-mono">
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-cyan-900 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs sm:text-sm font-bold tracking-wider text-cyan-300 uppercase truncate">
                  ARSENAL TÁCTICO (20 ARMAS)
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-400 font-bold bg-amber-950/60 px-2 sm:px-2.5 py-1 rounded border border-amber-600/60">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{activeShip?.credits || 0} CR</span>
                </div>
                <button
                  onClick={() => setShowWeaponMatrix(false)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-slate-800 bg-slate-950 overflow-x-auto text-xs shrink-0 select-none">
              {[
                { id: 'all', label: 'TODAS (20)' },
                { id: 'ballistic', label: 'BALÍSTICAS (5)' },
                { id: 'explosive', label: 'EXPLOSIVAS (3)' },
                { id: 'special', label: 'ESPECIALES (5)' },
                { id: 'exotic', label: 'EXÓTICAS (7)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedWeaponCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors whitespace-nowrap ${
                    selectedWeaponCategory === cat.id
                      ? 'bg-cyan-500 text-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 overflow-y-auto max-h-[62vh]">
              {WEAPON_CATALOG.filter(w => selectedWeaponCategory === 'all' || w.category === selectedWeaponCategory).map((w) => {
                const isSelected = activeShip?.weaponId === w.id;
                const canAfford = (activeShip?.credits ?? 0) >= w.price;
                return (
                  <button
                    key={w.id}
                    onClick={() => selectWeapon(w.id)}
                    disabled={!canAfford}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_14px_rgba(56,189,248,0.3)]'
                        : canAfford
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer'
                          : 'bg-slate-950/60 border-slate-900 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 font-bold" style={{ color: w.color }}>
                        {w.code}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.price === 0 ? 'text-emerald-400 bg-emerald-950/60' : canAfford ? 'text-amber-400 bg-amber-950/60' : 'text-rose-400 bg-rose-950/60'}`}>
                        {w.price === 0 ? 'GRATIS' : `${w.price} CR`}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-100 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: w.color }} />
                      <span className="truncate">{w.name}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight mb-2 line-clamp-2">
                      {w.description}
                    </p>

                    <div className="mt-auto pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                      <span>DAÑO: {w.damage}</span>
                      <span>CRÁTER: {w.craterRadius}px</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HANGAR & GAME CONFIGURATION MODAL (1-3 PLAYERS, MODELS, IA) */}
      {showHangarModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50">
          <div
            className="sci-fi-scrollbar bg-slate-950 border-2 border-cyan-500 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.4)] font-mono text-slate-100"
            style={{
              maxHeight: '90vh',
              width: 'min(92vw, 540px)',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              padding: '18px'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300 uppercase">CONFIGURACIÓN DE COMBATE Y HANGAR</h3>
              </div>
              <button
                onClick={() => setShowHangarModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                title="Cerrar panel de configuración"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* 1. MODO DE JUEGO */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2 uppercase">1. SELECCIÓN DE MODO:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setGameConfig(prev => ({ ...prev, mode: 'vs_ai', playerCount: 1, aiPlayers: { 2: true } }))}
                    className={`p-2.5 rounded border text-left text-xs transition-all ${
                      gameConfig.mode === 'vs_ai' ? 'bg-cyan-950 border-cyan-400 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SOLITARIO VS IA</span>
                    </div>
                    <p className="text-[10px] text-slate-400">1 Jugador Humano contra 1 o 2 IAs tácticas balísticas.</p>
                  </button>

                  <button
                    onClick={() => setGameConfig(prev => ({ ...prev, mode: 'pass_play', aiPlayers: {} }))}
                    className={`p-2.5 rounded border text-left text-xs transition-all ${
                      gameConfig.mode === 'pass_play' ? 'bg-cyan-950 border-cyan-400 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PASS & PLAY LOCAL</span>
                    </div>
                    <p className="text-[10px] text-slate-400">2 o 3 Humanos alternando turnos en el mismo equipo.</p>
                  </button>

                  <button
                    onClick={() => {
                      setGameConfig(prev => ({ ...prev, mode: 'online' }));
                      setShowHangarModal(false);
                      setShowRoomModal(true);
                    }}
                    className={`p-2.5 rounded border text-left text-xs transition-all ${
                      gameConfig.mode === 'online' ? 'bg-cyan-950 border-cyan-400 text-white shadow' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ONLINE FIREBASE (QR)</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Hasta 3 jugadores sincronizados vía Firestore con código QR.</p>
                  </button>
                </div>
              </div>

              {/* 2. NÚMERO DE NAVES EN PARTIDA (1 a 3) */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2 uppercase">2. NÚMERO DE JUGADORES EN COMBATE:</label>
                <div className="flex gap-2">
                  {[2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setGameConfig(prev => ({
                        ...prev,
                        playerCount: num as 2 | 3,
                        aiPlayers: prev.mode === 'vs_ai' ? { 2: true, ...(num === 3 ? { 3: true } : {}) } : {}
                      }))}
                      className={`flex-1 py-2 rounded border text-xs font-bold transition-all ${
                        gameConfig.playerCount === num ? 'bg-cyan-900 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {num} JUGADORES ({num === 2 ? 'P1 Azul vs P2 Rojo' : 'P1 Azul vs P2 Rojo vs P3 Amarillo'})
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. HANGAR: ELECCIÓN DE MODELOS DE NAVE */}
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-2 uppercase">3. HANGAR DE NAVES EMBLEMÁTICAS (DISEÑOS & ESTELAS):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {([1, 2, 3] as PlayerId[]).slice(0, gameConfig.playerCount).map((pId) => {
                    const currentModel = gameConfig.models[pId] || (pId === 1 ? 'enterprise' : pId === 2 ? 'falcon' : 'xwing');
                    const colors = { 1: '#38bdf8', 2: '#f43f5e', 3: '#eab308' };
                    const shipColor = colors[pId];
                    return (
                      <div key={pId} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col gap-2 shadow-inner">
                        <div className="font-bold flex items-center justify-between pb-1 border-b border-slate-800" style={{ color: shipColor }}>
                          <span>JUGADOR {pId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-slate-300">
                            {gameConfig.mode === 'vs_ai' && pId >= 2 ? 'IA TÁCTICA' : 'HUMANO'}
                          </span>
                        </div>

                        {/* Interactive Blueprint Schematic Preview */}
                        <div className="h-24 bg-slate-950 border border-slate-800 rounded flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />
                          
                          {/* 1. USS ENTERPRISE */}
                          {currentModel === 'enterprise' && (
                            <svg viewBox="-25 -25 50 50" className="w-20 h-20 relative z-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                              {/* Nacelles */}
                              <rect x="-14" y="-12" width="4" height="17" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              <circle cx="-12" cy="-12" r="2" fill="#ef4444" />
                              <rect x="-11.5" y="-9" width="1.2" height="10" fill="#38bdf8" />
                              <rect x="10" y="-12" width="4" height="17" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              <circle cx="12" cy="-12" r="2" fill="#ef4444" />
                              <rect x="10.3" y="-9" width="1.2" height="10" fill="#38bdf8" />
                              {/* Pylons */}
                              <line x1="-3" y1="1" x2="-11" y2="0" stroke="#64748b" strokeWidth="1.5" />
                              <line x1="3" y1="1" x2="11" y2="0" stroke="#64748b" strokeWidth="1.5" />
                              {/* Secondary Hull */}
                              <polygon points="-3,-4 -3,4 0,7 3,4 3,-4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                              {/* Amber Deflector */}
                              <ellipse cx="0" cy="-3.5" rx="2.5" ry="1.5" fill="#f59e0b" />
                              {/* Neck */}
                              <rect x="-2" y="-10" width="4" height="7" fill="#94a3b8" />
                              {/* Saucer */}
                              <ellipse cx="0" cy="-15" rx="14" ry="7.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.2" />
                              <ellipse cx="0" cy="-15" rx="10" ry="4.5" fill="none" stroke={shipColor} strokeWidth="1.2" />
                              <circle cx="0" cy="-15" r="2" fill="#f8fafc" />
                              {/* Warp trail hint */}
                              <polygon points="-14,5 -12,14 -10,5" fill="#38bdf8" />
                              <polygon points="10,5 12,14 14,5" fill="#38bdf8" />
                            </svg>
                          )}

                          {/* 2. HALCÓN MILENARIO */}
                          {currentModel === 'falcon' && (
                            <svg viewBox="-25 -25 50 50" className="w-20 h-20 relative z-10 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">
                              {/* Main Saucer */}
                              <ellipse cx="0" cy="-1" rx="14" ry="12" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.4" />
                              {/* Mandibles */}
                              <polygon points="-8,-9 -8,-20 -2.5,-20 -2.5,-9" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                              <polygon points="2.5,-9 2.5,-20 8,-20 8,-9" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                              {/* Cockpit */}
                              <rect x="8" y="-8" width="6" height="5" fill="#94a3b8" />
                              <polygon points="13,-4 17,-4 16,-13 14,-13" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1" />
                              <rect x="14" y="-12" width="2" height="3" fill="#38bdf8" />
                              {/* Radar Dish */}
                              <circle cx="-6" cy="-6" r="3" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
                              {/* Player Armor marking */}
                              <rect x="-6" y="-2" width="4" height="3" fill={shipColor} />
                              <rect x="2" y="-2" width="4" height="3" fill={shipColor} />
                              {/* Turret */}
                              <circle cx="0" cy="-1" r="3" fill="#334155" />
                              {/* Neon Blue Engine Strip */}
                              <ellipse cx="0" cy="9" rx="10" ry="1.8" fill="#00e5ff" />
                            </svg>
                          )}

                          {/* 3. ALA-X / X-WING */}
                          {currentModel === 'xwing' && (
                            <svg viewBox="-25 -25 50 50" className="w-20 h-20 relative z-10 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                              {/* Wings in X-Formation */}
                              <polygon points="-3,-3 -17,-13 -17,-10 -3,0" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              <polygon points="3,-3 17,-13 17,-10 3,0" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              <polygon points="-3,2 -17,3 -17,6 -3,5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              <polygon points="3,2 17,3 17,6 3,5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              {/* 4 Laser Cannons */}
                              <rect x="-18" y="-19" width="1.5" height="12" fill="#475569" />
                              <rect x="16.5" y="-19" width="1.5" height="12" fill="#475569" />
                              <rect x="-18" y="-4" width="1.5" height="12" fill="#475569" />
                              <rect x="16.5" y="-4" width="1.5" height="12" fill="#475569" />
                              {/* Long pointed Fuselage */}
                              <polygon points="0,-21 -3.5,4 3.5,4" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1" />
                              {/* Player stripes */}
                              <rect x="-2.5" y="-11" width="1.2" height="7" fill={shipColor} />
                              <rect x="1.3" y="-11" width="1.2" height="7" fill={shipColor} />
                              {/* Cockpit & R2 */}
                              <polygon points="0,-10 -1.8,-3 1.8,-3" fill="#0f172a" />
                              <circle cx="0" cy="-1" r="1.3" fill="#38bdf8" />
                              {/* 4 Nozzles with orange afterburners */}
                              <rect x="-7" y="4" width="2" height="4" fill="#ea580c" />
                              <rect x="-3" y="4.5" width="2" height="5" fill="#ea580c" />
                              <rect x="1" y="4.5" width="2" height="5" fill="#ea580c" />
                              <rect x="5" y="4" width="2" height="4" fill="#ea580c" />
                            </svg>
                          )}

                          {currentModel === 'interceptor' && (
                            <svg viewBox="-25 -25 50 50" className="w-16 h-16 relative z-10 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                              <path d="M -12 6 L 0 -18 L 12 6 L 0 1 Z" fill={shipColor} stroke="#0f172a" strokeWidth="1.5" />
                              <path d="M -16 6 L -6 -3 L -6 4 Z" fill="#0f172a" />
                              <path d="M 16 6 L 6 -3 L 6 4 Z" fill="#0f172a" />
                              <polygon points="0,-14 -3,-3 3,-3" fill="#38bdf8" />
                              <polygon points="-3,5 0,16 3,5" fill="#0284c7" />
                            </svg>
                          )}
                          {currentModel === 'dreadnought' && (
                            <svg viewBox="-25 -25 50 50" className="w-16 h-16 relative z-10 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                              <path d="M -14 5 L -14 -6 L -6 -15 L 6 -15 L 14 -6 L 14 5 Z" fill={shipColor} stroke="#0f172a" strokeWidth="2" />
                              <rect x="-17" y="-8" width="5" height="10" fill="#1e293b" />
                              <rect x="12" y="-8" width="5" height="10" fill="#1e293b" />
                              <rect x="-5" y="-11" width="10" height="4" fill="#f97316" />
                              <rect x="-9" y="5" width="4" height="12" fill="#ea580c" />
                              <rect x="5" y="5" width="4" height="12" fill="#ea580c" />
                            </svg>
                          )}
                          {(currentModel === 'frigate' || currentModel === 'quantum') && (
                            <svg viewBox="-25 -25 50 50" className="w-16 h-16 relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                              <path d="M -14 5 L -13 -16 L -7 -16 L -5 5 Z" fill={shipColor} stroke="#0f172a" strokeWidth="1.5" />
                              <path d="M 5 5 L 7 -16 L 13 -16 L 14 5 Z" fill={shipColor} stroke="#0f172a" strokeWidth="1.5" />
                              <rect x="-6" y="-7" width="12" height="5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                              <line x1="-5" y1="-14" x2="5" y2="-14" stroke="#10b981" strokeWidth="1.5" />
                              <line x1="-5" y1="-11" x2="5" y2="-11" stroke="#10b981" strokeWidth="1.5" />
                              <line x1="-5" y1="-8" x2="5" y2="-8" stroke="#10b981" strokeWidth="1.5" />
                              <polygon points="-12,5 -9,16 -6,5" fill="#10b981" />
                              <polygon points="6,5 9,16 12,5" fill="#10b981" />
                            </svg>
                          )}
                        </div>

                        <select
                          value={currentModel}
                          onChange={(e) => setGameConfig(prev => ({
                            ...prev,
                            models: { ...prev.models, [pId]: e.target.value as ShipModel }
                          }))}
                          className="w-full bg-black border border-slate-700 text-xs p-1.5 rounded text-white focus:border-cyan-400 focus:outline-none"
                        >
                          <option value="enterprise">USS Enterprise (NCC-1701 - Star Trek)</option>
                          <option value="falcon">Halcón Milenario (YT-1300 - Star Wars)</option>
                          <option value="xwing">Ala-X / X-Wing (T-65B - Star Wars)</option>
                          <option value="interceptor">Caza Ligero (Interceptor Clásico)</option>
                          <option value="dreadnought">Crucero Pesado (Dreadnought Blindado)</option>
                          <option value="frigate">Fragata Táctica (Frigate Bi-fuselaje)</option>
                        </select>

                        <div className="text-[10px] text-slate-400 leading-tight">
                          {currentModel === 'enterprise' && 'Platillo elíptico, cuello dorsal, deflector ámbar y góndolas cilíndricas con impulso azul celeste.'}
                          {currentModel === 'falcon' && 'Casco discoidal achatado, mandíbulas de carga en cuña, cabina lateral y escape sublumínico azul neón.'}
                          {currentModel === 'xwing' && 'Fuselaje en punta, 4 alas en cruz con cañones láser y 4 toberas independientes con postquemador anaranjado.'}
                          {currentModel === 'interceptor' && 'Fuselaje en punta triangular delgada con tobera de plasma azul.'}
                          {currentModel === 'dreadnought' && 'Casco blindado ancho con módulos hexagonales y tobera de propulsión ámbar.'}
                          {(currentModel === 'frigate' || currentModel === 'quantum') && 'Diseño bi-fuselaje simétrico con bobinas electromagnéticas y tobera verde esmeralda.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Instalación PWA en Menú si no está instalado */}
              {!isInstalled && (deferredPrompt || isIOS) && (
                <div className="p-3 bg-slate-900 border border-emerald-500/60 rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-300 font-bold">ACCESO DIRECTO PWA:</span>
                  </div>
                  <button
                    onClick={handleInstallPWA}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    [ 📲 INSTALAR EN EL DISPOSITIVO ]
                  </button>
                </div>
              )}

              {/* BOTÓN SOBREDIMENSIONADO Y BRILLANTE DE LANZAMIENTO */}
              <div className="sticky bottom-0 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent shrink-0">
                <button
                  onClick={() => handleApplyConfig(gameConfig)}
                  className="w-full min-h-[56px] h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.98] text-white font-black text-sm tracking-wider uppercase rounded-xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5 animate-spin-slow text-cyan-200" />
                  <span>[ DESPLEGAR A COMBATE / INICIAR JUEGO ]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTIPLAYER / ONLINE ROOM MODAL */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border-2 border-cyan-800 rounded-xl max-w-md w-full p-5 shadow-[0_0_40px_rgba(56,189,248,0.2)] font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900 mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-300 uppercase">SALA MULTIJUGADOR (HASTA 3 PLAYERS)</h3>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newId = network.createRoom();
                    setRoomCode(newId);
                    setIsOnlineMode(true);
                    setLocalPlayerId(1);
                  }}
                  className="flex-1 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-xs font-bold text-cyan-300 rounded transition-colors"
                >
                  CREAR SALA NUEVA
                </button>
                <button
                  onClick={() => {
                    network.leaveRoom();
                    setIsOnlineMode(false);
                    setRoomCode('');
                    setShowRoomModal(false);
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded"
                >
                  MODO LOCAL
                </button>
              </div>

              {roomCode && (
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-900 border border-cyan-900 rounded-lg">
                  <div className="text-xs text-slate-300">
                    CÓDIGO DE SALA: <span className="font-bold text-cyan-400 text-sm">{roomCode}</span>
                  </div>

                  <div
                    ref={qrContainerRef}
                    className="p-2 bg-slate-950 border border-cyan-800 rounded flex items-center justify-center min-h-[150px] min-w-[150px]"
                  />

                  {/* Share button for Mobile / WhatsApp / Link */}
                  <button
                    onClick={handleShareRoom}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-bold text-xs rounded transition-transform shadow-md"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
                    <span>{copySuccess ? '¡ENLACE COPIADO AL PORTAPAPELES!' : 'COMPARTIR SALA (WHATSAPP / LINK)'}</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    Escanea el código QR para unirte a la sala. Sincroniza semillas procedurales, turnos, créditos y disparos en tiempo real mediante Firestore y BroadcastChannel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN-SPACE CELEBRATION (CONFETTI, GLOWING DEBRIS & WARP-JUMP STREAKS) */}
      <ScreenCelebration
        winner={winner}
        winnerColor={ships.find(s => s.id === winner)?.color}
      />

      {/* GAME OVER VICTORY BANNER */}
      {winner && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border-2 border-cyan-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(56,189,248,0.4)] font-mono">
            <h2 className="text-xl font-black text-cyan-400 mb-2 tracking-wider">
              {winner === 'draw' ? '¡ANIQUILACIÓN MUTUA!' : `¡VICTORIA PARA JUGADOR ${winner}!`}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              {winner === 'draw'
                ? 'Todas las naves han sido reducidas a cenizas estelares.'
                : `El comandante del Jugador ${winner} domina el sistema planetario con ${ships.find(s => s.id === winner)?.credits || 0} CR acumulados.`}
            </p>
            <button
              onClick={() => handleRestart()}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-lg transition-transform active:scale-95"
            >
              JUGAR OTRA BATALLA
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
