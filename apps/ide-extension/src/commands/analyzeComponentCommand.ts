import * as vscode from 'vscode';
import type { MetadataType } from '@orgtrace/core';

import type { OrgTraceService } from '../OrgTraceService';
import type { WebviewProvider } from '../WebviewProvider';

export async function analyzeComponentCommand(
  service: OrgTraceService,
  webviewProvider: WebviewProvider,
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    await vscode.window.showWarningMessage('Open a Salesforce project workspace before running OrgTrace.');
    return;
  }

  const apiName = await vscode.window.showInputBox({
    prompt: 'Component API name',
    placeHolder: 'Account.Some_Field__c',
  });

  if (!apiName) return;

  const result = await service.analyzeComponent({
    projectPath: workspaceFolder.uri.fsPath,
    target: {
      apiName,
      type: 'Unknown' satisfies MetadataType,
    },
  });

  await webviewProvider.showResult(result);
}
