import * as path from 'path';
import type { DependencyReference } from '@orgtrace/core';
import type { FileParser, ParseContext } from '../types';

export const lwcHtmlParser: FileParser = {
  canParse(filePath: string): boolean {
    return (
      filePath.endsWith('.html') &&
      filePath.includes(`${path.sep}lwc${path.sep}`)
    );
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot } = ctx;
    const refs: DependencyReference[] = [];
    const sourceApiName = path.basename(path.dirname(filePath));
    const relativePath = path.relative(projectRoot, filePath);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (!line.toLowerCase().includes(target.apiName.toLowerCase())) continue;
      if (/^\s*<!--/.test(line)) continue;

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
        relationshipType: 'References',
        location: { filePath: relativePath, lineNumber: i + 1 },
        matchedText: line.trim(),
        confidence: 'Low',
        dataSource: 'LocalScan',
      });
    }

    return refs;
  },
};
