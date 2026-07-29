$files = @(
    'src\pages\stationary and consumptions\GRNStockInward.jsx',
    'src\pages\stationary and consumptions\PurchaseOrder.jsx',
    'src\pages\stationary and consumptions\ReturnableDCManagement.jsx',
    'src\pages\stationary and consumptions\TransferEntry.jsx',
    'src\pages\stationary and consumptions\QuotationEntry.jsx'
)
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '<div className="card overflow-hidden flex-1 flex flex-col mt-4">', '{/* Filters Card */}
          <div className="card" style={{ marginBottom: 24, marginTop: 16 }}>'
        $content = $content -replace '<div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">', '<div style={{ display: ''flex'', gap: 16, alignItems: ''center'', justifyContent: ''space-between'', flexWrap: ''wrap'' }}>'
        $content = $content -replace 'className="form-control" style=\{\{ paddingLeft: ''36px'' \}\}', 'className="form-control" style={{ paddingLeft: ''36px'', margin: 0 }}'
        $content = $content -replace '<button onClick=\{loadData\} title="Refresh" className="btn btn-secondary p-2"><RefreshCw size=\{16\} /></button>', '<button onClick={loadData} title="Refresh" className="btn btn-secondary p-2" style={{ height: ''fit-content'' }}>
                <RefreshCw size={16} />
              </button>'
        $content = $content -replace '</div>?
?
\s*<div className="overflow-x-auto flex-1">', '</div>
          </div>

          <div style={{ display: ''flex'', gap: 24, alignItems: ''flex-start'' }}>
            <div style={{ flex: 1, overflowX: ''auto'' }}>
              <div className="card" style={{ padding: 0 }}>'
        $content = $content -replace '</tbody>?
\s*</table>?
\s*</div>?
\s*</div>?
\s*</>', '</tbody>
                </table>
              </div>
            </div>
          </div>
        </>'
        Set-Content -Path $file -Value $content
    }
}
