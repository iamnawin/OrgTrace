import type { ComponentRef, MetadataType } from '@orgtrace/core';

export interface TypeDisplay {
  icon: string;
  label: string;
}

/** Display metadata for the component types surfaced by the picker. */
const TYPE_DISPLAY: Partial<Record<string, TypeDisplay>> = {
  Flow: { icon: 'symbol-event', label: 'Flow' },
  FlowDefinition: { icon: 'symbol-event', label: 'Flow Definition' },
  ApexClass: { icon: 'symbol-class', label: 'Apex Class' },
  ApexTrigger: { icon: 'symbol-event', label: 'Apex Trigger' },
  ApexComponent: { icon: 'symbol-method', label: 'Apex Component' },
  ApexPage: { icon: 'browser', label: 'Visualforce Page' },
  ApexTestSuite: { icon: 'beaker', label: 'Apex Test Suite' },
  AuraDefinitionBundle: { icon: 'symbol-method', label: 'Aura' },
  StaticResource: { icon: 'file-media', label: 'Static Resource' },
  CustomField: { icon: 'symbol-field', label: 'Field' },
  CustomObject: { icon: 'database', label: 'Object' },
  BusinessProcess: { icon: 'git-branch', label: 'Business Process' },
  CompactLayout: { icon: 'layout', label: 'Compact Layout' },
  CustomIndex: { icon: 'list-tree', label: 'Custom Index' },
  FieldSet: { icon: 'list-selection', label: 'Field Set' },
  GlobalValueSet: { icon: 'symbol-enum', label: 'Global Value Set' },
  Index: { icon: 'list-tree', label: 'Index' },
  ListView: { icon: 'list-flat', label: 'List View' },
  RecordType: { icon: 'symbol-enum-member', label: 'Record Type' },
  StandardValueSet: { icon: 'symbol-enum', label: 'Standard Value Set' },
  WebLink: { icon: 'link', label: 'Web Link' },
  LightningComponentBundle: { icon: 'symbol-method', label: 'LWC' },
  BrandingSet: { icon: 'paintcan', label: 'Branding Set' },
  CustomApplication: { icon: 'window', label: 'Custom Application' },
  CustomApplicationComponent: { icon: 'extensions', label: 'Custom Application Component' },
  CustomPageWebLink: { icon: 'link-external', label: 'Custom Page Web Link' },
  CustomSite: { icon: 'globe', label: 'Custom Site' },
  CustomTab: { icon: 'window', label: 'Custom Tab' },
  ExperienceBundle: { icon: 'globe', label: 'Experience Bundle' },
  FlexiPage: { icon: 'layout', label: 'Lightning Page' },
  LightningExperienceTheme: { icon: 'paintcan', label: 'Lightning Experience Theme' },
  LightningMessageChannel: { icon: 'radio-tower', label: 'Lightning Message Channel' },
  PermissionSet: { icon: 'shield', label: 'Permission Set' },
  PermissionSetGroup: { icon: 'shield', label: 'Permission Set Group' },
  MutingPermissionSet: { icon: 'shield', label: 'Muting Permission Set' },
  Profile: { icon: 'account', label: 'Profile' },
  CustomPermission: { icon: 'key', label: 'Custom Permission' },
  RestrictionRule: { icon: 'law', label: 'Restriction Rule' },
  Role: { icon: 'organization', label: 'Role' },
  SharingRules: { icon: 'references', label: 'Sharing Rules' },
  SharingSet: { icon: 'references', label: 'Sharing Set' },
  ValidationRule: { icon: 'checklist', label: 'Validation Rule' },
  WorkflowRule: { icon: 'gear', label: 'Workflow Rule' },
  ApprovalProcess: { icon: 'pass', label: 'Approval Process' },
  AssignmentRules: { icon: 'arrow-swap', label: 'Assignment Rules' },
  AutoResponseRules: { icon: 'reply', label: 'Auto Response Rules' },
  DuplicateRule: { icon: 'copy', label: 'Duplicate Rule' },
  EscalationRules: { icon: 'arrow-up', label: 'Escalation Rules' },
  MatchingRules: { icon: 'symbol-operator', label: 'Matching Rules' },
  PlatformEventSubscriberConfig: { icon: 'broadcast', label: 'Platform Event Subscriber Config' },
  Workflow: { icon: 'gear', label: 'Workflow' },
  WorkflowAlert: { icon: 'bell', label: 'Workflow Alert' },
  WorkflowFieldUpdate: { icon: 'edit', label: 'Workflow Field Update' },
  WorkflowOutboundMessage: { icon: 'send', label: 'Workflow Outbound Message' },
  WorkflowTask: { icon: 'checklist', label: 'Workflow Task' },
  Report: { icon: 'graph', label: 'Report' },
  ReportType: { icon: 'graph', label: 'Report Type' },
  Dashboard: { icon: 'dashboard', label: 'Dashboard' },
  CustomLabel: { icon: 'tag', label: 'Custom Label' },
  CustomMetadata: { icon: 'symbol-namespace', label: 'Custom Metadata' },
  CustomSetting: { icon: 'settings-gear', label: 'Custom Setting' },
  EmailTemplate: { icon: 'mail', label: 'Email Template' },
  EmailServicesFunction: { icon: 'mail', label: 'Email Services Function' },
  CustomNotificationType: { icon: 'bell', label: 'Custom Notification Type' },
  PlatformEventChannel: { icon: 'broadcast', label: 'Platform Event Channel' },
  PlatformEventChannelMember: { icon: 'broadcast', label: 'Platform Event Channel Member' },
  LightningPage: { icon: 'layout', label: 'Lightning Page' },
  AuthProvider: { icon: 'key', label: 'Auth Provider' },
  Certificate: { icon: 'verified', label: 'Certificate' },
  ConnectedApp: { icon: 'plug', label: 'Connected App' },
  CorsWhitelistOrigin: { icon: 'globe', label: 'CORS Whitelist Origin' },
  CSPTrustedSite: { icon: 'shield', label: 'CSP Trusted Site' },
  ExternalCredential: { icon: 'key', label: 'External Credential' },
  ExternalDataSource: { icon: 'database', label: 'External Data Source' },
  ExternalServiceRegistration: { icon: 'plug', label: 'External Service Registration' },
  NamedCredential: { icon: 'key', label: 'Named Credential' },
  RemoteSiteSetting: { icon: 'globe', label: 'Remote Site Setting' },
  SamlSsoConfig: { icon: 'key', label: 'SAML SSO Config' },
  ContentAsset: { icon: 'file-media', label: 'Content Asset' },
  Document: { icon: 'file', label: 'Document' },
  Folder: { icon: 'folder', label: 'Folder' },
  NavigationMenu: { icon: 'menu', label: 'Navigation Menu' },
  Network: { icon: 'globe', label: 'Network' },
  SiteDotCom: { icon: 'globe', label: 'Site.com' },
  Queue: { icon: 'inbox', label: 'Queue' },
  Settings: { icon: 'settings-gear', label: 'Settings' },
  Translations: { icon: 'globe', label: 'Translations' },
};

const FALLBACK_DISPLAY: TypeDisplay = { icon: 'symbol-misc', label: 'Component' };

function labelFromMetadataType(type: MetadataType): string {
  if (type === 'Unknown') return FALLBACK_DISPLAY.label;
  return type.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

export function displayFor(type: MetadataType): TypeDisplay {
  return TYPE_DISPLAY[type] ?? { icon: FALLBACK_DISPLAY.icon, label: labelFromMetadataType(type) };
}

/**
 * Group ordering for the picker, tuned for Salesforce impact analysis: surface
 * automation/code first, then fields/objects, then everything else. Types absent
 * from this list sort last (in their original relative order).
 */
export const GROUP_ORDER: MetadataType[] = [
  'Flow',
  'FlowDefinition',
  'ApexClass',
  'ApexTrigger',
  'ApexComponent',
  'ApexPage',
  'ApexTestSuite',
  'CustomField',
  'CustomObject',
  'RecordType',
  'BusinessProcess',
  'CompactLayout',
  'FieldSet',
  'GlobalValueSet',
  'StandardValueSet',
  'ListView',
  'WebLink',
  'LightningComponentBundle',
  'AuraDefinitionBundle',
  'StaticResource',
  'FlexiPage',
  'LightningPage',
  'LightningMessageChannel',
  'CustomApplication',
  'CustomApplicationComponent',
  'CustomTab',
  'CustomPageWebLink',
  'BrandingSet',
  'LightningExperienceTheme',
  'CustomSite',
  'ExperienceBundle',
  'NavigationMenu',
  'PermissionSet',
  'PermissionSetGroup',
  'MutingPermissionSet',
  'Profile',
  'CustomPermission',
  'RestrictionRule',
  'Role',
  'SharingRules',
  'SharingSet',
  'ValidationRule',
  'ApprovalProcess',
  'AssignmentRules',
  'AutoResponseRules',
  'DuplicateRule',
  'EscalationRules',
  'MatchingRules',
  'PlatformEventSubscriberConfig',
  'Workflow',
  'WorkflowRule',
  'WorkflowAlert',
  'WorkflowFieldUpdate',
  'WorkflowOutboundMessage',
  'WorkflowTask',
  'Report',
  'ReportType',
  'Dashboard',
  'CustomLabel',
  'CustomMetadata',
  'CustomSetting',
  'EmailTemplate',
  'EmailServicesFunction',
  'CustomNotificationType',
  'PlatformEventChannel',
  'PlatformEventChannelMember',
  'AuthProvider',
  'Certificate',
  'ConnectedApp',
  'CorsWhitelistOrigin',
  'CSPTrustedSite',
  'ExternalCredential',
  'ExternalDataSource',
  'ExternalServiceRegistration',
  'NamedCredential',
  'RemoteSiteSetting',
  'SamlSsoConfig',
  'ContentAsset',
  'Document',
  'Folder',
  'Network',
  'SiteDotCom',
  'Queue',
  'Settings',
  'Translations',
];

function groupRank(type: MetadataType): number {
  const index = GROUP_ORDER.indexOf(type);
  return index === -1 ? GROUP_ORDER.length : index;
}

/** A type heading rendered as a non-selectable QuickPick separator row. */
export interface ComponentSeparatorModel {
  kind: 'separator';
  label: string;
}

/** A selectable component row carrying its source {@link ComponentRef}. */
export interface ComponentItemModel {
  kind: 'item';
  label: string;
  description: string;
  detail?: string;
  componentRef: ComponentRef;
}

export type ComponentPickModel = ComponentSeparatorModel | ComponentItemModel;

function toItem(ref: ComponentRef): ComponentItemModel {
  const display = displayFor(ref.type);
  const name = ref.label ?? ref.apiName;
  return {
    kind: 'item',
    label: `$(${display.icon}) ${display.label}: ${name}`,
    description: display.label,
    ...(ref.filePath ? { detail: ref.filePath } : {}),
    componentRef: ref,
  };
}

/**
 * Builds the QuickPick model for discovered components, inserting a separator
 * heading before each metadata type group. Reorders groups into {@link GROUP_ORDER}
 * (impact-analysis priority) while preserving each item's relative order within
 * its group; consecutive items of the same type share one heading.
 */
export function buildComponentPicks(refs: ComponentRef[]): ComponentPickModel[] {
  const ordered = [...refs].sort((a, b) => groupRank(a.type) - groupRank(b.type));
  const models: ComponentPickModel[] = [];
  let currentType: MetadataType | undefined;

  for (const ref of ordered) {
    if (ref.type !== currentType) {
      currentType = ref.type;
      models.push({ kind: 'separator', label: displayFor(ref.type).label });
    }
    models.push(toItem(ref));
  }

  return models;
}

/** The raw, unresolved target used when discovery returns no matches. */
export function rawFallbackRef(query: string): ComponentRef {
  return { apiName: query, type: 'Unknown' satisfies MetadataType };
}
