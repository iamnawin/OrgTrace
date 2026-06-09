import { AuthInfo, Connection, Org } from '@salesforce/core';
import { ComponentRef } from '@orgtrace/core';

export interface SalesforceEnrichmentResult {
  id?: string;
  durableId?: string;
  namespace?: string;
  label?: string;
  description?: string;
  status?: string;
  createdDate?: string;
  createdBy?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
}

export class SalesforceService {
  private connection?: Connection;

  /**
   * Initialize connection using the default org for a given project path
   */
  async init(projectPath?: string): Promise<boolean> {
    try {
      // In VS Code, we often rely on the project's local config
      const org = await Org.create({});
      this.connection = org.getConnection();
      return true;
    } catch (err) {
      console.error('Failed to initialize Salesforce connection:', err);
      return false;
    }
  }

  /**
   * Explicitly set connection details (useful for browser extension later)
   */
  setConnection(instanceUrl: string, accessToken: string) {
    this.connection = new Connection({
      authInfo: {
        instanceUrl,
        accessToken,
      } as any
    });
  }

  /**
   * Fetch metadata details for a component
   */
  async fetchComponentDetails(apiName: string, type: string): Promise<SalesforceEnrichmentResult | null> {
    if (!this.connection) return null;

    try {
      // Tooling API query mapping
      const toolingTable = this.getToolingTable(type);
      if (!toolingTable) return null;

      // Special handling for Field (Name vs DeveloperName etc)
      let query = '';
      if (type === 'CustomField') {
        const parts = apiName.split('.');
        const obj = parts[0] || '';
        const field = parts[1] || '';
        query = `SELECT Id, DurableId, NamespacePrefix, Metadata, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name 
                 FROM CustomField 
                 WHERE DeveloperName = '${this.stripNamespace(field)}' AND TableEnumOrId = '${this.stripNamespace(obj)}'`;
      } else if (type === 'ValidationRule') {
        // ValidationRule is also object-prefixed in our apiName
        query = `SELECT Id, DurableId, NamespacePrefix, Description, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name 
                 FROM ValidationRule 
                 WHERE DeveloperName = '${apiName}'`;
      } else {
        const nameField = this.isStandardNameField(type) ? 'Name' : 'DeveloperName';
        query = `SELECT Id, DurableId, NamespacePrefix, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name 
                 FROM ${toolingTable} 
                 WHERE ${nameField} = '${this.stripNamespace(apiName)}'`;
      }

      const result = await this.connection.tooling.query<any>(query);
      if (result.records && result.records.length > 0) {
        const record = result.records[0];
        const enrichment: SalesforceEnrichmentResult = {};
        
        if (record.Id) enrichment.id = record.Id as string;
        if (record.DurableId) enrichment.durableId = record.DurableId as string;
        if (record.NamespacePrefix) enrichment.namespace = record.NamespacePrefix as string;
        if (record.CreatedDate) enrichment.createdDate = record.CreatedDate as string;
        if (record.CreatedBy?.Name) enrichment.createdBy = record.CreatedBy.Name as string;
        if (record.LastModifiedDate) enrichment.lastModifiedDate = record.LastModifiedDate as string;
        if (record.LastModifiedBy?.Name) enrichment.lastModifiedBy = record.LastModifiedBy.Name as string;
        
        return enrichment;
      }
    } catch (err) {
      console.error(`Error fetching details for ${type}:${apiName}`, err);
    }

    return null;
  }

  private stripNamespace(apiName: string): string {
    const parts = apiName.split('__');
    
    if (parts.length === 3) {
      // Managed Object/Field: ns__name__c
      return parts[1] || apiName;
    }
    
    if (parts.length === 2) {
      if (apiName.endsWith('__c')) {
        // Custom Object/Field: name__c
        return parts[0] || apiName;
      } else {
        // Managed Class/Page/etc: ns__name
        return parts[1] || apiName;
      }
    }
    
    return apiName.replace('__c', '');
  }

  private getToolingTable(type: string): string | null {
    const mapping: Record<string, string> = {
      'ApexClass': 'ApexClass',
      'ApexTrigger': 'ApexTrigger',
      'ApexComponent': 'ApexComponent',
      'ApexPage': 'ApexPage',
      'LightningComponentBundle': 'LightningComponentBundle',
      'Flow': 'FlowDefinition',
      'CustomObject': 'CustomObject',
      'CustomField': 'CustomField',
      'PermissionSet': 'PermissionSet',
      'ValidationRule': 'ValidationRule',
    };
    return mapping[type] || null;
  }

  private isStandardNameField(type: string): boolean {
    return ['ApexClass', 'ApexTrigger', 'ApexPage', 'ApexComponent', 'PermissionSet'].includes(type);
  }
}
