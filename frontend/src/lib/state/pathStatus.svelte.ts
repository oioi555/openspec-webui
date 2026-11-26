import { getPathStatuses } from '$lib/api';

import { createPathStatusController, type PathStatusState } from './pathStatusCore';

const state = $state<PathStatusState>({ statuses: {} });

export const pathStatusStore = createPathStatusController({
  state,
  fetchStatuses: getPathStatuses,
});
