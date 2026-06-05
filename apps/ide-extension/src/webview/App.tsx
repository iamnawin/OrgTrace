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
          <section className="panel">
            <h2>Risk reasons</h2>
            <ul>
              {result.risk.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
          <DependencyList result={result} />
          <ReferenceTable references={result.references} />
          {(result.warnings?.length || result.errors?.length) ? (
            <section className="panel">
              <h2>Warnings and errors</h2>
              {result.warnings?.map((warning) => (
                <p key={warning} className="warning">{warning}</p>
              ))}
              {result.errors?.map((error) => (
                <p key={error} className="error">{error}</p>
              ))}
            </section>
          ) : null}
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
