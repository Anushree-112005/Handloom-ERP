import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  BarChart3, 
  Settings,
  ArrowRight 
} from 'lucide-react';

const OperationsHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Task Management',
      path: '/hr/tasks',
      icon: CheckSquare,
      description: 'Track HR tasks and compliance checklists',
      color: 'bg-lime-50 border-lime-200 hover:border-lime-400',
      iconColor: 'text-lime-600'
    },
    {
      title: 'HR Reports',
      path: '/hr/reports',
      icon: BarChart3,
      description: 'Generate analytics and compliance reports',
      color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'HR Settings',
      path: '/hr/settings',
      icon: Settings,
      description: 'Configure policies and system settings',
      color: 'bg-gray-50 border-gray-200 hover:border-gray-400',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Operations</h1>
        <p className="text-slate-600">
          Task management, reporting, and system configuration
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

export default OperationsHub;
