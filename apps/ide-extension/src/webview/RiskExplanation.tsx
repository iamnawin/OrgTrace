import type { DependencyResult } from '@orgtrace/core';
import { explainRiskCalculation } from '@orgtrace/core';

interface RiskExplanationProps {
  result: DependencyResult;
}

export function RiskExplanation({ result }: RiskExplanationProps): JSX.Element {
  const explanation = explainRiskCalculation(result);

  return (
    <section className="panel risk-explanation">
      <header>
        <div>
          <h3>Score breakdown</h3>
          <p>
            {explanation.finalScore}/100 {explanation.level}
            {explanation.capped ? `, capped from ${explanation.rawScore}` : ''}
          </p>
        </div>
        <div className="risk-total" data-level={explanation.level}>
          {explanation.finalScore}
        </div>
      </header>

      <div className="risk-score-grid">
        <div>
          <strong>{explanation.relationshipPoints}</strong>
          <span>Relationship points</span>
        </div>
        <div>
          <strong>{explanation.rulePoints}</strong>
          <span>Rule points</span>
        </div>
      </div>

      <div className="risk-contributions">
        {explanation.contributions.length > 0 ? (
          explanation.contributions.map((item) => (
            <div className="risk-contribution" key={`${item.label}:${item.detail}`}>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
              <b>+{item.points}</b>
            </div>
          ))
        ) : (
          <p>No scored relationships or rules were found in the local scan.</p>
        )}
      </div>

      <div className="risk-thresholds" aria-label="Risk score thresholds">
        {explanation.thresholds.map((threshold) => (
          <span key={threshold}>{threshold}</span>
        ))}
      </div>

      {explanation.recommendations.length > 0 ? (
        <div className="risk-recommendations">
          <h3>Recommended checks</h3>
          <ul>
            {explanation.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
