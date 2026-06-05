import * as vscode from 'vscode';

import { InMemoryCacheStore } from './cache/InMemoryCacheStore';

const cache = new InMemoryCacheStore();

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('orgtrace.analyzeComponent', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        await vscode.window.showWarningMessage('Open a Salesforce metadata file before running OrgTrace.');
        return;
      }

      await vscode.window.showInformationMessage(
        `OrgTrace analysis host is ready for ${editor.document.fileName}.`,
      );
    }),
    vscode.commands.registerCommand('orgtrace.rescan', async () => {
      cache.clear();
      await vscode.window.showInformationMessage('OrgTrace cache cleared.');
    }),
    vscode.commands.registerCommand('orgtrace.exportMarkdown', async () => {
      await vscode.window.showWarningMessage('OrgTrace export is not wired yet.');
    }),
  );
}

export function deactivate(): void {
  cache.clear();
}
