import * as vscode from 'vscode';

import type { OrgTraceService } from '../OrgTraceService';

export async function rescanCommand(service: OrgTraceService): Promise<void> {
  service.clearCache();
  await vscode.window.showInformationMessage('OrgTrace cache cleared.');
}
