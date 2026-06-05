import type { MetadataType, ReferenceSource } from './types';
import type { RiskRule } from './RiskEngine';

export interface MetadataTypeDefinition {
  type: MetadataType;
  label: string;
  supportsLocalScan: boolean;
  supportsToolingApi: boolean;
  supportsMetadataApi: boolean;
  fileExtensions?: string[];
  setupUrlBuilder?: (instanceUrl: string, apiName: string, id?: string) => string;
  riskRules?: RiskRule[];
}

const registry = new Map<MetadataType, MetadataTypeDefinition>();

export function registerMetadataType(def: MetadataTypeDefinition): void {
  registry.set(def.type, def);
}

export function getMetadataTypeDefinition(
  type: MetadataType,
): MetadataTypeDefinition | undefined {
  return registry.get(type);
}

export function getAllMetadataTypes(): MetadataTypeDefinition[] {
  return [...registry.values()];
}

// Phase 1A registrations
registerMetadataType({
  type: 'ApexClass',
  label: 'Apex Class',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.cls'],
  setupUrlBuilder: (instanceUrl, _apiName, id) =>
    id ? `${instanceUrl}/lightning/setup/ApexClasses/page?address=%2F${id}` : '',
});

registerMetadataType({
  type: 'ApexTrigger',
  label: 'Apex Trigger',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.trigger'],
  setupUrlBuilder: (instanceUrl, _apiName, id) =>
    id ? `${instanceUrl}/lightning/setup/ApexTriggers/page?address=%2F${id}` : '',
});

registerMetadataType({
  type: 'Flow',
  label: 'Flow',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.flow-meta.xml'],
  setupUrlBuilder: (instanceUrl, apiName) =>
    `${instanceUrl}/builder_platform_interaction/flowBuilder.app?flowDevName=${apiName}`,
});

registerMetadataType({
  type: 'LightningComponentBundle',
  label: 'Lightning Web Component',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.js', '.html'],
});

registerMetadataType({
  type: 'CustomObject',
  label: 'Custom Object',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.object-meta.xml'],
  setupUrlBuilder: (instanceUrl, apiName) =>
    `${instanceUrl}/lightning/setup/ObjectManager/${apiName}/Details/view`,
});

registerMetadataType({
  type: 'CustomField',
  label: 'Custom Field',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.field-meta.xml'],
});

registerMetadataType({
  type: 'PermissionSet',
  label: 'Permission Set',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.permissionset-meta.xml'],
  setupUrlBuilder: (instanceUrl, _apiName, id) =>
    id
      ? `${instanceUrl}/lightning/setup/PermSets/page?address=%2F${id}`
      : `${instanceUrl}/lightning/setup/PermSets/home`,
});

registerMetadataType({
  type: 'Profile',
  label: 'Profile',
  supportsLocalScan: true,
  supportsToolingApi: false,
  supportsMetadataApi: true,
  fileExtensions: ['.profile-meta.xml'],
});

registerMetadataType({
  type: 'Unknown',
  label: 'Unknown',
  supportsLocalScan: false,
  supportsToolingApi: false,
  supportsMetadataApi: false,
});
