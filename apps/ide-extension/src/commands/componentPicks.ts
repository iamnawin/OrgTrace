import type { ComponentRef, MetadataType } from '@orgtrace/core';

export interface TypeDisplay {
  icon: string;
  label: string;
}

/** Display metadata for the component types surfaced by the picker. */
const TYPE_DISPLAY: Partial<Record<string, TypeDisplay>> = {
  Flow: { icon: 'symbol-event', label: 'Flow' },
  ApexClass: { icon: 'symbol-class', label: 'Apex Class' },
  ApexTrigger: { icon: 'symbol-event', label: 'Apex Trigger' },
  AuraDefinitionBundle: { icon: 'symbol-method', label: 'Aura' },
  CustomField: { icon: 'symbol-field', label: 'Field' },
  CustomObject: { icon: 'database', label: 'Object' },
  LightningComponentBundle: { icon: 'symbol-method', label: 'LWC' },
  PermissionSet: { icon: 'shield', label: 'Permission Set' },
  Profile: { icon: 'account', label: 'Profile' },
  ValidationRule: { icon: 'checklist', label: 'Validation Rule' },
  WorkflowRule: { icon: 'gear', label: 'Workflow Rule' },
  Report: { icon: 'graph', label: 'Report' },
  Dashboard: { icon: 'dashboard', label: 'Dashboard' },
  CustomLabel: { icon: 'tag', label: 'Custom Label' },
  CustomMetadata: { icon: 'symbol-namespace', label: 'Custom Metadata' },
  EmailTemplate: { icon: 'mail', label: 'Email Template' },
  LightningPage: { icon: 'layout', label: 'Lightning Page' },
  NamedCredential: { icon: 'key', label: 'Named Credential' },
  RemoteSiteSetting: { icon: 'globe', label: 'Remote Site Setting' },
};

const FALLBACK_DISPLAY: TypeDisplay = { icon: 'symbol-misc', label: 'Component' };

function labelFromMetadataType(type: MetadataType): string {
  if (type === 'Unknown') return FALLBACK_DISPLAY.label;
  return type.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

export function displayFor(type: MetadataType): TypeDisplay {
  return TYPE_DISPLAY[type] ?? { icon: FALLBACK_DISPLAY.icon, label: labelFromMetadataType(type) };
}

/**
 * Group ordering for the picker, tuned for Salesforce impact analysis: surface
 * automation/code first, then fields/objects, then everything else. Types absent
 * from this list sort last (in their original relative order).
 */
export const GROUP_ORDER: MetadataType[] = [
  'Flow',
  'ApexClass',
  'ApexTrigger',
  'CustomField',
  'CustomObject',
  'LightningComponentBundle',
  'AuraDefinitionBundle',
  'PermissionSet',
  'Profile',
  'ValidationRule',
  'WorkflowRule',
  'Report',
  'Dashboard',
  'CustomLabel',
  'CustomMetadata',
  'EmailTemplate',
  'LightningPage',
  'NamedCredential',
  'RemoteSiteSetting',
];

function groupRank(type: MetadataType): number {
  const index = GROUP_ORDER.indexOf(type);
  return index === -1 ? GROUP_ORDER.length : index;
}

/** A type heading rendered as a non-selectable QuickPick separator row. */
export interface ComponentSeparatorModel {
  kind: 'separator';
  label: string;
}

/** A selectable component row carrying its source {@link ComponentRef}. */
export interface ComponentItemModel {
  kind: 'item';
  label: string;
  description: string;
  detail?: string;
  componentRef: ComponentRef;
}

export type ComponentPickModel = ComponentSeparatorModel | ComponentItemModel;

function toItem(ref: ComponentRef): ComponentItemModel {
  const display = displayFor(ref.type);
  const name = ref.label ?? ref.apiName;
  return {
    kind: 'item',
    label: `$(${display.icon}) ${display.label}: ${name}`,
    description: display.label,
    ...(ref.filePath ? { detail: ref.filePath } : {}),
    componentRef: ref,
  };
}

/**
 * Builds the QuickPick model for discovered components, inserting a separator
 * heading before each metadata type group. Reorders groups into {@link GROUP_ORDER}
 * (impact-analysis priority) while preserving each item's relative order within
 * its group; consecutive items of the same type share one heading.
 */
export function buildComponentPicks(refs: ComponentRef[]): ComponentPickModel[] {
  const ordered = [...refs].sort((a, b) => groupRank(a.type) - groupRank(b.type));
  const models: ComponentPickModel[] = [];
  let currentType: MetadataType | undefined;

  for (const ref of ordered) {
    if (ref.type !== currentType) {
      currentType = ref.type;
      models.push({ kind: 'separator', label: displayFor(ref.type).label });
    }
    models.push(toItem(ref));
  }

  return models;
}

/** The raw, unresolved target used when discovery returns no matches. */
export function rawFallbackRef(query: string): ComponentRef {
  return { apiName: query, type: 'Unknown' satisfies MetadataType };
}
