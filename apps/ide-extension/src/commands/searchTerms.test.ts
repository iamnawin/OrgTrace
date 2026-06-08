import { describe, expect, it } from 'vitest';
import { parseSearchTerms } from './searchTerms';

describe('parseSearchTerms', () => {
  it('treats a single value as one search term', () => {
    expect(parseSearchTerms('AccountAlertController')).toEqual(['AccountAlertController']);
  });

  it('splits comma-separated values and trims whitespace', () => {
    expect(parseSearchTerms('Account, Case.Account_Alert_Message__c, accountAlertPanel')).toEqual([
      'Account',
      'Case.Account_Alert_Message__c',
      'accountAlertPanel',
    ]);
  });

  it('drops empty values and duplicate exact terms', () => {
    expect(parseSearchTerms('Account,, Account,  ,Case')).toEqual(['Account', 'Case']);
  });
});
