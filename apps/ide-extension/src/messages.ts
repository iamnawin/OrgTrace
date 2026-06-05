// Typed postMessage contracts between the extension host and the React webview.
// Both sides import these types so the channel stays in sync.
// RULE: the webview never runs scanner logic — it only sends intents and renders results.

import type { DependencyResult, ComponentRef } from '@orgtrace/core';

// Webview -> Host
export type WebviewToHostMessage =
  | { type: 'ready' }
  | { type: 'analyze'; target: ComponentRef }
  | { type: 'rescan' }
  | { type: 'exportMarkdown' }
  | { type: 'openInEditor'; filePath: string; lineNumber?: number }
  | { type: 'openInSalesforce'; url: string };

// Host -> Webview
export type HostToWebviewMessage =
  | { type: 'analyzing'; target: ComponentRef }
  | { type: 'progress'; scanned: number; total: number; currentFile?: string }
  | { type: 'result'; result: DependencyResult }
  | { type: 'error'; message: string };
