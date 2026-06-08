import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { discoverComponents } from './discoverComponents';

let projectPath: string;

async function writeFile(relPath: string, content = ''): Promise<void> {
  const abs = path.join(projectPath, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf8');
}

beforeAll(async () => {
  projectPath = await fs.mkdtemp(path.join(os.tmpdir(), 'orgtrace-discover-'));
  const base = 'force-app/main/default';

  await writeFile(`${base}/classes/AccountAlertController.cls`);
  await writeFile(`${base}/flows/Account_Alert_Message.flow-meta.xml`);
  await writeFile(`${base}/objects/Account/Account.object-meta.xml`);
  await writeFile(
    `${base}/objects/Case/fields/Account_Alert_Message__c.field-meta.xml`,
  );
  await writeFile(`${base}/lwc/accountAlertPanel/accountAlertPanel.js`);
  await writeFile(`${base}/lwc/accountAlertPanel/accountAlertPanel.js-meta.xml`);
  await writeFile(
    `${base}/permissionsets/Account_Alert_Access.permissionset-meta.xml`,
  );
  await writeFile(
    `${base}/objects/Case/validationRules/Account_Alert_Required.validationRule-meta.xml`,
  );
  await writeFile(
    `${base}/reports/Sales/Account_Alert_Report.report-meta.xml`,
    '<?xml version="1.0"?><Report><name>Account Alert Report</name></Report>',
  );
  await writeFile(
    `${base}/dashboards/Sales/Account_Alert_Dashboard.dashboard-meta.xml`,
    '<?xml version="1.0"?><Dashboard><title>Account Alert Dashboard</title></Dashboard>',
  );
  // Noise that should never match an "account alert" query.
  await writeFile(`${base}/classes/ContactService.cls`);
});

afterAll(async () => {
  await fs.rm(projectPath, { recursive: true, force: true });
});

describe('discoverComponents', () => {
  it('matches across metadata types ignoring spaces, underscores, and casing', async () => {
    const results = await discoverComponents(projectPath, 'account alert');
    const byKey = new Map(results.map((r) => [`${r.type}:${r.apiName}`, r]));

    expect(byKey.has('Flow:Account_Alert_Message')).toBe(true);
    expect(byKey.has('ApexClass:AccountAlertController')).toBe(true);
    expect(byKey.has('LightningComponentBundle:accountAlertPanel')).toBe(true);
    expect(byKey.has('PermissionSet:Account_Alert_Access')).toBe(true);
    expect(byKey.has('Report:Account_Alert_Report')).toBe(true);
    expect(byKey.has('Dashboard:Account_Alert_Dashboard')).toBe(true);
    expect(byKey.has('ApexClass:ContactService')).toBe(false);
  });

  it('qualifies the field apiName and label with the owning object', async () => {
    const results = await discoverComponents(projectPath, 'account alert');
    const field = results.find((r) => r.type === 'CustomField');

    expect(field?.apiName).toBe('Case.Account_Alert_Message__c');
    expect(field?.label).toBe('Case.Account_Alert_Message__c');
  });

  it('qualifies validation rules with their owning object', async () => {
    const results = await discoverComponents(projectPath, 'account alert');
    const rule = results.find((r) => r.type === 'ValidationRule');

    expect(rule?.apiName).toBe('Account_Alert_Required');
    expect(rule?.label).toBe('Case.Account_Alert_Required');
  });

  it('excludes the object when the query does not match its name', async () => {
    const narrow = await discoverComponents(projectPath, 'account alert');
    expect(narrow.some((r) => r.type === 'CustomObject')).toBe(false);

    const broad = await discoverComponents(projectPath, 'account');
    expect(broad.some((r) => r.type === 'CustomObject' && r.apiName === 'Account')).toBe(true);
  });

  it('returns every candidate for an empty query', async () => {
    const results = await discoverComponents(projectPath, '');
    expect(results.length).toBeGreaterThanOrEqual(8);
  });

  it('restricts results to the requested metadata type when a filter is given', async () => {
    const flows = await discoverComponents(projectPath, 'account', 'Flow');

    expect(flows.length).toBeGreaterThan(0);
    expect(flows.every((r) => r.type === 'Flow')).toBe(true);
  });

  it('restricts generic metadata results to the requested metadata type', async () => {
    const reports = await discoverComponents(projectPath, 'account alert', 'Report');

    expect(reports).toEqual([
      expect.objectContaining({
        type: 'Report',
        apiName: 'Account_Alert_Report',
      }),
    ]);
  });

  it('ignores other types entirely under a filter, even for a broad query', async () => {
    const fields = await discoverComponents(projectPath, '', 'CustomField');

    expect(fields.every((r) => r.type === 'CustomField')).toBe(true);
    expect(fields.some((r) => r.apiName === 'Case.Account_Alert_Message__c')).toBe(true);
  });
});
