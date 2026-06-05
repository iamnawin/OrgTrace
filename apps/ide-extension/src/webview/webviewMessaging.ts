import type { WebviewToHostMessage } from '../messages';

declare const acquireVsCodeApi:
  | undefined
  | (() => {
      postMessage(message: WebviewToHostMessage): void;
    });

export function postWebviewMessage(message: WebviewToHostMessage): void {
  if (typeof acquireVsCodeApi === 'undefined') return;
  acquireVsCodeApi().postMessage(message);
}
