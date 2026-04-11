import type { FastifyInstance } from 'fastify';
import { readFile } from 'fs/promises';
import type { OpenSpecData } from '../../parser/index.js';
import { parseSpec, parseChangeByName, searchOpenSpec } from '../../parser/index.js';
import {
  inspectCommandAvailability,
  type CommandAvailability,
} from '../openspec-config.js';

/**
 * Register API routes
 */
export async function registerApiRoutes(
  fastify: FastifyInstance,
  getData: () => OpenSpecData | null,
  getOpenSpecPath: () => string
) {
  let cachedCommandAvailability: CommandAvailability | null = null;

  async function getCommandAvailability() {
    const availability = await inspectCommandAvailability(getOpenSpecPath());

    if (availability.status === 'ready') {
      cachedCommandAvailability = availability;
      return availability;
    }

    return cachedCommandAvailability ?? availability;
  }

  // Get project info
  fastify.get('/api/project', async (request, reply) => {
    const data = getData();
    if (!data) {
      return reply.status(503).send({ error: 'Data not loaded' });
    }
    return { project: data.project };
  });

  // Get all specs
  fastify.get('/api/specs', async (request, reply) => {
    const data = getData();
    if (!data) {
      return reply.status(503).send({ error: 'Data not loaded' });
    }
    return {
      specs: data.specs.map((s) => ({
        name: s.name,
        path: s.path,
        hasDesign: s.designContent !== null,
        lastModified: s.lastModified,
      })),
    };
  });

  // Get single spec
  fastify.get<{ Params: { name: string } }>('/api/specs/:name', async (request, reply) => {
    const { name } = request.params;
    const result = await parseSpec(getOpenSpecPath(), name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Spec not found' });
    }

    return { spec: result.data };
  });

  // Get all changes
  fastify.get('/api/changes', async (request, reply) => {
    const data = getData();
    if (!data) {
      return reply.status(503).send({ error: 'Data not loaded' });
    }
    return {
      active: data.changes.active.map(summarizeChange),
      archived: data.changes.archived.map(summarizeChange),
    };
  });

  // Get single change
  fastify.get<{ Params: { name: string } }>('/api/changes/:name', async (request, reply) => {
    const { name } = request.params;
    const result = await parseChangeByName(getOpenSpecPath(), name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Change not found' });
    }

    return { change: result.data };
  });

  // Serve raw file content (HTML or markdown) for iframe/direct access
  fastify.get<{ Params: { name: string; '*': string } }>(
    '/api/changes/:name/files/*',
    async (request, reply) => {
      const { name } = request.params;
      const filePath = request.params['*'];

      // Security: Validate path doesn't escape change directory
      if (filePath.includes('..') || filePath.startsWith('/')) {
        return reply.status(400).send({ error: 'Invalid file path' });
      }

      const result = await parseChangeByName(getOpenSpecPath(), name);
      if (!result.data) {
        return reply.status(404).send({ error: 'Change not found' });
      }

      const change = result.data;
      const file = change.files.find((f) => f.path === filePath);

      if (!file) {
        return reply.status(404).send({ error: 'File not found' });
      }

      try {
        const content = await readFile(file.absolutePath, 'utf-8');
        const contentType = file.type === 'html' ? 'text/html' : 'text/markdown';

        return reply
          .header('Content-Type', contentType)
          .header('X-Content-Type-Options', 'nosniff')
          .send(content);
      } catch (error) {
        return reply.status(500).send({ error: 'Failed to read file' });
      }
    }
  );

  // Get stats
  fastify.get('/api/stats', async (request, reply) => {
    const data = getData();
    if (!data) {
      return reply.status(503).send({ error: 'Data not loaded' });
    }
    return { stats: data.stats };
  });

  // Get local OpenSpec command availability
  fastify.get('/api/commands/availability', async () => {
    const availability = await getCommandAvailability();
    return { availability };
  });

  // Search
  fastify.get<{ Querystring: { q: string } }>('/api/search', async (request, reply) => {
    const { q } = request.query;

    if (!q || q.length < 2) {
      return { results: [] };
    }

    const data = getData();
    if (!data) {
      return reply.status(503).send({ error: 'Data not loaded' });
    }

    const results = searchOpenSpec(data, q);
    return { results };
  });
}

/**
 * Create a summary of a change for list views
 */
function summarizeChange(change: OpenSpecData['changes']['active'][0]) {
  return {
    name: change.name,
    path: change.path,
    isArchived: change.isArchived,
    archivedDate: change.archivedDate,
    lastModified: change.lastModified,
    taskProgress: change.taskProgress,
    specDeltaCount: change.specDeltas.length,
    hasProposal: change.proposal !== null,
    hasDesign: change.design !== null,
    fileCount: change.files.length,
    groupCount: change.fileGroups.length,
    hasHtmlFiles: change.files.some((f) => f.type === 'html'),
  };
}
