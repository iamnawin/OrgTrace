import type {
  ComponentRef,
  DependencyReference,
  DependencyResult,
  RiskLevel,
  RiskScore,
} from './types';

export interface RiskRuleInput {
  target: ComponentRef;
  references: DependencyReference[];
  dependencies: DependencyReference[];
}

export interface RiskRule {
  id: string;
  match: (input: RiskRuleInput) => boolean;
  scoreIncrease: number;
  reason: string;
  recommendation?: string;
}

export interface RiskScoreContribution {
  label: string;
  points: number;
  detail: string;
}

export interface RiskCalculationExplanation {
  finalScore: number;
  rawScore: number;
  level: RiskLevel;
  relationshipPoints: number;
  rulePoints: number;
  capped: boolean;
  contributions: RiskScoreContribution[];
  reasons: string[];
  recommendations: string[];
  thresholds: string[];
}

function confidenceWeight(ref: DependencyReference): number {
  switch (ref.confidence) {
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    case 'Low':
      return 1;
  }
}

function dependencyWeight(ref: DependencyReference): number {
  return Math.ceil(confidenceWeight(ref) / 2);
}

function riskLevelFor(score: number): RiskLevel {
  return score >= 75
    ? 'Critical'
    : score >= 50
      ? 'High'
      : score >= 25
        ? 'Medium'
        : 'Low';
}

function isCoreCrmApiName(apiName: string): boolean {
  const normalized = apiName.toLowerCase();
  return ['case', 'account', 'contact', 'opportunity', 'order'].some(
    (obj) =>
      normalized === obj ||
      normalized.startsWith(`${obj}.`) ||
      normalized.includes(`${obj}__`),
  );
}

export const defaultRiskRules: RiskRule[] = [
  {
    id: 'many-inbound-references',
    match: ({ references }) => references.length >= 10,
    scoreIncrease: 35,
    reason: 'Referenced by 10 or more components',
    recommendation: 'Review all inbound references before changing this component.',
  },
  {
    id: 'trigger-reference',
    match: ({ references }) =>
      references.some((r) => r.source.type === 'ApexTrigger'),
    scoreIncrease: 30,
    reason: 'Used inside an Apex Trigger',
    recommendation:
      'Regression test trigger execution paths and related object automation.',
  },
  {
    id: 'flow-reference',
    match: ({ references }) => references.some((r) => r.source.type === 'Flow'),
    scoreIncrease: 20,
    reason: 'Referenced by a Flow',
    recommendation: 'Regression test the affected Flow before deployment.',
  },
  {
    id: 'high-confidence-volume',
    match: ({ references }) =>
      references.filter((r) => r.confidence !== 'Low').length >= 6,
    scoreIncrease: 20,
    reason: '6 or more medium/high-confidence references found',
    recommendation:
      'Validate the main usage paths and impacted metadata before release.',
  },
  {
    id: 'core-crm-object',
    match: ({ target, references, dependencies }) =>
      isCoreCrmApiName(target.apiName) ||
      references.some((r) => isCoreCrmApiName(r.source.apiName)) ||
      dependencies.some((r) => isCoreCrmApiName(r.target.apiName)),
    scoreIncrease: 15,
    reason: 'Connected to a core CRM object',
    recommendation:
      'Check business-critical record flows, permissions, and automations.',
  },
  {
    id: 'flow-invokes-component',
    match: ({ references }) =>
      references.some(
        (r) => r.relationshipType === 'Invokes' && r.source.type === 'Flow',
      ),
    scoreIncrease: 10,
    reason: 'Invoked by an automated Flow',
    recommendation: 'Confirm Flow inputs, outputs, and fault paths still work.',
  },
  {
    id: 'permission-impact',
    match: ({ references }) =>
      references.some(
        (r) =>
          r.source.type === 'PermissionSet' ||
          r.source.type === 'Profile' ||
          r.relationshipType === 'UsesPermission' ||
          r.relationshipType === 'Configures',
      ),
    scoreIncrease: 10,
    reason: 'Referenced by access or configuration metadata',
    recommendation: 'Review permissions and access impact.',
  },
  {
    id: 'field-write-impact',
    match: ({ references }) =>
      references.some((r) => r.relationshipType === 'WritesField'),
    scoreIncrease: 15,
    reason: 'At least one component writes to this field',
    recommendation: 'Review data update behavior and downstream automation.',
  },
];

export function explainRiskCalculation(
  result: Omit<DependencyResult, 'risk'>,
  rules: RiskRule[] = defaultRiskRules,
): RiskCalculationExplanation {
  const references = result.references ?? [];
  const dependencies = result.dependencies ?? [];
  const contributions: RiskScoreContribution[] = [];
  const reasons: string[] = [];
  const recommendations: string[] = [];
  const inboundPoints = references.reduce(
    (total, ref) => total + confidenceWeight(ref),
    0,
  );
  const outboundPoints = dependencies.reduce(
    (total, dep) => total + dependencyWeight(dep),
    0,
  );
  let rulePoints = 0;

  if (references.length > 0) {
    contributions.push({
      label: 'Inbound references',
      points: inboundPoints,
      detail: `${references.length} references: High=3, Medium=2, Low=1 each`,
    });
  }

  if (dependencies.length > 0) {
    contributions.push({
      label: 'Outbound dependencies',
      points: outboundPoints,
      detail: `${dependencies.length} dependencies: High=2, Medium=1, Low=1 each`,
    });
  }

  const input: RiskRuleInput = {
    target: result.target,
    references,
    dependencies,
  };

  for (const rule of rules) {
    if (rule.match(input)) {
      rulePoints += rule.scoreIncrease;
      reasons.push(rule.reason);
      contributions.push({
        label: rule.reason,
        points: rule.scoreIncrease,
        detail: `Rule: ${rule.id}`,
      });
      if (rule.recommendation) {
        recommendations.push(rule.recommendation);
      }
    }
  }

  const rawScore = inboundPoints + outboundPoints + rulePoints;
  const finalScore = Math.min(rawScore, 100);

  return {
    finalScore,
    rawScore,
    level: riskLevelFor(finalScore),
    relationshipPoints: inboundPoints + outboundPoints,
    rulePoints,
    capped: rawScore > finalScore,
    contributions,
    reasons:
      reasons.length > 0
        ? [...new Set(reasons)]
        : ['Limited dependency impact detected based on available scan results.'],
    recommendations: [...new Set(recommendations)],
    thresholds: [
      'Low: 0-24',
      'Medium: 25-49',
      'High: 50-74',
      'Critical: 75-100',
    ],
  };
}

export function calculateRisk(
  result: Omit<DependencyResult, 'risk'>,
  rules: RiskRule[] = defaultRiskRules,
): RiskScore {
  const explanation = explainRiskCalculation(result, rules);

  return {
    level: explanation.level,
    score: explanation.finalScore,
    reasons: explanation.reasons,
    recommendations: explanation.recommendations,
  };
}
