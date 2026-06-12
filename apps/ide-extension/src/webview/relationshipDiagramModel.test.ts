import { describe, expect, it } from 'vitest';
import type { ComponentRef, DependencyReference } from '@orgtrace/core';

import { buildDiagramClusters } from './relationshipDiagramModel';

const target: ComponentRef = { apiName: 'CNT_Inventory_FileUploadLWC', type: 'ApexClass' };

function inboundRef(
  source: ComponentRef,
  relationshipType: DependencyReference['relationshipType'],
  lineNumber?: number,
): DependencyReference {
  return {
    source,
    target,
    relationshipType,
    confidence: 'High',
    dataSource: 'LocalScan',
    ...(lineNumber
      ? { location: { filePath: source.filePath ?? 'unknown', lineNumber } }
      : {}),
  };
}

const testClass: ComponentRef = {
  apiName: 'CNT_Inventory_FileUploadLWC_Test',
  type: 'ApexClass',
  filePath: 'force-app/main/default/classes/CNT_Inventory_FileUploadLWC_Test.cls',
};
const childClass: ComponentRef = {
  apiName: 'CNT_Inventory_Child',
  type: 'ApexClass',
  filePath: 'force-app/main/default/classes/CNT_Inventory_Child.cls',
};
const lwc: ComponentRef = {
  apiName: 'inventoryFileUpload',
  type: 'LightningComponentBundle',
  filePath: 'force-app/main/default/lwc/inventoryFileUpload',
};

describe('buildDiagramClusters', () => {
  it('collapses repeated references to one node per component with a count', () => {
    const clusters = buildDiagramClusters(
      [
        inboundRef(testClass, 'Tests', 10),
        inboundRef(testClass, 'Invokes', 22),
        inboundRef(testClass, 'Invokes', 31),
        inboundRef(childClass, 'Extends', 1),
      ],
      'inbound',
    );

    expect(clusters).toHaveLength(1);
    const nodes = clusters[0]!.nodes;
    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.component.apiName).toBe('CNT_Inventory_FileUploadLWC_Test');
    expect(nodes[0]!.referenceCount).toBe(3);
    expect(nodes[0]!.relationships).toEqual(['Invokes', 'Tests']);
    expect(nodes[1]!.component.apiName).toBe('CNT_Inventory_Child');
  });

  it('groups nodes into clusters by metadata type so all component kinds stay visible', () => {
    const clusters = buildDiagramClusters(
      [
        inboundRef(lwc, 'Invokes', 4),
        inboundRef(testClass, 'Tests', 10),
      ],
      'inbound',
    );

    expect(clusters.map((cluster) => cluster.type)).toEqual([
      'ApexClass',
      'LightningComponentBundle',
    ]);
    expect(clusters[1]!.nodes[0]!.component.apiName).toBe('inventoryFileUpload');
  });

  it('describes where the component is used with count, relationship, and location', () => {
    const clusters = buildDiagramClusters([inboundRef(testClass, 'Tests', 10)], 'inbound');
    const node = clusters[0]!.nodes[0]!;

    expect(node.description).toBe(
      '1 reference · Tests · force-app/main/default/classes/CNT_Inventory_FileUploadLWC_Test.cls:10',
    );
    expect(node.location).toEqual({
      filePath: 'force-app/main/default/classes/CNT_Inventory_FileUploadLWC_Test.cls',
      lineNumber: 10,
    });
  });

  it('uses the dependency target for outbound references', () => {
    const outbound: DependencyReference = {
      source: target,
      target: childClass,
      relationshipType: 'Invokes',
      confidence: 'High',
      dataSource: 'LocalScan',
    };

    const clusters = buildDiagramClusters([outbound], 'outbound');
    expect(clusters[0]!.nodes[0]!.component.apiName).toBe('CNT_Inventory_Child');
  });
});
