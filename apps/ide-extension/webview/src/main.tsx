import React from 'react';
import { createRoot } from 'react-dom/client';
import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import { App } from '../../src/webview/App';
import { applyHostMessage, type WebviewState } from '../../src/webview/webviewState';

import './styles.css';

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
    render(applyHostMessage(currentState, event.data));
  });
}
