import { describe, expect, it } from 'vitest';

import en from './en.json';
import es from './es.json';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix === '' ? key : `${prefix}.${key}`),
  );
}

describe('translation catalogues', () => {
  it('expose an identical set of keys in es and en', () => {
    expect(flattenKeys(es).sort()).toEqual(flattenKeys(en).sort());
  });
});
