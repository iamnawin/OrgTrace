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
  const render = (state: WebviewState): void => {
    reactRoot.render(<App results={state.results} components={state.components} />);
  };

  const initialResult = window.__ORGTRACE_INITIAL_RESULT__;
  render({
    results: Array.isArray(initialResult) ? initialResult : initialResult ? [initialResult] : [],
    components: window.__ORGTRACE_INITIAL_COMPONENTS__ ?? [],
  });

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'result') {
      render({ results: [event.data.result as DependencyResult], components: [] });
    }
    if (event.data?.type === 'results') {
      render({ results: event.data.results as DependencyResult[], components: [] });
    }
    if (event.data?.type === 'componentPicker') {
      render({ results: [], components: event.data.components as ComponentRef[] });
    }
  });
}
