import test from 'node:test';
import assert from 'node:assert/strict';
import { Config, DEFAULT_MOBILE_MEDIA } from '../lib/index.js';

const unwrap = (value) => (value && typeof value.get === 'function' ? value.get() : value);

test('Config defaults resolve to four rules and enabled dock fix', () => {
  const config = Config({});
  const rules = unwrap(config.rules);
  assert.equal(rules.length, 4);
  assert.deepEqual(
    rules.map((rule) => rule.selector),
    ['[data-token-pet="true"]', '#mem-open', '[data-dsh-live2d-pet-root]', '[data-vrmpet3d="1"]'],
  );
  for (const rule of rules) {
    assert.equal(rule.enabled, true);
    assert.equal(rule.desktop, true);
    assert.equal(rule.mobile, false);
  }
  assert.equal(unwrap(config.mobileMedia), DEFAULT_MOBILE_MEDIA);
  assert.equal(unwrap(config.fixDockFallback), true);
});

test('every editable Config field is volatile', () => {
  const json = Config.toJSON();
  const root = json.refs[json.uid];
  for (const key of ['rules', 'mobileMedia', 'fixDockFallback']) {
    const ref = root.dict[key];
    assert.ok(ref, `${key} exists in schema`);
    assert.equal(json.refs[ref].meta.volatile, true, `${key} is volatile`);
  }
});

test('Config fills per-rule defaults for custom entries', () => {
  const config = Config({ rules: [{ selector: '#custom' }] });
  const [rule] = unwrap(config.rules);
  assert.equal(rule.selector, '#custom');
  assert.equal(rule.enabled, true);
  assert.equal(rule.desktop, true);
  assert.equal(rule.mobile, false);
});

test('Config rejects oversized rules, selectors, and media queries', () => {
  const rules = Array.from({ length: 201 }, (_value, index) => ({ selector: '#r' + index }));
  assert.throws(() => Config({ rules }), /length|<=|max/i);
  assert.throws(() => Config({ rules: [{ selector: 'x'.repeat(501) }] }), /length|<=|max/i);
  assert.throws(() => Config({ mobileMedia: 'x'.repeat(301) }), /length|<=|max/i);
});
