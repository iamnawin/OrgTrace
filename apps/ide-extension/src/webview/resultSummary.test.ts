import { describe, expect, it } from 'vitest';
import type { DependencyReference, DependencyResult } from '@orgtrace/core';

import { buildResultSummaryRows, resultPanelId, shouldCollapseResult } from './resultSummary';

function result(
  apiName: string,
  score: number,
  references: DependencyReference[] = [],
  dependencies: DependencyReference[] = [],
): DependencyResult {
  return {
    target: {
      apiName,
      type: 'LightningComponentBundle',
    },
    references,
    dependencies,
    risk: {
      level: score >= 25 ? 'Medium' : 'Low',
      score,
      reasons: [],
    },
    scannedAt: '2026-06-11T00:00:00.000Z',
    sources: ['LocalScan'],
  };
}

function reference(apiName: string): DependencyReference {
  return {
    source: {
      apiName,
      type: 'Flow',
    },
    target: {
      apiName: 'target',
      type: 'LightningComponentBundle',
    },
    relationshipType: 'References',
    confidence: 'High',
    dataSource: 'LocalScan',
  };
}

describe('result summary helpers', () => {
  it('sorts summary rows by risk score before name', () => {
    expect(buildResultSummaryRows([
      result('lowComponent', 0),
      result('mediumComponent', 30, [reference('FlowA')]),
      result('anotherLow', 0),
    ])).toEqual([
      expect.objectContaining({
        apiName: 'mediumComponent',
        panelId: 'result-LightningComponentBundle-mediumComponent',
        score: 30,
        usedByCount: 1,
      }),
      expect.objectContaining({ apiName: 'anotherLow', panelId: 'result-LightningComponentBundle-anotherLow', score: 0 }),
      expect.objectContaining({ apiName: 'lowComponent', panelId: 'result-LightningComponentBundle-lowComponent', score: 0 }),
    ]);
  });

  it('creates stable result panel ids from keys and results', () => {
    expect(resultPanelId('LightningComponentBundle:accountHierarchyAction')).toBe(
      'result-LightningComponentBundle-accountHierarchyAction',
    );
    expect(resultPanelId(result('accountHierarchyAction', 0))).toBe(
      'result-LightningComponentBundle-accountHierarchyAction',
    );
  });

  it('collapses only zero-impact low-risk results', () => {
    expect(shouldCollapseResult(result('emptyLow', 0))).toBe(true);
    expect(shouldCollapseResult(result('referencedLow', 0, [reference('FlowA')]))).toBe(false);
    expect(shouldCollapseResult(result('medium', 30))).toBe(false);
  });
});
