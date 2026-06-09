export * from './SalesforceService';

export type SalesforceOrgContext = {
  instanceUrl: string;
  accessToken?: string;
  orgAlias?: string;
  apiVersion: string;
};
