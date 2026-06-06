import type { ComponentRef } from '@orgtrace/core';
import { describe, expect, it } from 'vitest';
import {
  buildComponentPicks,
  rawFallbackRef,
  type ComponentItemModel,
} from './componentPicks';

// Mirrors the type-sorted output contract of discoverComponents.
const refs: ComponentRef[] = [
  { apiName: 'AccountAlertController', type: 'ApexClass', filePath: 'classes/AccountAlertController.cls' },
  { apiName: 'Case.Account_Alert_Message__c', type: 'CustomField', filePath: 'objects/Case/fields/Account_Alert_Message__c.field-meta.xml', label: 'Case.Account_Alert_Message__c' },
  { apiName: 'Account', type: 'CustomObject', filePath: 'objects/Account/Account.object-meta.xml' },
  { apiName: 'Account_Alert_Message', type: 'Flow', filePath: 'flows/Account_Alert_Message.flow-meta.xml' },
  { apiName: 'Account_Record_Trigger_Before', type: 'Flow', filePath: 'flows/Account_Record_Trigger_Before.flow-meta.xml' },
  { apiName: 'accountAlertPanel', type: 'LightningComponentBundle', filePath: 'lwc/accountAlertPanel' },
  { apiName: 'Account_Alert_Access', type: 'PermissionSet', filePath: 'permissionsets/Account_Alert_Access.permissionset-meta.xml' },
];

describe('buildComponentPicks', () => {
  it('orders separator groups by impact-analysis priority, not alphabetically', () => {
    const models = buildComponentPicks(refs);
    const separators = models.filter((m) => m.kind === 'separator');

    expect(separators.map((s) => s.label)).toEqual([
      'Flow',
      'Apex Class',
      'Field',
      'Object',
      'LWC',
      'Permission Set',
    ]);
  });

  it('emits one separator per group even when a type has multiple items', () => {
    const models = buildComponentPicks(refs);
    const flowSeparators = models.filter(
      (m) => m.kind === 'separator' && m.label === 'Flow',
    );
    const flowItems = models.filter(
      (m): m is ComponentItemModel =>
        m.kind === 'item' && m.componentRef.type === 'Flow',
    );

    expect(flowSeparators).toHaveLength(1);
    expect(flowItems).toHaveLength(2);
  });

  it('places the type separator immediately before its items', () => {
    const models = buildComponentPicks(refs);
    const fieldIndex = models.findIndex(
      (m) => m.kind === 'separator' && m.label === 'Field',
    );

    expect(models[fieldIndex + 1]).toMatchObject({
      kind: 'item',
      componentRef: { type: 'CustomField', apiName: 'Case.Account_Alert_Message__c' },
    });
  });

  it('builds labels with codicon, type, and the qualified field name', () => {
    const models = buildComponentPicks(refs);
    const field = models.find(
      (m): m is ComponentItemModel =>
        m.kind === 'item' && m.componentRef.type === 'CustomField',
    );

    expect(field?.label).toBe('$(symbol-field) Field: Case.Account_Alert_Message__c');
    expect(field?.detail).toBe('objects/Case/fields/Account_Alert_Message__c.field-meta.xml');
  });

  it('returns an empty model list for no matches (no separators)', () => {
    expect(buildComponentPicks([])).toEqual([]);
  });
});

describe('rawFallbackRef', () => {
  it('wraps the raw query as an Unknown component for the direct-scan fallback', () => {
    expect(rawFallbackRef('zzzqqq')).toEqual({ apiName: 'zzzqqq', type: 'Unknown' });
  });
});
