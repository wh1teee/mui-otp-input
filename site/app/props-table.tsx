export type PropRow = readonly [
  name: string,
  type: string,
  defaultValue: string,
  description: string
]

export function PropsTable({
  label,
  rows
}: {
  label: string
  rows: readonly PropRow[]
}) {
  return (
    <section
      aria-label={label}
      className="docs-table-wrap"
      // Horizontal table overflow must be keyboard-scrollable.
      tabIndex={0}
    >
      <table className="docs-table docs-props">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, defaultValue, description]) => (
            <tr key={name}>
              <td>
                <code>{name}</code>
              </td>
              <td>
                <code className="docs-props-type">{type}</code>
              </td>
              <td>
                {defaultValue === '—' || defaultValue === 'required' ? (
                  defaultValue
                ) : (
                  <code>{defaultValue}</code>
                )}
              </td>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
