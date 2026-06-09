import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import type { ComponentRef, MetadataType } from '@orgtrace/core';
import { DEFAULT_IGNORE } from './constants';
import {
  isSpecializedMetadataXml,
  metadataNameFromFile,
  metadataTypeFromXml,
} from './metadataXml';

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
    pattern: '**/classes/*.cls',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.cls'),
      type: 'ApexClass',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'ApexTrigger',
    pattern: '**/triggers/*.trigger',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.trigger'),
      type: 'ApexTrigger',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'CustomObject',
    pattern: '**/objects/*/*.object-meta.xml',
    build: (abs, root) => ({
      apiName: stripSuffix(path.basename(abs), '.object-meta.xml'),
      type: 'CustomObject',
      filePath: path.relative(root, abs),
    }),
  },
  {
    type: 'CustomField',
    pattern: '**/fields/*.field-meta.xml',
    build: (abs, root) => {
      const fieldName = stripSuffix(path.basename(abs), FIELD_SUFFIX);
      const qualifiedName = `${owningObject(abs)}.${fieldName}`;
      return {
        apiName: qualifiedName,
        type: 'CustomField',
        filePath: path.relative(root, abs),
        label: qualifiedName,
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

async function buildGenericMetadataRef(
  absFile: string,
  projectPath: string,
): Promise<ComponentRef | undefined> {
  if (isSpecializedMetadataXml(absFile)) return undefined;

  let content: string;
  try {
    content = await fs.readFile(absFile, 'utf8');
  } catch {
    return undefined;
  }

  const type = metadataTypeFromXml(content);
  if (!type) return undefined;

  return {
    apiName: metadataNameFromFile(absFile),
    type,
    filePath: path.relative(projectPath, absFile),
  };
}

/** Collapse to lowercase alphanumerics so "account alert" matches "Account_Alert_Message__c". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds candidate Salesforce components in a local SFDX project whose name
 * matches `query`. Filename-based and content-free — it surfaces components for
 * the user to pick from, not full dependency analysis. An empty query returns
 * every candidate. Pass `typeFilter` to restrict discovery to a single metadata
 * type (e.g. the picker's scope filter).
 */
export async function discoverComponents(
  projectPath: string,
  query: string,
  typeFilter?: MetadataType,
): Promise<ComponentRef[]> {
  const normalizedQuery = normalize(query);
  const rules = typeFilter
    ? DISCOVERY_RULES.filter((rule) => rule.type === typeFilter)
    : DISCOVERY_RULES;

  const perRule = await Promise.all(
    rules.map(async (rule) => {
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

  const genericFiles = await fg('**/*-meta.xml', {
    cwd: projectPath,
    absolute: true,
    ignore: DEFAULT_IGNORE,
    onlyFiles: true,
  });
  const genericRefs = (
    await Promise.all(genericFiles.map((abs) => buildGenericMetadataRef(abs, projectPath)))
  ).filter((ref): ref is ComponentRef => {
    if (!ref) return false;
    if (typeFilter && ref.type !== typeFilter) return false;
    if (!normalizedQuery) return true;
    return normalize(ref.label ?? ref.apiName).includes(normalizedQuery);
  });

  return [...perRule.flat(), ...genericRefs].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return (a.label ?? a.apiName).localeCompare(b.label ?? b.apiName);
  });
}
