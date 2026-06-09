import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesforceService } from './SalesforceService';

// Mock @salesforce/core
vi.mock('@salesforce/core', () => {
  return {
    Org: {
      create: vi.fn().mockResolvedValue({
        getConnection: () => ({
          tooling: {
            query: vi.fn()
          }
        })
      })
    },
    Connection: vi.fn(),
    AuthInfo: {}
  };
});

describe('SalesforceService', () => {
  let service: SalesforceService;

  beforeEach(() => {
    service = new SalesforceService();
  });

  it('initializes connection', async () => {
    const success = await service.init();
    expect(success).toBe(true);
  });

  describe('fetchComponentDetails', () => {
    it('returns null if not initialized', async () => {
      const result = await service.fetchComponentDetails('MyClass', 'ApexClass');
      expect(result).toBe(null);
    });

    it('returns null for unknown types', async () => {
      await service.init();
      const result = await service.fetchComponentDetails('MyThing', 'UnknownType' as any);
      expect(result).toBe(null);
    });
  });

  describe('stripNamespace', () => {
    const strip = (name: string) => (service as any).stripNamespace(name);

    it('handles standard names', () => {
      expect(strip('Account')).toBe('Account');
      expect(strip('MyClass')).toBe('MyClass');
    });

    it('strips namespace from managed components', () => {
      expect(strip('pkg__MyClass')).toBe('MyClass');
      expect(strip('pkg__MyObj__c')).toBe('MyObj');
    });

    it('strips __c from custom components', () => {
      expect(strip('MyObj__c')).toBe('MyObj');
    });
  });
});
