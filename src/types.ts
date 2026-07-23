export type TurnstileTheme = 'light' | 'dark' | 'auto';
export type TurnstileSize = 'normal' | 'flexible' | 'compact';
export type TurnstileAppearance = 'always' | 'execute' | 'interaction-only';
export type TurnstileExecution = 'render' | 'execute';
export type TurnstileRetry = 'auto' | 'never';
export type TurnstileRefresh = 'auto' | 'manual' | 'never';

export interface TurnstileOptions {
  action?: string;
  cData?: string;
  theme?: TurnstileTheme;
  language?: string;
  tabIndex?: number;
  size?: TurnstileSize;
  appearance?: TurnstileAppearance;
  execution?: TurnstileExecution;
  retry?: TurnstileRetry;
  retryInterval?: number;
  refreshExpired?: TurnstileRefresh;
  refreshTimeout?: TurnstileRefresh;
  responseField?: boolean;
  responseFieldName?: string;
}

export interface TurnstileScriptOptions {
  nonce?: string;
  appendTo?: 'head' | 'body';
}

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  cData?: string;
  theme?: TurnstileTheme;
  language?: string;
  tabindex?: number;
  size?: TurnstileSize;
  appearance?: TurnstileAppearance;
  execution?: TurnstileExecution;
  retry?: TurnstileRetry;
  'retry-interval'?: number;
  'refresh-expired'?: TurnstileRefresh;
  'refresh-timeout'?: TurnstileRefresh;
  'response-field'?: boolean;
  'response-field-name'?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (errorCode: string) => boolean | void;
  'timeout-callback'?: () => void;
  'unsupported-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
}

export interface TurnstileApi {
  ready(callback: () => void): void;
  render(container: HTMLElement | string, options: TurnstileRenderOptions): string | undefined;
  reset(widgetId?: string): void;
  execute(widgetId?: string): void;
  getResponse(widgetId?: string): string | undefined;
  remove(widgetId: string): void;
}

export interface TurnstileInstance {
  reset(): void;
  execute(): void;
  getResponse(): string | undefined;
  remove(): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
