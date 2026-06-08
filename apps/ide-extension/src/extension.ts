import * as vscode from 'vscode';

import { analyzeComponentCommand } from './commands/analyzeComponentCommand';
import { exportReportCommand } from './commands/exportReportCommand';
import { rescanCommand } from './commands/rescanCommand';
import { InMemoryCacheStore } from './cache/InMemoryCacheStore';
import { OrgTraceService } from './OrgTraceService';
import { WebviewProvider } from './WebviewProvider';

export function activate(context: vscode.ExtensionContext): void {
  const cache = new InMemoryCacheStore();
  const service = new OrgTraceService(cache);
  const webviewProvider = new WebviewProvider(context.extensionUri);
  webviewProvider.onExport(() => exportReportCommand(service));
  webviewProvider.onAnalyzeMany(async (targets) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      await vscode.window.showWarningMessage('Open a Salesforce project workspace before running OrgTrace.');
      return;
    }

    const projectPath = workspaceFolder.uri.fsPath;
    const results = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `OrgTrace: analyzing ${targets.length} component${targets.length === 1 ? '' : 's'}...`,
      },
      () =>
        Promise.all(
          targets.map((target) => service.analyzeComponent({ projectPath, target })),
        ),
    );

    service.setLastResults(results);
    await webviewProvider.showResults(results);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('orgtrace.analyzeComponent', () =>
      analyzeComponentCommand(service, webviewProvider),
    ),
    vscode.commands.registerCommand('orgtrace.rescan', () =>
      rescanCommand(service, webviewProvider),
    ),
    vscode.commands.registerCommand('orgtrace.exportMarkdown', () =>
      exportReportCommand(service),
    ),
  );
}

export function deactivate(): void {}
