import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushTargetPath } from '@/lib/pushRegistration';

test('push tap opens only in-app paths', () => {
  assert.equal(pushTargetPath({ url: '/feed?post=1' }), '/feed?post=1');
  assert.equal(pushTargetPath({ url: '/venues/abc' }), '/venues/abc');
  assert.equal(pushTargetPath({ url: 'https://evil.example' }), null);
  assert.equal(pushTargetPath({ url: '//evil.example' }), null);
  assert.equal(pushTargetPath({}), null);
  assert.equal(pushTargetPath(null), null);
});
