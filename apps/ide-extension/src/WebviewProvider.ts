import * as vscode from 'vscode';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import type { WebviewToHostMessage } from './messages';

type WebviewInitialPayload = DependencyResult | DependencyResult[];
interface WebviewPayload {
  result?: WebviewInitialPayload;
  components?: ComponentRef[];
}

export class WebviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private exportHandler: (() => void | Promise<void>) | undefined;
  private analyzeManyHandler:
    | ((targets: ComponentRef[]) => void | Promise<void>)
    | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  async showResult(result: DependencyResult): Promise<void> {
    await this.showResults([result]);
  }

  async showResults(results: DependencyResult[]): Promise<void> {
    const panel = this.getPanel();
    panel.webview.html = await this.getHtml(panel.webview, { result: results });
    void panel.webview.postMessage(
      results.length === 1
        ? { type: 'result', result: results[0]! }
        : { type: 'results', results },
    );
    panel.reveal(vscode.ViewColumn.Beside);
  }

  async showComponentPicker(components: ComponentRef[]): Promise<void> {
    const panel = this.getPanel();
    panel.webview.html = await this.getHtml(panel.webview, { components });
    void panel.webview.postMessage({ type: 'componentPicker', components });
    panel.reveal(vscode.ViewColumn.Beside);
  }

  onExport(handler: () => void | Promise<void>): void {
    this.exportHandler = handler;
  }

  onAnalyzeMany(handler: (targets: ComponentRef[]) => void | Promise<void>): void {
    this.analyzeManyHandler = handler;
  }

  private getPanel(): vscode.WebviewPanel {
    if (this.panel) return this.panel;

    this.panel = vscode.window.createWebviewPanel(
      'orgtraceImpact',
      'OrgTrace Impact',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist'),
        ],
      },
    );
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    this.panel.webview.onDidReceiveMessage((message: WebviewToHostMessage) => {
      if (message.type === 'exportMarkdown') {
        void this.exportHandler?.();
        return;
      }
      if (message.type === 'openInEditor') {
        void this.openInEditor(message.filePath, message.lineNumber).catch((error: unknown) => {
          void vscode.window.showErrorMessage(`OrgTrace could not open ${message.filePath}: ${String(error)}`);
        });
        return;
      }
      if (message.type === 'analyzeMany') {
        void this.analyzeManyHandler?.(message.targets);
      }
    });

    return this.panel;
  }

  private async openInEditor(filePath: string, lineNumber?: number): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const uri = workspaceFolder
      ? vscode.Uri.joinPath(workspaceFolder.uri, filePath)
      : vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

    if (lineNumber && lineNumber > 0) {
      const position = new vscode.Position(lineNumber - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
  }

  private async getHtml(
    webview: vscode.Webview,
    payload: WebviewPayload,
  ): Promise<string> {
    const indexUri = vscode.Uri.joinPath(
      this.extensionUri,
      'webview',
      'dist',
      'index.html',
    );

    try {
      const bytes = await vscode.workspace.fs.readFile(indexUri);
      const html = Buffer.from(bytes).toString('utf8');
      const withAssetUris = html.replace(
        /(src|href)="\/([^"]+)"/g,
        (_match: string, attr: string, assetPath: string) => {
          const assetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist', assetPath),
          );
          return `${attr}="${assetUri.toString()}"`;
        },
      );

      return withAssetUris.replace(
        '</head>',
        `<script>window.__ORGTRACE_INITIAL_RESULT__=${JSON.stringify(payload.result)};window.__ORGTRACE_INITIAL_COMPONENTS__=${JSON.stringify(payload.components ?? [])};</script></head>`,
      );
    } catch {
      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OrgTrace</title>
  </head>
  <body>
    <pre>${JSON.stringify(payload, null, 2)}</pre>
  </body>
</html>`;
    }
  }
}
