import z from '@deepseek-ai/schemastery';

/**
 * Mark a Config field live-editable when the host's schemastery supports it.
 * Older 3.18.x releases lack volatile(); the plugin then still loads, but
 * the settings service does not expose the namespace (client falls back to
 * defaults) instead of crashing the Host.
 */
const liveField = (schema) => (typeof schema.volatile === 'function' ? schema.volatile() : schema);

/**
 * Default rules: on phones hide the desktop-oriented overlays that ship
 * with the current profile, while keeping them visible on desktop.
 *
 * The selectors intentionally use stable contracts:
 *   - dsh-token-viewer renders its whale-maid pet with `data-token-pet="true"`.
 *   - dsh-memento renders its floating entry button with `id="mem-open"`.
 *   - dsh-pet-live2d mounts the pet under `data-dsh-live2d-pet-root`.
 *   - dsh-plugin-vrmpet3d mounts its full-screen overlay with `data-vrmpet3d="1"`.
 * Never target the content-hashed CSS-module class names: they change per build.
 */
export const DEFAULT_RULES = [
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

export const DEFAULT_MOBILE_MEDIA = '(pointer: coarse) and (max-width: 1023px)';

/**
 * Host-side Config: the settings page is this schema's namespace, and the
 * client half reads the same accepted values through ctx.configForms.
 */
export const Config = z.object({
  rules: liveField(z
    .array(
      z.object({
        id: z.string().default(''),
        label: z.string().default(''),
        selector: z.string().max(500).default(''),
        enabled: z.boolean().default(true),
        desktop: z.boolean().default(true),
        mobile: z.boolean().default(false),
      }),
    )
    .max(200)
    .default(DEFAULT_RULES)
    .description('每个前端元素的桌面/手机可见性规则')),

  mobileMedia: liveField(z
    .string()
    .max(300)
    .default(DEFAULT_MOBILE_MEDIA)
    .description('判定为手机端的媒体查询（默认 pointer: coarse 且宽度 ≤1023px）')),

  fixDockFallback: liveField(z
    .boolean()
    .default(true)
    .description('手机端把 better-sidebar 的 dock fallback 下移，避免遮挡移动端抽屉按钮')),
});

/**
 * Host half is intentionally empty: all behavior lives in the browser half.
 * The row exists so the client module scanner discovers this package's
 * exports["./client"] bundle and so the Config namespace is served.
 */
export function apply() {}
