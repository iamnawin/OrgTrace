import type { DependencyReference } from '@orgtrace/core';
import { groupReferencesBySourceType } from './referenceGroups';

export interface ReferenceTableProps {
  references: DependencyReference[];
}

export function ReferenceTable({ references }: ReferenceTableProps): JSX.Element {
  const groups = groupReferencesBySourceType(references);

  return (
    <section className="panel">
      <h2>References</h2>
      {groups.length === 0 ? <p>No inbound references found.</p> : null}
      {groups.map((group) => (
        <div key={group.sourceType}>
          <h3>{group.sourceType}</h3>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Relationship</th>
                <th>Location</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {group.references.map((reference) => {
                const filePath = reference.location?.filePath ?? reference.source.filePath ?? '';
                const lineNumber = reference.location?.lineNumber;
                const location = lineNumber ? `${filePath}:${lineNumber}` : filePath;

                return (
                  <tr key={`${reference.source.type}:${reference.source.apiName}:${reference.relationshipType}:${location}`}>
                    <td>{reference.source.apiName}</td>
                    <td>{reference.relationshipType}</td>
                    <td>{location || 'Unknown'}</td>
                    <td>{reference.confidence}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
