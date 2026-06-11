import { describe, expect, it } from 'vitest';

import { preferredFileInDirectory } from './filePathResolution';

describe('preferredFileInDirectory', () => {
  it('opens the main LWC JavaScript file when a bundle directory is clicked', () => {
    expect(
      preferredFileInDirectory('force-app/main/default/lwc/accountHierarchyAction', [
        { name: 'accountHierarchyAction.html', type: 'file' },
        { name: 'accountHierarchyAction.js-meta.xml', type: 'file' },
        { name: 'accountHierarchyAction.js', type: 'file' },
      ]),
    ).toBe('force-app/main/default/lwc/accountHierarchyAction/accountHierarchyAction.js');
  });

  it('falls back to the first file when the directory has no named bundle entry', () => {
    expect(
      preferredFileInDirectory('force-app/main/default/staticresources/images', [
        { name: 'z.txt', type: 'file' },
        { name: 'a.txt', type: 'file' },
        { name: 'nested', type: 'directory' },
      ]),
    ).toBe('force-app/main/default/staticresources/images/a.txt');
  });

  it('returns undefined when a directory has no files', () => {
    expect(
      preferredFileInDirectory('force-app/main/default/lwc/emptyBundle', [
        { name: 'nested', type: 'directory' },
      ]),
    ).toBeUndefined();
  });
});
