import * as path from 'path';
import type { DependencyReference } from '@orgtrace/core';
import type { FileParser, ParseContext } from '../types';

const APEX_EXTENSIONS = new Set(['.cls', '.trigger']);

function isTestFile(content: string): boolean {
  return /@isTest/i.test(content) || /testMethod/i.test(content);
}

export const apexParser: FileParser = {
  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return APEX_EXTENSIONS.has(ext);
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot, searchTerm } = ctx;
    const refs: DependencyReference[] = [];
    const isTest = isTestFile(content);
    const sourceApiName = path.basename(filePath).replace(/\.(cls|trigger)$/, '');
    const sourceType = filePath.endsWith('.trigger') ? 'ApexTrigger' : 'ApexClass';
    const relativePath = path.relative(projectRoot, filePath);

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const lineNumber = i + 1;

      if (!line.includes(searchTerm)) continue;

      // Skip comment-only lines
      if (/^\s*(\/\/|\/\*)/.test(line)) continue;

      const matchedText = line.trim();

      // Classify relationship
      let relationshipType: DependencyReference['relationshipType'] = 'References';

      if (isTest) {
        relationshipType = 'Tests';
      } else if (/new\s+/.test(line)) {
        relationshipType = 'Invokes';
      } else if (/extends\s+/.test(line) || /implements\s+/.test(line)) {
        relationshipType = 'Extends';
      } else if (/\w+\.\w+\s*=/.test(line)) {
        relationshipType = 'WritesField';
      }

      refs.push({
        source: {
          apiName: sourceApiName,
          type: sourceType,
          filePath: relativePath,
        },
        target: {
          apiName: target.apiName,
          type: target.type,
        },
        relationshipType,
        location: {
          filePath: relativePath,
          lineNumber,
        },
        matchedText,
        confidence: 'Medium',
        dataSource: 'LocalScan',
      });
    }

    return refs;
  },
};
