import * as path from 'path';
import type { DependencyReference } from '@orgtrace/core';
import type { FileParser, ParseContext } from '../types';

export const lwcJsParser: FileParser = {
  canParse(filePath: string): boolean {
    return (
      filePath.endsWith('.js') &&
      filePath.includes(`${path.sep}lwc${path.sep}`)
    );
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot, searchTerm } = ctx;
    const refs: DependencyReference[] = [];
    const sourceApiName = path.basename(path.dirname(filePath));
    const relativePath = path.relative(projectRoot, filePath);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (!line.includes(searchTerm)) continue;

      let relationshipType: DependencyReference['relationshipType'] = 'References';
      let confidence: DependencyReference['confidence'] = 'Medium';

      // @salesforce/apex/ClassName.method
      if (line.includes('@salesforce/apex/')) {
        relationshipType = 'Invokes';
        confidence = 'High';
      }

      // @salesforce/schema/Object.Field
      if (line.includes('@salesforce/schema/')) {
        relationshipType = 'UsesField';
        confidence = 'High';
      }

      refs.push({
        source: {
          apiName: sourceApiName,
          type: 'LightningComponentBundle',
          filePath: relativePath,
        },
        target: {
          apiName: target.apiName,
          type: target.type,
        },
        relationshipType,
        location: { filePath: relativePath, lineNumber: i + 1 },
        matchedText: line.trim(),
        confidence,
        dataSource: 'LocalScan',
      });
    }

    return refs;
  },
};
