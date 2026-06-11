# CubeBook — Complete Tally Prime Workflow

## Overview

CubeBook is a full-featured Indian accounting application that mirrors Tally Prime's complete workflow from company creation to GST filing. Built with Python FastAPI backend and React frontend.

## ✅ What's Implemented

### Backend (FastAPI + SQLAlchemy)
- ✓ Complete data models (Company, FinancialYear, LedgerGroup, Ledger, Voucher, VoucherEntry, StockItem)
- ✓ All CRUD routers (companies, ledger-groups, ledgers, stock-items, vouchers)
- ✓ Complete reporting engine (Day Book, Trial Balance, P&L, Balance Sheet)
- ✓ GST calculation and GSTR summary
- ✓ Automatic ledger group and default ledger creation on company setup
- ✓ Voucher numbering system with auto-increment by type
- ✓ Full balance validation on voucher entry

### Frontend (React 18 + Vite + TailwindCSS)
- ✓ Company setup wizard with state selection
- ✓ Company selection/switching interface
- ✓ Ledger master management
- ✓ Stock items management
- ✓ Voucher entry with multiple types (Payment, Receipt, Journal, Sales, Purchase, Contra)
- ✓ Day Book report with date and type filters
- ✓ Trial Balance, P&L Account, Balance Sheet reports
- ✓ GST Summary report (GSTR-3B style)
- ✓ Global keyboard shortcuts (Tally-style F-keys)
- ✓ Zustand state management for company context
- ✓ React Query for API data fetching and caching

### Database
- ✓ SQLite for development
- ✓ Automatic migrations on startup
- ✓ Support for PostgreSQL (production)

### Seed Data Script
- ✓ Complete seed script using requests library
- ✓ Creates sample company with realistic opening balances
- ✓ Auto-populates ledgers, stock items
- ✓ Generates sample vouchers across all types
- ✓ Generates reports for validation

---

## 🚀 Running the Application

### Prerequisites
- Python 3.10+
- Node.js 16+
- SQLite3

### Backend Setup

```bash
cd cubebook/backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

Server will be available at: http://localhost:8000

#### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Setup

```bash
cd cubebook/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

### Populate Database with Sample Data

```bash
# With backend running, execute seed script
cd cubebook/backend
python -m scripts.seed_data
```

This will:
1. Create "Shree Traders Pvt. Ltd." company
2. Auto-create 28 ledger groups
3. Create 20+ ledgers with opening balances
4. Create 4 stock items
5. Generate 7 sample vouchers
6. Validate all reports

---

## 📋 Complete API Reference

### Companies
- `POST /api/companies` — Create company (auto-creates FY, groups, ledgers)
- `GET /api/companies` — List active companies
- `GET /api/companies/{id}` — Get company details
- `PUT /api/companies/{id}` — Update company

### Ledger Groups
- `GET /api/ledger-groups?company_id=X` — List all groups
- `POST /api/ledger-groups` — Create group
- `GET /api/ledgers/groups-tree` — Full chart of accounts tree

### Ledgers
- `GET /api/ledgers?company_id=X` — List ledgers with filters
- `POST /api/ledgers` — Create ledger
- `GET /api/ledgers/{id}/statement?from_date=&to_date=` — Full ledger statement
- `PUT /api/ledgers/{id}` — Update ledger

### Stock Items
- `GET /api/stock-items?company_id=X` — List stock items
- `POST /api/stock-items` — Create stock item
- `PUT /api/stock-items/{id}` — Update
- `DELETE /api/stock-items/{id}` — Delete

### Vouchers
- `POST /api/vouchers` — Create voucher (auto-validates balance)
- `GET /api/vouchers?company_id=X&...filters` — List with filters
- `GET /api/vouchers/{id}` — Get voucher details
- `PUT /api/vouchers/{id}` — Update voucher
- `PUT /api/vouchers/{id}/cancel` — Cancel (vs delete)
- `DELETE /api/vouchers/{id}` — Delete

### Reports
- `GET /api/reports/day-book?company_id=&from_date=&to_date=&voucher_type=` — Day book
- `GET /api/reports/trial-balance?company_id=&as_of=` — Trial balance
- `GET /api/reports/profit-loss?company_id=&from_date=&to_date=` — P&L account
- `GET /api/reports/balance-sheet?company_id=&as_of=` — Balance sheet

### GST
- `GET /api/gst/summary?company_id=&month=&year=` — GSTR-3B summary

---

## 🎮 Keyboard Shortcuts (Tally Prime Compatible)

| Key | Action |
|-----|--------|
| F4 | Contra voucher |
| F5 | Payment voucher |
| F6 | Receipt voucher |
| F7 | Journal voucher |
| F8 | Sales invoice |
| F9 | Purchase entry |
| Ctrl+F8 | Credit note |
| Ctrl+F9 | Debit note |
| Alt+D | Day Book |
| Alt+M | Masters (Ledgers) |
| Alt+G | Gateway (Home) |
| Alt+P | Print |
| Alt+E | Export |

---

## 📊 Database Schema

### companies
- id (PK), name, legal_name, gstin, pan, state_code, address, city, pincode, phone, email
- currency, maintain_accounts, maintain_inventory, is_active, created_at

### financial_years
- id (PK), company_id (FK), label, start_date, end_date, is_current, is_closed

### ledger_groups
- id (PK), name, parent_group, parent_id (FK), nature, is_system, company_id (FK)

### ledgers
- id (PK), name, alias, group, group_id (FK), opening_balance, balance_type
- party_type, gstin, pan, address, state_code, bank details, gst settings
- is_active, is_system, company_id (FK)

### stock_items
- id (PK), name, unit, hsn_code, gst_rate, purchase_rate, selling_rate
- opening_qty, opening_rate, company_id (FK), is_active

### vouchers
- id (PK), voucher_number, voucher_type, date, narration, reference_no, reference_date
- status, total_amount, is_optional, company_id (FK), fy_id (FK)

### voucher_entries
- id (PK), voucher_id (FK), ledger_id (FK), ledger_name, dr_amount, cr_amount
- gst_rate, gst_type, is_gst_entry, stock_item_id (FK), qty, rate, cost_centre

---

## 📝 Frontend Components

### Pages
- `Gateway.jsx` — Company selection/setup wizard
- `Dashboard.jsx` — Home dashboard
- `Ledgers.jsx` — Ledger master management
- `StockItems.jsx` — Stock items management
- `Vouchers.jsx` — Voucher entry and listing
- `DayBook.jsx` — Day book report
- `Reports.jsx` — Profit & Loss, Balance Sheet, Trial Balance
- `GSTReports.jsx` — GST summary

### Components
- `Layout.jsx` — Main layout with sidebar and topbar
- `Sidebar.jsx` — Navigation with all menu items
- `TopBar.jsx` — Header with company selector
- `ShortcutBar.jsx` — Keyboard shortcut help overlay
- `VoucherForm.jsx` — Multi-entry voucher entry form

### Hooks
- `useShortcuts.js` — Global keyboard shortcut handler
- `useCompanyStore.js` — Zustand company state management

### API
- `api/index.js` — All API endpoint definitions
- `api/client.js` — Axios instance with error handling

---

## 🔧 Configuration

### Backend
- Database: `cubebook.db` (SQLite by default)
- FastAPI: Port 8000
- CORS: Allows localhost:5173 and localhost:3000

### Frontend
- Vite Dev Server: Port 5173
- Base URL: http://localhost:8000/api
- Build output: `dist/`

---

## 🧪 Testing Workflow

1. **Create Company**
   - Navigate to http://localhost:5173
   - Fill company setup form
   - Company auto-creates default ledger groups and ledgers

2. **Create Ledgers**
   - Go to Ledgers page
   - Add debtors, creditors, bank accounts, expense ledgers
   - Set opening balances

3. **Enter Vouchers**
   - Press F8 to create sales invoice
   - Press F9 to create purchase entry
   - Press F5 for payment, F6 for receipt
   - System validates that Dr = Cr before saving

4. **View Reports**
   - Day Book: All transactions in chronological order
   - Trial Balance: All ledger closing balances
   - P&L: Income vs Expenses
   - Balance Sheet: Assets vs Liabilities + Equity
   - GST Summary: Output tax, input credit, net payable

---

## 📦 Deployment

### Production Database
Update `backend/app/database.py`:
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5432/cubebook"
```

### Build Frontend
```bash
cd frontend
npm run build
# Output in dist/
```

### Docker Setup
Can be containerized using Docker Compose with PostgreSQL for production.

---

## 🐛 Troubleshooting

### "Company not found" error
- Ensure you've created/selected a company
- Check localStorage: `cb_company_id` should be set

### Vouchers not balanced
- Frontend validates on submit: Dr amount must equal Cr amount
- Check that all entries sum correctly

### Reports show zero balances
- Vouchers must have status = "Posted"
- Check voucher entries are correctly assigned to ledgers

### API errors
- Check FastAPI server is running on http://localhost:8000
- Verify database connection in logs
- Clear browser cache if stuck on old API responses

---

## 📚 Tally Prime Features Implemented

- ✓ Company creation with 28 built-in ledger groups
- ✓ Chart of accounts (hierarchical ledger groups)
- ✓ Multi-ledger entry for all voucher types
- ✓ Auto-generated voucher numbering by type
- ✓ Opening balances (Dr/Cr by nature)
- ✓ GST calculations (CGST/SGST/IGST)
- ✓ Day Book (date-wise transaction list)
- ✓ Ledger statements (running balances)
- ✓ Trial Balance (all accounts)
- ✓ Profit & Loss account
- ✓ Balance Sheet
- ✓ Stock items with HSN codes
- ✓ Financial year management
- ✓ Keyboard shortcuts (F4-F9, Ctrl+F8-F9)
- ✓ Voucher cancellation (not deletion)

---

## 🔮 Future Enhancements

- [ ] Multi-currency support
- [ ] Custom ledger groups
- [ ] Budget vs Actual
- [ ] Cost center tracking
- [ ] Reconciliation module
- [ ] Cheque printing
- [ ] SMS/Email notifications
- [ ] Mobile app
- [ ] Cloud backup
- [ ] GSTR filing integration
- [ ] TDS calculations
- [ ] Loan/Investment tracking
- [ ] Fixed asset depreciation
- [ ] Inventory management with stock movements
- [ ] POS integration

---

## 📄 License

Copyright © 2025 CubeBook. All rights reserved.

---

## 🤝 Support

For issues or feature requests, contact: accounts@cubebook.local

---

**Last Updated:** June 2, 2026
**Version:** 1.0.0
**Status:** Production Ready
