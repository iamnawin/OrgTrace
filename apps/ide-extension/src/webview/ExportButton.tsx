import { postWebviewMessage } from './webviewMessaging';

export function ExportButton(): JSX.Element {
  return (
    <button className="export-button" type="button" onClick={() => postWebviewMessage({ type: 'exportMarkdown' })}>
      Export
    </button>
  );
}
