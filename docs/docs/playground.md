---
sidebar_position: 6
---

# Playground

The repository ships both MUI and Base UI stories. Run the reviewed local
playground from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm storybook
```

The production Storybook build is part of `pnpm ci:pr`, so examples are checked
against the same package sources, peer versions, and semantic shadcn stylesheet
as the release artifact. The previous public CodeSandbox targeted the unscoped
upstream package and is intentionally not linked from the maintained fork.
