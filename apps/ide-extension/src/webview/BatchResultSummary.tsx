import type { DependencyResult } from '@orgtrace/core';

import { RiskBadge } from './RiskBadge';
import { buildResultSummaryRows } from './resultSummary';

interface BatchResultSummaryProps {
  results: DependencyResult[];
  onSelectResult?: (resultKey: string) => void;
}

export function BatchResultSummary({ results, onSelectResult }: BatchResultSummaryProps): JSX.Element | null {
  if (results.length <= 1) return null;

  const rows = buildResultSummaryRows(results);
  const zeroImpactCount = rows.filter(
    (row) => row.score === 0 && row.usedByCount === 0 && row.usesCount === 0,
  ).length;

  return (
    <section className="panel batch-summary">
      <header>
        <div>
          <h2>Batch summary</h2>
          <p>
            {results.length} analyzed, {zeroImpactCount} low-impact components collapsed
          </p>
        </div>
      </header>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Type</th>
            <th>Risk</th>
            <th>Used By</th>
            <th>Uses</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="summary-row"
              onClick={() => onSelectResult?.(row.key)}
            >
              <td>
                <button
                  aria-controls={row.panelId}
                  className="summary-component-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectResult?.(row.key);
                  }}
                  type="button"
                >
                  {row.apiName}
                </button>
              </td>
              <td>{row.type}</td>
              <td>
                <RiskBadge risk={{ level: row.level as DependencyResult['risk']['level'], score: row.score, reasons: [] }} />
              </td>
              <td>{row.usedByCount}</td>
              <td>{row.usesCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
