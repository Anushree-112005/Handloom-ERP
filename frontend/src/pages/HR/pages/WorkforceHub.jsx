import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Network,
  Building2,
  Award,
  FolderOpen,
  ArrowRight
} from 'lucide-react';

const WorkforceHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Employees',
      path: '/hr/employees',
      icon: Users,
      description: 'Manage employee master database and profiles',
      color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Organization Chart',
      path: '/hr/org-chart',
      icon: Network,
      description: 'View organizational hierarchy and structure',
      color: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'Departments',
      path: '/hr/departments',
      icon: Building2,
      description: 'Manage departments and cost centers',
      color: 'bg-teal-50 border-teal-200 hover:border-teal-400',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Designations',
      path: '/hr/designations',
      icon: Award,
      description: 'Define roles and job grades',
      color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Projects',
      path: '/hr/projects',
      icon: FolderOpen,
      description: 'Manage team projects and assignments',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Workforce Management</h1>
        <p className="text-sm text-slate-500">
          Maintain comprehensive employee data and organizational structure
        </p>
      </div>

      <div className="module-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.path}
              onClick={() => navigate(section.path)}
              className="module-card group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="icon-box">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3>
                {section.title}
              </h3>
              <p>
                {section.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkforceHub;
