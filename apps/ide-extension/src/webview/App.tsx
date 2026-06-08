import type { ComponentRef, DependencyResult } from '@orgtrace/core';

import { DependencyList } from './DependencyList';
import { ExportButton } from './ExportButton';
import { MetadataSelector } from './MetadataSelector';
import { ReferenceTable } from './ReferenceTable';
import { RiskBadge } from './RiskBadge';

export interface AppProps {
  result?: DependencyResult;
  results?: DependencyResult[];
  components?: ComponentRef[];
}

function ResultPanel({ result }: { result: DependencyResult }): JSX.Element {
  return (
    <article className="result-panel">
      <header>
        <p className="eyebrow">{result.target.type}</p>
        <h2>{result.target.apiName}</h2>
        <RiskBadge risk={result.risk} />
      </header>
      <section className="panel">
        <h3>Risk reasons</h3>
        <ul>
          {result.risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>
      <DependencyList result={result} />
      <ReferenceTable references={result.references} />
      <ReferenceTable
        references={result.dependencies}
        emptyMessage="No outbound dependencies found."
        sourceHeading="Dependency"
        title="Outbound dependencies"
      />
      {(result.warnings?.length || result.errors?.length) ? (
        <section className="panel">
          <h3>Warnings and errors</h3>
          {result.warnings?.map((warning) => (
            <p key={warning} className="warning">{warning}</p>
          ))}
          {result.errors?.map((error) => (
            <p key={error} className="error">{error}</p>
          ))}
        </section>
      ) : null}
    </article>
  );
}

export function App({ result, results, components = [] }: AppProps): JSX.Element {
  const allResults = results ?? (result ? [result] : []);
  const firstResult = allResults[0];

  if (components.length > 0 && allResults.length === 0) {
    return (
      <main className="shell">
        <MetadataSelector components={components} />
      </main>
    );
  }

  return (
    <main className="shell">
      <header>
        <p className="eyebrow">OrgTrace</p>
        <h1>
          {allResults.length > 1
            ? `${allResults.length} component impact analyses`
            : firstResult?.target.apiName ?? 'Impact analysis'}
        </h1>
        {allResults.length === 1 && firstResult ? <RiskBadge risk={firstResult.risk} /> : null}
      </header>
      {allResults.length ? (
        <>
          {allResults.map((item) => (
            <ResultPanel key={`${item.target.type}:${item.target.apiName}`} result={item} />
          ))}
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
