import type { FileParser } from '../types';
import { apexParser } from './apexParser';
import { flowParser } from './flowParser';
import { lwcJsParser } from './lwcJsParser';
import { lwcHtmlParser } from './lwcHtmlParser';
import { objectFieldParser } from './objectFieldParser';
import { permissionSetParser } from './permissionSetParser';

export const fileParsers: FileParser[] = [
  apexParser,
  flowParser,
  lwcJsParser,
  lwcHtmlParser,
  objectFieldParser,
  permissionSetParser,
];
