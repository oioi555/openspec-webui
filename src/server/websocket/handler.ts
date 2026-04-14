import type { WebSocket } from 'ws';
import type { WSOutgoingMessage } from '../../shared/types.js';
import type { FileChangeEvent } from '../../watcher/file-watcher.js';

/**
 * Manage WebSocket connections and broadcasting
 */
export class WebSocketManager {
  private clients: Set<WebSocket> = new Set();
  private clientBindings: Map<WebSocket, string | null> = new Map();

  /**
   * Register a new client connection
   */
  addClient(ws: WebSocket, projectId: string | null, initialMessages: readonly WSOutgoingMessage[]) {
    this.clients.add(ws);
    this.clientBindings.set(ws, projectId);

    for (const message of initialMessages) {
      this.sendToClient(ws, message);
    }
  }

  /**
   * Remove a client connection
   */
  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
    this.clientBindings.delete(ws);
  }

  /**
   * Get a client's current project binding
   */
  getClientBinding(ws: WebSocket): string | null {
    return this.clientBindings.get(ws) ?? null;
  }

  /**
   * Update a client's project binding
   */
  bindClient(ws: WebSocket, projectId: string | null) {
    if (!this.clients.has(ws)) {
      return;
    }

    this.clientBindings.set(ws, projectId);
  }

  /**
   * List clients bound to a project
   */
  getClientsBoundTo(projectId: string): WebSocket[] {
    return [...this.clientBindings.entries()]
      .filter(([, boundProjectId]) => boundProjectId === projectId)
      .map(([client]) => client);
  }

  /**
   * Broadcast a file change to bound clients
   */
  broadcastFileChange(projectId: string, event: FileChangeEvent, data?: unknown) {
    const message: WSOutgoingMessage = {
      type: 'data:refresh',
      entity: event.affectedEntity,
      entityId: event.entityId,
      data,
    };

    for (const [client, boundProjectId] of this.clientBindings.entries()) {
      if (boundProjectId === projectId) {
        this.sendToClient(client, message);
      }
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: WSOutgoingMessage) {
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
  sendToClient(ws: WebSocket, message: WSOutgoingMessage) {
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
