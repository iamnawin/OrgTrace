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

export function calculateRisk(
  result: Omit<DependencyResult, 'risk'>,
  rules: RiskRule[] = defaultRiskRules,
): RiskScore {
  const references = result.references ?? [];
  const dependencies = result.dependencies ?? [];

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Inbound references weighted higher — they represent components that may break
  for (const ref of references) {
    score += confidenceWeight(ref);
  }

  // Outbound dependencies at half weight
  for (const dep of dependencies) {
    score += Math.ceil(confidenceWeight(dep) / 2);
  }

  const input: RiskRuleInput = {
    target: result.target,
    references,
    dependencies,
  };

  for (const rule of rules) {
    if (rule.match(input)) {
      score += rule.scoreIncrease;
      reasons.push(rule.reason);
      if (rule.recommendation) {
        recommendations.push(rule.recommendation);
      }
    }
  }

  score = Math.min(score, 100);

  const level: RiskLevel =
    score >= 75
      ? 'Critical'
      : score >= 50
        ? 'High'
        : score >= 25
          ? 'Medium'
          : 'Low';

  return {
    level,
    score,
    reasons:
      reasons.length > 0
        ? [...new Set(reasons)]
        : ['Limited dependency impact detected based on available scan results.'],
    recommendations: [...new Set(recommendations)],
  };
}
