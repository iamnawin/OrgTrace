import type { RiskScore } from '@orgtrace/core';

export interface RiskBadgeProps {
  risk: RiskScore;
}

export function RiskBadge({ risk }: RiskBadgeProps): JSX.Element {
  return (
    <span className="risk-badge" data-level={risk.level}>
      {risk.level} {risk.score}
    </span>
  );
}
