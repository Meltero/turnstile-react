import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from 'react';
import { loadTurnstile } from './loader.js';
import type {
  TurnstileApi,
  TurnstileInstance,
  TurnstileOptions,
  TurnstileRenderOptions,
  TurnstileScriptOptions,
} from './types.js';

export interface TurnstileProps {
  siteKey: string;
  options?: TurnstileOptions;
  scriptOptions?: TurnstileScriptOptions;
  id?: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  onSuccess?: (token: string) => void;
  onExpire?: () => void;
  onError?: (errorCode: string) => boolean | void;
  onTimeout?: () => void;
  onUnsupported?: () => void;
  onBeforeInteractive?: () => void;
  onAfterInteractive?: () => void;
}

function mapOptions(
  options: TurnstileOptions | undefined,
): Omit<TurnstileRenderOptions, 'sitekey'> {
  if (!options) return {};

  return {
    ...(options.action !== undefined ? { action: options.action } : {}),
    ...(options.cData !== undefined ? { cData: options.cData } : {}),
    ...(options.theme !== undefined ? { theme: options.theme } : {}),
    ...(options.language !== undefined ? { language: options.language } : {}),
    ...(options.tabIndex !== undefined ? { tabindex: options.tabIndex } : {}),
    ...(options.size !== undefined ? { size: options.size } : {}),
    ...(options.appearance !== undefined ? { appearance: options.appearance } : {}),
    ...(options.execution !== undefined ? { execution: options.execution } : {}),
    ...(options.retry !== undefined ? { retry: options.retry } : {}),
    ...(options.retryInterval !== undefined
      ? { 'retry-interval': options.retryInterval }
      : {}),
    ...(options.refreshExpired !== undefined
      ? { 'refresh-expired': options.refreshExpired }
      : {}),
    ...(options.refreshTimeout !== undefined
      ? { 'refresh-timeout': options.refreshTimeout }
      : {}),
    ...(options.responseField !== undefined
      ? { 'response-field': options.responseField }
      : {}),
    ...(options.responseFieldName !== undefined
      ? { 'response-field-name': options.responseFieldName }
      : {}),
  };
}

export const Turnstile = forwardRef<TurnstileInstance, TurnstileProps>(function Turnstile(
  {
    siteKey,
    options,
    scriptOptions,
    id,
    className,
    style,
    ariaLabel = 'Security verification',
    onSuccess,
    onExpire,
    onError,
    onTimeout,
    onUnsupported,
    onBeforeInteractive,
    onAfterInteractive,
  },
  forwardedRef,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<TurnstileApi | undefined>(undefined);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const callbacksRef = useRef({
    onSuccess,
    onExpire,
    onError,
    onTimeout,
    onUnsupported,
    onBeforeInteractive,
    onAfterInteractive,
  });
  callbacksRef.current = {
    onSuccess,
    onExpire,
    onError,
    onTimeout,
    onUnsupported,
    onBeforeInteractive,
    onAfterInteractive,
  };

  useImperativeHandle(
    forwardedRef,
    () => ({
      reset() {
        if (apiRef.current && widgetIdRef.current) {
          apiRef.current.reset(widgetIdRef.current);
        }
      },
      execute() {
        if (apiRef.current && widgetIdRef.current) {
          apiRef.current.execute(widgetIdRef.current);
        }
      },
      getResponse() {
        if (apiRef.current && widgetIdRef.current) {
          return apiRef.current.getResponse(widgetIdRef.current);
        }
        return undefined;
      },
      remove() {
        if (apiRef.current && widgetIdRef.current) {
          apiRef.current.remove(widgetIdRef.current);
          widgetIdRef.current = undefined;
        }
      },
    }),
    [],
  );

  const optionKey = JSON.stringify(options ?? {});
  const scriptKey = JSON.stringify(scriptOptions ?? {});

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container) return;

    if (siteKey.trim().length === 0) {
      callbacksRef.current.onError?.('missing-site-key');
      return;
    }

    void loadTurnstile(scriptOptions)
      .then((api) => {
        if (!active) return;
        apiRef.current = api;

        const renderOptions: TurnstileRenderOptions = {
          ...mapOptions(options),
          sitekey: siteKey,
          callback: (token) => callbacksRef.current.onSuccess?.(token),
          'expired-callback': () => callbacksRef.current.onExpire?.(),
          'error-callback': (errorCode) => callbacksRef.current.onError?.(errorCode),
          'timeout-callback': () => callbacksRef.current.onTimeout?.(),
          'unsupported-callback': () => callbacksRef.current.onUnsupported?.(),
          'before-interactive-callback': () =>
            callbacksRef.current.onBeforeInteractive?.(),
          'after-interactive-callback': () => callbacksRef.current.onAfterInteractive?.(),
        };

        widgetIdRef.current = api.render(container, renderOptions);
        if (!widgetIdRef.current) {
          callbacksRef.current.onError?.('render-failed');
        }
      })
      .catch(() => {
        if (active) callbacksRef.current.onError?.('script-load-failed');
      });

    return () => {
      active = false;
      if (apiRef.current && widgetIdRef.current) {
        apiRef.current.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, [siteKey, optionKey, scriptKey]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={style}
      aria-label={ariaLabel}
    />
  );
});
