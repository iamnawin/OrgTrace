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
  projectPath = await fs.mkdtemp(path.join(os.tmpdir(), 'orgtrace-counting-'));
  const base = 'force-app/main/default';

  // Apex Class + Meta
  await writeFile(`${base}/classes/MyClass.cls`);
  await writeFile(`${base}/classes/MyClass.cls-meta.xml`);

  // Apex Trigger + Meta
  await writeFile(`${base}/triggers/MyTrigger.trigger`);
  await writeFile(`${base}/triggers/MyTrigger.trigger-meta.xml`);

  // LWC Bundle
  await writeFile(`${base}/lwc/myCmp/myCmp.js`);
  await writeFile(`${base}/lwc/myCmp/myCmp.html`);
  await writeFile(`${base}/lwc/myCmp/myCmp.js-meta.xml`);
  await writeFile(`${base}/lwc/myCmp/myCmp.css`);

  // Flow
  await writeFile(`${base}/flows/MyFlow.flow-meta.xml`);

  // Object
  await writeFile(`${base}/objects/MyObj__c/MyObj__c.object-meta.xml`);

  // Field
  await writeFile(`${base}/objects/MyObj__c/fields/MyField__c.field-meta.xml`);
});

afterAll(async () => {
  await fs.rm(projectPath, { recursive: true, force: true });
});

describe('Component Counting Logic', () => {
  it('counts MyClass.cls and MyClass.cls-meta.xml as 1 component', async () => {
    const results = await discoverComponents(projectPath, 'MyClass');
    // It might find it via ApexClass rule and Generic XML rule if not careful
    // But we updated SPECIALIZED_META_XML_SUFFIXES to include .cls-meta.xml
    const apexClasses = results.filter(r => r.type === 'ApexClass');
    expect(apexClasses.length).toBe(1);
    expect(apexClasses[0]?.apiName).toBe('MyClass');
    
    // Ensure no generic metadata ref for the same file
    expect(results.length).toBe(1);
  });

  it('counts MyTrigger.trigger and MyTrigger.trigger-meta.xml as 1 component', async () => {
    const results = await discoverComponents(projectPath, 'MyTrigger');
    const triggers = results.filter(r => r.type === 'ApexTrigger');
    expect(triggers.length).toBe(1);
    expect(triggers[0]?.apiName).toBe('MyTrigger');
    expect(results.length).toBe(1);
  });

  it('counts LWC bundle as 1 component', async () => {
    const results = await discoverComponents(projectPath, 'myCmp');
    const lwcs = results.filter(r => r.type === 'LightningComponentBundle');
    expect(lwcs.length).toBe(1);
    expect(lwcs[0]?.apiName).toBe('myCmp');
    // js-meta.xml is specialized, so it shouldn't show up in generic either
    expect(results.length).toBe(1);
  });

  it('counts Flow as 1 component', async () => {
    const results = await discoverComponents(projectPath, 'MyFlow');
    expect(results.length).toBe(1);
    expect(results[0]?.type).toBe('Flow');
  });

  it('counts Custom Object as 1 component', async () => {
    const results = await discoverComponents(projectPath, 'MyObj');
    // Should find the object
    const objs = results.filter(r => r.type === 'CustomObject');
    expect(objs.length).toBe(1);
  });
});
