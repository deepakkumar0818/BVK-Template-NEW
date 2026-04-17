/**
 * State / GST sub-table — compact invoice rows (4 cells + GST row).
 */
interface AddressStateTaxGridProps {
  stateCode?: string
  stateName?: string
  gstNo?: string
}

export default function AddressStateTaxGrid({ stateCode, stateName, gstNo }: AddressStateTaxGridProps) {
  return (
    <table className="quotation-address-state-grid">
      <colgroup>
        <col className="quotation-address-state-grid__col--a" />
        <col className="quotation-address-state-grid__col--b" />
        <col className="quotation-address-state-grid__col--c" />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <th scope="row" className="quotation-address-state-grid__label">
            State Code
          </th>
          <td className="quotation-address-state-grid__value">{stateCode ?? ''}</td>
          <th scope="row" className="quotation-address-state-grid__label">
            State
          </th>
          <td className="quotation-address-state-grid__value">{stateName ?? ''}</td>
        </tr>
        <tr>
          <th scope="row" className="quotation-address-state-grid__label">
            GST Number
          </th>
          <td colSpan={3} className="quotation-address-state-grid__value">
            {gstNo ?? ''}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
