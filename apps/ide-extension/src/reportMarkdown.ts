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
  const usedBy = result.references.map(
    (ref) =>
      `${ref.source.type}: ${ref.source.apiName} (${ref.relationshipType}, ${ref.confidence}) at ${formatLocation(ref)}`,
  );

  const uses = result.dependencies.map(
    (dep) =>
      `${dep.target.type}: ${dep.target.apiName} (${dep.relationshipType}, ${dep.confidence}) at ${formatLocation(dep)}`,
  );

  // Simple Mermaid Diagram
  let mermaid = '```mermaid\ngraph TD\n';
  const targetLabel = `${result.target.type}: ${result.target.apiName}`;
  
  // Unique nodes to avoid duplicates in Mermaid
  const nodes = new Set<string>();
  nodes.add(`T["${targetLabel}"]`);

  result.references.slice(0, 10).forEach((ref, i) => {
    const nodeName = `R${i}`;
    mermaid += `  ${nodeName}["${ref.source.type}: ${ref.source.apiName}"] --> T\n`;
  });

  result.dependencies.slice(0, 10).forEach((dep, i) => {
    const nodeName = `D${i}`;
    mermaid += `  T --> ${nodeName}["${dep.target.type}: ${dep.target.apiName}"]\n`;
  });
  mermaid += '```';

  // Plain-text fallback diagram
  let textDiagram = '```text\n';
  if (result.references.length > 0) {
    result.references.slice(0, 3).forEach((ref) => {
      textDiagram += `[${ref.source.type}: ${ref.source.apiName}]\n    | (Used By)\n    v\n`;
    });
  }
  textDiagram += `(TARGET) [${result.target.type}: ${result.target.apiName}]`;
  if (result.dependencies.length > 0) {
    result.dependencies.slice(0, 3).forEach((dep) => {
      textDiagram += `\n    | (Uses)\n    v\n[${dep.target.type}: ${dep.target.apiName}]`;
    });
  }
  textDiagram += '\n```';

  return `# OrgTrace Impact Report: ${result.target.apiName}

## Selected Component Details

- **API Name:** ${result.target.apiName}
- **Metadata Type:** ${result.target.type}
- **Label:** ${result.target.label ?? 'N/A'}
- **Description:** ${result.target.description ?? 'N/A'}
- **File Path:** ${result.target.filePath ?? 'N/A'}
- **Status:** ${result.target.status ?? 'N/A'}
- **Namespace:** ${result.target.namespace ?? 'N/A'}
- **Last Modified By:** ${result.target.lastModifiedBy ?? 'Available after org connection'}
- **Last Modified Date:** ${result.target.lastModifiedDate ?? 'N/A'}
- **Created By:** ${result.target.createdBy ?? 'Available after org connection'}
- **Created Date:** ${result.target.createdDate ?? 'N/A'}
- **Data Sources:** ${result.sources.join(', ')}

## Relationship Diagram

### Visual (Mermaid)
${mermaid}

### Text Summary
${textDiagram}

## Risk Summary

- **Level:** ${result.risk.level}
- **Score:** ${result.risk.score}

### Reasons

${listItems(result.risk.reasons, 'No risk reasons reported.')}

### Recommendations

${listItems(result.risk.recommendations ?? [], 'No recommendations reported.')}

## Used By (Inbound)

${listItems(usedBy, 'No components found that use this component.')}

## Uses (Outbound)

${listItems(uses, 'No components found that this component uses.')}

## Scan Info

- **Scanned At:** ${result.scannedAt}
- **Warnings:** ${result.warnings?.length ?? 0}
- **Errors:** ${result.errors?.length ?? 0}

${result.warnings?.length ? '\n### Warnings\n' + listItems(result.warnings, '') : ''}
${result.errors?.length ? '\n### Errors\n' + listItems(result.errors, '') : ''}
`;
}
