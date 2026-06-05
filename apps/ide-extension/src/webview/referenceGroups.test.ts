import { describe, expect, it } from 'vitest';
import type { DependencyReference } from '@orgtrace/core';

import { groupReferencesBySourceType } from './referenceGroups';

function reference(sourceType: DependencyReference['source']['type']): DependencyReference {
  return {
    source: {
      apiName: `${sourceType}Source`,
      type: sourceType,
      filePath: `${sourceType}.xml`,
    },
    target: {
      apiName: 'Account.Status__c',
      type: 'CustomField',
    },
    relationshipType: 'References',
    location: {
      filePath: `${sourceType}.xml`,
      lineNumber: 4,
    },
    confidence: 'High',
    dataSource: 'LocalScan',
  };
}

describe('groupReferencesBySourceType', () => {
  it('groups references by metadata source type with stable labels', () => {
    const groups = groupReferencesBySourceType([
      reference('Flow'),
      reference('ApexClass'),
      reference('Flow'),
    ]);

    expect(groups).toEqual([
      { sourceType: 'ApexClass', references: [reference('ApexClass')] },
      { sourceType: 'Flow', references: [reference('Flow'), reference('Flow')] },
    ]);
  });
});
