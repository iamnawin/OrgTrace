// Cache abstraction so the storage backend can evolve (in-memory -> JSON file -> SQLite)
// without touching OrgTraceService. SQLite is intentionally deferred for Phase 1A.

import type { DependencyResult } from '@orgtrace/core';

export interface CacheStore {
  get(key: string): DependencyResult | undefined;
  set(key: string, value: DependencyResult): void;
  delete(key: string): void;
  clear(): void;
}
