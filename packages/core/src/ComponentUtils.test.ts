import { describe, it, expect } from 'vitest';
import { mergeComponentEnrichment } from './ComponentUtils';
import type { ComponentRef } from './types';

describe('mergeComponentEnrichment', () => {
  const base: ComponentRef = {
    apiName: 'MyClass',
    type: 'ApexClass',
    filePath: 'force-app/main/default/classes/MyClass.cls',
    label: 'Old Label',
  };

  it('preserves local-only fields like filePath', () => {
    const enrichment = { id: '01p...' };
    const result = mergeComponentEnrichment(base, enrichment);
    expect(result.filePath).toBe(base.filePath);
    expect(result.id).toBe('01p...');
  });

  it('overwrites local fields if enrichment provides them', () => {
    const enrichment = { label: 'New Label' };
    const result = mergeComponentEnrichment(base, enrichment);
    expect(result.label).toBe('New Label');
  });

  it('does not overwrite with undefined values', () => {
    const enrichment = { label: undefined, id: 'some-id' };
    const result = mergeComponentEnrichment(base, enrichment);
    expect(result.label).toBe('Old Label');
    expect(result.id).toBe('some-id');
  });

  it('handles null enrichment gracefully', () => {
    const result = mergeComponentEnrichment(base, null);
    expect(result).toEqual(base);
  });

  it('merges audit fields correctly', () => {
    const enrichment = {
      createdBy: 'Admin',
      createdDate: '2023-01-01',
      lastModifiedBy: 'Dev',
      lastModifiedDate: '2023-06-01',
    };
    const result = mergeComponentEnrichment(base, enrichment);
    expect(result.createdBy).toBe('Admin');
    expect(result.lastModifiedBy).toBe('Dev');
  });
});
