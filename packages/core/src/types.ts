export type KnownMetadataType =
  | 'ApexClass'
  | 'ApexTrigger'
  | 'Flow'
  | 'LightningComponentBundle'
  | 'AuraDefinitionBundle'
  | 'CustomField'
  | 'CustomObject'
  | 'PermissionSet'
  | 'Profile'
  | 'ValidationRule'
  | 'WorkflowRule'
  | 'Report'
  | 'Dashboard'
  | 'CustomLabel'
  | 'CustomMetadata'
  | 'EmailTemplate'
  | 'LightningPage'
  | 'NamedCredential'
  | 'RemoteSiteSetting'
  | 'Unknown';

export type MetadataType = KnownMetadataType | (string & {});

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ReferenceSource =
  | 'LocalScan'
  | 'ToolingAPI'
  | 'MetadataAPI'
  | 'GitHistory'
  | 'UserInput';

export type RelationshipType =
  | 'References'
  | 'Invokes'
  | 'Imports'
  | 'ReadsField'
  | 'WritesField'
  | 'UsesObject'
  | 'UsesField'
  | 'UsesPermission'
  | 'UsesLabel'
  | 'Extends'
  | 'Tests'
  | 'Configures'
  | 'ParentObject'
  | 'ChildObject'
  | 'LookupTo'
  | 'MasterDetailTo'
  | 'HasField'
  | 'Unknown';

export interface ComponentRef {
  apiName: string;
  type: MetadataType;
  filePath?: string;
  id?: string;
  durableId?: string;
  namespace?: string;
  label?: string;
  description?: string;
  status?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  createdBy?: string;
  createdDate?: string;
}

export interface SourceLocation {
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  startLine?: number;
  endLine?: number;
}

export interface DependencyReference {
  source: ComponentRef;
  target: ComponentRef;
  relationshipType: RelationshipType;
  location?: SourceLocation;
  matchedText?: string;
  snippet?: string;
  confidence: ConfidenceLevel;
  dataSource: ReferenceSource;
  reason?: string;
}

export interface RiskScore {
  level: RiskLevel;
  score: number;
  reasons: string[];
  recommendations?: string[];
}

export interface ScanContext {
  projectPath?: string;
  orgAlias?: string;
  instanceUrl?: string;
  apiVersion?: string;
  branchName?: string;
  commitSha?: string;
}

export interface DependencyResult {
  target: ComponentRef;
  references: DependencyReference[];
  dependencies: DependencyReference[];
  risk: RiskScore;
  scannedAt: string;
  sources: ReferenceSource[];
  context?: ScanContext;
  warnings?: string[];
  errors?: string[];
}
