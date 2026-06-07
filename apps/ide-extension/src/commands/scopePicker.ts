import type { MetadataType } from '@orgtrace/core';

import { GROUP_ORDER, displayFor } from './componentPicks';

/** A metadata-type filter for the picker. `type: undefined` means "All". */
export interface ScopeOption {
  label: string;
  type?: MetadataType;
  icon?: string;
}

/** The passthrough scope that applies no type filter. */
export const ALL_SCOPE: ScopeOption = { label: 'All' };

/**
 * Builds the scope filter options: an "All" passthrough followed by each
 * discoverable metadata type in impact-analysis order. Labels and icons come
 * from the shared picker display map so scope rows match the result rows.
 */
export function buildScopeOptions(): ScopeOption[] {
  return [
    ALL_SCOPE,
    ...GROUP_ORDER.map((type) => {
      const display = displayFor(type);
      return { label: display.label, type, icon: display.icon };
    }),
  ];
}
