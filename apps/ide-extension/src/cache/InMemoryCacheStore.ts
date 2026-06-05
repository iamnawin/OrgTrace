import type { DependencyResult } from '@orgtrace/core';
import type { CacheStore } from './CacheStore';

// Default Phase 1A cache. Lives for the duration of the extension host process.
export class InMemoryCacheStore implements CacheStore {
  private readonly map = new Map<string, DependencyResult>();

  get(key: string): DependencyResult | undefined {
    return this.map.get(key);
  }

  set(key: string, value: DependencyResult): void {
    this.map.set(key, value);
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}
