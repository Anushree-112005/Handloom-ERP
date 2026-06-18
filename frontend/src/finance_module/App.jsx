import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, companies } from './api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import useCompanyStore from './store/companyStore';
import './index.css';

// Core Pages
import Dashboard         from './pages/Dashboard';
import Gateway           from './pages/Gateway';
import CompanyCreate     from './pages/CompanyCreate';
import CompanyList       from './pages/CompanyList';
import CompanySetup      from './pages/CompanySetup';

import MasterCreation    from './pages/MasterCreation';
import MasterAlteration  from './pages/MasterAlteration';
import ChartOfAccounts   from './pages/ChartOfAccounts';
import VoucherTypesList  from './pages/VoucherTypesList';
import VoucherTypeCreate from './pages/VoucherTypeCreate';
import CurrenciesList    from './pages/CurrenciesList';
import BudgetsList       from './pages/BudgetsList';
import ScenariosList     from './pages/ScenariosList';
import CompanyGstDetails from './pages/CompanyGstDetails';
import PanCinDetails     from './pages/PanCinDetails';
import GstRegistration   from './pages/GstRegistration';
import GstClassification from './pages/GstClassification';
import CompanyFeatures   from './pages/CompanyFeatures';
import GroupCreate       from './pages/GroupCreate';
import LedgerCreate      from './pages/LedgerCreate';
import Ledgers           from './pages/Ledgers';
import StockItems        from './pages/StockItems';
import InventoryMasters  from './pages/InventoryMasters';
import StockGroupForm    from './pages/inventory/StockGroupForm';
import StockCategoryForm from './pages/inventory/StockCategoryForm';
import StockItemForm     from './pages/inventory/StockItemForm';
import UnitForm          from './pages/inventory/UnitForm';
import LocationForm      from './pages/inventory/LocationForm';
import CurrencyGateway   from './pages/CurrencyGateway';
import CurrencyCreate    from './pages/CurrencyCreate';
import CurrencyAlter     from './pages/CurrencyAlter';

// Transactions
import Vouchers          from './pages/Vouchers';
import DayBook           from './pages/DayBook';

// Financial Reports
import TrialBalance      from './pages/TrialBalance';
import ProfitLoss        from './pages/ProfitLoss';
import BalanceSheet      from './pages/BalanceSheet';
import LedgerReport      from './pages/LedgerReport';
import CashAndBankBook   from './pages/CashAndBankBook';
import OutstandingReport from './pages/OutstandingReport';
import SalesPurchaseRegister from './pages/SalesPurchaseRegister';
import RatioAnalysis     from './pages/RatioAnalysis';
import Reports           from './pages/Reports';

// GST
import GSTReports        from './pages/GSTReports';

// Inventory
import StockSummary      from './pages/StockSummary';
import StockMovement     from './pages/StockMovement';
import GodownSummary     from './pages/GodownSummary';

// Banking
import Banking           from './pages/Banking';
import BankingFeaturePage from './pages/BankingFeaturePage';
import ChequeRegister    from './pages/ChequeRegister';

// Payroll
import PayrollPage       from './pages/PayrollPage';

// System
import Login             from './pages/Login';
import Settings          from './pages/Settings';
import Audit             from './pages/Audit';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function AppRoutes() {
  const activeCompany = useCompanyStore(s => s.activeCompany);
  const { setCompany } = useCompanyStore();
  const [loading, setLoading] = useState(true);
  const company = localStorage.getItem('cb_company_id') || activeCompany;
  const isLoggedIn = !!localStorage.getItem('cb_auth_token') || !!localStorage.getItem('token');

  useEffect(() => {
    async function doAutoLogin() {
      try {
        let token = localStorage.getItem('cb_auth_token');
        if (!token) {
          try {
            const data = await auth.login({ username: 'admin', password: 'CubeBook@2026' });
            localStorage.setItem('cb_auth_token', data.access_token);
            localStorage.setItem('cb_auth_user', JSON.stringify({
              id:        data.user_id,
              username:  data.username,
              full_name: data.full_name,
              role:      data.role,
            }));
            token = data.access_token;
          } catch (e) {
            console.log("First finance login attempt failed, trying alternative password");
            const data = await auth.login({ username: 'admin', password: 'admin123' });
            localStorage.setItem('cb_auth_token', data.access_token);
            localStorage.setItem('cb_auth_user', JSON.stringify({
              id:        data.user_id,
              username:  data.username,
              full_name: data.full_name,
              role:      data.role,
            }));
            token = data.access_token;
          }
        }

        let companyId = localStorage.getItem('cb_company_id');
        let erpCompanyName = "Dinesh Exports";

        // Try to fetch the active company name from the main ERP
        try {
          const erpToken = localStorage.getItem('token'); // Main ERP usually uses 'token' or 'access_token'
          const res = await fetch('/api/v1/company-settings/', {
            headers: erpToken ? { 'Authorization': `Bearer ${erpToken}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            // The API might return an object or an array of settings
            if (Array.isArray(data) && data.length > 0 && data[0].company_name) {
              erpCompanyName = data[0].company_name;
            } else if (data && data.company_name) {
              erpCompanyName = data.company_name;
            }
          }
        } catch (e) {
          console.warn("Could not fetch ERP company settings:", e);
        }

        // Check if the ERP company exists in the Finance module
        const comps = await companies.list();
        let targetComp = comps?.find(c => c.name === erpCompanyName);

        // If it doesn't exist, create it automatically
        if (!targetComp) {
          try {
            targetComp = await companies.create({
              name: erpCompanyName,
              legal_name: erpCompanyName,
              maintain_inventory: true
            });
          } catch (e) {
            console.error("Failed to auto-create ERP company in finance:", e);
            targetComp = comps?.[0]; // Fallback to first available
          }
        }

        // Auto-select the ERP company if no company is currently selected in Finance.
        if (targetComp && !companyId) {
          localStorage.setItem('cb_company_id', targetComp.id);
          localStorage.setItem('cb_company_name', targetComp.name);
          setCompany(targetComp);
          companyId = targetComp.id;
        }

        // If a company ID is stored but not in Zustand, we should load it
        if (companyId && !activeCompany) {
          try {
            const compData = await companies.get(companyId);
            setCompany(compData);
          } catch (e) {
            // Company not found or invalid
          }
        }
      } catch (err) {
        console.error("Auto login failed:", err);
      } finally {
        setLoading(false);
      }
    }
    doAutoLogin();
  }, [activeCompany, setCompany]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-purple-400 font-semibold animate-pulse">Initializing Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public: Login */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/company/create" element={<CompanyCreate />} />
      <Route path="/company/alter"  element={<CompanyCreate />} />

      {!isLoggedIn && (
        <>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      {isLoggedIn && !company && (
        <>
          <Route path="/setup" element={<Gateway />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </>
      )}

      {company && (
        <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/cubebook/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="companies" element={<CompanyList />} />
              <Route path="company-setup" element={<CompanySetup />} />

              {/* Masters */}
              <Route path="masters"         element={<MasterCreation />} />
              <Route path="masters/alter"   element={<MasterAlteration />} />
              <Route path="masters/chart"   element={<ChartOfAccounts />} />
              <Route path="masters/voucher-types" element={<VoucherTypesList />} />
              <Route path="masters/voucher-type/create" element={<VoucherTypeCreate />} />
              <Route path="masters/currencies" element={<CurrenciesList />} />
              <Route path="masters/budgets" element={<BudgetsList />} />
              <Route path="masters/scenarios" element={<ScenariosList />} />
              <Route path="masters/gst-details" element={<CompanyGstDetails />} />
              <Route path="masters/pan-cin-details" element={<PanCinDetails />} />
              <Route path="masters/gst-registration" element={<GstRegistration />} />
              <Route path="masters/gst-classification" element={<GstClassification />} />
              <Route path="masters/company-features" element={<CompanyFeatures />} />
              <Route path="masters/group"   element={<GroupCreate />} />
              <Route path="masters/ledger"  element={<LedgerCreate />} />
              <Route path="ledgers"         element={<Ledgers />} />
              <Route path="stock"           element={<StockItems />} />
              <Route path="inventory-masters" element={<InventoryMasters />} />
              <Route path="inventory/stock-groups/create"    element={<StockGroupForm mode="create" />} />
              <Route path="inventory/stock-groups/alter/:id" element={<StockGroupForm mode="alter" />} />
              <Route path="inventory/stock-categories/create"    element={<StockCategoryForm mode="create" />} />
              <Route path="inventory/stock-categories/alter/:id" element={<StockCategoryForm mode="alter" />} />
              <Route path="inventory/stock-items/create"    element={<StockItemForm mode="create" />} />
              <Route path="inventory/stock-items/alter/:id" element={<StockItemForm mode="alter" />} />
              <Route path="inventory/units/create"    element={<UnitForm mode="create" />} />
              <Route path="inventory/units/alter/:id" element={<UnitForm mode="alter" />} />
              <Route path="inventory/locations/create"    element={<LocationForm mode="create" />} />
              <Route path="inventory/locations/alter/:id" element={<LocationForm mode="alter" />} />
              <Route path="currency"       element={<CurrencyGateway />} />
              <Route path="currency/create" element={<CurrencyCreate />} />
              <Route path="currency/alter"  element={<CurrencyAlter />} />

              {/* Transactions */}
              <Route path="vouchers"  element={<Vouchers />} />
              <Route path="day-book"  element={<DayBook />} />

              {/* Financial Reports */}
              <Route path="reports"                     element={<Reports />} />
              <Route path="reports/trial-balance"       element={<TrialBalance />} />
              <Route path="reports/profit-loss"         element={<ProfitLoss />} />
              <Route path="reports/balance-sheet"       element={<BalanceSheet />} />
              <Route path="reports/ledger"              element={<LedgerReport />} />
              <Route path="reports/cash-book"           element={<CashAndBankBook defaultTab="cash" />} />
              <Route path="reports/bank-book"           element={<CashAndBankBook defaultTab="bank" />} />
              <Route path="reports/outstanding"         element={<OutstandingReport />} />
              <Route path="reports/sales-register"      element={<SalesPurchaseRegister defaultTab="sales" />} />
              <Route path="reports/purchase-register"   element={<SalesPurchaseRegister defaultTab="purchase" />} />
              <Route path="reports/ratio-analysis"      element={<RatioAnalysis />} />

              {/* GST */}
              <Route path="gst"       element={<GSTReports />} />
              <Route path="gst/gstr1" element={<GSTReports />} />
              <Route path="gst/gstr3b" element={<GSTReports />} />
              <Route path="gst/itc"   element={<GSTReports />} />

              {/* Inventory */}
              <Route path="inventory/stock-summary" element={<StockSummary />} />
              <Route path="inventory/movement"      element={<StockMovement />} />
              <Route path="inventory/godowns"       element={<GodownSummary />} />

              {/* Banking */}
              <Route path="banking"                     element={<Banking />} />
              <Route path="banking/activities"          element={<BankingFeaturePage title="Banking Activities" modalType="ledger" />} />
              <Route path="banking/imported-data"       element={<BankingFeaturePage title="Imported Bank Data" modalType="ledger" />} />
              <Route path="banking/cheque-printing"     element={<BankingFeaturePage title="Cheque Printing" modalType="bank" />} />
              <Route path="banking/post-dated-summary"  element={<BankingFeaturePage title="Post-dated Summary" modalType="ledger" />} />
              <Route path="banking/deposit-slip"        element={<BankingFeaturePage title="Deposit Slip" modalType="bank" />} />
              <Route path="banking/payment-advice"      element={<BankingFeaturePage title="Payment Advice" modalType="bank" />} />
              <Route path="banking/cheque-register"     element={<ChequeRegister />} />

              {/* Payroll */}
              <Route path="payroll/employees"  element={<PayrollPage />} />
              <Route path="payroll/processing" element={<PayrollPage />} />
              <Route path="payroll/reports"    element={<PayrollPage />} />

              {/* Administration */}
              <Route path="settings"     element={<Settings />} />
              <Route path="admin/users"  element={<Settings />} />
              <Route path="admin/roles"  element={<Settings />} />

              {/* Audit */}
              <Route path="audit"          element={<Audit />} />
              <Route path="audit/vouchers" element={<Audit />} />

              <Route path="*" element={<Navigate to="/cubebook/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
