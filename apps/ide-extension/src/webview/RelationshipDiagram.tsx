import type { DependencyResult } from '@orgtrace/core';

export function RelationshipDiagram({ result }: { result: DependencyResult }): JSX.Element {
  const { target, references, dependencies } = result;

  // Limit to 5 for the diagram to keep it clean
  const usedBy = references.slice(0, 5);
  const uses = dependencies.slice(0, 5);

  return (
    <section className="panel relationship-diagram">
      <h3>Relationship Diagram</h3>
      <div className="diagram-container">
        {usedBy.length > 0 && (
          <div className="diagram-level used-by-level">
            {usedBy.map((ref, i) => (
              <div key={i} className="diagram-node">
                <span className="node-type">{ref.source.type}</span>
                <span className="node-name">{ref.source.apiName}</span>
              </div>
            ))}
            <div className="connector-vertical"></div>
          </div>
        )}

        <div className="diagram-level target-level">
          <div className="diagram-node target-node">
            <span className="node-type">{target.type}</span>
            <span className="node-name">{target.apiName}</span>
          </div>
        </div>

        {uses.length > 0 && (
          <div className="diagram-level uses-level">
            <div className="connector-vertical"></div>
            {uses.map((dep, i) => (
              <div key={i} className="diagram-node">
                <span className="node-type">{dep.target.type}</span>
                <span className="node-name">{dep.target.apiName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .diagram-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 20px;
          background: rgba(128, 128, 128, 0.05);
          border-radius: 8px;
        }
        .diagram-level {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          position: relative;
          width: 100%;
        }
        .diagram-node {
          padding: 8px 12px;
          background: var(--vscode-sideBar-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
          font-size: 0.9em;
        }
        .target-node {
          border: 2px solid var(--vscode-button-background);
          background: var(--vscode-button-secondaryBackground);
        }
        .node-type {
          font-size: 0.75em;
          opacity: 0.7;
          text-transform: uppercase;
        }
        .node-name {
          font-weight: 600;
        }
        .connector-vertical {
          width: 2px;
          height: 16px;
          background: var(--vscode-panel-border);
          position: absolute;
        }
        .used-by-level .connector-vertical {
          bottom: -16px;
          left: 50%;
        }
        .uses-level .connector-vertical {
          top: -16px;
          left: 50%;
        }
      `}</style>
    </section>
  );
}
