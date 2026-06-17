import os
import re

files_to_update = [
    "TrialBalance.jsx",
    "StockMovement.jsx",
    "SalesPurchaseRegister.jsx",
    "RatioAnalysis.jsx",
    "ProfitLoss.jsx",
    "OutstandingReport.jsx",
    "LedgerReport.jsx",
    "DayBook.jsx",
    "CashAndBankBook.jsx",
    "BalanceSheet.jsx"
]

base_dir = r"c:\Users\User\Desktop\dinesh-tex\dinesh-tex\frontend\src\finance_module\pages"

for file in files_to_update:
    filepath = os.path.join(base_dir, file)
    if not os.path.exists(filepath):
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # ensure useEffect is imported
    if "useEffect" not in content:
        content = re.sub(r'(import\s*\{\s*useState)(.*?\})', r'\1, useEffect\2', content)

    lines = content.split('\n')
    new_lines = []
    
    setters = []
    
    for i, line in enumerate(lines):
        m_from_date = re.search(r'const \[\s*\w+\s*,\s*(setFromDate)\s*\]', line)
        if m_from_date: setters.append(m_from_date.group(1))
        m_from = re.search(r'const \[\s*\w+\s*,\s*(setFrom)\s*\]', line)
        if m_from: setters.append(m_from.group(1))
        m_to_date = re.search(r'const \[\s*\w+\s*,\s*(setToDate)\s*\]', line)
        if m_to_date: setters.append(m_to_date.group(1))
        m_to = re.search(r'const \[\s*\w+\s*,\s*(setTo)\s*\]', line)
        if m_to: setters.append(m_to.group(1))
        m_asof = re.search(r'const \[\s*\w+\s*,\s*(setAsOf)\s*\]', line)
        if m_asof: setters.append(m_asof.group(1))

        if "useQuery(" in line and setters:
            injection = [
                "  useEffect(() => {",
                "    if (activeFy) {"
            ]
            
            if "setFromDate" in setters:
                injection.append("      setFromDate(activeFy.start_date || '');")
            if "setFrom" in setters:
                injection.append("      setFrom(activeFy.start_date || '');")
            if "setToDate" in setters:
                injection.append("      setToDate(activeFy.end_date || new Date().toISOString().split('T')[0]);")
            if "setTo" in setters:
                injection.append("      setTo(activeFy.end_date || new Date().toISOString().split('T')[0]);")
            if "setAsOf" in setters:
                injection.append("      setAsOf(activeFy.end_date || new Date().toISOString().split('T')[0]);")
                
            injection.append("    }")
            injection.append("  }, [activeFy]);\n")
            
            new_lines.extend(injection)
            setters = []
            
        new_lines.append(line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
        
    print(f"Updated {file}")
