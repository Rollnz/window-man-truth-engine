# GTM Conditional Loading Documentation

## Overview
GTM (Google Tag Manager) is conditionally loaded only on production domains to prevent analytics pollution from preview/development environments.

## How It Works

| Domain                                                            | GTM Loads? | Result           |
| ----------------------------------------------------------------- | ---------- | ---------------- |
| `itswindowman.com`                                                | Yes        | Full tracking    |
| `www.itswindowman.com`                                            | Yes        | Full tracking    |
| `window-truth-engine.lovable.app`                                 | No         | Console log only |
| `preview--window-truth-engine.lovable.app`                        | No         | Console log only |
| `id-preview-*--faf9d037-b00e-4588-a259-0baf63925ffd.lovable.app`  | No         | Console log only |
| `*.lovable.app` (any other)                                       | No         | Console log only |

## Implementation
The conditional logic lives in `src/lib/gtm.ts` and checks `window.location.hostname` before injecting the GTM script.
