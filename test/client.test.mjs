import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const CLIENT_PATH = fileURLToPath(new URL('../lib/client.js', import.meta.url));
const CODE = fs.readFileSync(CLIENT_PATH, 'utf8');
const DEFAULT_MEDIA = '(pointer: coarse) and (max-width: 1023px)';
const DEFAULT_RULES = [
  { id: 'token-pet', label: 'Token', selector: '[data-token-pet="true"]', enabled: true, desktop: true, mobile: false },
  { id: 'memento', label: 'Memory', selector: '#mem-open', enabled: true, desktop: true, mobile: false },
  { id: 'live2d-pet', label: 'Live2D', selector: '[data-dsh-live2d-pet-root]', enabled: true, desktop: true, mobile: false },
  { id: 'vrm-pet', label: 'VRM', selector: '[data-vrmpet3d="1"]', enabled: true, desktop: true, mobile: false },
];

function makeScope(value) {
  let current = value;
  const listeners = new Set();
  return {
    getSnapshot() {
      return { status: 'ready', writable: true, value: current };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getListenerCount() {
      return listeners.size;
    },
    set(path, next) {
      current = { ...current, [path]: next };
      for (const listener of listeners) listener();
      return Promise.resolve();
    },
  };
}

function makeMedia(initialMobile, badQuery) {
  const listeners = new Set();
  let matches = Boolean(initialMobile);
  const fn = (query) => {
    if (query === badQuery) throw new Error('invalid media query');
    return {
      media: query,
      get matches() {
        return matches;
      },
      addEventListener(type, listener) {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener(type, listener) {
        if (type === 'change') listeners.delete(listener);
      },
    };
  };
  return {
    fn,
    setMobile(value) {
      matches = Boolean(value);
      for (const listener of listeners) listener();
    },
  };
}

function makeHarness(options = {}) {
  const styleElements = [];
  const attributes = {};
  const documentElement = {
    setAttribute(name, value) {
      attributes[name] = value;
    },
    removeAttribute(name) {
      delete attributes[name];
    },
  };
  const document = {
    createElement(tagName) {
      return {
        tagName,
        dataset: {},
        textContent: '',
        id: '',
        remove() {
          const index = styleElements.indexOf(this);
          if (index >= 0) styleElements.splice(index, 1);
        },
      };
    },
    head: {
      appendChild(element) {
        styleElements.push(element);
      },
    },
    getElementById(id) {
      return styleElements.find((element) => element.id === id) || null;
    },
    documentElement,
  };
  let loaded;
  const media = makeMedia(options.initialMobile, options.badQuery);
  const window = {
    __ModuleLoader__: {
      load(registration) {
        loaded = registration;
      },
    },
    matchMedia: media.fn,
    location: { search: options.search || '' },
    __DSH_UI_VISIBILITY_TEST__: true,
  };
  const sandbox = { window, document, console, URLSearchParams };
  vm.createContext(sandbox);
  vm.runInContext(CODE, sandbox);
  assert.ok(loaded, 'client bundle registered a module');
  assert.equal(loaded.id, 'dsh-ui-visibility');

  const react = {
    createElement: () => ({}),
    useState: (value) => [value, () => {}],
    useEffect: () => {},
  };
  const moduleExports = loaded.factory((name) => {
    if (name === 'react') return react;
    throw new Error('unexpected require: ' + name);
  });

  const effects = [];
  let registration;
  const scope = options.scope;
  const ctx = {
    configForms: scope ? { get: () => scope } : undefined,
    get(name) {
      return name === 'configForms' ? ctx.configForms : undefined;
    },
    effect(callback) {
      const disposer = callback();
      if (typeof disposer === 'function') effects.push(disposer);
      return disposer;
    },
    slots: {
      inject(_name, callback) {
        return callback();
      },
      register(options, component) {
        registration = { options, component };
        return () => {};
      },
    },
  };

  moduleExports.apply(ctx);
  return { styleElements, attributes, effects, registration, scope, media, moduleExports };
}

function mainStyle(harness) {
  return harness.styleElements.find((element) => element.dataset.plugin === 'dsh-ui-visibility');
}

test('default rules hide desktop overlays on mobile and reposition dock fallback', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true }),
  });
  const css = mainStyle(harness).textContent;
  for (const selector of ['[data-token-pet="true"]', '#mem-open', '[data-dsh-live2d-pet-root]', '[data-vrmpet3d="1"]']) {
    assert.ok(css.includes('html[data-ui-vis-mobile="1"] ' + selector), `${selector} hidden on mobile`);
  }
  assert.ok(css.includes('[data-dsh-dock-fallback]'), 'dock fallback fix present');
  assert.equal(harness.attributes['data-ui-vis-mobile'], '0');
  assert.equal(harness.attributes['data-ui-vis-desktop'], '1');
  harness.media.setMobile(true);
  assert.equal(harness.attributes['data-ui-vis-mobile'], '1');
  assert.equal(harness.attributes['data-ui-vis-desktop'], '0');
});

test('dock fallback fix can be disabled', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: false }),
  });
  assert.ok(!mainStyle(harness).textContent.includes('[data-dsh-dock-fallback]'));
});

test('empty or custom rule lists replace defaults and update live', () => {
  const scope = makeScope({
    rules: [{ id: 'memento', label: 'Memory', selector: '#mem-open', enabled: true, desktop: true, mobile: false }],
    mobileMedia: DEFAULT_MEDIA,
    fixDockFallback: true,
  });
  const harness = makeHarness({ scope });
  let css = mainStyle(harness).textContent;
  assert.ok(css.includes('#mem-open'));
  assert.ok(!css.includes('[data-token-pet="true"]'));

  scope.set('rules', []);
  css = mainStyle(harness).textContent;
  assert.ok(!css.includes('#mem-open'));
  assert.ok(css.includes('[data-dsh-dock-fallback]'));
});

test('apply degrades gracefully when called without configForms (unit)', () => {
  const harness = makeHarness({});
  const css = mainStyle(harness).textContent;
  assert.ok(css.includes('[data-token-pet="true"]'));
  assert.equal(harness.attributes['data-ui-vis-mobile'], '0');
});

test('invalid media query falls back to the built-in default', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: '(bad', fixDockFallback: true }),
    badQuery: '(bad',
  });
  assert.equal(harness.attributes['data-ui-vis-mobile'], '0');
  assert.ok(mainStyle(harness).textContent.includes('[data-token-pet="true"]'));
});

test('unsafe selectors are ignored and the rule count is capped', () => {
  const rules = [
    { id: 'ok', label: 'ok', selector: '#ok', enabled: true, desktop: true, mobile: false },
    { id: 'bad-brace', label: 'bad', selector: '#bad} body { display:none }', enabled: true, desktop: true, mobile: false },
    { id: 'bad-long', label: 'long', selector: 'x'.repeat(501), enabled: true, desktop: true, mobile: false },
  ];
  for (let index = 0; index < 205; index += 1) {
    rules.push({ id: 'r' + index, label: '', selector: '#r' + index, enabled: true, desktop: true, mobile: false });
  }
  const harness = makeHarness({
    scope: makeScope({ rules, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true }),
  });
  const css = mainStyle(harness).textContent;
  assert.ok(css.includes('#ok'));
  assert.ok(!css.includes('body'));
  assert.ok(!css.includes('x'.repeat(501)));
  assert.ok(css.includes('#r196'), 'rule at index 199 is kept');
  assert.ok(!css.includes('#r197'), 'rule at index 200 is dropped');
});

test('comma-separated selectors gate every branch', () => {
  const harness = makeHarness({
    scope: makeScope({
      rules: [{ id: 'list', label: '', selector: '#a, #b', enabled: true, desktop: true, mobile: false }],
      mobileMedia: DEFAULT_MEDIA,
      fixDockFallback: false,
    }),
  });
  const css = mainStyle(harness).textContent;
  assert.ok(css.includes('html[data-ui-vis-mobile="1"] #a, html[data-ui-vis-mobile="1"] #b'));
  assert.ok(!css.includes('html[data-ui-vis-mobile="1"] #a, #b'));
});

test('protected DSH UI selectors are not emitted', () => {
  const harness = makeHarness({
    scope: makeScope({
      rules: [
        { id: 'body', label: '', selector: 'body', enabled: true, desktop: false, mobile: false },
        { id: 'root', label: '', selector: '#root > div', enabled: true, desktop: false, mobile: false },
        { id: 'approval', label: '', selector: '[data-approval-scroll]', enabled: true, desktop: false, mobile: false },
        { id: 'safe', label: '', selector: '#safe', enabled: true, desktop: true, mobile: false },
      ],
      mobileMedia: DEFAULT_MEDIA,
      fixDockFallback: false,
    }),
  });
  const css = mainStyle(harness).textContent;
  assert.ok(css.includes('#safe'));
  assert.ok(!css.includes('body'));
  assert.ok(!css.includes('#root'));
  assert.ok(!css.includes('data-approval'));
});

test('comments are rejected but child combinators are allowed', () => {
  const harness = makeHarness({
    scope: makeScope({
      rules: [
        { id: 'comment', label: '', selector: '#a /*', enabled: true, desktop: true, mobile: false },
        { id: 'child', label: '', selector: '#a > span', enabled: true, desktop: true, mobile: false },
      ],
      mobileMedia: DEFAULT_MEDIA,
      fixDockFallback: false,
    }),
  });
  const css = mainStyle(harness).textContent;
  assert.ok(!css.includes('/*'));
  assert.ok(css.includes('html[data-ui-vis-mobile="1"] #a > span'));
});

test('?uivis=off bypasses injected rules but keeps the settings section', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true }),
    search: '?uivis=off',
  });
  assert.equal(mainStyle(harness).textContent, '');
  assert.equal(harness.registration.options.name, 'settings.section');
  assert.equal(harness.attributes['data-ui-vis-mobile'], '0');
});

test('invalid media falls back even when matchMedia does not throw', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: '(bad', fixDockFallback: true }),
  });
  const css = mainStyle(harness).textContent;
  assert.ok(css.includes('[data-token-pet="true"]'));
  assert.ok(!css.includes('(bad'));
  assert.equal(harness.attributes['data-ui-vis-mobile'], '0');
});

test('store.save uses atomic mutate with the snapshot revision', async () => {
  const scope = makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true });
  const base = scope.getSnapshot.bind(scope);
  scope.getSnapshot = () => ({ ...base(), revision: 7 });
  const calls = [];
  scope.mutate = async (ops, revision) => {
    calls.push({ ops, revision });
    return true;
  };
  const harness = makeHarness({ scope });
  const store = harness.moduleExports.__test.createStore(scope);
  await store.save(DEFAULT_RULES, DEFAULT_MEDIA, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].revision, 7);
  assert.deepEqual(Array.from(calls[0].ops, (op) => op.path[0]), ['rules', 'mobileMedia', 'fixDockFallback']);
});

test('store.save rejects refusals, invalid drafts, and refused fallback writes', async () => {
  const scope = makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true });
  const harness = makeHarness({ scope });
  const store = harness.moduleExports.__test.createStore(scope);
  let calls = 0;
  scope.mutate = async () => {
    calls += 1;
    return false;
  };
  await assert.rejects(store.save(DEFAULT_RULES, DEFAULT_MEDIA, true), /拒绝/);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(
    store.save([{ id: 'body', selector: 'body', enabled: true, desktop: true, mobile: false }], DEFAULT_MEDIA, true),
    /关键界面/,
  );
  assert.equal(calls, 0);

  scope.mutate = undefined;
  scope.set = (field) => (field === 'mobileMedia' ? false : true);
  await assert.rejects(store.save(DEFAULT_RULES, DEFAULT_MEDIA, true), /拒绝/);
});

test('store.dispose releases the config subscription', () => {
  const scope = makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true });
  const harness = makeHarness({ scope });
  for (const dispose of harness.effects) dispose();
  const store = harness.moduleExports.__test.createStore(scope);
  assert.equal(scope.getListenerCount(), 1);
  store.dispose();
  assert.equal(scope.getListenerCount(), 0);
});

test('settings section registers and cleanup removes injected state', () => {
  const harness = makeHarness({
    scope: makeScope({ rules: DEFAULT_RULES, mobileMedia: DEFAULT_MEDIA, fixDockFallback: true }),
  });
  assert.equal(harness.registration.options.name, 'settings.section');
  assert.equal(harness.registration.options.id, 'dsh-ui-visibility');
  for (const dispose of harness.effects) dispose();
  assert.equal(mainStyle(harness), undefined);
  assert.equal(harness.attributes['data-ui-vis-mobile'], undefined);
  assert.equal(harness.attributes['data-ui-vis-desktop'], undefined);
});
