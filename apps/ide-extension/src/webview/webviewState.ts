import type { ComponentRef, DependencyResult } from '@orgtrace/core';
import type { HostToWebviewMessage } from '../messages';

export interface WebviewState {
  results: DependencyResult[];
  components: ComponentRef[];
}

export function applyHostMessage(
  state: WebviewState,
  message: HostToWebviewMessage,
): WebviewState {
  if (message.type === 'result') {
    const index = state.results.findIndex(
      (result) =>
        result.target.apiName === message.result.target.apiName &&
        result.target.type === message.result.target.type,
    );

    if (index === -1) {
      return {
        ...state,
        results: [message.result],
      };
    }

    const nextResults = [...state.results];
    nextResults[index] = message.result;
    return {
      ...state,
      results: nextResults,
    };
  }

  if (message.type === 'results') {
    return {
      ...state,
      results: message.results,
    };
  }

  if (message.type === 'componentPicker') {
    return {
      components: message.components,
      results: [],
    };
  }

  return state;
}
