import * as vscode from 'vscode';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import { calculateRisk, mergeComponentEnrichment } from '@orgtrace/core';
import { scan } from '@orgtrace/scanner';
import { SalesforceService } from '@orgtrace/salesforce-api';

import type { CacheStore } from './cache/CacheStore';
import { generateImpactMarkdown } from './reportMarkdown';

export interface AnalyzeComponentInput {
  projectPath: string;
  target: ComponentRef;
}

export class OrgTraceService {
  private lastResult: DependencyResult | undefined;
  private lastResults: DependencyResult[] = [];
  private readonly sfService: SalesforceService;
  private readonly onEnrichmentEmitter = new vscode.EventEmitter<DependencyResult>();
  public readonly onEnrichment = this.onEnrichmentEmitter.event;

  constructor(private readonly cache: CacheStore) {
    this.sfService = new SalesforceService();
  }

  async analyzeComponent(input: AnalyzeComponentInput): Promise<DependencyResult> {
    const cacheKey = `${input.projectPath}:${input.target.type}:${input.target.apiName}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.lastResult = cached;
      this.lastResults = [cached];
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
    this.lastResults = [result];

    // Trigger async enrichment
    void this.enrichWithOrgData(result, input.projectPath);

    return result;
  }

  private async enrichWithOrgData(result: DependencyResult, projectPath: string): Promise<void> {
    try {
      const initialized = await this.sfService.init(projectPath);
      if (!initialized) return;

      const enrichment = await this.sfService.fetchComponentDetails(
        result.target.apiName,
        result.target.type
      );

      if (enrichment) {
        const enrichedTarget = mergeComponentEnrichment(result.target, enrichment);
        const enrichedResult: DependencyResult = {
          ...result,
          target: enrichedTarget,
          sources: [...result.sources, 'SalesforceOrg' as any],
        };

        // Update cache and state
        const cacheKey = `${projectPath}:${result.target.type}:${result.target.apiName}`;
        this.cache.set(cacheKey, enrichedResult);
        
        if (this.lastResult?.target.apiName === result.target.apiName && 
            this.lastResult?.target.type === result.target.type) {
          this.lastResult = enrichedResult;
        }

        // Notify listeners (WebviewProvider)
        this.onEnrichmentEmitter.fire(enrichedResult);
      }
    } catch (err) {
      console.error('Enrichment failed:', err);
    }
  }


  setLastResults(results: DependencyResult[]): void {
    this.lastResults = results;
    this.lastResult = results[results.length - 1];
  }

  clearCache(): void {
    this.cache.clear();
    this.lastResult = undefined;
    this.lastResults = [];
  }

  getLastResult(): DependencyResult | undefined {
    return this.lastResult;
  }

  async exportLastResult(workspacePath?: string): Promise<vscode.Uri | undefined> {
    const results = this.lastResults.length > 0 ? this.lastResults : this.lastResult ? [this.lastResult] : [];

    if (results.length === 0) {
      await vscode.window.showWarningMessage('Run OrgTrace analysis before exporting a report.');
      return undefined;
    }

    const reportName = results.length === 1 ? results[0]!.target.apiName : 'orgtrace-multi-impact-report';
    const safeApiName = reportName.replace(/[^\w.-]+/g, '_');
    const baseUri = workspacePath
      ? vscode.Uri.file(workspacePath)
      : vscode.workspace.workspaceFolders?.[0]?.uri;
    const uri = vscode.Uri.joinPath(
      baseUri ?? vscode.Uri.file(process.cwd()),
      `${safeApiName}-impact-report.md`,
    );

    await vscode.workspace.fs.writeFile(
      uri,
      Buffer.from(results.map(generateImpactMarkdown).join('\n\n---\n\n'), 'utf8'),
    );
    await vscode.window.showInformationMessage(`OrgTrace report exported to ${uri.fsPath}.`);
    return uri;
  }
}
