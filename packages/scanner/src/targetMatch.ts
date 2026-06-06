import type { ComponentRef } from '@orgtrace/core';

/**
 * The substring a parser searches file content for.
 *
 * A qualified CustomField target (e.g. `Case.Account_Alert_Message__c`) is
 * searched by its bare field name (`Account_Alert_Message__c`) so that both
 * object-qualified (`Object.Field`) and bare (`Field`) occurrences in Apex,
 * Flow XML, LWC, and permission set metadata are still matched. The emitted
 * reference keeps the fully qualified `target.apiName` so callers can
 * disambiguate fields that share an API name across objects.
 *
 * Non-field targets are returned unchanged, preserving existing behavior.
 */
export function targetSearchTerm(target: ComponentRef): string {
  if (target.type === 'CustomField') {
    const dot = target.apiName.lastIndexOf('.');
    if (dot >= 0) return target.apiName.slice(dot + 1);
  }
  return target.apiName;
}
