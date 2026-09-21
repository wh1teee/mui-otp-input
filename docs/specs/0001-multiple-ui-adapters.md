---
sidebar_position: 9
---

# Specification 0001: multiple OTP UI adapters

## Required public surfaces

The package must expose MUI, headless, Base UI, shadcn, MUI React Hook Form, Base UI React Hook Form, and opt-in shadcn CSS entrypoints. The root export remains MUI-compatible.

## Shared behavior

Each renderer must support controlled and uncontrolled values, configurable length, character transformation and validation, full-code paste, platform one-time-code replacement, completion callbacks, disabled/read-only states, keyboard movement and deletion, native form association, form reset, and optional auto-submit.

The canonical value is a single string. Rendering slots must not alter server validation authority.

## Accessibility

The field has a visible or programmatic label. Later slots have localized accessible names. The first slot uses `autocomplete="one-time-code"`; later slots use `off`. Numeric codes use text inputs with `inputmode="numeric"`, not `type="number"`. Focus indicators, error text, narrow viewport geometry, forced colors, and reduced motion must remain usable.

## Isolation

MUI consumers can install and run without Base UI. Base UI consumers can install and run without MUI or Emotion. Headless consumers can install and run without React or any renderer. Strict declarations are checked with `skipLibCheck: false` from the exact tarball.

## Release proof

Release candidates require unit tests, React Hook Form tests, Chromium/Firefox/WebKit browser tests, automated WCAG checks, package export and closure verification, isolated exact-tarball consumers, successful documentation build, and a provenance-enabled prerelease publication before product integration.
