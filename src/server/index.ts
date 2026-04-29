import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import type { RawData } from 'ws';

import type { OpenSpecData } from '../parser/index.js';
import type { FileChangeEvent } from '../watcher/file-watcher.js';
import type { WSIncomingMessage } from '../shared/types.js';
import { WebSocketManager } from './websocket/handler.js';
import { registerApiRoutes } from './routes/api.js';
import { createProjectRegistry, ProjectRegistryError } from './project-registry.js';
import { createVersionSnapshotService, type VersionSnapshotService } from './version-status.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ServerOptions {
  port: number;
  host?: string;
  versionSnapshotService?: VersionSnapshotService;
}

export interface Server {
  url: string;
  close: () => Promise<void>;
}

/**
 * Create and start the OpenSpec WebUI server
 */
export async function createServer(options: ServerOptions): Promise<Server> {
  const { port, host = '127.0.0.1' } = options;

  const wsManager = new WebSocketManager();
  const versionSnapshotService = options.versionSnapshotService ?? createVersionSnapshotService();
  const projectRegistry = createProjectRegistry({
    onActiveFileChange: async (projectId, event, data) => {
      console.log(`File ${event.type}: ${event.path}`);

      if (data) {
        wsManager.broadcastFileChange(projectId, event, getRefreshData(event, data));
      }
    },
  });

  async function handleProjectBind(socket: import('ws').WebSocket, projectId: string | null) {
    const currentProjectId = wsManager.getClientBinding(socket);

    if (currentProjectId === projectId) {
      const data = projectId ? projectRegistry.getData(projectId) : null;
      wsManager.sendToClient(socket, {
        type: 'project:bound',
        activeProjectId: projectId,
        data: data ? getBoundData(data) : null,
      });
      return;
    }

    if (projectId) {
      const session = await projectRegistry.incrementRef(projectId);

      if (currentProjectId) {
        await projectRegistry.decrementRef(currentProjectId);
      }

      wsManager.bindClient(socket, projectId);
      wsManager.sendToClient(socket, {
        type: 'project:bound',
        activeProjectId: projectId,
        data: getBoundData(session.data),
      });
      return;
    }

    if (currentProjectId) {
      await projectRegistry.decrementRef(currentProjectId);
    }

    wsManager.bindClient(socket, null);
    wsManager.sendToClient(socket, {
      type: 'project:bound',
      activeProjectId: null,
      data: null,
    });
  }

  async function handleWebSocketMessage(socket: import('ws').WebSocket, rawMessage: RawData): Promise<void> {
    const text = typeof rawMessage === 'string' ? rawMessage : rawMessage.toString();
    const message = JSON.parse(text) as WSIncomingMessage;

    if (message.type === 'project:bind') {
      await handleProjectBind(socket, message.projectId);
    }
  }

  await projectRegistry.initialize();

  const startupProject = shouldBootstrapStartupProject(projectRegistry)
    ? resolveStartupProject()
    : { path: null, source: null };

  if (startupProject.path) {
    try {
      await projectRegistry.addProject(startupProject.path);
    } catch (error) {
      if (!shouldIgnoreStartupProjectError(startupProject.source, error)) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to bootstrap startup project (${startupProject.path}): ${message}`);
      }
    }
  }

  const activeData = projectRegistry.getActiveData();
  if (activeData) {
    console.log(`Loaded OpenSpec: ${activeData.project.name}`);
    console.log(`  ${activeData.specs.length} specs, ${activeData.changes.active.length} active changes`);
  }

  // Create Fastify instance
  const fastify = Fastify({
    logger: false,
  });

  // Register WebSocket plugin
  await fastify.register(fastifyWebsocket);

  // WebSocket endpoint
  fastify.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
      const initialProjectId = projectRegistry.getActiveProject()?.id ?? null;

      wsManager.addClient(socket, initialProjectId, [
        {
          type: 'connection:init',
          activeProjectId: initialProjectId,
        },
      ]);

      if (initialProjectId) {
        void projectRegistry.incrementRef(initialProjectId).catch((error) => {
          console.error('Failed to increment initial project binding refCount:', error);
        });
      }

      socket.on('message', (rawMessage: RawData) => {
        void handleWebSocketMessage(socket, rawMessage).catch((error) => {
          console.error('Failed to process WebSocket message:', error);
          wsManager.sendToClient(socket, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to process websocket message',
          });
        });
      });

      const cleanupClient = () => {
        const boundProjectId = wsManager.getClientBinding(socket);
        wsManager.removeClient(socket);

        if (boundProjectId) {
          void projectRegistry.decrementRef(boundProjectId).catch((error) => {
            console.error('Failed to decrement websocket binding refCount:', error);
          });
        }
      };

      socket.on('close', cleanupClient);
      socket.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        cleanupClient();
      });
    });
  });

  // Register API routes
  await registerApiRoutes(fastify, {
    registry: projectRegistry,
    versionSnapshotService,
    onProjectRemoved: async (removedProjectId, nextProjectId) => {
      for (const client of wsManager.getClientsBoundTo(removedProjectId)) {
        wsManager.bindClient(client, nextProjectId);

        if (nextProjectId) {
          const session = await projectRegistry.incrementRef(nextProjectId);
          wsManager.sendToClient(client, {
            type: 'project:bound',
            activeProjectId: nextProjectId,
            data: getBoundData(session.data),
          });
        } else {
          wsManager.sendToClient(client, {
            type: 'project:bound',
            activeProjectId: null,
            data: null,
          });
        }
      }
    },
  });

  // Serve static frontend files
  const frontendPath = join(__dirname, '..', '..', 'dist-frontend');
  const devFrontendPath = join(__dirname, '..', '..', 'frontend', 'dist');

  // Check which frontend path exists
  let staticPath = frontendPath;
  if (existsSync(devFrontendPath)) {
    staticPath = devFrontendPath;
  } else if (!existsSync(frontendPath)) {
    console.warn('Frontend build not found. Run `npm run build` first.');
  }

  if (existsSync(staticPath)) {
    await fastify.register(fastifyStatic, {
      root: staticPath,
      prefix: '/',
    });

    // SPA fallback - serve index.html for all non-API routes
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/') || request.url.startsWith('/ws')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  }

  // Start server
  let url: string;
  try {
    url = await fastify.listen({ port, host });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EADDRINUSE') {
      throw new Error(`Port ${port} is already in use. Please use a different port with --port <port>`);
    }
    throw err;
  }

  console.log(`OpenSpec WebUI running at ${url}`);

  return {
    url,
    close: async () => {
      await projectRegistry.close();
      await fastify.close();
    },
  };
}

function getBoundData(data: OpenSpecData): unknown {
  return {
    project: data.project,
    specs: data.specs,
    changes: data.changes,
    stats: data.stats,
  };
}

function resolveStartupProject(): { path: string | null; source: 'cwd' | null } {
  try {
    return { path: process.cwd(), source: 'cwd' };
  } catch {
    return { path: null, source: null };
  }
}

function shouldBootstrapStartupProject(
  projectRegistry: Pick<ReturnType<typeof createProjectRegistry>, 'listProjects' | 'getActiveProject'>
): boolean {
  return projectRegistry.getActiveProject() === null && projectRegistry.listProjects().length === 0;
}

function shouldIgnoreStartupProjectError(source: 'cwd' | null, error: unknown): boolean {
  return source === 'cwd' && error instanceof ProjectRegistryError && error.code === 'INVALID_PROJECT_PATH';
}

/**
 * Get the data to send with a refresh event
 */
function getRefreshData(event: FileChangeEvent, data: OpenSpecData): unknown {
  switch (event.affectedEntity) {
    case 'project':
      return { project: data.project };
    case 'specs':
      return { specs: data.specs, stats: data.stats };
    case 'changes':
      return { changes: data.changes, stats: data.stats };
    default:
      return { stats: data.stats };
  }
}
