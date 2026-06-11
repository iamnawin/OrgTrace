import type { WebviewToHostMessage } from '../messages';

interface VsCodeWebviewApi {
  postMessage(message: WebviewToHostMessage): void;
}

declare global {
  var acquireVsCodeApi:
    | undefined
    | (() => VsCodeWebviewApi);
}

let vscodeApi: VsCodeWebviewApi | undefined;

function getVsCodeApi(): VsCodeWebviewApi | undefined {
  if (vscodeApi) return vscodeApi;
  if (typeof globalThis.acquireVsCodeApi === 'undefined') return undefined;

  vscodeApi = globalThis.acquireVsCodeApi();
  return vscodeApi;
}

export function postWebviewMessage(message: WebviewToHostMessage): void {
  getVsCodeApi()?.postMessage(message);
}

export function resetVsCodeApiForTests(): void {
  vscodeApi = undefined;
}
