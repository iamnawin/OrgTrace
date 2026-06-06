import type { ComponentRef, DependencyReference } from '@orgtrace/core';

export interface ScanOptions {
  projectPath: string;
  target: ComponentRef;
  includePaths?: string[];
  excludePaths?: string[];
  onProgress?: (progress: ScanProgress) => void;
  maxConcurrency?: number;
}

export interface ScanProgress {
  scanned: number;
  total: number;
  currentFile?: string;
  phase: 'discovering' | 'scanning' | 'deduplicating' | 'completed';
}

export interface ParseContext {
  filePath: string;
  content: string;
  target: ComponentRef;
  projectRoot: string;
  /** Substring to search file content for; derived from {@link target}. */
  searchTerm: string;
}

export interface FileParser {
  canParse(filePath: string): boolean;
  parse(context: ParseContext): DependencyReference[];
}

export interface ScanResult {
  references: DependencyReference[];
  dependencies: DependencyReference[];
  warnings: string[];
  errors: string[];
  filesScanned: number;
}
