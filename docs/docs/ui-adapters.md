---
sidebar_position: 4
---

# UI adapters

The package intentionally publishes one behavior contract and separate renderer entrypoints.

| Surface                        | Import                     | Install                         |
| ------------------------------ | -------------------------- | ------------------------------- |
| Historical MUI API             | package root or `/mui`     | MUI + Emotion                   |
| Base UI primitives             | `/base-ui`                 | Base UI                         |
| shadcn names and optional skin | `/shadcn` + `/shadcn.css`  | Base UI                         |
| Behavior-only utilities        | `/headless`                | no UI peer                      |
| MUI form adapter               | `/react-hook-form`         | MUI + Emotion + React Hook Form |
| Base UI form adapter           | `/base-ui/react-hook-form` | Base UI + React Hook Form       |

MUI and Base UI are optional peers. The MUI closure contains no Base UI runtime import; the Base UI closure contains no MUI or Emotion runtime import. This boundary is checked against the built package and against isolated consumers installed from the exact tarball.

## Which export should an application use?

Use the package root when maintaining an existing MUI application. New MUI code may use `/mui` to make the choice explicit.

Use `/base-ui` when the application owns its labels, helper text, validation layout, and token mapping. Use the complete `OtpInput` when a ready field composition is useful.

Use `/shadcn` when matching shadcn component naming or consuming the optional semantic-variable stylesheet. It is not a second engine: it re-exports the Base UI adapter.

Use `/headless` for server-side normalization, custom renderers, or validation utilities without installing a UI library.

## Styling ownership

The package never installs Tailwind or modifies global tokens. `shadcn.css` is scoped to `data-slot` attributes. Applications may skip it entirely and style those slots in their own design system.

The MUI adapter retains `MuiOtpInput-Box`, `MuiOtpInput-TextField`, and `MuiOtpInput-TextField-{n}` classes and accepts normal MUI `Box` and `TextField` customization.
