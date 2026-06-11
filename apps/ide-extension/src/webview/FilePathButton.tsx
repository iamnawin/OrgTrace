import type { WebviewToHostMessage } from '../messages';
import { postWebviewMessage } from './webviewMessaging';

export function openInEditorMessage(
  filePath: string,
  lineNumber?: number,
): WebviewToHostMessage {
  return {
    type: 'openInEditor',
    filePath,
    ...(lineNumber ? { lineNumber } : {}),
  };
}

interface FilePathButtonProps {
  filePath: string;
  lineNumber?: number;
  label?: string;
}

export function FilePathButton({
  filePath,
  lineNumber,
  label,
}: FilePathButtonProps): JSX.Element {
  const display = label ?? (lineNumber ? `${filePath}:${lineNumber}` : filePath);

  return (
    <button
      className="link-button"
      title={display}
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        postWebviewMessage(openInEditorMessage(filePath, lineNumber));
      }}
    >
      {display}
    </button>
  );
}
