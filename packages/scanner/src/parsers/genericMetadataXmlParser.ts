import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import type { DependencyReference } from '@orgtrace/core';
import {
  isMetadataXml,
  isSpecializedMetadataXml,
  metadataNameFromFile,
  metadataTypeFromXml,
} from '../metadataXml';
import type { FileParser, ParseContext } from '../types';

const parser = new XMLParser({ ignoreAttributes: false });
const INTEGRATION_METADATA_TYPES = new Set([
  'ConnectedApp',
  'ExternalCredential',
  'ExternalDataSource',
  'ExternalServiceRegistration',
  'NamedCredential',
  'RemoteSiteSetting',
]);

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

function relationshipTypeFor(
  sourceType: string,
  targetType: string,
): DependencyReference['relationshipType'] {
  if (INTEGRATION_METADATA_TYPES.has(sourceType)) return 'Configures';
  if (targetType === 'CustomField') return 'UsesField';
  if (targetType === 'CustomObject') return 'UsesObject';
  return 'References';
}

export const genericMetadataXmlParser: FileParser = {
  canParse(filePath: string): boolean {
    return isMetadataXml(filePath) && !isSpecializedMetadataXml(filePath);
  },

  parse(ctx: ParseContext): DependencyReference[] {
    const { filePath, content, target, projectRoot, searchTerm } = ctx;
    const sourceType = metadataTypeFromXml(content);
    if (!sourceType) return [];

    let parsed: unknown;
    try {
      parsed = parser.parse(content);
    } catch {
      return [];
    }

    const found: string[] = [];
    searchNode(parsed, searchTerm, found);
    if (found.length === 0) return [];

    const relativePath = path.relative(projectRoot, filePath);

    return [
      {
        source: {
          apiName: metadataNameFromFile(filePath),
          type: sourceType,
          filePath: relativePath,
        },
        target: {
          apiName: target.apiName,
          type: target.type,
        },
        relationshipType: relationshipTypeFor(sourceType, target.type),
        location: { filePath: relativePath },
        matchedText: found[0]!,
        confidence: 'Medium',
        dataSource: 'LocalScan',
      },
    ];
  },
};
