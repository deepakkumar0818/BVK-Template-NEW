'use client'

export default function PrintButton() {
  const handlePrint = () => {
    // Reset scroll to the top before printing. Chrome anchors `position: fixed`
    // print footers (SLS / WI Process Febric / WI Decomesh / BVK) to the
    // scroll position at the moment window.print() fires, so triggering print
    // from a button at the bottom of the page (scrolled all the way down)
    // makes those fixed footers fail to repeat on every printed page.
    window.scrollTo(0, 0)
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="print-button"
    >
      Print
    </button>
  )
}
