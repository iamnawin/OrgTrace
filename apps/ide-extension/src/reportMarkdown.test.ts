import { describe, expect, it } from 'vitest';
import type { DependencyResult } from '@orgtrace/core';
import { generateImpactMarkdown } from '@orgtrace/core';

const result: DependencyResult = {
  target: {
    apiName: 'Account.Status__c',
    type: 'CustomField',
  },
  references: [
    {
      source: {
        apiName: 'AccountTrigger',
        type: 'ApexTrigger',
        filePath: 'force-app/main/default/triggers/AccountTrigger.trigger',
      },
      target: {
        apiName: 'Account.Status__c',
        type: 'CustomField',
      },
      relationshipType: 'WritesField',
      location: {
        filePath: 'force-app/main/default/triggers/AccountTrigger.trigger',
        lineNumber: 12,
      },
      matchedText: 'Account.Status__c = value;',
      confidence: 'Medium',
      dataSource: 'LocalScan',
    },
  ],
  dependencies: [],
  risk: {
    level: 'Medium',
    score: 32,
    reasons: ['At least one component writes to this field'],
    recommendations: ['Review data update behavior and downstream automation.'],
  },
  scannedAt: '2026-06-05T00:00:00.000Z',
  sources: ['LocalScan'],
  warnings: ['Skipped unreadable file'],
  errors: ['Parser failed on broken.flow-meta.xml'],
};

describe('generateImpactMarkdown', () => {
  it('includes target, risk reasons, file locations, warnings, and errors', () => {
    const markdown = generateImpactMarkdown(result);

    expect(markdown).toContain('# OrgTrace Impact Report');
    expect(markdown).toContain('Account.Status__c');
    expect(markdown).toContain('Medium');
    expect(markdown).toContain('At least one component writes to this field');
    expect(markdown).toContain('force-app/main/default/triggers/AccountTrigger.trigger:12');
    expect(markdown).toContain('Skipped unreadable file');
    expect(markdown).toContain('Parser failed on broken.flow-meta.xml');
  });
});
