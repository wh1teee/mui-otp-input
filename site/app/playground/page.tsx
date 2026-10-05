import {
  isOtpComplete,
  normalizeOtpValue,
  preprocessOtpPaste
} from '@wh1teee/mui-otp-input/headless'

import { DocsShell } from '../docs-ui'
import { Configurator } from './configurator'
import { FormExample } from './form-example'

export default function PlaygroundPage() {
  // Rendered on the server: the headless entry needs no React or UI runtime.
  const pasted = preprocessOtpPaste('Your code is 48-29-13', 'digits-only')
  const value = normalizeOtpValue(pasted, {
    length: 6,
    validationType: 'numeric'
  })
  const serverEvidence = { complete: isOtpComplete(value, 6), pasted, value }

  return (
    <DocsShell>
      <div className="docs-page-hero">
        <h1>Playground</h1>
        <p>
          Change any option, try the real component, and copy the matching code.
          Everything here runs the published package.
        </p>
      </div>

      <Configurator />
      <FormExample />

      <section
        className="docs-section playground-server-proof"
        aria-labelledby="server-evidence-title"
      >
        <h2 id="server-evidence-title">On the server</h2>
        <p>
          This result is computed by a Server Component with the{' '}
          <code>/headless</code> helpers before anything on the page hydrates.
        </p>
        <output data-testid="server-evidence">
          {JSON.stringify(serverEvidence)}
        </output>
      </section>
    </DocsShell>
  )
}
