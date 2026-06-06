import * as vscode from 'vscode';
import type { ComponentRef, MetadataType } from '@orgtrace/core';
import { discoverComponents } from '@orgtrace/scanner';

import type { OrgTraceService } from '../OrgTraceService';
import type { WebviewProvider } from '../WebviewProvider';

interface TypeDisplay {
  icon: string;
  label: string;
}

/** Display metadata for the component types surfaced by the picker. */
const TYPE_DISPLAY: Partial<Record<MetadataType, TypeDisplay>> = {
  Flow: { icon: 'symbol-event', label: 'Flow' },
  ApexClass: { icon: 'symbol-class', label: 'Apex Class' },
  CustomField: { icon: 'symbol-field', label: 'Field' },
  CustomObject: { icon: 'database', label: 'Object' },
  LightningComponentBundle: { icon: 'symbol-method', label: 'LWC' },
  PermissionSet: { icon: 'shield', label: 'Permission Set' },
  ValidationRule: { icon: 'checklist', label: 'Validation Rule' },
};

const FALLBACK_DISPLAY: TypeDisplay = { icon: 'symbol-misc', label: 'Component' };

interface ComponentPick extends vscode.QuickPickItem {
  componentRef: ComponentRef;
}

function toPick(ref: ComponentRef): ComponentPick {
  const display = TYPE_DISPLAY[ref.type] ?? FALLBACK_DISPLAY;
  const name = ref.label ?? ref.apiName;
  return {
    label: `$(${display.icon}) ${display.label}: ${name}`,
    description: display.label,
    detail: ref.filePath,
    componentRef: ref,
  };
}

async function pickComponent(
  projectPath: string,
  query: string,
): Promise<ComponentRef | undefined> {
  const matches = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `OrgTrace: searching for "${query}"…`,
    },
    () => discoverComponents(projectPath, query),
  );

  if (matches.length === 0) {
    // Preserve the original direct-scan path: let the user analyze the raw term.
    const choice = await vscode.window.showWarningMessage(
      `No components matched "${query}". Analyze it as a raw API name instead?`,
      'Analyze Anyway',
    );
    if (choice !== 'Analyze Anyway') return undefined;
    return { apiName: query, type: 'Unknown' satisfies MetadataType };
  }

  const selected = await vscode.window.showQuickPick(matches.map(toPick), {
    title: 'OrgTrace: Select Component',
    placeHolder: `${matches.length} match${matches.length === 1 ? '' : 'es'} — choose the exact component`,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  return selected?.componentRef;
}

export async function analyzeComponentCommand(
  service: OrgTraceService,
  webviewProvider: WebviewProvider,
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    await vscode.window.showWarningMessage('Open a Salesforce project workspace before running OrgTrace.');
    return;
  }

  const query = await vscode.window.showInputBox({
    prompt: 'Search for a Salesforce component to analyze',
    placeHolder: 'account alert',
  });

  if (!query) return;

  const projectPath = workspaceFolder.uri.fsPath;
  const target = await pickComponent(projectPath, query);

  if (!target) return;

  const result = await service.analyzeComponent({ projectPath, target });

  await webviewProvider.showResult(result);
}
