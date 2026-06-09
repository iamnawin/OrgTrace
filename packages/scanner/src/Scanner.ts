import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import type { DependencyReference, ComponentRef } from '@orgtrace/core';
import { DEFAULT_CONCURRENCY, DEFAULT_IGNORE, SFDX_PATTERNS } from './constants';
import { fileParsers } from './parsers';
import { deduplicateReferences } from './referenceKey';
import { targetSearchTerm } from './targetMatch';
import { extractMetadataDetails } from './metadataXml';
import type { FileParser, ScanOptions, ScanResult } from './types';

async function populateTargetDetails(
  target: ComponentRef,
  projectPath: string,
): Promise<void> {
  if (!target.filePath) return;

  const fullPath = path.isAbsolute(target.filePath)
    ? target.filePath
    : path.join(projectPath, target.filePath);

  let metaPath = fullPath;
  
  // Handle directories (LWC, Aura bundles)
  const stats = await fs.stat(fullPath).catch(() => null);
  if (stats?.isDirectory()) {
    const bundleName = path.basename(fullPath);
    // Check for LWC meta file
    const lwcMeta = path.join(fullPath, `${bundleName}.js-meta.xml`);
    // Check for Aura meta file
    const auraMeta = path.join(fullPath, `${bundleName}.cmp-meta.xml`);
    
    try {
      await fs.access(lwcMeta);
      metaPath = lwcMeta;
    } catch {
      try {
        await fs.access(auraMeta);
        metaPath = auraMeta;
      } catch {
        // No obvious meta file in directory
      }
    }
  } else if (!fullPath.endsWith('-meta.xml')) {
    // Check if .cls-meta.xml, .trigger-meta.xml etc exists
    const possibleMeta = `${fullPath}-meta.xml`;
    try {
      await fs.access(possibleMeta);
      metaPath = possibleMeta;
    } catch {
      // no-op
    }
  }

  try {
    const [content, fileStats] = await Promise.all([
      fs.readFile(metaPath, 'utf8'),
      fs.stat(fullPath),
    ]);

    const details = extractMetadataDetails(content);
    if (details.label) target.label = details.label;
    if (details.description) target.description = details.description;
    if (details.status) target.status = details.status;
    target.lastModifiedDate = fileStats.mtime.toISOString();
    target.createdDate = fileStats.birthtime.toISOString();
  } catch {
    // If reading fails, just leave it as is
  }
}

async function readForceignore(projectPath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(
      path.join(projectPath, '.forceignore'),
      'utf8',
    );
    return content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

async function readFileSafe(
  filePath: string,
): Promise<{ content: string } | { error: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { content };
  } catch (err) {
    return { error: String(err) };
  }
}

async function processBatch(
  files: string[],
  parsers: FileParser[],
  options: ScanOptions,
  projectPath: string,
  searchTerm: string,
  result: { refs: DependencyReference[]; warnings: string[]; errors: string[] },
  progress: { scanned: number },
): Promise<void> {
  await Promise.all(
    files.map(async (filePath) => {
      const matchingParsers = parsers.filter((p) => p.canParse(filePath));

      if (matchingParsers.length === 0) {
        progress.scanned++;
        return;
      }

      const read = await readFileSafe(filePath);

      if ('error' in read) {
        result.warnings.push(`Could not read ${filePath}: ${read.error}`);
        progress.scanned++;
        return;
      }

      for (const parser of matchingParsers) {
        try {
          const found = parser.parse({
            filePath,
            content: read.content,
            target: options.target,
            projectRoot: projectPath,
            searchTerm,
          });
          result.refs.push(...found);
        } catch (err) {
          result.warnings.push(`Parser error on ${filePath}: ${String(err)}`);
        }
      }

      progress.scanned++;
      options.onProgress?.({
        scanned: progress.scanned,
        total: 0, // filled in by caller after discovery
        currentFile: path.relative(projectPath, filePath),
        phase: 'scanning',
      });
    }),
  );
}

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const {
    projectPath,
    target,
    includePaths,
    excludePaths = [],
    onProgress,
    maxConcurrency = DEFAULT_CONCURRENCY,
  } = options;

  // Validate project path
  try {
    await fs.access(projectPath);
  } catch {
    throw new Error(`Project path is not accessible: ${projectPath}`);
  }

  onProgress?.({ scanned: 0, total: 0, phase: 'discovering' });

  const forceignorePatterns = await readForceignore(projectPath);
  const ignorePatterns = [...DEFAULT_IGNORE, ...forceignorePatterns, ...excludePaths];
  const globPatterns = includePaths ?? SFDX_PATTERNS;

  let files: string[];
  try {
    files = await fg(globPatterns, {
      cwd: projectPath,
      absolute: true,
      ignore: ignorePatterns,
      onlyFiles: true,
    });
  } catch (err) {
    throw new Error(`File discovery failed: ${String(err)}`);
  }

  const total = files.length;
  const searchTerm = targetSearchTerm(target);
  const result = {
    refs: [] as DependencyReference[],
    warnings: [] as string[],
    errors: [] as string[],
  };
  const progress = { scanned: 0 };

  onProgress?.({ scanned: 0, total, phase: 'scanning' });

  await populateTargetDetails(target, projectPath);

  // Process in batches
  for (let i = 0; i < files.length; i += maxConcurrency) {
    const batch = files.slice(i, i + maxConcurrency);
    await processBatch(batch, fileParsers, options, projectPath, searchTerm, result, progress);

    onProgress?.({
      scanned: progress.scanned,
      total,
      phase: 'scanning',
    });
  }

  onProgress?.({ scanned: total, total, phase: 'deduplicating' });

  const deduplicated = deduplicateReferences(result.refs);

  // Split into inbound references vs outbound dependencies
  const references = deduplicated.filter(
    (r) => r.target.apiName === target.apiName,
  );
  const dependencies = deduplicated.filter(
    (r) => r.source.apiName === target.apiName,
  );

  onProgress?.({ scanned: total, total, phase: 'completed' });

  return {
    references,
    dependencies,
    warnings: result.warnings,
    errors: result.errors,
    filesScanned: total,
  };
}
