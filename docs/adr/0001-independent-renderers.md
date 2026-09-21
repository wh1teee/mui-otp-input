---
sidebar_position: 8
---

# ADR 0001: one OTP contract, independent renderers

**Status:** accepted

## Context

The maintained fork historically exposed a Material UI component. Product consumers now include MUI surfaces and Base UI/shadcn surfaces. Maintaining two packages or duplicating input transactions would make paste, autofill, focus, validation, and form behavior drift.

## Decision

Keep the npm identity `@wh1teee/mui-otp-input` and publish explicit subpath exports.

- The package root and `/mui` retain the MUI API.
- `/base-ui` implements native slot composition on Base UI OTP Field.
- `/shadcn` aliases the Base UI primitives and offers opt-in semantic CSS.
- `/headless` owns renderer-independent normalization utilities.
- React Hook Form adapters are separate entrypoints.

Renderer peers remain optional. No renderer entrypoint may import another renderer at runtime. Shared behavior is expressed through headless normalization contracts and parity tests, not through making MUI depend on Base UI.

## Consequences

Existing fork users keep their root import. New applications choose a renderer explicitly. The package has one release train and one behavioral test matrix, while bundle closures remain renderer-isolated.

Upstream releases can be merged into the maintained fork, but fork behavior—delayed autofocus, paste preprocessing, character transformation, stable refs, and empty-slot focus routing—must remain covered before release.
