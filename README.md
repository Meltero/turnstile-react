# @meltero/turnstile-react

A small, typed React wrapper around Cloudflare Turnstile's official
client-side API.

The package is intentionally application-agnostic. It does not read environment
variables, choose site keys or actions, submit forms, call an API, apply styles,
or perform server-side token verification.

## Install

```bash
pnpm add @meltero/turnstile-react
```

## Use

```tsx
import { useRef, useState } from 'react';
import {
  Turnstile,
  type TurnstileInstance,
} from '@meltero/turnstile-react';

export function ProtectedForm() {
  const widget = useRef<TurnstileInstance>(null);
  const [token, setToken] = useState<string | null>(null);

  return (
    <form>
      <Turnstile
        ref={widget}
        siteKey="your-public-site-key"
        options={{ action: 'your-action', theme: 'auto', size: 'flexible' }}
        onSuccess={setToken}
        onExpire={() => setToken(null)}
        onError={() => {
          setToken(null);
          return true;
        }}
      />
      <button type="submit" disabled={!token}>
        Submit
      </button>
    </form>
  );
}
```

The ref exposes `reset()`, `execute()`, `getResponse()`, and `remove()`.

## Content Security Policy

Allow Cloudflare's script and frame origins:

```text
script-src https://challenges.cloudflare.com
frame-src https://challenges.cloudflare.com
```

For nonce-based policies, pass `scriptOptions={{ nonce }}`.

## Server-side validation is required

The browser widget does not protect an endpoint by itself. Send the generated
token to your server and verify it with Cloudflare's Siteverify API. Validate
the expected action and hostname in addition to the success flag.

See Cloudflare's
[server-side validation documentation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
