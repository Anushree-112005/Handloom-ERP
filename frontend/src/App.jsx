import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ModulePage from './components/ModulePage';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Overview from './pages/dashboard/Overview';
import PartyMaster from './pages/party_master/PartyMaster';
import BuyerOrder from './pages/buyer_order/BuyerOrder';
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
import LogReport from './pages/log_report/LogReport';
import EwayBill from './pages/eway_bill/EwayBill';
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
        <ProtectedRoute><Layout title="Dinesh Textile ERP" /></ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="overview" element={<Overview />} />
        <Route path="party-master" element={<PartyMaster />} />

        <Route path="buyer-order" element={<BuyerOrder />} />

        <Route path="design-entry" element={<DesignEntry />} />

        <Route path="yarn/purchase-order" element={<YarnPurchaseOrder />} />

        <Route path="yarn/inward" element={<YarnInward />} />

        <Route path="yarn/grey-delivery" element={<GreyYarnDelivery />} />

        <Route path="dyed-yarn/received" element={<DyedYarnReceived />} />

        <Route path="dyed-yarn/delivery" element={<DyedYarnDelivery />} />

        <Route path="warp/beam-receipt" element={<WarpBeamReceipt />} />

        <Route path="warp/delivery" element={<WarpDelivery />} />

        <Route path="cloth/inward" element={<ClothInward />} />

        <Route path="cloth/checking" element={<OnTableChecking />} />

        <Route path="cloth/delivery" element={<ClothDelivery />} />

        <Route path="finished-fabric" element={<FinishedFabricInward />} />

        <Route path="packing" element={<PackingSlip />} />

        <Route path="goods-release" element={<GoodsRelease />} />

        <Route path="sales-invoice" element={<SalesInvoice />} />

        <Route path="despatch" element={<DespatchPlanning />} />

        <Route path="eway-bill" element={<EwayBill />} />

        <Route path="employee" element={<EmployeeMaster />} />

        <Route path="user-management" element={<UserManagement />} />

        <Route path="log-report" element={<LogReport />} />

        <Route path="about" element={
          <div className="card animate-fade" style={{ padding: '32px', maxWidth: '600px', margin: '40px auto', textAlign: 'left' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={24} style={{ color: '#2563eb' }} /> About Dinesh Textile ERP
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              Dinesh Textile ERP is a high-performance Enterprise Resource Planning platform tailored for textile manufacturing, procurement, inventory tracking, quality inspection, and sales/export operations.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              It features real-time data entry pipelines, process visualization, automated GST & E-Way billing modules, and comprehensive logging and audit systems.
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Version 1.0.0 • Developed for Dinesh Export Textile
            </div>
          </div>
        } />
      </Route>
    </Routes>
  );
}
