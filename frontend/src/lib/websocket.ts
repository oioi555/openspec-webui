import type { WSMessage } from '../../../src/shared/types.ts';

export type MessageHandler = (message: WSMessage) => void;
export type {
  WSEntity,
  WSDataRefreshMessage,
  WSMessage,
  WSRefreshCause,
} from '../../../src/shared/types.ts';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private shouldReconnect = true;
  private ready = false;

  constructor(private url: string) {}

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.shouldReconnect = true;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.ready = true;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WSMessage;
        this.handlers.forEach((handler) => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.ready = false;
      if (!this.shouldReconnect) {
        return;
      }

      console.log('WebSocket disconnected, reconnecting...');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      this.ready = false;
      console.error('WebSocket error:', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: WSMessage) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  get isConnected() {
    return this.ready && this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ready = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws?.close();
    this.ws = null;
  }
}

// Create singleton instance
const wsUrl = typeof window === 'undefined' ? 'ws://127.0.0.1/ws' : `ws://${window.location.host}/ws`;
export const wsClient = new WebSocketClient(wsUrl);
