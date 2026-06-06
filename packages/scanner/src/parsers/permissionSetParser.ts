import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import type { DependencyReference } from '@orgtrace/core';
import type { FileParser, ParseContext } from '../types';

const parser = new XMLParser({ ignoreAttributes: false });

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

export const permissionSetParser: FileParser = {
  canParse(filePath: string): boolean {
    return (
      filePath.endsWith('.permissionset-meta.xml') ||
      filePath.endsWith('.profile-meta.xml')
    );
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot, searchTerm } = ctx;
    const refs: DependencyReference[] = [];

    let parsed: unknown;
    try {
      parsed = parser.parse(content);
    } catch {
      return refs;
    }

    const found: string[] = [];
    searchNode(parsed, searchTerm, found);
    if (found.length === 0) return refs;

    const isProfile = filePath.endsWith('.profile-meta.xml');
    const sourceApiName = path
      .basename(filePath)
      .replace(/\.(permissionset|profile)-meta\.xml$/, '');
    const relativePath = path.relative(projectRoot, filePath);

    refs.push({
      source: {
        apiName: sourceApiName,
        type: isProfile ? 'Profile' : 'PermissionSet',
        filePath: relativePath,
      },
      target: {
        apiName: target.apiName,
        type: target.type,
      },
      relationshipType: 'UsesPermission',
      location: { filePath: relativePath },
      matchedText: found[0]!,
      confidence: 'High',
      dataSource: 'LocalScan',
    });

    return refs;
  },
};
