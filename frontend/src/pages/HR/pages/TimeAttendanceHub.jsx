import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  Calendar, 
  Sun,
  ArrowRight 
} from 'lucide-react';

const TimeAttendanceHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Attendance & Leave',
      path: '/hr/attendance',
      icon: Clock,
      description: 'Track attendance and manage leave requests',
      color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
      iconColor: 'text-amber-600'
    },
    {
      title: 'Timesheet',
      path: '/hr/timesheet',
      icon: FileText,
      description: 'Log work hours and project time',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Shift Management',
      path: '/hr/shifts',
      icon: Calendar,
      description: 'Define and assign employee shifts',
      color: 'bg-rose-50 border-rose-200 hover:border-rose-400',
      iconColor: 'text-rose-600'
    },
    {
      title: 'Holiday Calendar',
      path: '/hr/holidays',
      icon: Sun,
      description: 'Maintain company holiday calendar',
      color: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Time & Attendance</h1>
        <p className="text-slate-600">
          Track employee work hours, attendance, and leave management
        </p>
      </div>

      <div className="form-row">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.path}
              onClick={() => navigate(section.path)}
              className={`${section.color} border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-white ${section.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-slate-600">
                {section.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeAttendanceHub;
