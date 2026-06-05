import React from 'react';
import { createRoot } from 'react-dom/client';
import type { DependencyResult } from '@orgtrace/core';
import { App } from '../../src/webview/App';

import './styles.css';

interface WebviewState {
  result?: DependencyResult;
}

declare global {
  interface Window {
    __ORGTRACE_INITIAL_RESULT__?: DependencyResult;
  }
}

const root = document.getElementById('root');

if (root) {
  const reactRoot = createRoot(root);
  const render = (state: WebviewState): void => {
    reactRoot.render(<App result={state.result} />);
  };

  render({ result: window.__ORGTRACE_INITIAL_RESULT__ });

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'result') {
      render({ result: event.data.result as DependencyResult });
    }
  });
}
