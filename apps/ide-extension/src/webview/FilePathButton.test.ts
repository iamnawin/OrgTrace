import { describe, expect, it } from 'vitest';

import { openInEditorMessage } from './FilePathButton';

describe('openInEditorMessage', () => {
  it('builds a path-only editor navigation message', () => {
    expect(openInEditorMessage('force-app/main/default/lwc/accountAlertPanel')).toEqual({
      type: 'openInEditor',
      filePath: 'force-app/main/default/lwc/accountAlertPanel',
    });
  });

  it('includes a line number when one is available', () => {
    expect(openInEditorMessage('force-app/main/default/classes/MyClass.cls', 12)).toEqual({
      type: 'openInEditor',
      filePath: 'force-app/main/default/classes/MyClass.cls',
      lineNumber: 12,
    });
  });
});
