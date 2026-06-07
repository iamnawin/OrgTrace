import * as vscode from 'vscode';
import type { ComponentRef, MetadataType } from '@orgtrace/core';
import { discoverComponents } from '@orgtrace/scanner';

import type { OrgTraceService } from '../OrgTraceService';
import type { WebviewProvider } from '../WebviewProvider';
import { buildComponentPicks, rawFallbackRef } from './componentPicks';
import { buildScopeOptions } from './scopePicker';

interface ComponentPick extends vscode.QuickPickItem {
  componentRef: ComponentRef;
}

interface ScopePick extends vscode.QuickPickItem {
  scopeType?: MetadataType;
}

/**
 * Asks the user to narrow the search to a single metadata type. Returns the
 * chosen type (or `undefined` for "All"); a cancelled pick aborts the command.
 */
async function pickScope(): Promise<{ cancelled: boolean; type: MetadataType | undefined }> {
  const items: ScopePick[] = buildScopeOptions().map((option) => ({
    label: option.icon ? `$(${option.icon}) ${option.label}` : option.label,
    ...(option.type ? { scopeType: option.type } : {}),
  }));

  const selected = await vscode.window.showQuickPick(items, {
    title: 'OrgTrace: Filter by Metadata Type',
    placeHolder: 'Narrow the search by type, or choose All',
  });

  if (!selected) return { cancelled: true, type: undefined };
  return { cancelled: false, type: selected.scopeType };
}

/** Maps the pure pick models onto VS Code QuickPick items with separator rows. */
function toQuickPickItems(
  refs: ComponentRef[],
): (vscode.QuickPickItem | ComponentPick)[] {
  return buildComponentPicks(refs).map((model) =>
    model.kind === 'separator'
      ? { label: model.label, kind: vscode.QuickPickItemKind.Separator }
      : {
          label: model.label,
          description: model.description,
          ...(model.detail ? { detail: model.detail } : {}),
          componentRef: model.componentRef,
        },
  );
}

async function pickComponent(
  projectPath: string,
  query: string,
  typeFilter?: MetadataType,
): Promise<ComponentRef | undefined> {
  const matches = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `OrgTrace: searching for "${query}"…`,
    },
    () => discoverComponents(projectPath, query, typeFilter),
  );

  if (matches.length === 0) {
    // Preserve the original direct-scan path: let the user analyze the raw term.
    const choice = await vscode.window.showWarningMessage(
      `No components matched "${query}". Analyze it as a raw API name instead?`,
      'Analyze Anyway',
    );
    if (choice !== 'Analyze Anyway') return undefined;
    return rawFallbackRef(query);
  }

  const selected = await vscode.window.showQuickPick(toQuickPickItems(matches), {
    title: 'OrgTrace: Select Component',
    placeHolder: `${matches.length} match${matches.length === 1 ? '' : 'es'} — choose the exact component`,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!selected || !('componentRef' in selected)) return undefined;
  return selected.componentRef;
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

  const scope = await pickScope();
  if (scope.cancelled) return;

  const query = await vscode.window.showInputBox({
    prompt: 'Search for a Salesforce component to analyze',
    placeHolder: 'account alert',
  });

  if (!query) return;

  const projectPath = workspaceFolder.uri.fsPath;
  const target = await pickComponent(projectPath, query, scope.type);

  if (!target) return;

  const result = await service.analyzeComponent({ projectPath, target });

  await webviewProvider.showResult(result);
}
