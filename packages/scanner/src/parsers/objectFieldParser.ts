import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import type { DependencyReference, MetadataType } from '@orgtrace/core';
import type { FileParser, ParseContext } from '../types';

const parser = new XMLParser({ ignoreAttributes: false });

function resolveType(filePath: string): MetadataType {
  if (filePath.endsWith('.object-meta.xml')) return 'CustomObject';
  if (filePath.endsWith('.field-meta.xml')) return 'CustomField';
  return 'Unknown';
}

function searchNode(node: unknown, targetApiName: string, found: string[]): void {
  if (typeof node === 'string') {
    if (node === targetApiName || node.includes(targetApiName)) {
      found.push(node);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) searchNode(item, targetApiName, found);
    return;
  }
  if (node && typeof node === 'object') {
    for (const val of Object.values(node as Record<string, unknown>)) {
      searchNode(val, targetApiName, found);
    }
  }
}

export const objectFieldParser: FileParser = {
  canParse(filePath: string): boolean {
    return (
      filePath.endsWith('.object-meta.xml') ||
      filePath.endsWith('.field-meta.xml')
    );
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot } = ctx;
    const refs: DependencyReference[] = [];

    let parsed: unknown;
    try {
      parsed = parser.parse(content);
    } catch {
      return refs;
    }

    const found: string[] = [];
    searchNode(parsed, target.apiName, found);
    if (found.length === 0) return refs;

    const sourceApiName = path.basename(filePath).replace(/\.(object|field)-meta\.xml$/, '');
    const relativePath = path.relative(projectRoot, filePath);
    const sourceType = resolveType(filePath);

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
      relationshipType: 'UsesField',
      location: { filePath: relativePath },
      matchedText: found[0]!,
      confidence: 'High',
      dataSource: 'LocalScan',
    });

    return refs;
  },
};
