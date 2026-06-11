import type { DependencyReference } from '@orgtrace/core';
import { FilePathButton } from './FilePathButton';
import { groupReferencesBySourceType } from './referenceGroups';

export interface ReferenceTableProps {
  references: DependencyReference[];
  emptyMessage?: string;
  sourceHeading?: string;
  title?: string;
}

export function ReferenceTable({
  references,
  emptyMessage = 'No inbound references found.',
  sourceHeading = 'Source',
  title = 'Inbound references',
}: ReferenceTableProps): JSX.Element {
  const groups = groupReferencesBySourceType(references);

  return (
    <section className="panel">
      <h2>{title}</h2>
      {groups.length === 0 ? <p>{emptyMessage}</p> : null}
      {groups.map((group) => (
        <div key={group.sourceType}>
          <h3>{group.sourceType}</h3>
          <table>
            <thead>
              <tr>
                <th>{sourceHeading}</th>
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
                    <td>
                      {filePath ? (
                        <FilePathButton
                          filePath={filePath}
                          label={location}
                          lineNumber={lineNumber}
                        />
                      ) : (
                        'Unknown'
                      )}
                    </td>
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
