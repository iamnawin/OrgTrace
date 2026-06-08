import * as vscode from 'vscode';
import { discoverComponents } from '@orgtrace/scanner';

import type { OrgTraceService } from '../OrgTraceService';
import type { WebviewProvider } from '../WebviewProvider';

export async function analyzeComponentCommand(
  _service: OrgTraceService,
  webviewProvider: WebviewProvider,
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    await vscode.window.showWarningMessage('Open a Salesforce project workspace before running OrgTrace.');
    return;
  }

  const projectPath = workspaceFolder.uri.fsPath;
  const components = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'OrgTrace: loading metadata components...',
    },
    () => discoverComponents(projectPath, ''),
  );

  if (components.length === 0) {
    await vscode.window.showWarningMessage('No Salesforce metadata components were found in this workspace.');
    return;
  }

  await webviewProvider.showComponentPicker(components);
}
