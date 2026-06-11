import { describe, expect, it } from 'vitest';
import type { DependencyResult } from './types';
import { explainRiskCalculation } from './RiskEngine';

function reference(
  confidence: 'High' | 'Medium' | 'Low',
  sourceType: DependencyResult['references'][number]['source']['type'] = 'ApexClass',
): DependencyResult['references'][number] {
  return {
    source: {
      apiName: `${sourceType}Source`,
      type: sourceType,
    },
    target: {
      apiName: 'Account.Status__c',
      type: 'CustomField',
    },
    relationshipType: 'References',
    confidence,
    dataSource: 'LocalScan',
  };
}

describe('explainRiskCalculation', () => {
  it('shows relationship weights, rule bonuses, cap, and thresholds', () => {
    const result: Omit<DependencyResult, 'risk'> = {
      target: {
        apiName: 'Account.Status__c',
        type: 'CustomField',
      },
      references: [
        reference('High', 'Flow'),
        reference('Medium', 'ApexClass'),
      ],
      dependencies: [
        {
          ...reference('High'),
          target: {
            apiName: 'Shared_Label',
            type: 'CustomLabel',
          },
        },
      ],
      scannedAt: '2026-06-11T00:00:00.000Z',
      sources: ['LocalScan'],
    };

    const explanation = explainRiskCalculation(result);

    expect(explanation.relationshipPoints).toBe(7);
    expect(explanation.rulePoints).toBe(35);
    expect(explanation.rawScore).toBe(42);
    expect(explanation.finalScore).toBe(42);
    expect(explanation.level).toBe('Medium');
    expect(explanation.contributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Inbound references',
          points: 5,
          detail: '2 references: High=3, Medium=2, Low=1 each',
        }),
        expect.objectContaining({
          label: 'Outbound dependencies',
          points: 2,
          detail: '1 dependencies: High=2, Medium=1, Low=1 each',
        }),
        expect.objectContaining({
          label: 'Referenced by a Flow',
          points: 20,
          detail: 'Rule: flow-reference',
        }),
        expect.objectContaining({
          label: 'Connected to a core CRM object',
          points: 15,
          detail: 'Rule: core-crm-object',
        }),
      ]),
    );
    expect(explanation.thresholds).toEqual([
      'Low: 0-24',
      'Medium: 25-49',
      'High: 50-74',
      'Critical: 75-100',
    ]);
  });
});
