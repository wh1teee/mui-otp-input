import type { Metadata } from 'next'

import {
  Callout,
  CodeBlock,
  DocsLayout,
  DocsShell,
  Section,
  type TocGroup
} from '../docs-ui'

export const metadata: Metadata = {
  title: 'Migration — OTP Input',
  description:
    'Move from mui-one-time-password-input or an earlier fork release to @wh1teee/mui-otp-input 8.'
}

const swapPackage = `pnpm remove mui-one-time-password-input
pnpm add @wh1teee/mui-otp-input`

const swapImport = `- import { MuiOtpInput } from 'mui-one-time-password-input';
+ import { MuiOtpInput } from '@wh1teee/mui-otp-input';`

const upgradeExample = `// Before: digits were enforced by hand.
<MuiOtpInput
  length={6}
  value={code}
  onChange={setCode}
  validateChar={(character) => /^\\d$/.test(character)}
/>

// After: the built-in policy, a cleaned paste, and a named group.
<MuiOtpInput
  ariaLabel="Verification code"
  length={6}
  value={code}
  onChange={setCode}
  validationType="numeric"
  pastePreprocess="digits-only"
/>`

const shadcnMove = `- import { MuiOtpInput } from '@wh1teee/mui-otp-input';
+ import { OtpInput } from '@wh1teee/mui-otp-input/shadcn';
+ import '@wh1teee/mui-otp-input/shadcn.css';

- <MuiOtpInput ariaLabel="Code" length={6} value={code} onChange={setCode} />
+ <OtpInput label="Code" length={6} value={code} onValueChange={setCode} />`

const toc: readonly TocGroup[] = [
  {
    title: 'Migration',
    links: [
      ['From the original package', '#from-upstream'],
      ['What you gain', '#additions'],
      ['From fork 5.x', '#from-fork'],
      ['Leaving Material UI', '#to-base-ui']
    ]
  }
]

const additions = [
  [
    'validationType',
    'Built-in numeric or alphanumeric policy instead of a hand-written validateChar.'
  ],
  [
    'pastePreprocess',
    'Cleans pasted and autofilled text before character rules run.'
  ],
  [
    'transformChar',
    'Maps characters before validation, for example to upper case.'
  ],
  ['onInvalid', 'Reports rejected typing and paste so you can explain why.'],
  [
    'autoFocus={ms}',
    'Delays first-slot focus until a dialog or transition settles.'
  ],
  [
    'ariaLabel, slotAriaLabel',
    'Names the group and announces each slot position.'
  ],
  [
    'name, form, autoSubmit',
    'Native form submission and reset, opt-in submit on completion.'
  ],
  ['mask', 'Renders slots as password inputs.']
] as const

export default function MigrationPage() {
  return (
    <DocsShell>
      <div className="docs-page-hero">
        <h1>Migration</h1>
        <p>
          Version 8 keeps the original <code>MuiOtpInput</code> API and adds
          Base UI, shadcn, headless, and form entrypoints next to it.
        </p>
      </div>
      <DocsLayout toc={toc}>
        <Section
          id="from-upstream"
          title="From mui-one-time-password-input"
          lead="This package continues viclafouch/mui-otp-input, published as mui-one-time-password-input. Swap the package and the import; your props keep working."
        >
          <CodeBlock title="Terminal">{swapPackage}</CodeBlock>
          <CodeBlock title="diff">{swapImport}</CodeBlock>
          <p>
            Every prop of the original component — <code>value</code>,{' '}
            <code>length</code>, <code>autoFocus</code>, <code>onChange</code>,{' '}
            <code>onComplete</code>, <code>onBlur</code>,{' '}
            <code>validateChar</code>, and <code>TextFieldsProps</code> — keeps
            its name and meaning, and the root still accepts Material UI{' '}
            <code>Box</code> props. Material UI 7 and 9 and React 18 and 19 are
            supported.
          </p>
        </Section>

        <Section
          id="additions"
          title="What you gain"
          lead="Optional props. Nothing changes until you use them."
        >
          <section
            aria-label="Props added since the original package"
            className="docs-table-wrap"
            // Horizontal table overflow must be keyboard-scrollable.
            tabIndex={0}
          >
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {additions.map(([prop, description]) => (
                  <tr key={prop}>
                    <td>
                      <code>{prop}</code>
                    </td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <CodeBlock title="VerificationCode.tsx">{upgradeExample}</CodeBlock>
          <Callout>
            <code>validationType</code> defaults to <code>"none"</code> in the
            Material UI component, exactly like the original. Opt in to{' '}
            <code>"numeric"</code> for numeric codes.
          </Callout>
        </Section>

        <Section
          id="from-fork"
          title="From @wh1teee/mui-otp-input 5.x"
          lead="Root imports are unchanged. Version 8 rebased the fork onto upstream v7 and kept its behavior."
        >
          <ul className="docs-list">
            <li>
              Delayed <code>autoFocus</code>, <code>transformChar</code>,{' '}
              <code>pastePreprocess</code>, and stable input refs behave as
              before.
            </li>
            <li>
              <code>/mui</code> is an explicit alias of the root import, for
              codebases that want the renderer visible in every import.
            </li>
            <li>
              The explicit form adapter path is{' '}
              <code>/mui/react-hook-form</code>; <code>/react-hook-form</code>{' '}
              still works.
            </li>
          </ul>
        </Section>

        <Section
          id="to-base-ui"
          title="Leaving Material UI"
          lead="Move one screen at a time: both renderers share one behavior contract, so the value your form receives does not change."
        >
          <CodeBlock title="diff">{shadcnMove}</CodeBlock>
          <p>
            The Base UI field renders its own label and description, defaults to
            numeric codes, and names change callbacks after Base UI (
            <code>onValueChange</code>, <code>onValueComplete</code>). Once no
            screen imports the root or <code>/mui</code>, remove{' '}
            <code>@mui/material</code> and Emotion — the Base UI entrypoints
            never load them.
          </p>
        </Section>
      </DocsLayout>
    </DocsShell>
  )
}
