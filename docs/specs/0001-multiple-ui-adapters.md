---
sidebar_position: 9
---

# Specification 0001: multiple OTP UI adapters

## Required public surfaces

The package must expose MUI, headless, Base UI, shadcn, MUI React Hook Form, Base UI React Hook Form, and opt-in shadcn CSS entrypoints. The root export remains MUI-compatible.

## Shared behavior

Each renderer must support controlled and uncontrolled values, WebOTP fill (through `requestWebOtp`/`useWebOtp`), configurable length, character transformation and validation, full-code paste, platform one-time-code replacement, completion callbacks, disabled/read-only states, keyboard movement and deletion, native form association, form reset, and optional auto-submit.

The canonical value is a single string. Rendering slots must not alter server validation authority.

## Accessibility

The field has a visible or programmatic label. Per-cell renderers (MUI, `/base-ui`) give later slots localized accessible names; the first slot uses `autocomplete="one-time-code"` and later slots use `off`. The single-input renderer (`/shadcn`) has exactly one `<input>`, named by the field label, with `autocomplete="one-time-code"`; its drawn cells are hidden from assistive technology, the active cell follows the input selection, and digits run left to right on any page direction. Numeric codes use text inputs with `inputmode="numeric"`, not `type="number"`. Focus indicators, error text, narrow viewport geometry, forced colors, and reduced motion must remain usable.

## Isolation

MUI consumers can install and run without Base UI. Base UI consumers can install and run without MUI or Emotion. `/shadcn` consumers can install and run without Base UI, MUI or Emotion. Headless consumers can install and run without React or any renderer. Strict declarations are checked with `skipLibCheck: false` from the exact tarball.

## Release proof

Stable and prerelease candidates require unit tests, React Hook Form tests, Chromium/Firefox/WebKit browser tests, automated WCAG checks, package export and bundle-budget verification, isolated exact-tarball consumers, a production Next.js 16 App Router build/SSR proof, successful documentation build, and provenance-enabled immutable publication.
