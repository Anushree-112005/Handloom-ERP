import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ModulePage from './components/ModulePage';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Overview from './pages/dashboard/Overview';
import PartyMaster from './pages/party_master/PartyMaster';
import BuyerOrder from './pages/buyer_order/BuyerOrder';
import OrderSubModule from './pages/buyer_order/OrderSubModule';
import DispatchExpenseSubModule from './pages/buyer_order/DispatchExpenseSubModule';
import IPOInvoice from './pages/buyer_order/IPOInvoice';
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
import SubMasterPage from './pages/masters/SubMasterPage';




import CubeBookPage from './pages/cubebook/CubeBookPage';
import HRModule from './pages/HR/HRModule';
import PPCMultiModule from './pages/ppc/PPCMultiModule';

// Fleet & Vehicle Management Imports
import FleetDashboard from './pages/Vehicle management/FleetDashboard';
import VehicleList from './pages/Vehicle management/VehicleList';
import DriverList from './pages/Vehicle management/DriverList';
import HelperList from './pages/Vehicle management/HelperList';
import TransportVendorList from './pages/Vehicle management/TransportVendorList';
import RouteList from './pages/Vehicle management/RouteList';
import FuelStationList from './pages/Vehicle management/FuelStationList';
import TripPlanning from './pages/Vehicle management/TripPlanning';
import TripExecution from './pages/Vehicle management/TripExecution';
import TripProfitability from './pages/Vehicle management/TripProfitability';
import FuelEntry from './pages/Vehicle management/FuelEntry';
import FuelConsumption from './pages/Vehicle management/FuelConsumption';
import DieselKmReport from './pages/Vehicle management/DieselKmReport';
import MaintenanceLog from './pages/Vehicle management/MaintenanceLog';
import ServiceSchedule from './pages/Vehicle management/ServiceSchedule';
import BreakdownEntry from './pages/Vehicle management/BreakdownEntry';
import FleetDocuments from './pages/Vehicle management/FleetDocuments';
import FleetExpiryAlerts from './pages/Vehicle management/FleetExpiryAlerts';
import VehicleUtilization from './pages/Vehicle management/VehicleUtilization';
import DriverPerformance from './pages/Vehicle management/DriverPerformance';
import Documents from './pages/Vehicle management/Documents';


// Stores & Consumables Imports
import StationaryDashboard from './pages/stationary and consumptions/Dashboard';
import CategoryMaster from './pages/stationary and consumptions/CategoryMaster';
import UOMMaster from './pages/stationary and consumptions/UOMMaster';
import ItemMaster from './pages/stationary and consumptions/ItemMaster';
import VendorMaster from './pages/stationary and consumptions/VendorMaster';
import DepartmentMaster from './pages/stationary and consumptions/DepartmentMaster';
import MaterialRequest from './pages/stationary and consumptions/MaterialRequest';
import PurchaseRequisition from './pages/stationary and consumptions/PurchaseRequisition';
import PurchaseOrder from './pages/stationary and consumptions/PurchaseOrder';
import GRNStockInward from './pages/stationary and consumptions/GRNStockInward';
import IssueEntry from './pages/stationary and consumptions/IssueEntry';
import ReturnEntry from './pages/stationary and consumptions/ReturnEntry';
import TransferEntry from './pages/stationary and consumptions/TransferEntry';
import AdjustmentEntry from './pages/stationary and consumptions/AdjustmentEntry';
import PhysicalVerification from './pages/stationary and consumptions/PhysicalVerification';
import RequestApproval from './pages/stationary and consumptions/RequestApproval';
import POApproval from './pages/stationary and consumptions/POApproval';
import IssueApproval from './pages/stationary and consumptions/IssueApproval';
import StockReport from './pages/stationary and consumptions/StockReport';
import StockLedger from './pages/stationary and consumptions/StockLedger';
import ConsumptionReport from './pages/stationary and consumptions/ConsumptionReport';
import PurchaseReport from './pages/stationary and consumptions/PurchaseReport';
import ReorderReport from './pages/stationary and consumptions/ReorderReport';
import AuditReport from './pages/stationary and consumptions/AuditReport';


// Core Yarn & Warping Imports
import DesignEntry from './pages/design_management/DesignEntry';
import DesignAI from './pages/design_management/DesignAI';
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

        {/* Dynamic Sub-Master route — handles all 38 generic master forms */}
        <Route path="sub-master/:entity" element={<SubMasterPage />} />

        <Route path="buyer-order" element={<BuyerOrder />} />
        <Route path="buyer-order/processing" element={<OrderSubModule />} />
        <Route path="buyer-order/dispatch-expense" element={<DispatchExpenseSubModule />} />
        <Route path="ipo-invoice" element={<IPOInvoice />} />
        <Route path="work-order/desk" element={<WorkOrderDesk defaultSection="Transactions" />} />
        <Route path="work-order/transaction" element={<Navigate to="/work-order/transaction/design" replace />} />
        <Route path="work-order/transaction/design" element={<WorkOrderDesk defaultSection="Design & Development" />} />
        <Route path="work-order/transaction/management" element={<WorkOrderDesk defaultSection="Order Management" />} />
        <Route path="work-order/transaction/processing" element={<WorkOrderDesk defaultSection="Processing" />} />
        <Route path="work-order/transaction/prep" element={<WorkOrderDesk defaultSection="Yarn & Fabric Prep" />} />
        <Route path="work-order/transaction/amendments" element={<WorkOrderDesk defaultSection="Amendments & Codes" />} />
        <Route path="work-order/completion" element={<Navigate to="/work-order/completion/vendor-purchase" replace />} />
        <Route path="work-order/completion/vendor-purchase" element={<WorkOrderDesk defaultSection="Vendor & Purchase Completion" />} />
        <Route path="work-order/completion/processing-fabric" element={<WorkOrderDesk defaultSection="Processing & Fabric Completion" />} />

        <Route path="work-order/approval" element={<Navigate to="/work-order/approval/external" replace />} />
        <Route path="work-order/approval/external" element={<WorkOrderDesk defaultSection="External Order Approvals" />} />
        <Route path="work-order/approval/material-yarn" element={<WorkOrderDesk defaultSection="Material & Yarn Approvals" />} />

        <Route path="design-entry" element={<DesignEntry />} />
        <Route path="design-ai" element={<DesignAI />} />

        <Route path="yarn/purchase-order" element={<YarnPurchaseOrder />} />

        <Route path="yarn/inward" element={<YarnInward />} />

        <Route path="yarn/grey-delivery" element={<GreyYarnDelivery />} />

        <Route path="dyed-yarn/received" element={<DyedYarnReceived />} />

        <Route path="dyed-yarn/delivery" element={<DyedYarnDelivery />} />

        <Route path="warp/beam-receipt" element={<WarpBeamReceipt />} />

        <Route path="warp/delivery" element={<WarpDelivery />} />
        <Route path="warp/transaction" element={<Navigate to="/warp/transaction/entries" replace />} />
        <Route path="warp/transaction/entries" element={<WarpSizingTransaction defaultSection="Beam & Transaction Entries" />} />
        <Route path="warp/transaction/reports" element={<WarpSizingTransaction defaultSection="Reports, Bills & Amendments" />} />

        <Route path="cloth/inward" element={<ClothInward />} />
        <Route path="cloth/checking" element={<OnTableChecking />} />
        <Route path="cloth/delivery" element={<ClothDelivery />} />
        <Route path="finished-fabric" element={<FinishedFabricInward />} />

        <Route path="fabric/transaction" element={<Navigate to="/fabric/transaction/checking" replace />} />
        <Route path="fabric/transaction/checking" element={<FabricTransaction defaultSection="Fabric Checking" />} />
        <Route path="fabric/transaction/inward" element={<FabricTransaction defaultSection="Fabric Inward" />} />
        <Route path="fabric/transaction/delivery" element={<FabricTransaction defaultSection="Fabric Delivery" />} />
        <Route path="fabric/transaction/lotbale" element={<FabricTransaction defaultSection="Lot & Bale" />} />
        <Route path="fabric/transaction/gate" element={<FabricTransaction defaultSection="Gate & Dispatch" />} />
        <Route path="fabric/transaction/bills" element={<FabricTransaction defaultSection="Vendor Bills" />} />
        <Route path="fabric/transaction/surplus" element={<FabricTransaction defaultSection="Surplus Stock" />} />

        <Route path="greige/transaction" element={<Navigate to="/greige/transaction/operations" replace />} />
        <Route path="greige/transaction/operations" element={<GreigeTransaction defaultSection="Greige Operations" />} />
        <Route path="greige/transaction/administration" element={<GreigeTransaction defaultSection="Greige Administration" />} />

        {/* Production Planning & Control (PPC) - Full 10 Module Structure */}
        <Route path="ppc/:moduleName/:submodule?" element={<PPCMultiModule />} />

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
        <Route path="spares/approval" element={<SparesApproval />} />
        <Route path="spares/report" element={<SparesReport />} />

        <Route path="spares/desk" element={<Navigate to="/spares/desk/master-setup" replace />} />
        <Route path="spares/desk/master-setup" element={<SparesTransaction defaultSection="Master Setup" />} />
        <Route path="spares/desk/requests-approvals" element={<SparesTransaction defaultSection="Requests & Approvals" />} />
        <Route path="spares/desk/purchase-work-orders" element={<SparesTransaction defaultSection="Purchase & Work Orders" />} />
        <Route path="spares/desk/consumption-jobwork" element={<SparesTransaction defaultSection="Consumption & Jobwork" />} />
        <Route path="accounts/voucher-entry" element={<VoucherEntry />} />
        <Route path="accounts/transaction" element={<AccountsTransaction />} />
        <Route path="finance/desk/bills" element={<AccountsTransaction defaultSection="Creditors" />} />
        <Route path="finance/desk/invoices" element={<AccountsTransaction defaultSection="Sales" />} />
        <Route path="finance/desk/amendments" element={<AccountsTransaction defaultSection="Sales" defaultPage="sam" />} />
        <Route path="finance/desk/lc" element={<AccountsTransaction defaultSection="LC" />} />
        <Route path="cubebook/*" element={<CubeBookPage />} />
        <Route path="hr/*" element={<HRModule />} />
        
        {/* Fleet & Vehicle Management Routes */}
        <Route path="fleet/dashboard" element={<FleetDashboard />} />
        <Route path="fleet/vehicles" element={<VehicleList />} />
        <Route path="fleet/drivers" element={<DriverList />} />
        <Route path="fleet/helpers" element={<HelperList />} />
        <Route path="fleet/vendors" element={<TransportVendorList />} />
        <Route path="fleet/routes" element={<RouteList />} />
        <Route path="fleet/fuel-stations" element={<FuelStationList />} />
        <Route path="fleet/trip-planning" element={<TripPlanning />} />
        <Route path="fleet/trip-execution" element={<TripExecution />} />
        <Route path="fleet/trip-profitability" element={<TripProfitability />} />
        <Route path="fleet/fuel-entry" element={<FuelEntry />} />
        <Route path="fleet/fuel-consumption" element={<FuelConsumption />} />
        <Route path="fleet/diesel-km-report" element={<DieselKmReport />} />
        <Route path="fleet/maintenance-log" element={<MaintenanceLog />} />
        <Route path="fleet/service-schedule" element={<ServiceSchedule />} />
        <Route path="fleet/breakdown-entry" element={<BreakdownEntry />} />
        <Route path="fleet/documents" element={<FleetDocuments />} />
        <Route path="fleet/expiry-alerts" element={<FleetExpiryAlerts />} />
        <Route path="fleet/vehicle-utilization" element={<VehicleUtilization />} />
        <Route path="fleet/driver-performance" element={<DriverPerformance />} />
        <Route path="fleet/document-manager" element={<Documents />} />

        {/* Support old URL path and redirect/map it */}
        <Route path="vehicle-management/dashboard" element={<FleetDashboard />} />

        {/* Stores & Consumables Routes */}
        <Route path="stores-consumables/dashboard" element={<StationaryDashboard />} />
        <Route path="stores-consumables/category" element={<CategoryMaster />} />
        <Route path="stores-consumables/uom" element={<UOMMaster />} />
        <Route path="stores-consumables/item" element={<ItemMaster />} />
        <Route path="stores-consumables/vendor" element={<VendorMaster />} />
        <Route path="stores-consumables/department" element={<DepartmentMaster />} />
        <Route path="stores-consumables/request" element={<MaterialRequest />} />
        <Route path="stores-consumables/requisition" element={<PurchaseRequisition />} />
        <Route path="stores-consumables/po" element={<PurchaseOrder />} />
        <Route path="stores-consumables/grn" element={<GRNStockInward />} />
        <Route path="stores-consumables/issue" element={<IssueEntry />} />
        <Route path="stores-consumables/return" element={<ReturnEntry />} />
        <Route path="stores-consumables/transfer" element={<TransferEntry />} />
        <Route path="stores-consumables/adjustment" element={<AdjustmentEntry />} />
        <Route path="stores-consumables/physical" element={<PhysicalVerification />} />
        <Route path="stores-consumables/approve-request" element={<RequestApproval />} />
        <Route path="stores-consumables/approve-po" element={<POApproval />} />
        <Route path="stores-consumables/approve-issue" element={<IssueApproval />} />
        <Route path="stores-consumables/report-stock" element={<StockReport />} />
        <Route path="stores-consumables/report-ledger" element={<StockLedger />} />
        <Route path="stores-consumables/report-consumption" element={<ConsumptionReport />} />
        <Route path="stores-consumables/report-purchase" element={<PurchaseReport />} />
        <Route path="stores-consumables/report-reorder" element={<ReorderReport />} />
        <Route path="stores-consumables/report-audit" element={<AuditReport />} />

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
        
        {/* Wildcard redirect for unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

