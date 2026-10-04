/**
 * Real-time Multiplayer Synchronizer (Firebase Firestore + BroadcastChannel Fallback)
 * Supports Online Room creation, QR code generation, and low-latency turn sync
 */

export type PlayerId = 1 | 2 | 3;

export interface NetworkShotEvent {
  playerId: PlayerId;
  actionType?: 'FIRE' | 'JUMP';
  angle: number;
  power: number;
  weaponId: number;
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  player1Ready: boolean;
  player2Ready: boolean;
  player3Ready?: boolean;
  currentTurn: PlayerId;
  lastShot?: NetworkShotEvent;
  currentSeed?: number;
  scores: { p1: number; p2: number; p3?: number };
}

export class NetworkManager {
  private roomId: string = '';
  private localPlayerId: PlayerId = 1;
  private channel: BroadcastChannel | null = null;
  private onShotReceivedCallback?: (shot: NetworkShotEvent) => void;
  private onRoomUpdatedCallback?: (state: RoomState) => void;
  private onNewRoundCallback?: (seed: number) => void;
  private firestoreUnsubscribe?: () => void;
  private isOnlineMode = false;

  constructor() {
    // Check URL hash for room: #room=WH-123
    const hash = window.location.hash;
    const match = hash.match(/room=([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      this.roomId = match[1].toUpperCase();
      this.localPlayerId = 2; // Default joining player is Player 2
      this.isOnlineMode = true;
    }
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getLocalPlayerId(): PlayerId {
    return this.localPlayerId;
  }

  public setLocalPlayerId(id: PlayerId) {
    this.localPlayerId = id;
  }

  public isOnline(): boolean {
    return this.isOnlineMode;
  }

  public createRoom(customId?: string): string {
    const id = customId || 'WH-' + Math.floor(100 + Math.random() * 900);
    this.roomId = id.toUpperCase();
    this.localPlayerId = 1;
    this.isOnlineMode = true;
    window.location.hash = `room=${this.roomId}`;
    this.initSync();
    return this.roomId;
  }

  public joinRoom(id: string): void {
    this.roomId = id.toUpperCase();
    this.localPlayerId = 2;
    this.isOnlineMode = true;
    window.location.hash = `room=${this.roomId}`;
    this.initSync();
  }

  public leaveRoom(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = undefined;
    }
    this.roomId = '';
    this.isOnlineMode = false;
    window.location.hash = '';
  }

  public onShot(callback: (shot: NetworkShotEvent) => void) {
    this.onShotReceivedCallback = callback;
  }

  public onRoomUpdate(callback: (state: RoomState) => void) {
    this.onRoomUpdatedCallback = callback;
  }

  public onNewRound(callback: (seed: number) => void) {
    this.onNewRoundCallback = callback;
  }

  public sendNewRound(seed: number) {
    if (this.channel) {
      this.channel.postMessage({ type: 'NEW_ROUND', seed });
    }
    const win = window as unknown as { firebase?: { firestore?: () => { collection: (name: string) => { doc: (id: string) => { set: (data: unknown, opts: unknown) => Promise<unknown> } } } } };
    if (win.firebase?.firestore) {
      try {
        const db = win.firebase.firestore();
        db.collection('warheads_rooms').doc(this.roomId).set({
          currentSeed: seed,
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn('Firestore new round sync deferred:', err);
      }
    }
  }

  public sendShot(angle: number, power: number, weaponId: number, actionType: 'FIRE' | 'JUMP' = 'FIRE') {
    const shot: NetworkShotEvent = {
      playerId: this.localPlayerId,
      actionType,
      angle,
      power,
      weaponId,
      timestamp: Date.now()
    };

    // Broadcast locally across tabs/windows
    if (this.channel) {
      this.channel.postMessage({ type: 'SHOT', shot });
    }

    // Attempt Firebase Firestore sync if client is available
    const win = window as unknown as { firebase?: { firestore?: () => { collection: (name: string) => { doc: (id: string) => { set: (data: unknown, opts: unknown) => Promise<unknown> } } } } };
    if (win.firebase?.firestore) {
      try {
        const db = win.firebase.firestore();
        db.collection('warheads_rooms').doc(this.roomId).set({
          lastShot: shot,
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      } catch (err) {
        console.warn('Firestore shot sync deferred:', err);
      }
    }
  }

  public initSync() {
    if (!this.roomId) return;

    // 1. Instant local sync via BroadcastChannel
    try {
      if (this.channel) this.channel.close();
      this.channel = new BroadcastChannel(`warheads_${this.roomId}`);
      this.channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === 'SHOT' && data.shot) {
          if (data.shot.playerId !== this.localPlayerId) {
            this.onShotReceivedCallback?.(data.shot);
          }
        } else if (data.type === 'NEW_ROUND' && data.seed !== undefined) {
          this.onNewRoundCallback?.(data.seed);
        } else if (data.type === 'STATE' && data.state) {
          this.onRoomUpdatedCallback?.(data.state);
        }
      };

      // Announce arrival
      this.channel.postMessage({
        type: 'PEER_JOIN',
        playerId: this.localPlayerId,
        roomId: this.roomId
      });
    } catch (e) {
      console.warn('BroadcastChannel fallback:', e);
    }

    // 2. Firebase Firestore listener if loaded
    const win = window as unknown as { firebase?: { firestore?: () => { collection: (name: string) => { doc: (id: string) => { onSnapshot: (cb: (doc: { data: () => unknown }) => void) => () => void } } } } };
    if (win.firebase?.firestore) {
      try {
        const db = win.firebase.firestore();
        let lastKnownSeed: number | undefined;
        this.firestoreUnsubscribe = db.collection('warheads_rooms').doc(this.roomId).onSnapshot((snapshot) => {
          const data = snapshot.data() as { lastShot?: NetworkShotEvent; currentSeed?: number } | undefined;
          if (data?.currentSeed !== undefined && data.currentSeed !== lastKnownSeed) {
            lastKnownSeed = data.currentSeed;
            this.onNewRoundCallback?.(data.currentSeed);
          }
          if (data?.lastShot && data.lastShot.playerId !== this.localPlayerId) {
            this.onShotReceivedCallback?.(data.lastShot);
          }
        });
      } catch (err) {
        console.warn('Firestore room sync deferred:', err);
      }
    }
  }

  /**
   * Generates QR Code inside a container element using QRCode.js
   */
  public renderQRCode(container: HTMLElement, text: string) {
    container.innerHTML = '';
    const win = window as unknown as { QRCode?: new (el: HTMLElement, opts: { text: string; width: number; height: number; colorDark: string; colorLight: string; correctLevel: number }) => unknown };
    if (typeof win.QRCode === 'function') {
      new win.QRCode(container, {
        text,
        width: 148,
        height: 148,
        colorDark: '#38bdf8',
        colorLight: '#090d16',
        correctLevel: 2 // H
      });
    } else {
      // Styled textual fallback
      const link = document.createElement('div');
      link.className = 'text-xs text-cyan-400 font-mono break-all p-2 bg-slate-900 border border-cyan-800 rounded';
      link.innerText = text;
      container.appendChild(link);
    }
  }
}

export const network = new NetworkManager();
