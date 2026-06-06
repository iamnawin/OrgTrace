import * as path from 'path';
import fg from 'fast-glob';
import type { ComponentRef, MetadataType } from '@orgtrace/core';
import { DEFAULT_IGNORE } from './constants';

/**
 * A lightweight, filename-based discovery rule. It locates candidate metadata
 * files by glob and turns each into a {@link ComponentRef} without parsing file
 * contents — fast enough to power an interactive "sneak peek" search.
 */
interface DiscoveryRule {
  type: MetadataType;
  pattern: string;
  build(absFile: string, projectPath: string): ComponentRef;
}

function stripSuffix(name: string, suffix: string): string {
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** `.../objects/<Object>/<container>/<name>.xml` → `<Object>`. */
function owningObject(absFile: string): string {
  return path.basename(path.dirname(path.dirname(absFile)));
}

const FIELD_SUFFIX = '.field-meta.xml';
const VALIDATION_RULE_SUFFIX = '.validationRule-meta.xml';

const DISCOVERY_RULES: DiscoveryRule[] = [
  {
    type: 'Flow',
    pattern: '**/*.flow-meta.xml',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.flow-meta.xml'),
      type: 'Flow',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'ApexClass',
    pattern: '**/*.cls',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.cls'),
      type: 'ApexClass',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'CustomObject',
    pattern: '**/*.object-meta.xml',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.object-meta.xml'),
      type: 'CustomObject',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'CustomField',
    pattern: '**/*.field-meta.xml',
    build: (abs, root) => {
      const fieldName = stripSuffix(path.basename(abs), FIELD_SUFFIX);
      return {
        apiName: fieldName,
        type: 'CustomField',
        filePath: path.relative(root, abs),
        label: `${owningObject(abs)}.${fieldName}`,
      };
    },
  },
  {
    type: 'LightningComponentBundle',
    pattern: '**/lwc/*/*.js-meta.xml',
    build: (abs, root) => {
      const bundleDir = path.dirname(abs);
      return {
        apiName: path.basename(bundleDir),
        type: 'LightningComponentBundle',
        filePath: path.relative(root, bundleDir),
      };
    },
  },
  {
    type: 'PermissionSet',
    pattern: '**/*.permissionset-meta.xml',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.permissionset-meta.xml'),
      type: 'PermissionSet',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'ValidationRule',
    pattern: '**/*.validationRule-meta.xml',
    build: (abs, root) => {
      const ruleName = stripSuffix(path.basename(abs), VALIDATION_RULE_SUFFIX);
      return {
        apiName: ruleName,
        type: 'ValidationRule',
        filePath: path.relative(root, abs),
        label: `${owningObject(abs)}.${ruleName}`,
      };
    },
  },
];

/** Collapse to lowercase alphanumerics so "account alert" matches "Account_Alert_Message__c". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds candidate Salesforce components in a local SFDX project whose name
 * matches `query`. Filename-based and content-free — it surfaces components for
 * the user to pick from, not full dependency analysis. An empty query returns
 * every candidate.
 */
export async function discoverComponents(
  projectPath: string,
  query: string,
): Promise<ComponentRef[]> {
  const normalizedQuery = normalize(query);

  const perRule = await Promise.all(
    DISCOVERY_RULES.map(async (rule) => {
      let files: string[];
      try {
        files = await fg(rule.pattern, {
          cwd: projectPath,
          absolute: true,
          ignore: DEFAULT_IGNORE,
          onlyFiles: true,
        });
      } catch {
        return [];
      }

      return files
        .map((abs) => rule.build(abs, projectPath))
        .filter((ref) => {
          if (!normalizedQuery) return true;
          return normalize(ref.label ?? ref.apiName).includes(normalizedQuery);
        });
    }),
  );

  return perRule.flat().sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return (a.label ?? a.apiName).localeCompare(b.label ?? b.apiName);
  });
}
