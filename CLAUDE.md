# mui-otp-input

Accessible one-time code input for React, published on npm as
`@wh1teee/mui-otp-input`. A maintained continuation of
`viclafouch/mui-otp-input` (npm `mui-one-time-password-input`); keep the MIT
attribution in `THIRD_PARTY_NOTICES.md`.

## Project structure

- `src/` — the package: MUI renderer (`mui.tsx`), Base UI / shadcn renderer
  (`base-ui.tsx`, `internal/otp-behavior-root.tsx`), headless normalization
  (`headless.ts`), React Hook Form adapters, `shadcn.css`.
- `site/` — Next.js documentation site (workspace package
  `mui-otp-input-site`), deployed to Vercel as `mui-otp-input-docs`.
- `docs/` — ADRs, specs, release notes, rollback notes, entrypoint budgets.
- `scripts/` — package, bundle, consumer, release, and site test verifiers.
- `.storybook/` — local component stories.

## Commands

- `pnpm build` — build the package (required before building the site).
- `pnpm lint` — type check, script syntax, and ESLint.
- `pnpm test:unit`, `pnpm test:browser` — Vitest unit and Chromium/Firefox/WebKit tests.
- `pnpm --dir site dev` — run the documentation site.
- `pnpm ci:pr` — the full pull-request gate, including the site type check,
  build, and Playwright/axe suite.

## Release

1. Bump `version` in `package.json` and add `docs/releases/<version>.md` and
   `docs/releases/rollback-<version>.md`.
2. Merge to `main`, then push the tag `v<version>`. `release.yml` verifies the
   exact tarball and publishes it with npm provenance.
3. Deploy `site/` to the Vercel project `mui-otp-input-docs`.
