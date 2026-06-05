import * as vscode from 'vscode';
import type { DependencyResult } from '@orgtrace/core';

export class WebviewProvider {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly extensionUri: vscode.Uri) {}

  async showResult(result: DependencyResult): Promise<void> {
    const panel = this.getPanel();
    panel.webview.html = await this.getHtml(panel.webview, result);
    panel.reveal(vscode.ViewColumn.Beside);
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

    return this.panel;
  }

  private async getHtml(
    webview: vscode.Webview,
    result: DependencyResult,
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
        `<script>window.__ORGTRACE_INITIAL_RESULT__=${JSON.stringify(result)};</script></head>`,
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
    <pre>${JSON.stringify(result, null, 2)}</pre>
  </body>
</html>`;
    }
  }
}
