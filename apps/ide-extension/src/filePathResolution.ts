export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory';
}

const PREFERRED_EXTENSIONS = ['.js', '.js-meta.xml', '.html', '.css', '.xml'];

export function preferredFileInDirectory(
  directoryPath: string,
  entries: DirectoryEntry[],
): string | undefined {
  const normalizedDirectory = directoryPath.replace(/\\/g, '/');
  const pathParts = normalizedDirectory.split('/').filter(Boolean);
  const directoryName = pathParts[pathParts.length - 1];
  const files = entries.filter((entry) => entry.type === 'file');

  if (directoryName) {
    for (const extension of PREFERRED_EXTENSIONS) {
      const preferredName = `${directoryName}${extension}`;
      const match = files.find((entry) => entry.name === preferredName);
      if (match) return `${directoryPath}/${match.name}`;
    }
  }

  const fallbackName = files
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))[0];

  return fallbackName ? `${directoryPath}/${fallbackName}` : undefined;
}
