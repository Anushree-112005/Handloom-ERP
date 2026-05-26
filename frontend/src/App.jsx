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
import DesignEntry from './pages/design_management/DesignEntry';
import YarnPurchaseOrder from './pages/yarn/YarnPurchaseOrder';
import YarnInward from './pages/yarn/YarnInward';
import GreyYarnDelivery from './pages/yarn/GreyYarnDelivery';
import DyedYarnReceived from './pages/yarn/DyedYarnReceived';
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

        <Route path="cloth/inward" element={
          <ModulePage title="Cloth Vendor Inward" description="Record cloth received from vendors"
            icon={Factory} color="#10b981" fields={[]} />
        } />

        <Route path="cloth/checking" element={
          <ModulePage title="ON Table Checking" description="Quality checking with defect tracking and grading"
            icon={CheckSquare} color="#eab308" fields={[]} />
        } />

        <Route path="cloth/delivery" element={
          <ModulePage title="Cloth Delivery Entry" description="Dispatch cloth with GST and logistics details"
            icon={Truck} color="#14b8a6" fields={[]} />
        } />

        <Route path="finished-fabric" element={
          <ModulePage title="Finished Fabric Inward" description="Receive and inspect finished fabric"
            icon={Scissors} color="#06b6d4" fields={[]} />
        } />

        <Route path="packing" element={
          <ModulePage title="Packing Slip / Bale Entry" description="Create packing slips with bale-level details"
            icon={Box} color="#f97316" fields={[]} />
        } />

        <Route path="goods-release" element={
          <ModulePage title="Goods Release Advice" description="GRA creation with approval workflow"
            icon={ClipboardList} color="#ef4444" fields={[]} />
        } />

        <Route path="sales-invoice" element={
          <ModulePage title="Sales Invoice" description="Generate invoices with GST calculations"
            icon={Receipt} color="#3b82f6" fields={[]} />
        } />

        <Route path="despatch" element={
          <ModulePage title="Despatch Planning" description="Plan and schedule dispatch with tolerance tracking"
            icon={MapPin} color="#ef4444" fields={[]} />
        } />

        <Route path="eway-bill" element={
          <ModulePage title="E-Way Bill Entry" description="GST e-way bill generation and management"
            icon={FileText} color="#22c55e" fields={[]} />
        } />

        <Route path="employee" element={<EmployeeMaster />} />

        <Route path="user-management" element={<UserManagement />} />

        <Route path="log-report" element={
          <ModulePage title="Log Report" description="System audit trail and activity monitoring"
            icon={Activity} color="#64748b"
            fields={[
              {name:'Module',type:'Dropdown',desc:'Filter by ERP module'},
              {name:'Type/Mode',type:'Dropdown',desc:'Save, Update, Delete, Print'},
              {name:'From Date',type:'Date',desc:'Start date filter'},
              {name:'To Date',type:'Date',desc:'End date filter'},
              {name:'User ID',type:'Dropdown',desc:'Filter by user'},
            ]}
          />
        } />

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
