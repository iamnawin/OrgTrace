import type { OrgTraceService } from '../OrgTraceService';
import * as vscode from 'vscode';

export async function exportReportCommand(service: OrgTraceService): Promise<void> {
  await service.exportLastResult(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
}
