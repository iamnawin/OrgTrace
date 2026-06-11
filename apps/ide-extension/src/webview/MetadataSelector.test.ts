import { describe, expect, it } from 'vitest';
import type { ComponentRef } from '@orgtrace/core';

import { applyTypeSelection, keyFor, type TypeGroup } from './MetadataSelector';

const flow: ComponentRef = {
  apiName: 'Account_Alert_Message',
  type: 'Flow',
  filePath: 'force-app/main/default/flows/Account_Alert_Message.flow-meta.xml',
};

const lwc: ComponentRef = {
  apiName: 'accountAlertPanel',
  type: 'LightningComponentBundle',
  filePath: 'force-app/main/default/lwc/accountAlertPanel',
};

function groupFor(component: ComponentRef): TypeGroup {
  return {
    type: component.type,
    label: component.type,
    components: [component],
  };
}

describe('MetadataSelector state helpers', () => {
  it('activates the metadata type when selecting it from the checkbox', () => {
    const state = applyTypeSelection(
      { activeType: flow.type, selectedKeys: new Set<string>() },
      groupFor(lwc),
      true,
    );

    expect(state.activeType).toBe('LightningComponentBundle');
    expect([...state.selectedKeys]).toEqual([keyFor(lwc)]);
  });

  it('keeps the metadata type visible when clearing it from the checkbox', () => {
    const state = applyTypeSelection(
      { activeType: flow.type, selectedKeys: new Set([keyFor(lwc)]) },
      groupFor(lwc),
      false,
    );

    expect(state.activeType).toBe('LightningComponentBundle');
    expect(state.selectedKeys.size).toBe(0);
  });
});
