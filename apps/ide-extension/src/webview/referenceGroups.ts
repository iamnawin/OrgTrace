import type { DependencyReference, MetadataType } from '@orgtrace/core';

export interface ReferenceGroup {
  sourceType: MetadataType;
  references: DependencyReference[];
}

export function groupReferencesBySourceType(
  references: DependencyReference[],
): ReferenceGroup[] {
  const groups = new Map<MetadataType, DependencyReference[]>();

  for (const reference of references) {
    const existing = groups.get(reference.source.type) ?? [];
    existing.push(reference);
    groups.set(reference.source.type, existing);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([sourceType, groupedReferences]) => ({
      sourceType,
      references: groupedReferences,
    }));
}
