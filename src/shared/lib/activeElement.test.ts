import { describe, expect, it } from 'vitest';

import { getFocusedElement } from './activeElement';

describe('getFocusedElement', () => {
  it('returns null where document/HTMLElement do not exist (this test environment)', () => {
    expect(() => getFocusedElement()).not.toThrow();
    expect(getFocusedElement()).toBeNull();
  });
});
