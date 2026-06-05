import type { DependencyReference, DependencyResult } from '@orgtrace/core';

function formatLocation(reference: DependencyReference): string {
  const filePath = reference.location?.filePath ?? reference.source.filePath;
  const lineNumber = reference.location?.lineNumber;

  if (!filePath) return 'unknown location';
  return lineNumber ? `${filePath}:${lineNumber}` : filePath;
}

function listItems(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  return items.map((item) => `- ${item}`).join('\n');
}

export function generateImpactMarkdown(result: DependencyResult): string {
  const references = result.references.map(
    (ref) =>
      `${ref.source.type}: ${ref.source.apiName} (${ref.relationshipType}, ${ref.confidence}) at ${formatLocation(ref)}`,
  );

  const dependencies = result.dependencies.map(
    (dep) =>
      `${dep.target.type}: ${dep.target.apiName} (${dep.relationshipType}, ${dep.confidence}) at ${formatLocation(dep)}`,
  );

  return `# OrgTrace Impact Report

## Target

- API Name: ${result.target.apiName}
- Type: ${result.target.type}
- Scanned At: ${result.scannedAt}

## Risk

- Level: ${result.risk.level}
- Score: ${result.risk.score}

### Reasons

${listItems(result.risk.reasons, 'No risk reasons reported.')}

### Recommendations

${listItems(result.risk.recommendations ?? [], 'No recommendations reported.')}

## References

${listItems(references, 'No inbound references found.')}

## Dependencies

${listItems(dependencies, 'No outbound dependencies found.')}

## Warnings

${listItems(result.warnings ?? [], 'No warnings.')}

## Errors

${listItems(result.errors ?? [], 'No errors.')}
`;
}
