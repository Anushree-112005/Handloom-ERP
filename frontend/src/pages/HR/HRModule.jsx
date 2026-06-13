import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HRDashboard from './pages/HRDashboard';
import AIHRDashboard from './pages/AIHRDashboard';
import WorkforceHub from './pages/WorkforceHub';
import EmployeeMaster from './pages/EmployeeMaster';
import EmployeeProfile from './pages/EmployeeProfile';
import OrgChart from './pages/OrgChart';
import Departments from './pages/Departments';
import Designations from './pages/Designations';
import HRProjects from './pages/HRProjects';
import RecruitmentHub from './pages/RecruitmentHub';
import JobRequisitions from './pages/JobRequisitions';
import Recruitment from './pages/Recruitment';
import OffersOnboarding from './pages/OffersOnboarding';
import TimeAttendanceHub from './pages/TimeAttendanceHub';
import AttendanceLeave from './pages/AttendanceLeave';
import Timesheet from './pages/Timesheet';
import Shifts from './pages/Shifts';
import Holidays from './pages/Holidays';
import CompensationHub from './pages/CompensationHub';
import Payroll from './pages/Payroll';
import Loans from './pages/Loans';
import Benefits from './pages/Benefits';
import GrowthHub from './pages/GrowthHub';
import PerformanceOffboarding from './pages/PerformanceOffboarding';
import Goals from './pages/Goals';
import LearningDevelopment from './pages/LearningDevelopment';
import ExpenseClaims from './pages/ExpenseClaims';
import TravelRequests from './pages/TravelRequests';
import OperationsHub from './pages/OperationsHub';
import TaskManagement from './pages/TaskManagement';
import HRReports from './pages/HRReports';
import HRSettings from './pages/HRSettings';
import AdministrationHub from './pages/AdministrationHub';
import Documents from './pages/Documents';
import Assets from './pages/Assets';
import Announcements from './pages/Announcements';
import Helpdesk from './pages/Helpdesk';

export default function HRModule() {
  return (
    <div className="hr-module-container">
      <Routes>
        <Route path="/" element={<HRDashboard />} />
        <Route path="/ai-dashboard" element={<AIHRDashboard />} />
        <Route path="/workforce" element={<WorkforceHub />} />
        <Route path="/employees" element={<EmployeeMaster />} />
        <Route path="/employees/:id" element={<EmployeeProfile />} />
        <Route path="/org-chart" element={<OrgChart />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/designations" element={<Designations />} />
        <Route path="/projects" element={<HRProjects />} />
        <Route path="/recruitment-hub" element={<RecruitmentHub />} />
        <Route path="/requisitions" element={<JobRequisitions />} />
        <Route path="/recruitment" element={<Recruitment />} />
        <Route path="/offers-onboarding" element={<OffersOnboarding />} />
        <Route path="/time-attendance" element={<TimeAttendanceHub />} />
        <Route path="/attendance" element={<AttendanceLeave />} />
        <Route path="/timesheet" element={<Timesheet />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/compensation" element={<CompensationHub />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/growth" element={<GrowthHub />} />
        <Route path="/performance" element={<PerformanceOffboarding />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/learning" element={<LearningDevelopment />} />
        <Route path="/expenses" element={<ExpenseClaims />} />
        <Route path="/travel" element={<TravelRequests />} />
        <Route path="/operations" element={<OperationsHub />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/reports" element={<HRReports />} />
        <Route path="/settings" element={<HRSettings />} />
        <Route path="/administration" element={<AdministrationHub />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/helpdesk" element={<Helpdesk />} />
      </Routes>
    </div>
  );
}
