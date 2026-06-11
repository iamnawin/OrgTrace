import { ComponentRef } from './types';

type ComponentEnrichment = {
  [Key in keyof ComponentRef]?: ComponentRef[Key] | undefined;
};

/**
 * Merges org enrichment data into an existing ComponentRef.
 * Does not overwrite local-only fields like filePath.
 */
export function mergeComponentEnrichment(
  base: ComponentRef,
  enrichment: ComponentEnrichment | null
): ComponentRef {
  if (!enrichment) return base;

  const result = { ...base };

  if (enrichment.id !== undefined) result.id = enrichment.id;
  if (enrichment.durableId !== undefined) result.durableId = enrichment.durableId;
  if (enrichment.namespace !== undefined) result.namespace = enrichment.namespace;
  if (enrichment.label !== undefined) result.label = enrichment.label;
  if (enrichment.description !== undefined) result.description = enrichment.description;
  if (enrichment.status !== undefined) result.status = enrichment.status;
  if (enrichment.createdDate !== undefined) result.createdDate = enrichment.createdDate;
  if (enrichment.createdBy !== undefined) result.createdBy = enrichment.createdBy;
  if (enrichment.lastModifiedDate !== undefined) result.lastModifiedDate = enrichment.lastModifiedDate;
  if (enrichment.lastModifiedBy !== undefined) result.lastModifiedBy = enrichment.lastModifiedBy;

  return result;
}
