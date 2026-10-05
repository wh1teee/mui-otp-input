import { CopyButton } from './copy-button'
import {
  Callout,
  CodeBlock,
  DocsLayout,
  DocsShell,
  REPOSITORY_URL,
  Section,
  type TocGroup
} from './docs-ui'
import { LandingDemo } from './landing-demo'
import { PropsTable, type PropRow } from './props-table'

const installMui = `pnpm add @wh1teee/mui-otp-input @mui/material @emotion/react @emotion/styled`

const installBaseUi = `pnpm add @wh1teee/mui-otp-input @base-ui/react`

const muiExample = `'use client';

import { MuiOtpInput } from '@wh1teee/mui-otp-input';
import { useState } from 'react';

export function VerificationCode() {
  const [code, setCode] = useState('');

  return (
    <MuiOtpInput
      ariaLabel="Verification code"
      length={6}
      value={code}
      onChange={setCode}
      onComplete={(value) => verify(value)}
      validationType="numeric"
      pastePreprocess="digits-only"
    />
  );
}`

const shadcnExample = `'use client';

import { OtpInput } from '@wh1teee/mui-otp-input/shadcn';
import '@wh1teee/mui-otp-input/shadcn.css';
import { useState } from 'react';

export function VerificationCode() {
  const [code, setCode] = useState('');

  return (
    <OtpInput
      label="Verification code"
      helperText="Enter the six digits we sent to your phone."
      length={6}
      separatorAfter={[2]}
      value={code}
      onValueChange={setCode}
    />
  );
}`

const primitivesExample = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@wh1teee/mui-otp-input/shadcn';

<label htmlFor="code">Verification code</label>
<InputOTP id="code" length={6} value={code} onValueChange={setCode}>
  <InputOTPGroup>
    <InputOTPSlot index={0} aria-label="Digit 1 of 6" />
    <InputOTPSlot index={1} aria-label="Digit 2 of 6" />
    <InputOTPSlot index={2} aria-label="Digit 3 of 6" />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} aria-label="Digit 4 of 6" />
    <InputOTPSlot index={4} aria-label="Digit 5 of 6" />
    <InputOTPSlot index={5} aria-label="Digit 6 of 6" />
  </InputOTPGroup>
</InputOTP>`

const characterRulesExample = `// Letters and digits, shown upper-case.
<MuiOtpInput
  length={8}
  validationType="alphanumeric"
  transformChar={(character) => character.toUpperCase()}
/>

// Reject look-alike characters on top of the built-in policy.
<MuiOtpInput
  validationType="alphanumeric"
  validateChar={(character) => !/[0OIl1]/.test(character)}
  onInvalid={(attempt, { reason }) => explain(reason, attempt)}
/>`

const pasteExample = `// Built-in strategies
<MuiOtpInput pastePreprocess="digits-only" /> // "Code: 12-34" → "1234"
<MuiOtpInput pastePreprocess="trim" />        // " ab12 " → "ab12"

// Or your own: pull the code out of a longer message.
<MuiOtpInput
  pastePreprocess={(text) => text.match(/\\b\\d{6}\\b/)?.[0] ?? text}
/>`

const rhfExample = `import { useForm } from 'react-hook-form';
import { OtpInputController } from '@wh1teee/mui-otp-input/shadcn/react-hook-form';

type Values = { code: string };

export function VerifyForm() {
  const { control, handleSubmit } = useForm<Values>({
    defaultValues: { code: '' },
  });

  return (
    <form onSubmit={handleSubmit(submit)}>
      <OtpInputController
        control={control}
        name="code"
        label="Verification code"
        length={6}
        rules={{
          validate: (value) => value.length === 6 || 'Enter all six digits',
        }}
      />
      <button type="submit">Verify</button>
    </form>
  );
}`

const rhfMuiExample = `import { MuiOtpInputController } from '@wh1teee/mui-otp-input/mui/react-hook-form';

<MuiOtpInputController
  control={control}
  name="code"
  ariaLabel="Verification code"
  length={6}
  validationType="numeric"
  rules={{ required: 'Enter the code' }}
/>;`

const muiStylingExample = `<MuiOtpInput
  length={6}
  sx={{ gap: 1.5, maxWidth: 420 }}
  TextFieldsProps={(index) => ({
    size: 'small',
    placeholder: '·',
    sx: index === 2 ? { mr: 2 } : undefined,
  })}
/>

// Theme overrides keep working through stable class names:
// .MuiOtpInput-Box, .MuiOtpInput-TextField, .MuiOtpInput-TextField-{n}`

const shadcnTokensExample = `/* Tokens the optional skin reads. Define them where your theme lives. */
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --input: #cbd5e1;
  --ring: #64748b;
  --destructive: #b91c1c;
  --muted-foreground: #475569;
  --radius: 0.5rem;
}`

const classNamesExample = `<OtpInput
  label="Code"
  length={6}
  classNames={{
    root: 'grid gap-2',
    group: 'flex gap-2',
    slot: 'size-12 rounded-md border text-center text-lg',
  }}
/>`

const headlessExample = `import {
  isOtpComplete,
  normalizeOtpValue,
  preprocessOtpPaste,
} from '@wh1teee/mui-otp-input/headless';

// The same rules the components use, for route handlers and tests.
const pasted = preprocessOtpPaste('Your code is 12-34', 'digits-only');
const code = normalizeOtpValue(pasted, { length: 4, validationType: 'numeric' });

isOtpComplete(code, 4); // true`

const nextExample = `// app/verify/page.tsx — a Server Component
import { VerificationCode } from './verification-code'; // 'use client' inside

export default function VerifyPage() {
  return <VerificationCode />;
}

// app/api/verify/route.ts — headless helpers run anywhere
import { normalizeOtpValue } from '@wh1teee/mui-otp-input/headless';`

const toc: readonly TocGroup[] = [
  {
    title: 'Get started',
    links: [
      ['Quick start', '#quick-start'],
      ['Base UI & shadcn', '#base-ui-shadcn']
    ]
  },
  {
    title: 'Guides',
    links: [
      ['Value & focus', '#behavior'],
      ['Character rules', '#character-rules'],
      ['Paste & autofill', '#paste-autofill'],
      ['React Hook Form', '#forms'],
      ['Styling', '#styling'],
      ['Headless', '#headless']
    ]
  },
  {
    title: 'Reference',
    links: [
      ['MuiOtpInput', '#api-mui'],
      ['OtpInput', '#api-base-ui'],
      ['Entrypoints', '#entrypoints']
    ]
  },
  {
    title: 'Production',
    links: [
      ['SSR & Next.js', '#ssr'],
      ['Accessibility', '#accessibility'],
      ['Size & quality', '#quality']
    ]
  }
]

const muiProps: readonly PropRow[] = [
  ['value', 'string', '—', 'Controlled value.'],
  ['defaultValue', 'string', "''", 'Initial value when uncontrolled.'],
  ['onChange', '(value) => void', '—', 'Every accepted change.'],
  ['onComplete', '(value) => void', '—', 'All slots are filled.'],
  ['length', 'number', '4', 'Number of slots and maximum value length.'],
  [
    'validationType',
    "'none' | 'numeric' | 'alphanumeric'",
    "'none'",
    'Built-in character policy.'
  ],
  [
    'transformChar',
    '(char, index) => string',
    '—',
    'Maps a character before validation.'
  ],
  [
    'validateChar',
    '(char, index) => boolean',
    '—',
    'Extra per-character rule.'
  ],
  [
    'pastePreprocess',
    "'none' | 'trim' | 'digits-only' | fn",
    "'none'",
    'Cleans pasted and autofilled text.'
  ],
  [
    'onInvalid',
    '(attempt, details) => void',
    '—',
    'Typed or pasted input was rejected.'
  ],
  ['onBlur', '(value, complete) => void', '—', 'Focus left the whole field.'],
  [
    'autoFocus',
    'boolean | number',
    'false',
    'Focuses the first slot, optionally after a delay in ms.'
  ],
  ['autoSubmit', 'boolean', 'false', 'Submits the owning form on completion.'],
  ['mask', 'boolean', 'false', 'Renders slots as password inputs.'],
  ['ariaLabel', 'string', '—', 'Accessible name; slots read “ariaLabel 3/6”.'],
  [
    'slotAriaLabel',
    '(index, length) => string',
    '—',
    'Custom accessible name per slot.'
  ],
  [
    'TextFieldsProps',
    'TextFieldProps | (index) => TextFieldProps',
    '—',
    'Props for every slot, or per slot.'
  ],
  [
    'name, form, required',
    'string, string, boolean',
    '—',
    'Native form participation.'
  ]
]

const baseUiProps: readonly PropRow[] = [
  [
    'label',
    'ReactNode',
    'required',
    'Visible label, linked to the first slot.'
  ],
  ['length', 'number', 'required', 'Number of slots.'],
  [
    'helperText',
    'ReactNode',
    '—',
    'Description below the slots; announced on error.'
  ],
  [
    'error',
    'boolean',
    'false',
    'Invalid styling and aria-invalid on every slot.'
  ],
  ['value, defaultValue', 'string', '—', 'Controlled or initial value.'],
  ['onValueChange', '(value, details) => void', '—', 'Every accepted change.'],
  ['onValueComplete', '(value, details) => void', '—', 'All slots are filled.'],
  [
    'validationType',
    "'none' | 'numeric' | 'alphanumeric'",
    "'numeric'",
    'Built-in character policy.'
  ],
  [
    'separatorAfter',
    'readonly number[]',
    '[]',
    'Zero-based slots followed by a separator.'
  ],
  [
    'classNames',
    'OtpInputClassNames',
    '—',
    'root, label, group, slot, separator, description.'
  ],
  [
    'slotProps',
    'props | (index) => props',
    '—',
    'Native and Base UI props per slot.'
  ],
  [
    'slotAriaLabel',
    '(index, length) => string',
    '—',
    'Custom accessible name per slot.'
  ]
]

const entrypoints = [
  ['@wh1teee/mui-otp-input', 'MuiOtpInput', 'MUI + Emotion'],
  ['…/mui', 'MuiOtpInput, explicit import', 'MUI + Emotion'],
  ['…/base-ui', 'OtpInput and InputOTP primitives', 'Base UI'],
  ['…/shadcn', 'The same, under shadcn naming', 'Base UI'],
  ['…/shadcn.css', 'Optional skin over data-slot', 'none'],
  ['…/headless', 'Normalization helpers', 'none'],
  ['…/mui/react-hook-form', 'MuiOtpInputController', 'MUI + React Hook Form'],
  [
    '…/base-ui/react-hook-form',
    'OtpInputController',
    'Base UI + React Hook Form'
  ],
  [
    '…/shadcn/react-hook-form',
    'OtpInputController',
    'Base UI + React Hook Form'
  ]
] as const

export default function DocumentationPage() {
  return (
    <DocsShell>
      <div className="docs-hero">
        <div className="docs-hero-copy">
          <h1>One-time codes, typed, pasted, or autofilled</h1>
          <p>
            An accessible OTP input for React. Every way a code can arrive lands
            in one clean string. Use the Material UI component, the
            shadcn-styled Base UI field, or the primitives inside your own
            design system.
          </p>
          <div className="docs-hero-actions">
            <a className="docs-button docs-button-primary" href="#quick-start">
              Get started
            </a>
            <a className="docs-button" href="/playground">
              Open playground
            </a>
          </div>
          <div className="docs-install">
            <code>npm i @wh1teee/mui-otp-input</code>
            <CopyButton
              label="Copy install command"
              text="npm i @wh1teee/mui-otp-input"
            />
          </div>
        </div>
        <LandingDemo />
      </div>

      <DocsLayout toc={toc}>
        <Section
          id="quick-start"
          title="Quick start"
          lead="React 18 or 19. Install the package with the peers of the renderer you use — each renderer needs only its own."
        >
          <h3>Material UI</h3>
          <CodeBlock title="Terminal">{installMui}</CodeBlock>
          <CodeBlock title="VerificationCode.tsx">{muiExample}</CodeBlock>
          <p>
            Material UI 7 and 9 are supported. The value is always a plain
            string with no separators or placeholders, ready to send to your
            API.
          </p>
        </Section>

        <Section
          id="base-ui-shadcn"
          title="Base UI and shadcn"
          lead="A complete field built on Base UI's OTP Field. Neither path loads Material UI or Emotion."
        >
          <CodeBlock title="Terminal">{installBaseUi}</CodeBlock>
          <CodeBlock title="VerificationCode.tsx">{shadcnExample}</CodeBlock>
          <p>
            <code>OtpInput</code> wires the label, description, error state, and
            an accessible name for every slot. <code>/shadcn</code> is the same
            component under shadcn naming; import <code>/shadcn.css</code> for a
            skin built on the standard shadcn variables, or style the{' '}
            <code>data-slot</code> attributes yourself.
          </p>
          <h3>Compose the primitives</h3>
          <p>
            When your design system already owns the field layout, build it from
            the parts shadcn users know.
          </p>
          <CodeBlock title="CodeField.tsx">{primitivesExample}</CodeBlock>
        </Section>

        <Section
          id="behavior"
          title="Value and focus"
          lead="Every renderer follows the same rules, so switching renderers never changes what your form receives."
        >
          <ul className="docs-list">
            <li>
              The value is one string, clamped to <code>length</code>.
              Controlled and default values pass through the same rules as
              typing.
            </li>
            <li>
              Focus advances after each accepted character. Clicking a later
              empty slot focuses the first empty one, so a code is never entered
              with gaps.
            </li>
            <li>
              <kbd>Backspace</kbd> deletes and steps back; <kbd>Delete</kbd>,
              the arrow keys, <kbd>Home</kbd>, and <kbd>End</kbd> move through
              the slots as in a single text field. <kbd>Tab</kbd> moves past the
              whole code, not through every slot.
            </li>
            <li>
              One slot holds one character. Emoji and other characters outside
              the Basic Multilingual Plane are rejected, and IME text commits
              once composition ends.
            </li>
            <li>
              With <code>name</code>, the code submits and resets with its
              native <code>&lt;form&gt;</code>. <code>autoSubmit</code> submits
              the owning form on completion; it is off by default.
            </li>
          </ul>
        </Section>

        <Section
          id="character-rules"
          title="Character rules"
          lead="A built-in policy, an optional transform, and an optional validator, applied to every character."
        >
          <CodeBlock title="Rules.tsx">{characterRulesExample}</CodeBlock>
          <p>
            <code>transformChar</code> runs before validation, so it can turn an
            otherwise rejected character into an accepted one. Rejected input
            never reaches the value; <code>onInvalid</code> reports it so you
            can explain why. Transforms apply to what users type, paste, or
            autofill — a <code>value</code> you pass in is only checked, never
            transformed again.
          </p>
          <Callout>
            The Material UI component defaults to{' '}
            <code>validationType="none"</code> to stay compatible with earlier
            releases. Set <code>"numeric"</code> for numeric codes; the Base UI
            field already defaults to it.
          </Callout>
        </Section>

        <Section
          id="paste-autofill"
          title="Paste and autofill"
          lead="A full code can arrive at once — pasted from a message or offered by the keyboard."
        >
          <CodeBlock title="Paste.tsx">{pasteExample}</CodeBlock>
          <p>
            The first slot advertises <code>autocomplete="one-time-code"</code>,
            so iOS and Android suggest codes from incoming messages; the other
            slots opt out. A pasted or autofilled code replaces the current
            value in one step.
          </p>
        </Section>

        <Section
          id="forms"
          title="React Hook Form"
          lead="Typed controllers instead of hand-written Controller wiring. Install react-hook-form only when you import them."
        >
          <CodeBlock title="VerifyForm.tsx">{rhfExample}</CodeBlock>
          <CodeBlock title="Material UI">{rhfMuiExample}</CodeBlock>
          <p>
            Both controllers register the first slot as the field ref, so{' '}
            <code>setFocus</code>, focus on error, <code>reset</code>, disabled
            fields, and server errors behave like any other input. Field names
            are limited to string-valued paths at the type level.
          </p>
        </Section>

        <Section
          id="styling"
          title="Styling"
          lead="Material UI styling for the MUI component; plain classes and data attributes for Base UI."
        >
          <h3>Material UI</h3>
          <CodeBlock title="Styled.tsx">{muiStylingExample}</CodeBlock>
          <p>
            The root accepts every <code>Box</code> prop, and{' '}
            <code>TextFieldsProps</code> styles all slots at once or each slot
            on its own.
          </p>
          <h3>Base UI and shadcn</h3>
          <CodeBlock title="Tailwind.tsx">{classNamesExample}</CodeBlock>
          <p>
            Every part carries a <code>data-slot</code> attribute (
            <code>otp-field</code>, <code>input-otp-group</code>,{' '}
            <code>input-otp-slot</code>, …). The optional stylesheet targets
            only those attributes, adds no reset, and reads these tokens:
          </p>
          <CodeBlock title="tokens.css">{shadcnTokensExample}</CodeBlock>
        </Section>

        <Section
          id="headless"
          title="Headless helpers"
          lead="The normalization rules as plain functions, with no React or UI dependency."
        >
          <CodeBlock title="verify.ts">{headlessExample}</CodeBlock>
          <p>
            Use them to normalize input in route handlers, check values in
            tests, or drive a fully custom renderer.
          </p>
        </Section>

        <Section
          id="api-mui"
          title="MuiOtpInput"
          lead="From the package root or /mui. Also accepts every Material UI Box prop."
        >
          <PropsTable label="MuiOtpInput props" rows={muiProps} />
        </Section>

        <Section
          id="api-base-ui"
          title="OtpInput"
          lead="From /base-ui or /shadcn. Also accepts Base UI OTP Field root props such as name, disabled, and autoComplete."
        >
          <PropsTable label="OtpInput props" rows={baseUiProps} />
          <p>
            <code>InputOTP</code> adds the same behavior props (
            <code>transformChar</code>, <code>validateChar</code>,{' '}
            <code>pastePreprocess</code>, <code>autoFocus</code>) to Base UI's{' '}
            <code>OTPField.Root</code>; <code>InputOTPSlot</code> requires an{' '}
            <code>index</code>.
          </p>
        </Section>

        <Section
          id="entrypoints"
          title="Entrypoints"
          lead="Renderer and form peers are optional. A missing peer fails only when its entrypoint is imported."
        >
          <section
            aria-label="Package entrypoints"
            className="docs-table-wrap"
            // Horizontal table overflow must be keyboard-scrollable.
            tabIndex={0}
          >
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Import</th>
                  <th>Provides</th>
                  <th>Peers</th>
                </tr>
              </thead>
              <tbody>
                {entrypoints.map(([path, provides, peers]) => (
                  <tr key={path}>
                    <td>
                      <code>{path}</code>
                    </td>
                    <td>{provides}</td>
                    <td>{peers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </Section>

        <Section
          id="ssr"
          title="SSR and Next.js"
          lead="Works in the App Router through normal package exports — no transpilePackages or special config."
        >
          <CodeBlock title="Next.js App Router">{nextExample}</CodeBlock>
          <p>
            UI entrypoints ship the <code>"use client"</code> directive and
            render on the server. Keep the initial value identical on the server
            and the first client render. A one-time code is a credential: don't
            log it, and don't keep it after verification.
          </p>
        </Section>

        <Section
          id="accessibility"
          title="Accessibility"
          lead="Targets WCAG 2.2 AA, checked with axe and keyboard tests in Chromium, Firefox, and WebKit."
        >
          <p>
            Every slot announces its position (“Verification code 3/6”), and in
            the Base UI field errors reach every slot through{' '}
            <code>aria-describedby</code> and <code>aria-invalid</code>. Slots
            grow to touch-target size on coarse pointers, and the skin honors
            forced colors and reduced motion. When you compose primitives, give
            the first slot a visible label and every slot an{' '}
            <code>aria-label</code>.
          </p>
        </Section>

        <Section
          id="quality"
          title="Size and quality"
          lead="Every pull request checks the exact package tarball that would be published."
        >
          <div className="docs-grid docs-grid-stats">
            <div className="docs-card">
              <strong>≤ 4.7 KB</strong>
              <p>gzip for the Material UI entry, peers external.</p>
            </div>
            <div className="docs-card">
              <strong>≤ 3.65 KB</strong>
              <p>
                gzip for <code>/base-ui</code> and <code>/shadcn</code>.
              </p>
            </div>
            <div className="docs-card">
              <strong>≤ 1 KB</strong>
              <p>
                gzip for <code>/headless</code>, with no runtime peer.
              </p>
            </div>
          </div>
          <p>
            CI installs the packed tarball into isolated MUI 7 + React 18, MUI 9
            + React 19, Base UI–only, and Next.js 16 consumers, and fails if a
            Material UI import leaks into a Base UI bundle or the reverse.
            Releases are published from GitHub Actions with npm provenance. This
            project continues{' '}
            <a href="https://github.com/viclafouch/mui-otp-input">
              viclafouch/mui-otp-input
            </a>{' '}
            under the MIT license — see the{' '}
            <a href="/migration">migration guide</a> and the{' '}
            <a href={`${REPOSITORY_URL}/blob/main/THIRD_PARTY_NOTICES.md`}>
              third-party notices
            </a>
            .
          </p>
        </Section>
      </DocsLayout>
    </DocsShell>
  )
}
