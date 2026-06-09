import type { ComponentRef } from '@orgtrace/core';

export function ComponentDetails({ target }: { target: ComponentRef }): JSX.Element {
  const details = [
    { label: 'API Name', value: target.apiName },
    { label: 'Metadata Type', value: target.type },
    { label: 'Label', value: target.label || 'N/A' },
    { label: 'Description', value: target.description || 'N/A' },
    { label: 'File Path', value: target.filePath || 'N/A' },
    { label: 'Status', value: target.status || 'N/A' },
    { label: 'Namespace', value: target.namespace || 'N/A' },
    { label: 'Source', value: 'Local Scan' },
    { label: 'Last Modified By', value: target.lastModifiedBy || 'Available after org connection' },
    { label: 'Last Modified Date', value: target.lastModifiedDate || 'N/A' },
    { label: 'Created By', value: target.createdBy || 'Available after org connection' },
    { label: 'Created Date', value: target.createdDate || 'N/A' },
  ];

  return (
    <section className="panel component-details">
      <h3>Component Details</h3>
      <div className="details-grid">
        {details.map(({ label, value }) => (
          <div key={label} className="detail-item">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value}</span>
          </div>
        ))}
      </div>
      <style>{`
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
          margin-top: 8px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 0.85em;
          opacity: 0.7;
          text-transform: uppercase;
        }
        .detail-value {
          font-weight: 500;
          word-break: break-all;
        }
      `}</style>
    </section>
  );
}
