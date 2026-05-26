import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ModulePage from './components/ModulePage';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Overview from './pages/dashboard/Overview';
import PartyMaster from './pages/party_master/PartyMaster';
import EmployeeMaster from './pages/employee_master/EmployeeMaster';
import BuyerOrder from './pages/buyer_order/BuyerOrder';
import {
  ShoppingCart, Package, Truck, Palette, Layers, Factory,
  CheckSquare, Scissors, Box, ClipboardList, Receipt, MapPin,
  FileText, Shield, Activity, ArrowRightLeft
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
      </Route>
    </Routes>
  );
}
