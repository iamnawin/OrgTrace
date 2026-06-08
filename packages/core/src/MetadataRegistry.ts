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
  type: 'ValidationRule',
  label: 'Validation Rule',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.validationRule-meta.xml'],
});

registerMetadataType({
  type: 'WorkflowRule',
  label: 'Workflow Rule',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.workflow-meta.xml'],
});

registerMetadataType({
  type: 'AuraDefinitionBundle',
  label: 'Aura Component',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
});

registerMetadataType({
  type: 'Report',
  label: 'Report',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.report-meta.xml'],
});

registerMetadataType({
  type: 'Dashboard',
  label: 'Dashboard',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.dashboard-meta.xml'],
});

registerMetadataType({
  type: 'CustomLabel',
  label: 'Custom Label',
  supportsLocalScan: true,
  supportsToolingApi: false,
  supportsMetadataApi: true,
  fileExtensions: ['.labels-meta.xml'],
});

registerMetadataType({
  type: 'CustomMetadata',
  label: 'Custom Metadata',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.md-meta.xml'],
});

registerMetadataType({
  type: 'EmailTemplate',
  label: 'Email Template',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.email-meta.xml'],
});

registerMetadataType({
  type: 'LightningPage',
  label: 'Lightning Page',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.flexipage-meta.xml'],
});

registerMetadataType({
  type: 'NamedCredential',
  label: 'Named Credential',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.namedCredential-meta.xml'],
});

registerMetadataType({
  type: 'RemoteSiteSetting',
  label: 'Remote Site Setting',
  supportsLocalScan: true,
  supportsToolingApi: true,
  supportsMetadataApi: true,
  fileExtensions: ['.remoteSite-meta.xml'],
});

registerMetadataType({
  type: 'Unknown',
  label: 'Unknown',
  supportsLocalScan: false,
  supportsToolingApi: false,
  supportsMetadataApi: false,
});
