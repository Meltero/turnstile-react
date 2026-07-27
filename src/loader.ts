import type { TurnstileApi, TurnstileScriptOptions } from './types.js';

export const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-api';
export const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loaderPromise: Promise<TurnstileApi> | undefined;

function resolveLoadedApi(resolve: (api: TurnstileApi) => void, reject: (error: Error) => void) {
  const api = window.turnstile;
  if (!api) {
    reject(new Error('Cloudflare Turnstile loaded without exposing its client API.'));
    return;
  }
  resolve(api);
}

export function loadTurnstile(options: TurnstileScriptOptions = {}): Promise<TurnstileApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Cloudflare Turnstile requires a browser environment.'));
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<TurnstileApi>((resolve, reject) => {
    let script: HTMLScriptElement | undefined;
    const fail = () => {
      loaderPromise = undefined;
      script?.remove();
      reject(new Error('Failed to load the Cloudflare Turnstile script.'));
    };

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing instanceof HTMLScriptElement) {
      script = existing;
      if (existing.src !== TURNSTILE_SCRIPT_SRC) {
        fail();
        return;
      }
      existing.addEventListener('load', () => resolveLoadedApi(resolve, fail), { once: true });
      existing.addEventListener('error', fail, { once: true });
      return;
    }

    script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    if (options.nonce) script.nonce = options.nonce;
    script.addEventListener('load', () => resolveLoadedApi(resolve, fail), { once: true });
    script.addEventListener('error', fail, { once: true });
    (options.appendTo === 'body' ? document.body : document.head).append(script);
  });

  return loaderPromise;
}

export function resetTurnstileLoaderForTests() {
  loaderPromise = undefined;
}
