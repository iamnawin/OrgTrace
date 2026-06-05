import * as vscode from 'vscode';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import { calculateRisk } from '@orgtrace/core';
import { scan } from '@orgtrace/scanner';

import type { CacheStore } from './cache/CacheStore';

export interface AnalyzeComponentInput {
  projectPath: string;
  target: ComponentRef;
}

export class OrgTraceService {
  private lastResult: DependencyResult | undefined;

  constructor(private readonly cache: CacheStore) {}

  async analyzeComponent(input: AnalyzeComponentInput): Promise<DependencyResult> {
    const cacheKey = `${input.projectPath}:${input.target.type}:${input.target.apiName}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.lastResult = cached;
      return cached;
    }

    const scanResult = await scan({
      projectPath: input.projectPath,
      target: input.target,
    });

    const resultWithoutRisk = {
      target: input.target,
      references: scanResult.references,
      dependencies: scanResult.dependencies,
      scannedAt: new Date().toISOString(),
      sources: ['LocalScan' as const],
      context: {
        projectPath: input.projectPath,
      },
      warnings: scanResult.warnings,
      errors: scanResult.errors,
    };

    const result: DependencyResult = {
      ...resultWithoutRisk,
      risk: calculateRisk(resultWithoutRisk),
    };

    this.cache.set(cacheKey, result);
    this.lastResult = result;
    return result;
  }

  clearCache(): void {
    this.cache.clear();
    this.lastResult = undefined;
  }

  getLastResult(): DependencyResult | undefined {
    return this.lastResult;
  }

  async exportLastResult(): Promise<void> {
    if (!this.lastResult) {
      await vscode.window.showWarningMessage('Run OrgTrace analysis before exporting a report.');
      return;
    }

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`${this.lastResult.target.apiName}-impact-report.md`),
      filters: {
        Markdown: ['md'],
      },
    });

    if (!uri) return;

    await vscode.workspace.fs.writeFile(
      uri,
      Buffer.from(this.toMarkdown(this.lastResult), 'utf8'),
    );
  }

  private toMarkdown(result: DependencyResult): string {
    const references = result.references
      .map((ref) => `- ${ref.source.type}: ${ref.source.apiName}`)
      .join('\n');

    return `# OrgTrace Impact Report

## Target

- API Name: ${result.target.apiName}
- Type: ${result.target.type}

## Risk

- Level: ${result.risk.level}
- Score: ${result.risk.score}

## References

${references || 'No inbound references found.'}
`;
  }
}
