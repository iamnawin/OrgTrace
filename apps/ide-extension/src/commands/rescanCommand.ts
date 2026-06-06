import * as vscode from 'vscode';

import type { OrgTraceService } from '../OrgTraceService';
import type { WebviewProvider } from '../WebviewProvider';

export async function rescanCommand(
  service: OrgTraceService,
  webviewProvider: WebviewProvider,
): Promise<void> {
  const last = service.getLastResult();

  if (!last) {
    service.clearCache();
    await vscode.window.showInformationMessage(
      'OrgTrace cache cleared. Run "Analyze Component" to start a scan.',
    );
    return;
  }

  const projectPath =
    last.context?.projectPath ??
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!projectPath) {
    await vscode.window.showWarningMessage('Open the Salesforce project workspace before rescanning.');
    return;
  }

  // Force a fresh scan, then refresh the Impact webview with the updated result.
  service.clearCache();
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `OrgTrace: rescanning ${last.target.label ?? last.target.apiName}…`,
    },
    () => service.analyzeComponent({ projectPath, target: last.target }),
  );

  await webviewProvider.showResult(result);
}
