import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import type { OpenSpecData } from '../parser/index.js';
import type { FileChangeEvent } from '../watcher/file-watcher.js';
import { WebSocketManager } from './websocket/handler.js';
import { registerApiRoutes } from './routes/api.js';
import { createProjectRegistry } from './project-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ServerOptions {
  initialProjectPath?: string;
  port: number;
  host?: string;
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
  const projectRegistry = createProjectRegistry({
    onActiveFileChange: async (event, data) => {
      console.log(`File ${event.type}: ${event.path}`);

      if (data) {
        wsManager.broadcastFileChange(event, getRefreshData(event, data));
      }
    },
  });

  await projectRegistry.initialize();

  const startupProject = resolveStartupProject(options);

  if (startupProject.path) {
    try {
      await projectRegistry.addProject(startupProject.path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Ignoring invalid OPENSPEC_INITIAL_PROJECT (${startupProject.path}): ${message}`);
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
      wsManager.addClient(socket, [
        {
          type: 'connection:init',
          activeProjectId: projectRegistry.getActiveProject()?.id ?? null,
        },
      ]);
    });
  });

  // Register API routes
  await registerApiRoutes(fastify, {
    registry: projectRegistry,
    onProjectSwitched: async (projectId) => {
      wsManager.broadcast({
        type: 'project:switched',
        activeProjectId: projectId,
      });
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
    console.warn('Frontend build not found. Run `npm run build:frontend` first.');
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

function resolveStartupProject(
  options: ServerOptions
): { path: string | null; source: 'initialProjectPath' | 'env' | null } {
  const initialProjectPath = options.initialProjectPath?.trim();
  if (initialProjectPath) {
    return { path: initialProjectPath, source: 'initialProjectPath' };
  }

  const envInitialProject = process.env.OPENSPEC_INITIAL_PROJECT?.trim();
  if (envInitialProject) {
    return { path: envInitialProject, source: 'env' };
  }

  return { path: null, source: null };
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
