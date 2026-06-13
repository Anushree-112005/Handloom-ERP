import React from 'react';
import { 
  Settings, Users, Clock, Box, ShieldAlert, Zap, Factory, BarChart2,
  Calendar, Briefcase, UserCheck, AlertTriangle, TrendingDown,
  Layers, CheckSquare, Target, Activity, FileText, Bell, Map as MapIcon,
  ArrowRightLeft, Wrench
} from 'lucide-react';
import GenericMasterForm from '../../components/GenericMasterForm';
import ShiftMaster from './ShiftMaster';
import OperatorMaster from './OperatorMaster';
import LoomAvailability from './LoomAvailability';
import CapacityCalculation from './CapacityCalculation';
import OrderBreakdown from './OrderBreakdown';
import LoadBalancing from './LoadBalancing';
import StartDatePlanning from './StartDatePlanning';
import ShiftPlanning from './ShiftPlanning';
import PriorityScheduling from './PriorityScheduling';
import RuntimeCalculation from './RuntimeCalculation';
import OperatorAssignment from './OperatorAssignment';
import LoomStartEntry from './LoomStartEntry';
import ShiftProductionEntry from './ShiftProductionEntry';
import SpeedMonitoring from './SpeedMonitoring';
import LoomStatusUpdate from './LoomStatusUpdate';
import DailyProductionReport from './DailyProductionReport';
import TargetVsActual from './TargetVsActual';
import LossAnalysis from './LossAnalysis';
import EfficiencyCalculation from './EfficiencyCalculation';
import ShiftSummary from './ShiftSummary';
import OrderProgress from './OrderProgress';
import LoomContribution from './LoomContribution';
import LiveDashboard from './LiveDashboard';
import MultiLoomView from './MultiLoomView';
import BreakdownEntry from './BreakdownEntry';
import DowntimeCalc from './DowntimeCalc';
import LostMetersCalc from './LostMetersCalc';
import Reallocation from './Reallocation';
import MaintenanceLog from './MaintenanceLog';
import ETACalculation from './ETACalculation';
import DynamicETAUpdate from './DynamicETAUpdate';
import DelayRisk from './DelayRisk';
import FinishAlert from './FinishAlert';
import AlertLowEfficiency from './AlertLowEfficiency';
import AlertBreakdown from './AlertBreakdown';
import AlertDelayRisk from './AlertDelayRisk';
import AlertNextOrder from './AlertNextOrder';

// Reports
import LoomWiseProduction from './reports/LoomWiseProduction';
import OrderWiseProduction from './reports/OrderWiseProduction';
import DailyFactoryReport from './reports/DailyFactoryReport';
import EfficiencyTrend from './reports/EfficiencyTrend';
import DowntimeHistory from './reports/DowntimeHistory';
import DeliveryForecast from './reports/DeliveryForecast';

// Module 1
export const SHIFT_MASTER = {
  entity: 'ppc_shift_master',
  title: 'Shift Master',
  icon: Clock,
  color: '#8b5cf6',
  description: 'Define shift timings and working hours',
  fields: [
    { name: 'name', label: 'Shift Name', required: true, placeholder: 'e.g. Day Shift' },
    { name: 'extra_field_1', label: 'Start Time', required: true, placeholder: 'e.g. 06:00 AM' },
    { name: 'extra_field_2', label: 'End Time', required: true, placeholder: 'e.g. 02:00 PM' },
    { name: 'extra_field_3', label: 'Shift Type', type: 'select', options: ['Day', 'Night', 'General'], required: true },
    { name: 'description', label: 'Break Duration (mins)', type: 'number', placeholder: 'e.g. 30' }
  ]
};

export const OPERATOR_MASTER = {
  entity: 'ppc_operator_master',
  title: 'Operator Master',
  icon: Users,
  color: '#3b82f6',
  description: 'Manage floor operators and supervisors',
  fields: [
    { name: 'name', label: 'Operator Name', required: true },
    { name: 'code', label: 'Operator ID/Emp Code', required: true },
    { name: 'extra_field_1', label: 'Designation', type: 'select', options: ['Weaver', 'Assistant', 'Supervisor'] },
    { name: 'extra_field_2', label: 'Skill Level', type: 'select', options: ['Junior', 'Senior', 'Expert'] },
    { name: 'description', label: 'Contact Number' }
  ]
};

export const YARN_MASTER = {
  entity: 'ppc_yarn_master',
  title: 'Yarn Master',
  icon: Layers,
  color: '#f59e0b',
  description: 'Yarn counts, types, and suppliers',
  fields: [
    { name: 'name', label: 'Yarn Name', required: true, placeholder: 'e.g. Cotton Yarn 40s' },
    { name: 'code', label: 'Yarn Count', required: true, placeholder: 'e.g. 40s' },
    { name: 'extra_field_1', label: 'Yarn Type', type: 'select', options: ['Cotton', 'Polyester', 'Blended', 'Viscose'] },
    { name: 'extra_field_2', label: 'Unit', type: 'select', options: ['Kg', 'Cone', 'Bobbin'] },
    { name: 'description', label: 'Supplier Name' }
  ]
};

export const FABRIC_MASTER = {
  entity: 'ppc_fabric_master',
  title: 'Fabric Master',
  icon: MapIcon,
  color: '#ec4899',
  description: 'Fabric types, patterns, and parameters',
  fields: [
    { name: 'name', label: 'Fabric Name', required: true, placeholder: 'e.g. Cotton Poplin' },
    { name: 'extra_field_1', label: 'Fabric Type', type: 'select', options: ['Woven', 'Knitted', 'Non-Woven'] },
    { name: 'extra_field_2', label: 'Weave Pattern', type: 'select', options: ['Plain', 'Twill', 'Satin', 'Jacquard'] },
    { name: 'code', label: 'GSM & Width', placeholder: 'e.g. 120 GSM, 150cm' },
    { name: 'description', label: 'Warp & Weft Details', placeholder: 'e.g. 40s Warp, 40s Weft' }
  ]
};

export const DOWNTIME_REASON_MASTER = {
  entity: 'ppc_downtime_reason',
  title: 'Downtime Reason Master',
  icon: ShieldAlert,
  color: '#ef4444',
  description: 'Categorize reasons for machine stoppages',
  fields: [
    { name: 'code', label: 'Reason ID', placeholder: 'e.g. DR-001' },
    { name: 'extra_field_1', label: 'Reason Category', type: 'select', options: ['Mechanical', 'Electrical', 'Yarn', 'Power', 'Operator'] },
    { name: 'name', label: 'Reason Description', required: true, placeholder: 'e.g. Shuttle fly / Reed damage' },
    { name: 'description', label: 'Average Repair Time (min)', type: 'number', placeholder: 'e.g. 45' },
    { name: 'extra_field_2', label: 'Responsible Dept', type: 'text', placeholder: 'e.g. Maintenance' }
  ]
};

// Module 2 - Planning Tools (Simulated as Masters for data persistence)
export const LOOM_AVAILABILITY = {
  entity: 'ppc_availability_check',
  title: 'Loom Availability Check',
  icon: Calendar,
  color: '#10b981',
  description: 'Track Expected Free Dates for Looms',
  fields: [
    { name: 'name', label: 'Loom ID / Name', required: true },
    { name: 'extra_field_1', label: 'Current Order', placeholder: 'e.g. ORD-2024-001' },
    { name: 'extra_field_2', label: 'Expected Free Date', type: 'text', placeholder: 'e.g. 15-Jun-2026' },
    { name: 'description', label: 'Remaining Meters' }
  ]
};

export const ORDER_BREAKDOWN = {
  entity: 'ppc_order_breakdown',
  title: 'Order Breakdown',
  icon: Factory,
  color: '#06b6d4',
  description: 'Split large orders across multiple looms',
  fields: [
    { name: 'name', label: 'Order ID', required: true },
    { name: 'extra_field_1', label: 'Total Ordered Meters', required: true },
    { name: 'extra_field_2', label: 'Split Logic', type: 'select', options: ['Equal Split', 'Capacity-based', 'Manual'] },
    { name: 'description', label: 'Allocated Looms (IDs)' }
  ]
};

// Module 3 - Scheduling
export const SHIFT_PLANNING = {
  entity: 'ppc_shift_planning',
  title: 'Shift & Operator Assignment',
  icon: UserCheck,
  color: '#f43f5e',
  description: 'Map Operators to Looms for Shifts',
  fields: [
    { name: 'name', label: 'Loom ID', required: true },
    { name: 'extra_field_1', label: 'Shift Date', placeholder: 'e.g. 13-Jun-2026' },
    { name: 'extra_field_2', label: 'Shift Type', type: 'select', options: ['Day', 'Night'] },
    { name: 'description', label: 'Operator Name' }
  ]
};

// Module 7 - Reallocation
export const REALLOCATION = {
  entity: 'ppc_reallocation',
  title: 'Reallocation Engine',
  icon: ArrowRightLeft,
  color: '#8b5cf6',
  description: 'Move pending meters to a different loom',
  fields: [
    { name: 'name', label: 'Original Loom ID', required: true },
    { name: 'extra_field_1', label: 'Target Loom ID', required: true },
    { name: 'extra_field_2', label: 'Reason', type: 'select', options: ['Breakdown', 'Urgent Priority', 'Low Efficiency'] },
    { name: 'description', label: 'Meters Reallocated' }
  ]
};

export const MAINTENANCE_LOG = {
  entity: 'ppc_maintenance_log',
  title: 'Maintenance Log',
  icon: Wrench,
  color: '#0ea5e9',
  description: 'Service history and parts replaced',
  fields: [
    { name: 'name', label: 'Loom ID', required: true },
    { name: 'extra_field_1', label: 'Service Type', type: 'select', options: ['Preventive', 'Corrective'] },
    { name: 'extra_field_2', label: 'Parts Replaced', placeholder: 'e.g. Reed, Shuttle' },
    { name: 'code', label: 'Service Cost (₹)' },
    { name: 'description', label: 'Next Service Date' }
  ]
};


// Registry Map
export const PPC_REGISTRY = {
  'shift-master': <ShiftMaster />,
  'operator-master': <OperatorMaster />,
  'yarn-master': <GenericMasterForm config={YARN_MASTER} />,
  'fabric-master': <GenericMasterForm config={FABRIC_MASTER} />,
  'downtime-reason': <GenericMasterForm config={DOWNTIME_REASON_MASTER} />,
  
  'availability': <LoomAvailability />,
  'capacity': <CapacityCalculation />,
  'order-breakdown': <OrderBreakdown />,
  'load-balancing': <LoadBalancing />,
  // Scheduling
  'start-end': <StartDatePlanning />,
  'runtime': <RuntimeCalculation />,
  'shift-planning': <ShiftPlanning />,
  'operator-assign': <OperatorAssignment />,
  'priority': <PriorityScheduling />,
  
  // Execution
  'loom-start': <LoomStartEntry />,
  'shift-entry': <ShiftProductionEntry />,
  'speed-monitoring': <SpeedMonitoring />,
  'status-update': <LoomStatusUpdate />,
  
  // Monitoring
  'daily-report': <DailyProductionReport />,
  'target-actual': <TargetVsActual />,
  'loss-analysis': <LossAnalysis />,
  'efficiency': <EfficiencyCalculation />,
  'shift-summary': <ShiftSummary />,
  
  // Progress Tracking
  'order-progress': <OrderProgress />,
  'loom-contribution': <LoomContribution />,
  'live-dashboard': <LiveDashboard />,
  'multi-loom': <MultiLoomView />,
  
  // Problem Handling
  'breakdown-entry': <BreakdownEntry />,
  'downtime-calc': <DowntimeCalc />,
  'lost-meters': <LostMetersCalc />,
  'reallocation': <Reallocation />,
  'maintenance': <MaintenanceLog />,
  
  // Prediction Engine
  'eta-calc': <ETACalculation />,
  'dynamic-eta': <DynamicETAUpdate />,
  'delay-risk': <DelayRisk />,
  'finish-alert': <FinishAlert />,

  // Alerts
  'finishing-alert': <FinishAlert />,
  'low-efficiency': <AlertLowEfficiency />,
  'breakdown-alert': <AlertBreakdown />,
  'delay-alert': <AlertDelayRisk />,
  'next-order': <AlertNextOrder />,

  // Reports
  'loom-wise': <LoomWiseProduction />,
  'order-wise': <OrderWiseProduction />,
  'daily-factory': <DailyFactoryReport />,
  'efficiency-trend': <EfficiencyTrend />,
  'downtime-history': <DowntimeHistory />,
  'delivery-forecast': <DeliveryForecast />
};
