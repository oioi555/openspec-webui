import type { WebSocket } from 'ws';
import type { WSMessage } from '../../shared/types.js';
import type { FileChangeEvent } from '../../watcher/file-watcher.js';

/**
 * Manage WebSocket connections and broadcasting
 */
export class WebSocketManager {
  private clients: Set<WebSocket> = new Set();

  /**
   * Register a new client connection
   */
  addClient(ws: WebSocket, initialMessages: readonly WSMessage[]) {
    this.clients.add(ws);

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(ws);
    });

    for (const message of initialMessages) {
      this.sendToClient(ws, message);
    }
  }

  /**
   * Broadcast a file change to all connected clients
   */
  broadcastFileChange(event: FileChangeEvent, data?: unknown) {
    const message: WSMessage = {
      type: 'data:refresh',
      entity: event.affectedEntity,
      entityId: event.entityId,
      data,
    };

    this.broadcast(message);
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: WSMessage) {
    const payload = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(payload);
      }
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get the number of connected clients
   */
  get clientCount(): number {
    return this.clients.size;
  }
}
