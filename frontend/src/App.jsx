import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ModulePage from './components/ModulePage';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Overview from './pages/dashboard/Overview';
import PartyMaster from './pages/party_master/PartyMaster';
import BuyerOrder from './pages/buyer_order/BuyerOrder';
import WorkOrderDesk from './pages/buyer_order/WorkOrderDesk';
import EmployeeMaster from './pages/employee_master/EmployeeMaster';
import UserManagement from './pages/user_management/UserManagement';
import DespatchPlanning from './pages/despatch/DespatchPlanning';
import SalesInvoice from './pages/sales_invoice/SalesInvoice';
import GoodsRelease from './pages/goods_release/GoodsRelease';
import PackingSlip from './pages/packing/PackingSlip';
import FinishedFabricInward from './pages/finished_fabric/FinishedFabricInward';
import ClothDelivery from './pages/cloth/ClothDelivery';
import OnTableChecking from './pages/cloth/OnTableChecking';
import ClothInward from './pages/cloth/ClothInward';
import FabricTransaction from './pages/cloth/FabricTransaction';
import GreigeTransaction from './pages/cloth/GreigeTransaction';
import LogReport from './pages/log_report/LogReport';
import ReportsDashboard from './pages/reports_dashboard/ReportsDashboard';
import EwayBill from './pages/eway_bill/EwayBill';
import CompanySetting from './pages/settings/CompanySetting';
import GateInward from './pages/gate/GateInward';
import GateOutward from './pages/gate/GateOutward';
import GatePass from './pages/gate/GatePass';
import GateReports from './pages/gate/GateReports';
import SparesTransaction from './pages/spares/SparesTransaction';
import SparesMaster from './pages/spares/SparesMaster';
import SparesReport from './pages/spares/SparesReport';
import SparesApproval from './pages/spares/SparesApproval';
import VoucherEntry from './pages/accounts/VoucherEntry';
import AccountsTransaction from './pages/accounts/AccountsTransaction';




// Core Yarn & Warping Imports
import DesignEntry from './pages/design_management/DesignEntry';
import YarnPurchaseOrder from './pages/yarn/YarnPurchaseOrder';
import YarnInward from './pages/yarn/YarnInward';
import GreyYarnDelivery from './pages/yarn/GreyYarnDelivery';
import DyedYarnReceived from './pages/yarn/DyedYarnReceived';
import DyedYarnDelivery from './pages/yarn/DyedYarnDelivery';
import WarpBeamReceipt from './pages/warp/WarpBeamReceipt';
import WarpDelivery from './pages/warp/WarpDelivery';
import WarpSizingTransaction from './pages/warp/WarpSizingTransaction';

import {
  ShoppingCart, Package, Truck, Palette, Layers, Factory,
  CheckSquare, Scissors, Box, ClipboardList, Receipt, MapPin,
  FileText, Shield, Activity, ArrowRightLeft, Users, Info
} from 'lucide-react';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute><Layout title="DINESH EXPORTS - THE HOUSE OF FABRICS" /></ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="overview" element={<Overview />} />
        <Route path="party-master" element={<PartyMaster />} />

        <Route path="buyer-order" element={<BuyerOrder />} />
        <Route path="work-order/desk" element={<WorkOrderDesk defaultSection="Transactions" />} />
        <Route path="work-order/transaction" element={<WorkOrderDesk defaultSection="Transactions" />} />
        <Route path="work-order/completion" element={<WorkOrderDesk defaultSection="Completions" />} />
        <Route path="work-order/approval" element={<WorkOrderDesk defaultSection="Approvals" />} />

        <Route path="design-entry" element={<DesignEntry />} />

        <Route path="yarn/purchase-order" element={<YarnPurchaseOrder />} />

        <Route path="yarn/inward" element={<YarnInward />} />

        <Route path="yarn/grey-delivery" element={<GreyYarnDelivery />} />

        <Route path="dyed-yarn/received" element={<DyedYarnReceived />} />

        <Route path="dyed-yarn/delivery" element={<DyedYarnDelivery />} />

        <Route path="warp/beam-receipt" element={<WarpBeamReceipt />} />

        <Route path="warp/delivery" element={<WarpDelivery />} />
        <Route path="warp/transaction" element={<WarpSizingTransaction />} />

        <Route path="cloth/inward" element={<ClothInward />} />

        <Route path="cloth/checking" element={<OnTableChecking />} />

        <Route path="cloth/delivery" element={<ClothDelivery />} />
        <Route path="fabric/transaction" element={<FabricTransaction />} />
        <Route path="greige/transaction" element={<GreigeTransaction />} />

        <Route path="finished-fabric" element={<FinishedFabricInward />} />

        {/* LAB & Shade Management Routes */}
        <Route path="lab/lab-dip" element={
          <ModulePage 
            title="Lab Dip Entry" 
            description="Manage color shade recipes, spectrophotometer matching, and dyeing recipes." 
            icon={Palette} 
            color="#3b82f6" 
          />
        } />
        <Route path="lab/shade-matching" element={
          <ModulePage 
            title="Shade Matching" 
            description="Inspect production lot shades and verify consistency against standard lab dips." 
            icon={CheckSquare} 
            color="#10b981" 
          />
        } />

        <Route path="packing" element={<PackingSlip />} />

        <Route path="goods-release" element={<GoodsRelease />} />

        <Route path="sales-invoice" element={<SalesInvoice />} />

        <Route path="despatch" element={<DespatchPlanning />} />

        <Route path="eway-bill" element={<EwayBill />} />

        <Route path="employee" element={<EmployeeMaster />} />

        <Route path="user-management" element={<UserManagement />} />

        <Route path="log-report" element={<LogReport />} />

        <Route path="reports-dashboard" element={<ReportsDashboard />} />

        <Route path="company-settings" element={<CompanySetting />} />

        <Route path="gate/inward" element={<GateInward />} />
        <Route path="gate/outward" element={<GateOutward />} />
        <Route path="gate/pass" element={<GatePass />} />
        <Route path="gate/reports" element={<GateReports />} />
        <Route path="spares/master" element={<SparesMaster />} />
        <Route path="spares/transaction" element={<SparesTransaction />} />
        <Route path="spares/approval" element={<SparesApproval />} />
        <Route path="spares/report" element={<SparesReport />} />
        <Route path="accounts/voucher-entry" element={<VoucherEntry />} />
        <Route path="accounts/transaction" element={<AccountsTransaction />} />

        <Route path="about" element={
          <div className="card animate-fade" style={{ padding: '32px', maxWidth: '600px', margin: '40px auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={24} style={{ color: '#2563eb' }} /> About DINESH EXPORTS ERP
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              DINESH EXPORTS ERP is a high-performance Enterprise Resource Planning platform tailored for textile manufacturing, procurement, inventory tracking, quality inspection, and sales/export operations.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              It features real-time data entry pipelines, process visualization, automated GST & E-Way billing modules, and comprehensive logging and audit systems.
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Version 1.0.0 • Developed for DINESH EXPORTS
            </div>
          </div>
        } />
      </Route>
    </Routes>
  );
}
