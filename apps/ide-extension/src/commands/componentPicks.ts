import type { ComponentRef, MetadataType } from '@orgtrace/core';

interface TypeDisplay {
  icon: string;
  label: string;
}

/** Display metadata for the component types surfaced by the picker. */
const TYPE_DISPLAY: Partial<Record<MetadataType, TypeDisplay>> = {
  Flow: { icon: 'symbol-event', label: 'Flow' },
  ApexClass: { icon: 'symbol-class', label: 'Apex Class' },
  CustomField: { icon: 'symbol-field', label: 'Field' },
  CustomObject: { icon: 'database', label: 'Object' },
  LightningComponentBundle: { icon: 'symbol-method', label: 'LWC' },
  PermissionSet: { icon: 'shield', label: 'Permission Set' },
  ValidationRule: { icon: 'checklist', label: 'Validation Rule' },
};

const FALLBACK_DISPLAY: TypeDisplay = { icon: 'symbol-misc', label: 'Component' };

function displayFor(type: MetadataType): TypeDisplay {
  return TYPE_DISPLAY[type] ?? FALLBACK_DISPLAY;
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
 * heading before each metadata type group. Expects `refs` to already be sorted
 * by type (the contract of `discoverComponents`); consecutive items of the same
 * type share one heading.
 */
export function buildComponentPicks(refs: ComponentRef[]): ComponentPickModel[] {
  const models: ComponentPickModel[] = [];
  let currentType: MetadataType | undefined;

  for (const ref of refs) {
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
