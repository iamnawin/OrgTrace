import { useState } from 'react';
import type { DependencyResult } from '@orgtrace/core';
import { displayFor } from '../commands/componentPicks';
import { openInEditorMessage } from './FilePathButton';
import { postWebviewMessage } from './webviewMessaging';
import { buildDiagramClusters, type DiagramCluster, type DiagramNode } from './relationshipDiagramModel';

function DiagramNodeView({ node }: { node: DiagramNode }): JSX.Element {
  const body = (
    <>
      <span className="node-name">{node.component.apiName}</span>
      <span className="node-meta">
        {node.relationships.join(', ')}
        {node.referenceCount > 1 ? ` · ×${node.referenceCount}` : ''}
      </span>
    </>
  );

  if (node.location) {
    const location = node.location;
    return (
      <button
        className="diagram-node"
        title={node.description}
        type="button"
        onClick={() =>
          postWebviewMessage(openInEditorMessage(location.filePath, location.lineNumber))
        }
      >
        {body}
      </button>
    );
  }

  return (
    <div className="diagram-node" title={node.description}>
      {body}
    </div>
  );
}

function DiagramClusters({ clusters }: { clusters: DiagramCluster[] }): JSX.Element {
  return (
    <>
      {clusters.map((cluster) => (
        <div key={cluster.type} className="diagram-cluster">
          <span className="cluster-label">
            {displayFor(cluster.type).label} ({cluster.nodes.length})
          </span>
          <div className="cluster-nodes">
            {cluster.nodes.map((node) => (
              <DiagramNodeView key={node.component.apiName} node={node} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function TreeNodeRow({ node }: { node: DiagramNode }): JSX.Element {
  const meta = `${node.relationships.join(', ')}${node.referenceCount > 1 ? ` · ×${node.referenceCount}` : ''}`;

  if (node.location) {
    const location = node.location;
    return (
      <button
        className="tree-node"
        title={node.description}
        type="button"
        onClick={() =>
          postWebviewMessage(openInEditorMessage(location.filePath, location.lineNumber))
        }
      >
        <strong>{node.component.apiName}</strong>
        <span className="node-meta">{meta}</span>
      </button>
    );
  }

  return (
    <span className="tree-node" title={node.description}>
      <strong>{node.component.apiName}</strong>
      <span className="node-meta">{meta}</span>
    </span>
  );
}

function TreeBranch({ label, clusters }: { label: string; clusters: DiagramCluster[] }): JSX.Element {
  return (
    <div className="tree-branch">
      <span className="level-label">{label}</span>
      <ul className="tree">
        {clusters.map((cluster) => (
          <li key={cluster.type}>
            <span className="cluster-label">
              {displayFor(cluster.type).label} ({cluster.nodes.length})
            </span>
            <ul className="tree">
              {cluster.nodes.map((node) => (
                <li key={node.component.apiName}>
                  <TreeNodeRow node={node} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RelationshipDiagram({ result }: { result: DependencyResult }): JSX.Element {
  const { target, references, dependencies } = result;
  const [view, setView] = useState<'stack' | 'tree'>('stack');

  const usedByClusters = buildDiagramClusters(references, 'inbound');
  const usesClusters = buildDiagramClusters(dependencies, 'outbound');
  const usedByCount = usedByClusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0);
  const usesCount = usesClusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0);

  const targetNode = (
    <div className="diagram-node target-node">
      <span className="node-type">{target.type}</span>
      <span className="node-name">{target.apiName}</span>
    </div>
  );

  return (
    <section className="panel relationship-diagram">
      <div className="diagram-header">
        <h3>Relationship Diagram</h3>
        <div className="view-toggle" role="group" aria-label="Diagram view">
          <button
            className={view === 'stack' ? 'active' : ''}
            type="button"
            onClick={() => setView('stack')}
          >
            Stack
          </button>
          <button
            className={view === 'tree' ? 'active' : ''}
            type="button"
            onClick={() => setView('tree')}
          >
            Tree
          </button>
        </div>
      </div>
      {view === 'tree' ? (
        <div className="diagram-container tree-view">
          {usedByClusters.length > 0 && (
            <TreeBranch
              clusters={usedByClusters}
              label={`Used by ${usedByCount} component${usedByCount === 1 ? '' : 's'}`}
            />
          )}
          {targetNode}
          {usesClusters.length > 0 && (
            <TreeBranch
              clusters={usesClusters}
              label={`Uses ${usesCount} component${usesCount === 1 ? '' : 's'}`}
            />
          )}
        </div>
      ) : (
      <div className="diagram-container">
        {usedByClusters.length > 0 && (
          <div className="diagram-level used-by-level">
            <span className="level-label">Used by {usedByCount} component{usedByCount === 1 ? '' : 's'}</span>
            <DiagramClusters clusters={usedByClusters} />
            <div className="connector-vertical"></div>
          </div>
        )}

        <div className="diagram-level target-level">{targetNode}</div>

        {usesClusters.length > 0 && (
          <div className="diagram-level uses-level">
            <div className="connector-vertical"></div>
            <span className="level-label">Uses {usesCount} component{usesCount === 1 ? '' : 's'}</span>
            <DiagramClusters clusters={usesClusters} />
          </div>
        )}
      </div>
      )}

      <style>{`
        .diagram-header {
          align-items: center;
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }
        .view-toggle {
          background: rgba(128, 128, 128, 0.12);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 999px;
          display: inline-flex;
          padding: 2px;
        }
        .view-toggle button {
          appearance: none;
          background: transparent;
          border: none;
          border-radius: 999px;
          color: inherit;
          cursor: pointer;
          font: inherit;
          font-size: 0.8em;
          opacity: 0.75;
          padding: 3px 12px;
        }
        .view-toggle button.active {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          opacity: 1;
        }
        .tree-view {
          align-items: stretch;
        }
        .tree-view .target-node {
          align-self: center;
        }
        .tree-branch {
          width: 100%;
        }
        .tree {
          list-style: none;
          margin: 4px 0 0;
          padding-left: 16px;
        }
        .tree li {
          padding: 2px 0 2px 14px;
          position: relative;
        }
        .tree li::before {
          border-left: 1px solid var(--vscode-panel-border);
          bottom: 0;
          content: '';
          left: 0;
          position: absolute;
          top: 0;
        }
        .tree li:last-child::before {
          height: 14px;
        }
        .tree li::after {
          border-top: 1px solid var(--vscode-panel-border);
          content: '';
          left: 0;
          position: absolute;
          top: 14px;
          width: 10px;
        }
        .tree-node {
          appearance: none;
          background: transparent;
          border: none;
          color: inherit;
          display: inline-flex;
          font: inherit;
          font-size: 0.9em;
          gap: 8px;
          padding: 0;
          text-align: left;
        }
        button.tree-node {
          cursor: pointer;
        }
        button.tree-node:hover strong {
          text-decoration: underline;
        }
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
          flex-direction: column;
          align-items: center;
          gap: 10px;
          position: relative;
          width: 100%;
        }
        .level-label {
          font-size: 0.8em;
          font-weight: 600;
          opacity: 0.75;
          text-transform: uppercase;
        }
        .diagram-cluster {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
        }
        .cluster-label {
          font-size: 0.75em;
          opacity: 0.7;
        }
        .cluster-nodes {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          max-height: 220px;
          overflow: auto;
          width: 100%;
        }
        .diagram-node {
          padding: 8px 12px;
          background: var(--vscode-sideBar-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          font: inherit;
          min-width: 120px;
          font-size: 0.9em;
          text-align: center;
        }
        button.diagram-node {
          cursor: pointer;
        }
        button.diagram-node:hover {
          border-color: var(--vscode-button-background);
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
        .node-meta {
          font-size: 0.75em;
          opacity: 0.7;
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
