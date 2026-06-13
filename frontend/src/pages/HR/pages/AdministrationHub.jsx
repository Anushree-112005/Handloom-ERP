import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Laptop, 
  Megaphone, 
  HelpCircle,
  ArrowRight 
} from 'lucide-react';

const AdministrationHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Documents',
      path: '/hr/documents',
      icon: FolderOpen,
      description: 'Store and manage HR documents',
      color: 'bg-slate-50 border-slate-200 hover:border-slate-400',
      iconColor: 'text-slate-600'
    },
    {
      title: 'Assets',
      path: '/hr/assets',
      icon: Laptop,
      description: 'Track IT and company asset allocation',
      color: 'bg-zinc-50 border-zinc-200 hover:border-zinc-400',
      iconColor: 'text-zinc-600'
    },
    {
      title: 'Announcements',
      path: '/hr/announcements',
      icon: Megaphone,
      description: 'Publish company-wide communications',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Helpdesk',
      path: '/hr/helpdesk',
      icon: HelpCircle,
      description: 'HR queries and support tickets',
      color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Administration</h1>
        <p className="text-slate-600">
          Manage HR documents, assets, and internal communication
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

export default AdministrationHub;
