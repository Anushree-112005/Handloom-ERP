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

        <Route path="design-entry" element={
          <ModulePage title="Design Entry" description="Create and manage fabric designs and specifications"
            icon={Palette} color="#10b981"
            fields={[
              {name:'DS Ref No',type:'Auto',desc:'Auto-generated reference number'},
              {name:'DS Date',type:'Date',desc:'Design entry date'},
              {name:'Design No',type:'Text',desc:'Internal design number'},
              {name:'Color',type:'Dropdown',desc:'Standard color list'},
              {name:'Buyer Name',type:'Dropdown',desc:'Buyer name'},
              {name:'Fabric',type:'Dropdown',desc:'Fabric composition'},
              {name:'Weaving',type:'Dropdown',desc:'Weaving pattern'},
              {name:'Design Type',type:'Dropdown',desc:'Normal, Special, Sample'},
            ]}
          />
        } />

        <Route path="yarn/purchase-order" element={
          <ModulePage title="Yarn Purchase Order" description="Generate purchase orders for yarn procurement"
            icon={Package} color="#f59e0b"
            fields={[
              {name:'PO Number',type:'Auto',desc:'System-generated PO number'},
              {name:'Party Name',type:'Dropdown',desc:'Yarn supplier'},
              {name:'Yarn Type',type:'Dropdown',desc:'Type of yarn'},
              {name:'Count',type:'Dropdown',desc:'Yarn count values'},
              {name:'Total Kgs',type:'Numeric',desc:'Total weight ordered'},
              {name:'Rate',type:'Numeric',desc:'Rate per kg'},
            ]}
          />
        } />

        <Route path="yarn/inward" element={
          <ModulePage title="Yarn Purchase Inward" description="Record yarn receipts and update inventory"
            icon={ArrowRightLeft} color="#22c55e"
            fields={[
              {name:'Inv No',type:'Text',desc:'Invoice number'},
              {name:'Received Type',type:'Dropdown',desc:'Direct / Against Order'},
              {name:'Party Name',type:'Dropdown',desc:'Supplier name'},
              {name:'Total Kgs',type:'Numeric',desc:'Total weight received'},
            ]}
          />
        } />

        <Route path="yarn/grey-delivery" element={
          <ModulePage title="Grey Yarn Delivery" description="Dispatch grey yarn to processing units"
            icon={Truck} color="#64748b"
            fields={[
              {name:'DC No',type:'Auto',desc:'Delivery challan number'},
              {name:'Delivery Type',type:'Dropdown',desc:'Direct / Against Order'},
              {name:'Party Name',type:'Dropdown',desc:'Receiving party'},
              {name:'Total Kgs',type:'Numeric',desc:'Total delivered weight'},
            ]}
          />
        } />

        <Route path="dyed-yarn/received" element={
          <ModulePage title="Dyed Yarn Received" description="Record dyed yarn consignments with quality tracking"
            icon={Palette} color="#ec4899"
            fields={[
              {name:'Inv No',type:'Text',desc:'Invoice number'},
              {name:'Received Type',type:'Dropdown',desc:'Direct / Against Order'},
              {name:'Design No',type:'Dropdown',desc:'Design reference'},
              {name:'Rcvd Kgs',type:'Numeric',desc:'Actual received weight'},
              {name:'Short %',type:'Numeric',desc:'Shortage percentage'},
            ]}
          />
        } />

        <Route path="dyed-yarn/delivery" element={
          <ModulePage title="Dyed Yarn Delivery" description="Dispatch dyed yarn with challan and logistics tracking"
            icon={Truck} color="#a855f7"
            fields={[
              {name:'DC No',type:'Auto',desc:'Delivery challan number'},
              {name:'Party Name',type:'Dropdown',desc:'Receiving party'},
              {name:'Transport',type:'Dropdown',desc:'Transport Master'},
              {name:'Balance Kgs',type:'Numeric',desc:'Balance after delivery'},
            ]}
          />
        } />

        <Route path="warp/beam-receipt" element={
          <ModulePage title="Warp Beam Receipt" description="Receive warp beams from sizing with beam-level details"
            icon={Layers} color="#8b5cf6"
            fields={[
              {name:'Ref No',type:'Text',desc:'Internal reference'},
              {name:'Beam Type',type:'Dropdown',desc:'Beam classification'},
              {name:'Warp Count',type:'Dropdown',desc:'Yarn count in warp'},
              {name:'Warp Ends',type:'Numeric',desc:'Number of warp ends'},
              {name:'Loom No',type:'Dropdown',desc:'Assigned loom'},
            ]}
          />
        } />

        <Route path="warp/delivery" element={
          <ModulePage title="Warp Delivery Entry" description="Dispatch warp beams to weavers and job workers"
            icon={Truck} color="#0ea5e9" fields={[]} />
        } />

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
