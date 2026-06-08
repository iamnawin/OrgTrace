import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { scan } from './Scanner';

let projectPath: string;

async function writeFile(relPath: string, content: string): Promise<void> {
  const abs = path.join(projectPath, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, 'utf8');
}

beforeAll(async () => {
  projectPath = await fs.mkdtemp(path.join(os.tmpdir(), 'orgtrace-fieldmatch-'));
  const base = 'force-app/main/default';

  // The field definition itself.
  await writeFile(
    `${base}/objects/Case/fields/Account_Alert_Message__c.field-meta.xml`,
    '<?xml version="1.0"?><CustomField><fullName>Account_Alert_Message__c</fullName></CustomField>',
  );
  // Flow references the field by its BARE name (no object qualifier).
  await writeFile(
    `${base}/flows/Show_Alert.flow-meta.xml`,
    '<?xml version="1.0"?><Flow><recordLookups><field>Account_Alert_Message__c</field></recordLookups></Flow>',
  );
  // Apex references the field on a lowercase SObject variable (bare field).
  await writeFile(
    `${base}/classes/AlertService.cls`,
    'public class AlertService {\n  void run(Case c) {\n    String x = c.Account_Alert_Message__c;\n  }\n}\n',
  );
  await writeFile(
    `${base}/reports/Sales/Alert_Report.report-meta.xml`,
    '<?xml version="1.0"?><Report><columns>Account_Alert_Message__c</columns></Report>',
  );
  await writeFile(
    `${base}/namedCredentials/Alert_Service.namedCredential-meta.xml`,
    '<?xml version="1.0"?><NamedCredential><customHeaders><value>Account_Alert_Message__c</value></customHeaders></NamedCredential>',
  );
});

afterAll(async () => {
  await fs.rm(projectPath, { recursive: true, force: true });
});

describe('scan field matching', () => {
  it('finds bare field references when the target apiName is object-qualified', async () => {
    const result = await scan({
      projectPath,
      target: { apiName: 'Case.Account_Alert_Message__c', type: 'CustomField' },
    });

    const sources = result.references.map((r) => r.source.apiName);
    expect(sources).toContain('Show_Alert'); // Flow, bare field node
    expect(sources).toContain('AlertService'); // Apex, bare field access
    expect(sources).toContain('Alert_Report'); // Generic metadata XML
    expect(sources).toContain('Alert_Service'); // Integration metadata XML

    expect(result.references).toContainEqual(
      expect.objectContaining({
        source: expect.objectContaining({
          apiName: 'Alert_Service',
          type: 'NamedCredential',
        }),
        relationshipType: 'Configures',
      }),
    );

    // Emitted references keep the qualified target for disambiguation.
    for (const ref of result.references) {
      expect(ref.target.apiName).toBe('Case.Account_Alert_Message__c');
    }
  });

  it('still finds the same references when the target apiName is bare (fallback)', async () => {
    const result = await scan({
      projectPath,
      target: { apiName: 'Account_Alert_Message__c', type: 'CustomField' },
    });

    const sources = result.references.map((r) => r.source.apiName);
    expect(sources).toContain('Show_Alert');
    expect(sources).toContain('AlertService');
    expect(sources).toContain('Alert_Report');
    expect(sources).toContain('Alert_Service');
  });
});
