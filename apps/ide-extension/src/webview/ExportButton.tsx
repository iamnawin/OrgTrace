import { postWebviewMessage } from './webviewMessaging';

export function ExportButton(): JSX.Element {
  return (
    <button type="button" onClick={() => postWebviewMessage({ type: 'exportMarkdown' })}>
      Export
    </button>
  );
}
