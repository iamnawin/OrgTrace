import { useEffect, useMemo, useState } from 'react';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';

import { DependencyList } from './DependencyList';
import { ExportButton } from './ExportButton';
import { MetadataSelector } from './MetadataSelector';
import { ReferenceTable } from './ReferenceTable';
import { RiskBadge } from './RiskBadge';
import { ComponentDetails } from './ComponentDetails';
import { RelationshipDiagram } from './RelationshipDiagram';
import { RiskExplanation } from './RiskExplanation';
import { BatchResultSummary } from './BatchResultSummary';
import { resultPanelId, shouldCollapseResult } from './resultSummary';

export interface AppProps {
  result?: DependencyResult;
  results?: DependencyResult[];
  components?: ComponentRef[];
}

function ResultPanel({
  result,
  panelId,
  collapsible = false,
  defaultCollapsed = false,
}: {
  result: DependencyResult;
  panelId: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}): JSX.Element {
  const header = (
      <header>
        <p className="eyebrow">{result.target.type}</p>
        <h2>{result.target.apiName}</h2>
        <RiskBadge risk={result.risk} />
      </header>
  );
  const body = (
    <>
      <ComponentDetails target={result.target} />

      <section className="panel">
        <h3>Risk summary</h3>
        <ul>
          {result.risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <RiskExplanation result={result} />

      <RelationshipDiagram result={result} />

      <DependencyList result={result} />
      
      <ReferenceTable 
        references={result.references} 
        title="Used By (Inbound)"
        emptyMessage="No components found that use this component."
      />
      
      <ReferenceTable
        references={result.dependencies}
        emptyMessage="No components found that this component uses."
        sourceHeading="Component"
        title="Uses (Outbound)"
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
    </>
  );

  if (collapsible) {
    return (
      <details className="result-panel result-disclosure" id={panelId} open={!defaultCollapsed}>
        <summary>{header}</summary>
        {body}
      </details>
    );
  }

  return (
    <article className="result-panel" id={panelId}>
      {header}
      {body}
    </article>
  );
}

export function App({ result, results, components = [] }: AppProps): JSX.Element {
  const allResults = useMemo(
    () => results ?? (result ? [result] : []),
    [result, results],
  );
  const firstResult = allResults[0];
  const [showSelector, setShowSelector] = useState(allResults.length === 0);

  // Track array identity, not just length: re-analyzing the same component
  // replaces the result in place, and the view must still switch back.
  useEffect(() => {
    setShowSelector(allResults.length === 0);
  }, [allResults]);

  function revealResultPanel(resultKey: string): void {
    const panel = document.getElementById(resultPanelId(resultKey));
    if (!panel) return;

    if (panel instanceof HTMLDetailsElement) {
      panel.open = true;
    }

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (components.length > 0 && showSelector) {
    return (
      <main className="shell">
        <MetadataSelector components={components} />
      </main>
    );
  }

  return (
    <main className="shell">
      <header>
        <div>
          <p className="eyebrow">OrgTrace</p>
          <h1>
            {allResults.length > 1
              ? `${allResults.length} component impact analyses`
              : firstResult?.target.apiName ?? 'Impact analysis'}
          </h1>
        </div>
        <div className="header-actions">
          {allResults.length === 1 && firstResult ? <RiskBadge risk={firstResult.risk} /> : null}
          {components.length > 0 ? (
            <button type="button" onClick={() => setShowSelector(true)}>
              New analysis
            </button>
          ) : null}
        </div>
      </header>
      {allResults.length ? (
        <>
          <BatchResultSummary onSelectResult={revealResultPanel} results={allResults} />
          {allResults.map((item) => (
            <ResultPanel
              key={`${item.target.type}:${item.target.apiName}`}
              collapsible={allResults.length > 1}
              defaultCollapsed={shouldCollapseResult(item)}
              panelId={resultPanelId(item)}
              result={item}
            />
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
