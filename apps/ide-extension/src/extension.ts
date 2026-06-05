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

  context.subscriptions.push(
    vscode.commands.registerCommand('orgtrace.analyzeComponent', () =>
      analyzeComponentCommand(service, webviewProvider),
    ),
    vscode.commands.registerCommand('orgtrace.rescan', () =>
      rescanCommand(service),
    ),
    vscode.commands.registerCommand('orgtrace.exportMarkdown', () =>
      exportReportCommand(service),
    ),
  );
}

export function deactivate(): void {}
