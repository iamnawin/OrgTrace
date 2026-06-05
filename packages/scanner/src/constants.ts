export const SFDX_PATTERNS = [
  '**/*.cls',
  '**/*.trigger',
  '**/*.js',
  '**/*.html',
  '**/*.flow-meta.xml',
  '**/*.object-meta.xml',
  '**/*.field-meta.xml',
  '**/*.permissionset-meta.xml',
  '**/*.profile-meta.xml',
];

export const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.sfdx/**',
  '**/.sf/**',
  '**/.git/**',
  '**/build/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/lwc/**/__tests__/**',
];

export const DEFAULT_CONCURRENCY = 50;
