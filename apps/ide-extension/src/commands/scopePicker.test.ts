import { describe, expect, it } from 'vitest';
import { ALL_SCOPE, buildScopeOptions } from './scopePicker';

describe('buildScopeOptions', () => {
  it('leads with an All passthrough that applies no type filter', () => {
    const options = buildScopeOptions();

    expect(options[0]).toEqual(ALL_SCOPE);
    expect(options[0]?.type).toBeUndefined();
  });

  it('lists discoverable types in impact-analysis order', () => {
    const options = buildScopeOptions();

    expect(options.map((o) => o.label)).toEqual([
      'All',
      'Flow',
      'Apex Class',
      'Apex Trigger',
      'Field',
      'Object',
      'LWC',
      'Aura',
      'Permission Set',
      'Profile',
      'Validation Rule',
      'Workflow Rule',
      'Report',
      'Dashboard',
      'Custom Label',
      'Custom Metadata',
      'Email Template',
      'Lightning Page',
      'Named Credential',
      'Remote Site Setting',
    ]);
  });

  it('maps each scope label to its metadata type', () => {
    const byLabel = new Map(buildScopeOptions().map((o) => [o.label, o.type]));

    expect(byLabel.get('Flow')).toBe('Flow');
    expect(byLabel.get('Apex Class')).toBe('ApexClass');
    expect(byLabel.get('Apex Trigger')).toBe('ApexTrigger');
    expect(byLabel.get('Field')).toBe('CustomField');
    expect(byLabel.get('Object')).toBe('CustomObject');
    expect(byLabel.get('LWC')).toBe('LightningComponentBundle');
    expect(byLabel.get('Aura')).toBe('AuraDefinitionBundle');
    expect(byLabel.get('Permission Set')).toBe('PermissionSet');
    expect(byLabel.get('Profile')).toBe('Profile');
    expect(byLabel.get('Validation Rule')).toBe('ValidationRule');
    expect(byLabel.get('Workflow Rule')).toBe('WorkflowRule');
    expect(byLabel.get('Report')).toBe('Report');
    expect(byLabel.get('Dashboard')).toBe('Dashboard');
    expect(byLabel.get('Custom Label')).toBe('CustomLabel');
    expect(byLabel.get('Custom Metadata')).toBe('CustomMetadata');
    expect(byLabel.get('Email Template')).toBe('EmailTemplate');
    expect(byLabel.get('Lightning Page')).toBe('LightningPage');
    expect(byLabel.get('Named Credential')).toBe('NamedCredential');
    expect(byLabel.get('Remote Site Setting')).toBe('RemoteSiteSetting');
  });

  it('carries a codicon for every concrete type so scope rows match result rows', () => {
    const concrete = buildScopeOptions().filter((o) => o.type);

    expect(concrete.every((o) => Boolean(o.icon))).toBe(true);
  });
});
