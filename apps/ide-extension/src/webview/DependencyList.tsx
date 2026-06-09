import type { DependencyResult } from '@orgtrace/core';

export interface DependencyListProps {
  result: DependencyResult;
}

export function DependencyList({ result }: DependencyListProps): JSX.Element {
  return (
    <section className="panel stat-panel">
      <h2>Summary</h2>
      <div className="stat-grid">
        <div className="stat-card inbound">
          <strong>{result.references.length}</strong>
          <span>Used By</span>
        </div>
        <div className="stat-card outbound">
          <strong>{result.dependencies.length}</strong>
          <span>Uses</span>
        </div>
      </div>
    </section>
  );
}
