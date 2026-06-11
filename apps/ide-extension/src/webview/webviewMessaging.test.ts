import { afterEach, describe, expect, it, vi } from 'vitest';

import { postWebviewMessage, resetVsCodeApiForTests } from './webviewMessaging';

declare global {
  var acquireVsCodeApi:
    | undefined
    | (() => {
        postMessage(message: unknown): void;
      });
}

describe('postWebviewMessage', () => {
  afterEach(() => {
    resetVsCodeApiForTests();
    globalThis.acquireVsCodeApi = undefined;
  });

  it('reuses one VS Code API instance across multiple messages', () => {
    const postMessage = vi.fn();
    const acquireVsCodeApi = vi.fn(() => ({ postMessage }));
    globalThis.acquireVsCodeApi = acquireVsCodeApi;

    postWebviewMessage({ type: 'exportMarkdown' });
    postWebviewMessage({ type: 'openInEditor', filePath: 'force-app/main/default/classes/MyClass.cls' });

    expect(acquireVsCodeApi).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledTimes(2);
  });
});
