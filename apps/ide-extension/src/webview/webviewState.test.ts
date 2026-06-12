import { describe, expect, it } from 'vitest';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';

import { applyHostMessage, type WebviewState } from './webviewState';

function component(apiName: string): ComponentRef {
  return {
    apiName,
    type: 'Flow',
  };
}

function result(apiName: string, score = 0): DependencyResult {
  return {
    dependencies: [],
    references: [],
    risk: {
      level: score >= 25 ? 'Medium' : 'Low',
      reasons: [],
      score,
    },
    scannedAt: '2026-06-11T00:00:00.000Z',
    sources: ['LocalScan'],
    target: {
      apiName,
      type: 'Flow',
    },
  };
}

describe('webview state updates', () => {
  it('keeps component picker data when batch results arrive', () => {
    const state: WebviewState = {
      components: [component('FlowA')],
      results: [],
    };
    const next = applyHostMessage(state, {
      results: [result('FlowA')],
      type: 'results',
    });

    expect(next.components).toEqual(state.components);
    expect(next.results).toHaveLength(1);
  });

  it('keeps component picker data when a new single result arrives', () => {
    const state: WebviewState = {
      components: [component('FlowA'), component('FlowB')],
      results: [result('FlowA')],
    };
    const next = applyHostMessage(state, {
      result: result('FlowB', 30),
      type: 'result',
    });

    expect(next.components).toEqual(state.components);
    expect(next.results).toEqual([expect.objectContaining({ target: expect.objectContaining({ apiName: 'FlowB' }) })]);
  });

  it('returns a new results array when the same target is re-analyzed', () => {
    const state: WebviewState = {
      components: [component('FlowA')],
      results: [result('FlowA')],
    };
    const next = applyHostMessage(state, {
      result: result('FlowA', 30),
      type: 'result',
    });

    // The webview switches from selector back to results on array identity,
    // so an in-place replacement must still produce a fresh array.
    expect(next.results).not.toBe(state.results);
    expect(next.results).toHaveLength(1);
    expect(next.results[0]?.risk.score).toBe(30);
  });

  it('clears results only when the host sends a fresh component picker', () => {
    const next = applyHostMessage(
      {
        components: [],
        results: [result('FlowA')],
      },
      {
        components: [component('FlowB')],
        type: 'componentPicker',
      },
    );

    expect(next).toEqual({
      components: [component('FlowB')],
      results: [],
    });
  });
});
