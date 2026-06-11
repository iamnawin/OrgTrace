import * as path from 'path';

const META_XML_SUFFIX = '-meta.xml';

export const SPECIALIZED_META_XML_SUFFIXES = [
  '.flow-meta.xml',
  '.object-meta.xml',
  '.field-meta.xml',
  '.permissionset-meta.xml',
  '.profile-meta.xml',
  '.js-meta.xml',
  '.cls-meta.xml',
  '.trigger-meta.xml',
  '.validationRule-meta.xml',
] as const;

export function isMetadataXml(filePath: string): boolean {
  return filePath.endsWith(META_XML_SUFFIX);
}

export function isSpecializedMetadataXml(filePath: string): boolean {
  return SPECIALIZED_META_XML_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

export function metadataTypeFromXml(content: string): string | undefined {
  const match = content.match(/<([A-Za-z][\w-]*)(?:\s|>)/);
  return match?.[1];
}

export function metadataNameFromFile(filePath: string): string {
  const basename = path.basename(filePath);
  const metadataName = basename.endsWith(META_XML_SUFFIX)
    ? basename.slice(0, -META_XML_SUFFIX.length)
    : basename;
  const typeSeparatorIndex = metadataName.lastIndexOf('.');
  return typeSeparatorIndex === -1
    ? metadataName
    : metadataName.slice(0, typeSeparatorIndex);
}

export function extractMetadataDetails(content: string): {
  label?: string;
  description?: string;
  status?: string;
} {
  const label = content.match(/<label>(.*?)<\/label>/)?.[1];
  const description = content.match(/<description>(.*?)<\/description>/)?.[1];
  const status = content.match(/<status>(.*?)<\/status>/)?.[1];
  const details: {
    label?: string;
    description?: string;
    status?: string;
  } = {};

  if (label !== undefined) details.label = label;
  if (description !== undefined) details.description = description;
  if (status !== undefined) details.status = status;

  return details;
}
