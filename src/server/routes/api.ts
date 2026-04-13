import type { FastifyInstance, FastifyReply } from 'fastify';
import type { OpenSpecData } from '../../parser/index.js';
import { parseSpec, parseChangeByName, searchOpenSpec } from '../../parser/index.js';
import {
  inspectCommandAvailability,
  type CommandAvailability,
} from '../openspec-config.js';
import {
  ProjectRegistryError,
  createNoActiveProjectError,
  createStructuredApiError,
  type ProjectRegistry,
} from '../project-registry.js';

interface RegisterApiRoutesOptions {
  registry: Pick<
    ProjectRegistry,
    | 'addProject'
    | 'activateProject'
    | 'getActiveData'
    | 'getActiveOpenSpecPath'
    | 'getActiveProject'
    | 'getActiveProjectRoot'
    | 'getCommandAvailabilityCache'
    | 'listProjects'
    | 'removeProject'
    | 'setCommandAvailabilityCache'
  >;
  onProjectSwitched?: (projectId: string | null) => Promise<void> | void;
}

interface AddProjectRequestBody {
  path?: string;
}

/**
 * Register API routes
 */
export async function registerApiRoutes(
  fastify: FastifyInstance,
  options: RegisterApiRoutesOptions
) {
  const { registry, onProjectSwitched } = options;

  async function getCommandAvailability() {
    const projectRoot = registry.getActiveProjectRoot();
    if (!projectRoot) {
      return {
        status: 'unavailable',
        profile: null,
        workflows: [],
        availableExpandedCommands: [],
        error: 'No active project selected',
      } satisfies CommandAvailability;
    }

    const availability = await inspectCommandAvailability(projectRoot);

    if (availability.status === 'ready') {
      registry.setCommandAvailabilityCache(availability);
      return availability;
    }

    return registry.getCommandAvailabilityCache() ?? availability;
  }

  function getActiveData(reply: FastifyReply): OpenSpecData | null {
    const data = registry.getActiveData();
    if (!data) {
      void reply.status(503).send(createNoActiveProjectError().toResponseBody());
      return null;
    }

    return data;
  }

  function getActiveOpenSpecPath(reply: FastifyReply): string | null {
    const openspecPath = registry.getActiveOpenSpecPath();
    if (!openspecPath) {
      void reply.status(503).send(createNoActiveProjectError().toResponseBody());
      return null;
    }

    return openspecPath;
  }

  function sendProjectRegistryError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
    if (error instanceof ProjectRegistryError) {
      return reply.status(error.statusCode).send(error.toResponseBody());
    }

    const message = error instanceof Error ? error.message : fallbackMessage;
    return reply
      .status(500)
      .send(createStructuredApiError('ACTIVATION_FAILED', message));
  }

  // List projects
  fastify.get('/api/projects', async () => ({
    projects: registry.listProjects(),
    activeProjectId: registry.getActiveProject()?.id ?? null,
  }));

  // Add or reactivate a project
  fastify.post<{ Body: AddProjectRequestBody }>('/api/projects', async (request, reply) => {
    const projectPath = request.body?.path?.trim();
    if (!projectPath) {
      return reply.status(400).send(createStructuredApiError('INVALID_PROJECT_PATH', 'Project path is required'));
    }

    try {
      const result = await registry.addProject(projectPath);

      if (result.activeChanged) {
        await onProjectSwitched?.(result.entry.id);
      }

      return reply.status(result.status === 'created' ? 201 : 200).send({
        project: result.entry,
        activeProjectId: result.entry.id,
      });
    } catch (error) {
      return sendProjectRegistryError(reply, error, 'Failed to add project');
    }
  });

  // Remove a project
  fastify.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    try {
      const result = await registry.removeProject(request.params.id);

      if (result.activeChanged) {
        await onProjectSwitched?.(result.activeProjectId);
      }

      return {
        removedProjectId: result.removed.id,
        activeProjectId: result.activeProjectId,
      };
    } catch (error) {
      return sendProjectRegistryError(reply, error, 'Failed to remove project');
    }
  });

  // Activate a project
  fastify.post<{ Params: { id: string } }>(
    '/api/projects/:id/activate',
    async (request, reply) => {
      try {
        const result = await registry.activateProject(request.params.id);

        if (result.activeChanged) {
          await onProjectSwitched?.(result.entry.id);
        }

        return {
          project: result.entry,
          activeProjectId: result.entry.id,
        };
      } catch (error) {
        return sendProjectRegistryError(reply, error, 'Failed to activate project');
      }
    }
  );

  // Get project info
  fastify.get('/api/project', async (request, reply) => {
    const data = getActiveData(reply);
    if (!data) {
      return reply;
    }

    return { project: data.project };
  });

  // Get all specs
  fastify.get('/api/specs', async (request, reply) => {
    const data = getActiveData(reply);
    if (!data) {
      return reply;
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
    const openspecPath = getActiveOpenSpecPath(reply);
    if (!openspecPath) {
      return reply;
    }

    const result = await parseSpec(openspecPath, name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Spec not found' });
    }

    return { spec: result.data };
  });

  // Get all changes
  fastify.get('/api/changes', async (request, reply) => {
    const data = getActiveData(reply);
    if (!data) {
      return reply;
    }

    return {
      active: data.changes.active.map(summarizeChange),
      archived: data.changes.archived.map(summarizeChange),
    };
  });

  // Get single change
  fastify.get<{ Params: { name: string } }>('/api/changes/:name', async (request, reply) => {
    const { name } = request.params;
    const openspecPath = getActiveOpenSpecPath(reply);
    if (!openspecPath) {
      return reply;
    }

    const result = await parseChangeByName(openspecPath, name);

    if (!result.data) {
      return reply.status(404).send({ error: result.errors[0] || 'Change not found' });
    }

    return { change: result.data };
  });

  // Get stats
  fastify.get('/api/stats', async (request, reply) => {
    const data = getActiveData(reply);
    if (!data) {
      return reply;
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

    const data = getActiveData(reply);
    if (!data) {
      return reply;
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
  };
}
