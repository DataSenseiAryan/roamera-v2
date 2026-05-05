type WsEventHandler = (payload: unknown) => void;

interface WsMessage {
  type: string;
  [key: string]: unknown;
}

interface SubscribeMessage {
  type: 'subscribe';
  rooms: string[];
  since?: number;
}

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private rooms: Set<string> = new Set();
  private handlers: Map<string, Set<WsEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEventTimestamps: Map<string, number> = new Map();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private tokenGetter: () => Promise<string | null>;
  private isConnecting = false;

  constructor(opts: {
    baseUrl: string;
    tokenGetter: () => Promise<string | null>;
  }) {
    this.url = opts.baseUrl.replace(/^http/, 'ws');
    this.tokenGetter = opts.tokenGetter;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    const token = await this.tokenGetter();
    if (!token) {
      this.isConnecting = false;
      return;
    }

    const wsUrl = `${this.url}/ws?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this._startPing();
      if (this.rooms.size > 0) {
        this._send({
          type: 'subscribe',
          rooms: [...this.rooms],
          since: this._oldestTimestamp(),
        });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        this.lastEventTimestamps.set(msg.type, Date.now());
        const handlers = this.handlers.get(msg.type);
        handlers?.forEach((h) => h(msg));
        const wildcardHandlers = this.handlers.get('*');
        wildcardHandlers?.forEach((h) => h(msg));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this._stopPing();
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
      this.ws?.close();
    };
  }

  subscribe(rooms: string[]): void {
    rooms.forEach((r) => this.rooms.add(r));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this._send({ type: 'subscribe', rooms } as SubscribeMessage);
    }
  }

  unsubscribe(rooms: string[]): void {
    rooms.forEach((r) => this.rooms.delete(r));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this._send({ type: 'unsubscribe', rooms });
    }
  }

  on(event: string, handler: WsEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: WsEventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this._stopPing();
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = 0;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private _send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this._send({ type: 'ping' });
    }, 25_000);
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private _oldestTimestamp(): number | undefined {
    if (this.lastEventTimestamps.size === 0) return undefined;
    return Math.min(...this.lastEventTimestamps.values());
  }
}
