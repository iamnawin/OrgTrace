import type {
  ComponentRef,
  DependencyReference,
  MetadataType,
} from '@orgtrace/core';

export interface DiagramNode {
  component: ComponentRef;
  referenceCount: number;
  relationships: string[];
  location?: { filePath: string; lineNumber?: number };
  description: string;
}

export interface DiagramCluster {
  type: MetadataType;
  nodes: DiagramNode[];
}

function describeNode(
  referenceCount: number,
  relationships: string[],
  location?: { filePath: string; lineNumber?: number },
): string {
  const parts = [
    `${referenceCount} reference${referenceCount === 1 ? '' : 's'}`,
    relationships.join(', '),
  ];
  if (location) {
    parts.push(
      location.lineNumber
        ? `${location.filePath}:${location.lineNumber}`
        : location.filePath,
    );
  }
  return parts.filter(Boolean).join(' · ');
}

/**
 * Collapses raw references into one node per component so a component
 * referenced on many lines appears once with a count, then groups the
 * nodes by metadata type so the structure reads as a schema.
 */
export function buildDiagramClusters(
  refs: DependencyReference[],
  side: 'inbound' | 'outbound',
): DiagramCluster[] {
  const nodesByKey = new Map<
    string,
    {
      component: ComponentRef;
      referenceCount: number;
      relationships: Set<string>;
      location?: { filePath: string; lineNumber?: number };
    }
  >();

  for (const ref of refs) {
    const component = side === 'inbound' ? ref.source : ref.target;
    const key = `${component.type}:${component.apiName}`;
    const entry = nodesByKey.get(key) ?? {
      component,
      referenceCount: 0,
      relationships: new Set<string>(),
    };
    entry.referenceCount += 1;
    entry.relationships.add(ref.relationshipType);
    if (!entry.location && ref.location?.filePath) {
      entry.location = {
        filePath: ref.location.filePath,
        ...(ref.location.lineNumber ? { lineNumber: ref.location.lineNumber } : {}),
      };
    }
    nodesByKey.set(key, entry);
  }

  const clusters = new Map<MetadataType, DiagramNode[]>();
  for (const entry of nodesByKey.values()) {
    const relationships = [...entry.relationships].sort();
    const node: DiagramNode = {
      component: entry.component,
      referenceCount: entry.referenceCount,
      relationships,
      ...(entry.location ? { location: entry.location } : {}),
      description: describeNode(entry.referenceCount, relationships, entry.location),
    };
    const existing = clusters.get(entry.component.type) ?? [];
    existing.push(node);
    clusters.set(entry.component.type, existing);
  }

  return [...clusters.entries()]
    .map(([type, nodes]) => ({
      type,
      nodes: nodes.sort(
        (a, b) =>
          b.referenceCount - a.referenceCount ||
          a.component.apiName.localeCompare(b.component.apiName),
      ),
    }))
    .sort(
      (a, b) =>
        b.nodes.reduce((sum, node) => sum + node.referenceCount, 0) -
          a.nodes.reduce((sum, node) => sum + node.referenceCount, 0) ||
        a.type.localeCompare(b.type),
    );
}
