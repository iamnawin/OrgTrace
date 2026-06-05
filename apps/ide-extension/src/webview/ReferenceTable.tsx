import type { DependencyReference } from '@orgtrace/core';

export interface ReferenceTableProps {
  references: DependencyReference[];
}

export function ReferenceTable({ references }: ReferenceTableProps): JSX.Element {
  return (
    <section className="panel">
      <h2>References</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Type</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {references.map((reference) => (
            <tr key={`${reference.source.type}:${reference.source.apiName}:${reference.relationshipType}`}>
              <td>{reference.source.apiName}</td>
              <td>{reference.source.type}</td>
              <td>{reference.confidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
