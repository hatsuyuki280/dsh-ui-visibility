// SPDX-License-Identifier: MIT
// dsh-ui-visibility — browser half.
//
// Injects one <style> tag whose rules are gated by two attributes on <html>:
//   html[data-ui-vis-mobile="1"]  → media query currently matches a phone
//   html[data-ui-vis-desktop="1"] → media query does not match
// The settings page edits the rule list through ctx.configForms; saving a
// change re-renders the style tag immediately, with no reload.

;(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.__ModuleLoader__ || !window.__ModuleLoader__.load) return;

  window.__ModuleLoader__.load({
    id: 'dsh-ui-visibility',
    factory: function (require) {
      var react = require('react');
      var module = { exports: {} };
      var exports = module.exports;

      var ENTRY_ID = 'ui-visibility';
      var DEFAULT_MEDIA = '(pointer: coarse) and (max-width: 1023px)';
      var MAX_RULES = 200;
      var MAX_SELECTOR_LENGTH = 500;
      var MAX_MEDIA_LENGTH = 300;
      var DEFAULT_RULES = [
        {
          id: 'token-pet',
          label: 'Token 吉祥物',
          selector: '[data-token-pet="true"]',
          enabled: true,
          desktop: true,
          mobile: false,
        },
        {
          id: 'memento',
          label: 'Memory 浮窗',
          selector: '#mem-open',
          enabled: true,
          desktop: true,
          mobile: false,
        },
        {
          id: 'live2d-pet',
          label: 'Live2D 桌宠',
          selector: '[data-dsh-live2d-pet-root]',
          enabled: true,
          desktop: true,
          mobile: false,
        },
        {
          id: 'vrm-pet',
          label: 'VRM 桌宠',
          selector: '[data-vrmpet3d="1"]',
          enabled: true,
          desktop: true,
          mobile: false,
        },
      ];

      function copyRule(rule) {
        return {
          id: rule.id || '',
          label: rule.label || '',
          selector: rule.selector || '',
          enabled: rule.enabled !== false,
          desktop: rule.desktop !== false,
          mobile: rule.mobile === true,
        };
      }

      function normalizeRule(rule) {
        if (rule === null || typeof rule !== 'object') return copyRule({});
        return copyRule(rule);
      }

      function readConfig(scope) {
        var snapshot;
        try {
          snapshot = scope && typeof scope.getSnapshot === 'function' ? scope.getSnapshot() : undefined;
        } catch (error) {
          snapshot = undefined;
        }
        var value = snapshot && snapshot.value && typeof snapshot.value === 'object' ? snapshot.value : {};
        var rules = Array.isArray(value.rules) ? value.rules.map(normalizeRule) : DEFAULT_RULES.map(copyRule);
        var media = safeMedia(value.mobileMedia) || DEFAULT_MEDIA;
        return {
          ready: !!(snapshot && snapshot.status === 'ready'),
          writable: !!(snapshot && snapshot.writable === true),
          revision: snapshot && typeof snapshot.revision === 'number' ? snapshot.revision : undefined,
          rules: rules,
          mobileMedia: media,
          fixDockFallback: value.fixDockFallback !== false,
        };
      }

      function createStore(scope) {
        var state = readConfig(scope);
        var listeners = new Set();
        function refresh() {
          state = readConfig(scope);
          listeners.forEach(function (listener) {
            listener();
          });
        }
        var offScope = scope && typeof scope.subscribe === 'function' ? scope.subscribe(refresh) : null;
        return {
          getSnapshot: function () {
            return state;
          },
          subscribe: function (listener) {
            listeners.add(listener);
            return function () {
              listeners.delete(listener);
            };
          },
          dispose: function () {
            if (typeof offScope === 'function') offScope();
            offScope = null;
          },
          save: function (rules, mobileMedia, fixDockFallback) {
            if (!scope) return Promise.reject(new Error('配置服务不可用'));
            var validation = validateDraft(rules, mobileMedia);
            if (validation) return Promise.reject(new Error(validation));
            var value = fixDockFallback !== false;
            var expected = state.revision;
            function setChecked(field, next) {
              return Promise.resolve().then(function () {
                var accepted = scope.set(field, next);
                if (accepted === false) throw new Error('配置写入被拒绝');
              });
            }
            var atomic = typeof scope.mutate === 'function'
              ? Promise.resolve().then(function () {
                  return scope.mutate([
                    { op: 'set', path: ['rules'], value: rules },
                    { op: 'set', path: ['mobileMedia'], value: mobileMedia },
                    { op: 'set', path: ['fixDockFallback'], value: value },
                  ], expected);
                }).then(function (accepted) {
                  if (accepted === false) throw new Error('配置写入被拒绝');
                })
              : setChecked('rules', rules)
                  .then(function () { return setChecked('mobileMedia', mobileMedia); })
                  .then(function () { return setChecked('fixDockFallback', value); });
            return atomic.then(function () {
              refresh();
            });
          },
        };
      }

      function balanced(text) {
        var paren = 0;
        var bracket = 0;
        var quote = '';
        var escaped = false;
        for (var index = 0; index < text.length; index += 1) {
          var ch = text.charAt(index);
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (quote) {
            if (ch === quote) quote = '';
            continue;
          }
          if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
          }
          if (ch === '(') paren += 1;
          else if (ch === ')') {
            paren -= 1;
            if (paren < 0) return false;
          } else if (ch === '[') bracket += 1;
          else if (ch === ']') {
            bracket -= 1;
            if (bracket < 0) return false;
          }
        }
        return !quote && !escaped && paren === 0 && bracket === 0;
      }

      function splitSelectorList(selector) {
        var parts = [];
        var start = 0;
        var paren = 0;
        var bracket = 0;
        var quote = '';
        var escaped = false;
        for (var index = 0; index < selector.length; index += 1) {
          var ch = selector.charAt(index);
          if (escaped) {
            escaped = false;
            continue;
          }
          if (ch === '\\') {
            escaped = true;
            continue;
          }
          if (quote) {
            if (ch === quote) quote = '';
            continue;
          }
          if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
          }
          if (ch === '(') paren += 1;
          else if (ch === ')') {
            if (paren > 0) paren -= 1;
          } else if (ch === '[') bracket += 1;
          else if (ch === ']') {
            if (bracket > 0) bracket -= 1;
          } else if (ch === ',' && paren === 0 && bracket === 0) {
            parts.push(selector.slice(start, index).trim());
            start = index + 1;
          }
        }
        parts.push(selector.slice(start).trim());
        return parts.filter(function (part) { return part.length > 0; });
      }

      function isValidSelector(selector) {
        if (typeof document !== 'undefined' && document.querySelector) {
          try {
            document.querySelector(selector);
            return true;
          } catch (error) {
            return false;
          }
        }
        if (typeof CSSStyleSheet === 'function') {
          try {
            new CSSStyleSheet().insertRule('html ' + selector + ' { }', 0);
            return true;
          } catch (error) {
            return false;
          }
        }
        return true;
      }

      function safeSelector(selector) {
        var text = String(selector || '').trim();
        if (text.length === 0 || text.length > MAX_SELECTOR_LENGTH) return '';
        if (/[{}<]/.test(text)) return '';
        if (/\/\*|\*\//.test(text)) return '';
        if (/[\u0000-\u001F\u007F]/.test(text)) return '';
        if (!balanced(text)) return '';
        if (!isValidSelector(text)) return '';
        return text;
      }

      function gateSelector(prefix, selector) {
        var parts = splitSelectorList(selector);
        if (parts.length === 0) return '';
        return parts.map(function (part) { return prefix + part; }).join(', ');
      }

      function safeMedia(query) {
        var text = String(query || '').trim();
        if (text.length === 0 || text.length > MAX_MEDIA_LENGTH) return '';
        if (/[{}<]/.test(text)) return '';
        if (/\/\*|\*\//.test(text)) return '';
        if (/[\u0000-\u001F\u007F]/.test(text)) return '';
        if (!balanced(text)) return '';
        if (typeof CSSStyleSheet === 'function') {
          try {
            new CSSStyleSheet().insertRule('@media ' + text + ' { }', 0);
          } catch (error) {
            return '';
          }
        }
        return text;
      }

      var PROTECTED_SYNTAX = /(^|[\s>+~,(])(html|body|#root|:root|\*)(?=$|[\s>+~,)#.:[])/i;
      var PROTECTED_HOOKS = /data-approval|role\s*=\s*["']?dialog|\.uivis-page|data-slot\s*=\s*["']?sidebar/i;
      var PROTECTED_ROOTS = 'html, body, #root, [data-approval-scroll], [data-approval-actions], [role="dialog"], .uivis-page, [data-slot="sidebar"]';
      var PROTECTED_CONTAINERS = '[data-approval-scroll], [data-approval-actions], [role="dialog"], .uivis-page, [data-slot="sidebar"]';

      function isProtectedSelector(selector) {
        var text = String(selector || '');
        if (PROTECTED_SYNTAX.test(text) || PROTECTED_HOOKS.test(text)) return true;
        if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return false;
        var roots;
        try {
          roots = document.querySelectorAll(PROTECTED_ROOTS);
        } catch (error) {
          return false;
        }
        for (var index = 0; index < roots.length; index += 1) {
          var node = roots[index];
          try {
            if (node.matches(selector) || node.closest(selector)) return true;
            if (node.matches(PROTECTED_CONTAINERS) && node.querySelector(selector)) return true;
          } catch (error) {
            return true;
          }
        }
        return false;
      }

      function isBypassed() {
        try {
          if (typeof URLSearchParams !== 'function') return false;
          var search = window.location && window.location.search ? window.location.search : '';
          return new URLSearchParams(search).get('uivis') === 'off';
        } catch (error) {
          return false;
        }
      }

      function validateDraft(rules, mobileMedia) {
        if (!Array.isArray(rules)) return '规则格式无效';
        if (rules.length > MAX_RULES) return '最多支持 ' + MAX_RULES + ' 条规则';
        for (var index = 0; index < rules.length; index += 1) {
          var rule = rules[index];
          if (!rule || typeof rule !== 'object') return '第 ' + (index + 1) + ' 条规则格式无效';
          var selector = safeSelector(rule.selector);
          if (!selector) return '第 ' + (index + 1) + ' 条规则的选择器无效';
          if (isProtectedSelector(selector)) return '第 ' + (index + 1) + ' 条规则不能隐藏 DSH 关键界面';
        }
        if (!safeMedia(mobileMedia)) return '手机端媒体查询无效';
        return '';
      }

      function addMediaListener(media, listener) {
        if (typeof media.addEventListener === 'function') media.addEventListener('change', listener);
        else if (typeof media.addListener === 'function') media.addListener(listener);
      }

      function removeMediaListener(media, listener) {
        if (typeof media.removeEventListener === 'function') media.removeEventListener('change', listener);
        else if (typeof media.removeListener === 'function') media.removeListener(listener);
      }

      function buildCss(rules, fixDockFallback) {
        var out = [];
        var limit = Math.min(rules.length, MAX_RULES);
        for (var index = 0; index < limit; index += 1) {
          var rule = rules[index];
          if (!rule || rule.enabled === false) continue;
          var selector = safeSelector(rule.selector);
          if (selector.length === 0 || isProtectedSelector(selector)) continue;
          if (rule.mobile !== true) {
            var mobileGate = gateSelector('html[data-ui-vis-mobile="1"] ', selector);
            if (mobileGate) out.push(mobileGate + ' { display: none !important; }');
          }
          if (rule.desktop !== true) {
            var desktopGate = gateSelector('html[data-ui-vis-desktop="1"] ', selector);
            if (desktopGate) out.push(desktopGate + ' { display: none !important; }');
          }
        }
        if (fixDockFallback) {
          out.push(
            'html[data-ui-vis-mobile="1"] [data-dsh-dock-fallback] { top: 60px !important; top: calc(env(safe-area-inset-top, 0px) + 60px) !important; left: 10px !important; right: auto !important; bottom: auto !important; }',
          );
        }
        return out.join('\n');
      }

      function serviceOf(ctx, name) {
        try {
          return ctx && typeof ctx.get === 'function' ? ctx.get(name) : undefined;
        } catch (error) {
          return undefined;
        }
      }

      var SETTINGS_CSS = [
        '.uivis-page{display:flex;flex-direction:column;gap:12px;padding:16px;min-width:0;',
        'font:var(--dsw-font-xs-13,13px/1.5 system-ui,sans-serif);color:var(--dsw-alias-label-primary,#111)}',
        '.uivis-title{margin:0;font-size:16px;font-weight:600}',
        '.uivis-desc{margin:0;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#666)}',
        '.uivis-note{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-warn-label,#8a6d3b)}',
        '.uivis-list{display:flex;flex-direction:column;gap:8px}',
        '.uivis-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr) auto;gap:8px;align-items:end;',
        'border:1px solid var(--dsw-alias-border-l1,#ddd);border-radius:8px;padding:8px}',
        '.uivis-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
        '.uivis-label{font-size:11px;color:var(--dsw-alias-label-tertiary,#888)}',
        '.uivis-input{height:28px;min-width:0;border:1px solid var(--dsw-alias-border-l1,#ccc);border-radius:6px;',
        'padding:0 8px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;font:inherit}',
        '.uivis-input.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}',
        '.uivis-toggles{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;justify-content:flex-end}',
        '.uivis-toggle{display:inline-flex;gap:4px;align-items:flex-start;white-space:normal;line-height:1.5}',
        '.uivis-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
        '.uivis-btn{height:28px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2,#bbb);border-radius:6px;',
        'background:var(--dsw-alias-bg-layer-2,#f5f5f5);color:inherit;cursor:pointer;font:inherit}',
        '.uivis-btn.primary{background:var(--dsw-alias-state-business-primary,#3b82f6);border-color:transparent;color:#fff}',
        '.uivis-btn.danger{color:var(--dsw-alias-state-error-primary,#c00)}',
        '.uivis-btn:disabled{opacity:.5;cursor:default}',
        '.uivis-status{font-size:12px;color:var(--dsw-alias-label-tertiary,#888)}',
        '@media (max-width:700px){.uivis-row{grid-template-columns:minmax(0,1fr)}}',
      ].join('');

      function useStore(store) {
        var pair = react.useState(store.getSnapshot());
        var snapshot = pair[0];
        var setSnapshot = pair[1];
        react.useEffect(function () {
          return store.subscribe(function () {
            setSnapshot(store.getSnapshot());
          });
        }, []);
        return snapshot;
      }

      function createVisibilitySection(visibilityStore) {
        return function VisibilitySection() {
        var snapshot = useStore(visibilityStore);
        var draftPair = react.useState(null);
        var draft = draftPair[0];
        var setDraft = draftPair[1];
        var statusPair = react.useState('');
        var status = statusPair[0];
        var setStatus = statusPair[1];
        var busyPair = react.useState(false);
        var busy = busyPair[0];
        var setBusy = busyPair[1];

        var rules = draft ? draft.rules : snapshot.rules;
        var mobileMedia = draft ? draft.mobileMedia : snapshot.mobileMedia;
        var fixDockFallback = draft ? draft.fixDockFallback : snapshot.fixDockFallback;

        function ensureDraft() {
          if (draft) return draft;
          var next = {
            rules: snapshot.rules.map(copyRule),
            mobileMedia: snapshot.mobileMedia,
            fixDockFallback: snapshot.fixDockFallback,
          };
          setDraft(next);
          return next;
        }

        function updateRule(index, patch) {
          var current = ensureDraft();
          var nextRules = current.rules.map(function (rule, at) {
            return at === index ? Object.assign({}, rule, patch) : rule;
          });
          setDraft({ rules: nextRules, mobileMedia: current.mobileMedia, fixDockFallback: current.fixDockFallback });
          setStatus('');
        }

        function addRule() {
          var current = ensureDraft();
          if (current.rules.length >= MAX_RULES) {
            setStatus('最多支持 ' + MAX_RULES + ' 条规则');
            return;
          }
          var nextRules = current.rules.concat([
            {
              id: 'rule-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              label: '新规则',
              selector: '',
              enabled: true,
              desktop: true,
              mobile: true,
            },
          ]);
          setDraft({ rules: nextRules, mobileMedia: current.mobileMedia, fixDockFallback: current.fixDockFallback });
          setStatus('');
        }

        function removeRule(index) {
          var current = ensureDraft();
          setDraft({
            rules: current.rules.filter(function (_rule, at) {
              return at !== index;
            }),
            mobileMedia: current.mobileMedia,
            fixDockFallback: current.fixDockFallback,
          });
          setStatus('');
        }

        function resetDefaults() {
          setDraft({ rules: DEFAULT_RULES.map(copyRule), mobileMedia: DEFAULT_MEDIA, fixDockFallback: true });
          setStatus('已载入默认值，点击保存生效');
        }

        function discard() {
          setDraft(null);
          setStatus('');
        }

        function save() {
          if (!draft) return;
          setBusy(true);
          setStatus('');
          visibilityStore
            .save(draft.rules, draft.mobileMedia, draft.fixDockFallback)
            .then(function () {
              setDraft(null);
              setStatus('已保存');
            })
            .catch(function (error) {
              setStatus('保存失败：' + (error && error.message ? error.message : String(error)));
            })
            .then(function () {
              setBusy(false);
            });
        }

        var disabled = !snapshot.ready || !snapshot.writable || busy;

        return react.createElement(
          'div',
          { className: 'uivis-page' },
          react.createElement('h2', { className: 'uivis-title' }, '插件显示与隐藏'),
          react.createElement(
            'p',
            { className: 'uivis-desc' },
            '按视口隐藏插件的前端元素：每条规则分别控制“桌面显示”和“手机显示”，两端互不影响。',
            '下面是示例默认值；请按自己的偏好调整。',
          ),
          react.createElement(
            'p',
            { className: 'uivis-note' },
            '安全限制：不能隐藏 DSH 根节点、审批对话框、设置页或侧栏；每条规则一个或多个选择器，最多 ' + MAX_RULES + ' 条、每个选择器最多 ' + MAX_SELECTOR_LENGTH + ' 字符。',
            '若规则导致界面异常，可在地址后加 ?uivis=off 重新打开页面。',
          ),
          isBypassed()
            ? react.createElement('p', { className: 'uivis-note' }, '当前通过 ?uivis=off 暂停隐藏；移除该参数并刷新后恢复。')
            : null,
          !snapshot.ready
            ? react.createElement('p', { className: 'uivis-note' }, '配置尚未就绪，当前使用默认规则。')
            : null,
          snapshot.ready && !snapshot.writable
            ? react.createElement('p', { className: 'uivis-note' }, '当前配置为只读，无法保存修改。')
            : null,
          react.createElement(
            'div',
            { className: 'uivis-list' },
            rules.map(function (rule, index) {
              return react.createElement(
                'div',
                { className: 'uivis-row', key: rule.id || String(index) },
                react.createElement(
                  'div',
                  { className: 'uivis-field' },
                  react.createElement('span', { className: 'uivis-label' }, '名称'),
                  react.createElement('input', {
                    className: 'uivis-input',
                    value: rule.label,
                    disabled: disabled,
                    'aria-label': '第 ' + (index + 1) + ' 条规则的名称',
                    maxLength: 100,
                    onChange: function (event) {
                      updateRule(index, { label: event.target.value });
                    },
                  }),
                ),
                react.createElement(
                  'div',
                  { className: 'uivis-field' },
                  react.createElement('span', { className: 'uivis-label' }, 'CSS 选择器'),
                  react.createElement('input', {
                    className: 'uivis-input mono',
                    value: rule.selector,
                    disabled: disabled,
                    'aria-label': '第 ' + (index + 1) + ' 条规则的 CSS 选择器',
                    maxLength: MAX_SELECTOR_LENGTH,
                    placeholder: '[data-token-pet="true"] 或 #mem-open',
                    onChange: function (event) {
                      updateRule(index, { selector: event.target.value });
                    },
                  }),
                ),
                react.createElement(
                  'div',
                  { className: 'uivis-toggles' },
                  react.createElement(
                    'label',
                    { className: 'uivis-toggle' },
                    react.createElement('input', {
                      type: 'checkbox',
                      checked: rule.enabled,
                      disabled: disabled,
                      onChange: function (event) {
                        updateRule(index, { enabled: event.target.checked });
                      },
                    }),
                    '启用',
                  ),
                  react.createElement(
                    'label',
                    { className: 'uivis-toggle' },
                    react.createElement('input', {
                      type: 'checkbox',
                      checked: rule.desktop,
                      disabled: disabled,
                      onChange: function (event) {
                        updateRule(index, { desktop: event.target.checked });
                      },
                    }),
                    '桌面显示',
                  ),
                  react.createElement(
                    'label',
                    { className: 'uivis-toggle' },
                    react.createElement('input', {
                      type: 'checkbox',
                      checked: rule.mobile,
                      disabled: disabled,
                      onChange: function (event) {
                        updateRule(index, { mobile: event.target.checked });
                      },
                    }),
                    '手机显示',
                  ),
                  react.createElement(
                    'button',
                    {
                      className: 'uivis-btn danger',
                      type: 'button',
                      disabled: disabled,
                      'aria-label': '删除第 ' + (index + 1) + ' 条规则',
                      onClick: function () {
                        removeRule(index);
                      },
                    },
                    '删除',
                  ),
                ),
              );
            }),
          ),
          react.createElement(
            'div',
            { className: 'uivis-actions' },
            react.createElement(
              'button',
              {
                className: 'uivis-btn',
                type: 'button',
                disabled: disabled || rules.length >= MAX_RULES,
                onClick: addRule,
              },
              '添加规则 (' + rules.length + '/' + MAX_RULES + ')',
            ),
            react.createElement(
              'button',
              { className: 'uivis-btn', type: 'button', disabled: disabled, onClick: resetDefaults },
              '恢复默认',
            ),
            react.createElement('span', { className: 'uivis-status', role: 'status', 'aria-live': 'polite' }, status),
          ),
          react.createElement(
            'div',
            { className: 'uivis-field' },
            react.createElement('span', { className: 'uivis-label' }, '手机端判定媒体查询'),
            react.createElement('input', {
              className: 'uivis-input mono',
              value: mobileMedia,
              disabled: disabled,
              'aria-label': '手机端判定媒体查询',
              maxLength: MAX_MEDIA_LENGTH,
              onChange: function (event) {
                var current = ensureDraft();
                setDraft({
                  rules: current.rules,
                  mobileMedia: event.target.value,
                  fixDockFallback: current.fixDockFallback,
                });
                setStatus('');
              },
            }),
          ),
          react.createElement(
            'label',
            { className: 'uivis-toggle' },
            react.createElement('input', {
              type: 'checkbox',
              checked: fixDockFallback,
              disabled: disabled,
              onChange: function (event) {
                var current = ensureDraft();
                setDraft({
                  rules: current.rules,
                  mobileMedia: current.mobileMedia,
                  fixDockFallback: event.target.checked,
                });
                setStatus('');
              },
            }),
            '手机端把 better-sidebar 的 dock 入口下移（避免遮挡移动端抽屉按钮）',
          ),
          react.createElement(
            'div',
            { className: 'uivis-actions' },
            react.createElement(
              'button',
              { className: 'uivis-btn', type: 'button', disabled: !draft || busy, onClick: discard },
              '放弃修改',
            ),
            react.createElement(
              'button',
              { className: 'uivis-btn primary', type: 'button', disabled: disabled || !draft, onClick: save },
              busy ? '保存中…' : '保存',
            ),
          ),
        );
        };
      }

      function apply(ctx) {
        var style = document.createElement('style');
        style.dataset.plugin = 'dsh-ui-visibility';
        document.head.appendChild(style);

        var settingsStyle = document.createElement('style');
        settingsStyle.dataset.role = 'dsh-ui-visibility-settings';
        settingsStyle.textContent = SETTINGS_CSS;
        document.head.appendChild(settingsStyle);

        var configForms = serviceOf(ctx, 'configForms');
        if (!configForms) {
          try {
            configForms = ctx.configForms;
          } catch (error) {
            configForms = undefined;
          }
        }
        var scope = configForms && typeof configForms.get === 'function' ? configForms.get(ENTRY_ID) : undefined;
        var store = createStore(scope);
        var VisibilitySection = createVisibilitySection(store);
        var bypass = isBypassed();
        var media = null;
        var offStore = null;

        var render = function () {
          var snapshot = store.getSnapshot();
          if (typeof window.matchMedia === 'function') {
            if (!media || media.media !== snapshot.mobileMedia) {
              if (media) removeMediaListener(media, render);
              try {
                media = window.matchMedia(snapshot.mobileMedia);
              } catch (error) {
                media = null;
              }
              if (media) addMediaListener(media, render);
            }
          }
          var isMobile = !!(media && media.matches);
          document.documentElement.setAttribute('data-ui-vis-mobile', isMobile ? '1' : '0');
          document.documentElement.setAttribute('data-ui-vis-desktop', isMobile ? '0' : '1');
          style.textContent = bypass ? '' : buildCss(snapshot.rules, snapshot.fixDockFallback);
        };

        ctx.effect(function () {
          return function () {
            if (typeof offStore === 'function') offStore();
            store.dispose();
            if (media) removeMediaListener(media, render);
            style.remove();
            settingsStyle.remove();
            var hasOtherInstance = typeof document.querySelector === 'function'
              ? document.querySelector('style[data-plugin="dsh-ui-visibility"]')
              : null;
            if (!hasOtherInstance) {
              document.documentElement.removeAttribute('data-ui-vis-mobile');
              document.documentElement.removeAttribute('data-ui-vis-desktop');
            }
          };
        }, 'dsh-ui-visibility: cleanup');

        offStore = store.subscribe(render);
        render();

        ctx.effect(function () {
          return ctx.slots.inject('settings.section', function () {
            return ctx.slots.register(
              {
                name: 'settings.section',
                id: 'dsh-ui-visibility',
                order: 30,
                label: '插件显示与隐藏',
                inject: function () {
                  return {};
                },
              },
              VisibilitySection,
            );
          });
        }, 'dsh-ui-visibility: settings section');
      }

      exports.apply = apply;
      exports.inject = ['slots', 'configForms'];
      if (typeof window !== 'undefined' && window.__DSH_UI_VISIBILITY_TEST__) {
        exports.__test = {
          createStore: createStore,
          validateDraft: validateDraft,
          safeSelector: safeSelector,
        };
      }
      return module.exports;
    },
  });
})();
