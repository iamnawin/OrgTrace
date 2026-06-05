import type { DependencyResult } from '@orgtrace/core';

export interface DependencyListProps {
  result: DependencyResult;
}

export function DependencyList({ result }: DependencyListProps): JSX.Element {
  return (
    <section className="panel">
      <h2>Dependencies</h2>
      <p>{result.dependencies.length} outbound dependencies</p>
      <p>{result.references.length} inbound references</p>
    </section>
  );
}
