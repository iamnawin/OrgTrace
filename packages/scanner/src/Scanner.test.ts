import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { scan } from './Scanner';

describe('Scanner', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orgtrace-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should find references to an ApexClass in a Trigger', async () => {
    const triggerDir = path.join(tmpDir, 'force-app/main/default/triggers');
    await fs.mkdir(triggerDir, { recursive: true });
    
    const triggerContent = 'trigger AccountTrigger on Account (before insert) { new MyAccountClass().doSomething(); }';
    await fs.writeFile(path.join(triggerDir, 'AccountTrigger.trigger'), triggerContent);

    const result = await scan({
      projectPath: tmpDir,
      target: { apiName: 'MyAccountClass', type: 'ApexClass' }
    });

    expect(result.references.length).toBe(1);
    expect(result.references[0]?.source.apiName).toBe('AccountTrigger');
  });

  it('should find references to a CustomObject in Apex', async () => {
    const classDir = path.join(tmpDir, 'force-app/main/default/classes');
    await fs.mkdir(classDir, { recursive: true });
    
    const classContent = 'public class MyAccountClass { void test() { Account a; } }';
    await fs.writeFile(path.join(classDir, 'MyAccountClass.cls'), classContent);

    const result = await scan({
      projectPath: tmpDir,
      target: { apiName: 'Account', type: 'CustomObject' }
    });

    expect(result.references.length).toBe(1);
    expect(result.references[0]?.source.apiName).toBe('MyAccountClass');
  });
});
