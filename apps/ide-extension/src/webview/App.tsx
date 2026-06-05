import type { DependencyResult } from '@orgtrace/core';

import { DependencyList } from './DependencyList';
import { ExportButton } from './ExportButton';
import { ReferenceTable } from './ReferenceTable';
import { RiskBadge } from './RiskBadge';

export interface AppProps {
  result?: DependencyResult;
}

export function App({ result }: AppProps): JSX.Element {
  return (
    <main className="shell">
      <header>
        <p className="eyebrow">OrgTrace</p>
        <h1>{result?.target.apiName ?? 'Impact analysis'}</h1>
        {result ? <RiskBadge risk={result.risk} /> : null}
      </header>
      {result ? (
        <>
          <DependencyList result={result} />
          <ReferenceTable references={result.references} />
          <ExportButton />
        </>
      ) : (
        <section className="panel">
          <p>Select a Salesforce metadata component to inspect local references and change risk.</p>
        </section>
      )}
    </main>
  );
}
