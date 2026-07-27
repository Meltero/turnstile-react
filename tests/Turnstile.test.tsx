import { createRef, StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Turnstile } from '../src/Turnstile.js';
import {
  resetTurnstileLoaderForTests,
  TURNSTILE_SCRIPT_ID,
  TURNSTILE_SCRIPT_SRC,
} from '../src/loader.js';
import type {
  TurnstileApi,
  TurnstileInstance,
  TurnstileRenderOptions,
} from '../src/types.js';

function installApi() {
  let capturedOptions: TurnstileRenderOptions | undefined;
  const api: TurnstileApi = {
    ready: vi.fn((callback: () => void) => callback()),
    render: vi.fn(
      (_container: HTMLElement | string, options: TurnstileRenderOptions) => {
        capturedOptions = options;
        return 'widget-1';
      },
    ),
    reset: vi.fn(),
    execute: vi.fn(),
    getResponse: vi.fn(() => 'current-token'),
    remove: vi.fn(),
  };
  window.turnstile = api;
  return { api, getOptions: () => capturedOptions };
}

async function finishScriptLoad() {
  const script = document.getElementById(TURNSTILE_SCRIPT_ID);
  expect(script).toBeInstanceOf(HTMLScriptElement);
  const installed = installApi();
  act(() => {
    script?.dispatchEvent(new Event('load'));
  });
  await waitFor(() => expect(installed.api.render).toHaveBeenCalled());
  return installed;
}

afterEach(() => {
  delete window.turnstile;
  document.getElementById(TURNSTILE_SCRIPT_ID)?.remove();
  resetTurnstileLoaderForTests();
  vi.restoreAllMocks();
});

describe('Turnstile', () => {
  it('loads the official explicit-render script once', async () => {
    render(
      <>
        <Turnstile siteKey="site-key-a" />
        <Turnstile siteKey="site-key-b" />
      </>,
    );

    const scripts = document.querySelectorAll(`#${TURNSTILE_SCRIPT_ID}`);
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).src).toBe(TURNSTILE_SCRIPT_SRC);

    const { api } = await finishScriptLoad();
    await waitFor(() => expect(api.render).toHaveBeenCalledTimes(2));
    expect(api.ready).not.toHaveBeenCalled();
  });

  it('maps generic options and forwards lifecycle callbacks', async () => {
    const onSuccess = vi.fn();
    const onExpire = vi.fn();
    const onError = vi.fn(() => true);
    const onTimeout = vi.fn();
    const onUnsupported = vi.fn();

    render(
      <Turnstile
        siteKey="site-key"
        options={{
          action: 'example-action',
          cData: 'example',
          theme: 'dark',
          size: 'flexible',
          appearance: 'interaction-only',
          execution: 'render',
          retry: 'auto',
          retryInterval: 9000,
          refreshExpired: 'manual',
          refreshTimeout: 'never',
          responseField: false,
          responseFieldName: 'turnstile-token',
          tabIndex: 2,
        }}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onError}
        onTimeout={onTimeout}
        onUnsupported={onUnsupported}
      />,
    );

    const { getOptions } = await finishScriptLoad();
    const options = getOptions();
    expect(options).toMatchObject({
      sitekey: 'site-key',
      action: 'example-action',
      cData: 'example',
      theme: 'dark',
      size: 'flexible',
      appearance: 'interaction-only',
      execution: 'render',
      retry: 'auto',
      'retry-interval': 9000,
      'refresh-expired': 'manual',
      'refresh-timeout': 'never',
      'response-field': false,
      'response-field-name': 'turnstile-token',
      tabindex: 2,
    });

    act(() => {
      options?.callback?.('verified-token');
      options?.['expired-callback']?.();
      options?.['error-callback']?.('110200');
      options?.['timeout-callback']?.();
      options?.['unsupported-callback']?.();
    });

    expect(onSuccess).toHaveBeenCalledWith('verified-token');
    expect(onExpire).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith('110200');
    expect(onTimeout).toHaveBeenCalledOnce();
    expect(onUnsupported).toHaveBeenCalledOnce();
  });

  it('exposes widget controls through its ref', async () => {
    const ref = createRef<TurnstileInstance>();
    render(<Turnstile ref={ref} siteKey="site-key" />);
    const { api } = await finishScriptLoad();

    act(() => {
      ref.current?.reset();
      ref.current?.execute();
    });
    expect(ref.current?.getResponse()).toBe('current-token');
    act(() => ref.current?.remove());

    expect(api.reset).toHaveBeenCalledWith('widget-1');
    expect(api.execute).toHaveBeenCalledWith('widget-1');
    expect(api.getResponse).toHaveBeenCalledWith('widget-1');
    expect(api.remove).toHaveBeenCalledWith('widget-1');
  });

  it('removes the widget during unmount', async () => {
    const view = render(<Turnstile siteKey="site-key" />);
    const { api } = await finishScriptLoad();
    view.unmount();
    expect(api.remove).toHaveBeenCalledWith('widget-1');
  });

  it('works under React Strict Mode without injecting duplicate scripts', async () => {
    render(
      <StrictMode>
        <Turnstile siteKey="site-key" />
      </StrictMode>,
    );
    expect(document.querySelectorAll(`#${TURNSTILE_SCRIPT_ID}`)).toHaveLength(1);
    await finishScriptLoad();
  });

  it('surfaces missing configuration and script failures without throwing', async () => {
    const missingKey = vi.fn();
    render(<Turnstile siteKey="" onError={missingKey} />);
    expect(missingKey).toHaveBeenCalledWith('missing-site-key');

    const loadFailure = vi.fn();
    render(<Turnstile siteKey="site-key" onError={loadFailure} />);
    const script = document.getElementById(TURNSTILE_SCRIPT_ID);
    act(() => {
      script?.dispatchEvent(new Event('error'));
    });
    await waitFor(() => expect(loadFailure).toHaveBeenCalledWith('script-load-failed'));
  });

  it('applies a CSP nonce to the injected script', () => {
    render(<Turnstile siteKey="site-key" scriptOptions={{ nonce: 'request-nonce' }} />);
    const script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement;
    expect(script.nonce).toBe('request-nonce');
  });
});
