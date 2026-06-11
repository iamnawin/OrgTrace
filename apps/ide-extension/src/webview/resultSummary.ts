import type { DependencyResult } from '@orgtrace/core';

export interface ResultSummaryRow {
  key: string;
  panelId: string;
  apiName: string;
  type: string;
  score: number;
  level: string;
  usedByCount: number;
  usesCount: number;
}

export function resultKey(result: DependencyResult): string {
  return `${result.target.type}:${result.target.apiName}`;
}

export function resultPanelId(resultOrKey: DependencyResult | string): string {
  const key = typeof resultOrKey === 'string' ? resultOrKey : resultKey(resultOrKey);
  return `result-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

export function buildResultSummaryRows(results: DependencyResult[]): ResultSummaryRow[] {
  return [...results]
    .sort((a, b) => {
      if (a.risk.score !== b.risk.score) return b.risk.score - a.risk.score;
      return a.target.apiName.localeCompare(b.target.apiName);
    })
    .map((result) => ({
      key: resultKey(result),
      panelId: resultPanelId(result),
      apiName: result.target.apiName,
      type: result.target.type,
      score: result.risk.score,
      level: result.risk.level,
      usedByCount: result.references.length,
      usesCount: result.dependencies.length,
    }));
}

export function shouldCollapseResult(result: DependencyResult): boolean {
  return (
    result.risk.level === 'Low' &&
    result.risk.score === 0 &&
    result.references.length === 0 &&
    result.dependencies.length === 0
  );
}
