import type { DependencyReference } from '@orgtrace/core';

export function getReferenceKey(ref: DependencyReference): string {
  return [
    ref.source.apiName,
    ref.source.type,
    ref.target.apiName,
    ref.target.type,
    ref.relationshipType,
    ref.location?.filePath ?? '',
    ref.location?.lineNumber ?? '',
    ref.matchedText ?? '',
  ].join('|');
}

export function deduplicateReferences(
  refs: DependencyReference[],
): DependencyReference[] {
  const seen = new Set<string>();
  const result: DependencyReference[] = [];
  for (const ref of refs) {
    const key = getReferenceKey(ref);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ref);
    }
  }
  return result;
}
