import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import { App } from '../../src/webview/App';

import './styles.css';

interface WebviewState {
  results: DependencyResult[];
  components: ComponentRef[];
}

declare global {
  interface Window {
    __ORGTRACE_INITIAL_RESULT__?: DependencyResult | DependencyResult[];
    __ORGTRACE_INITIAL_COMPONENTS__?: ComponentRef[];
  }
}

const root = document.getElementById('root');

if (root) {
  const reactRoot = createRoot(root);
  let currentState: WebviewState = {
    results: Array.isArray(window.__ORGTRACE_INITIAL_RESULT__)
      ? window.__ORGTRACE_INITIAL_RESULT__
      : window.__ORGTRACE_INITIAL_RESULT__
        ? [window.__ORGTRACE_INITIAL_RESULT__]
        : [],
    components: window.__ORGTRACE_INITIAL_COMPONENTS__ ?? [],
  };

  const render = (state: WebviewState): void => {
    currentState = state;
    reactRoot.render(<App results={state.results} components={state.components} />);
  };

  render(currentState);

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'result') {
      const enriched = event.data.result as DependencyResult;
      const index = currentState.results.findIndex(
        (r) => r.target.apiName === enriched.target.apiName && r.target.type === enriched.target.type
      );

      if (index !== -1) {
        const nextResults = [...currentState.results];
        nextResults[index] = enriched;
        render({ ...currentState, results: nextResults });
      } else {
        render({ results: [enriched], components: [] });
      }
    }
    if (event.data?.type === 'results') {
      render({ results: event.data.results as DependencyResult[], components: [] });
    }
    if (event.data?.type === 'componentPicker') {
      render({ results: [], components: event.data.components as ComponentRef[] });
    }
  });
}
