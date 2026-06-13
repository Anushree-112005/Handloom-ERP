import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  GraduationCap, 
  Receipt,
  Plane,
  ArrowRight 
} from 'lucide-react';

const GrowthHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Performance & Offboarding',
      path: '/hr/performance',
      icon: TrendingUp,
      description: 'Conduct appraisals and manage exits',
      color: 'bg-violet-50 border-violet-200 hover:border-violet-400',
      iconColor: 'text-violet-600'
    },
    {
      title: 'Goals & KPIs',
      path: '/hr/goals',
      icon: Target,
      description: 'Set and track performance goals',
      color: 'bg-fuchsia-50 border-fuchsia-200 hover:border-fuchsia-400',
      iconColor: 'text-fuchsia-600'
    },
    {
      title: 'Learning & Development',
      path: '/hr/learning',
      icon: GraduationCap,
      description: 'Organize training and development programs',
      color: 'bg-pink-50 border-pink-200 hover:border-pink-400',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Expense Claims',
      path: '/hr/expenses',
      icon: Receipt,
      description: 'Submit and process expense reimbursements',
      color: 'bg-red-50 border-red-200 hover:border-red-400',
      iconColor: 'text-red-600'
    },
    {
      title: 'Travel Requests',
      path: '/hr/travel',
      icon: Plane,
      description: 'Request and approve business travel',
      color: 'bg-sky-50 border-sky-200 hover:border-sky-400',
      iconColor: 'text-sky-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Growth & Development</h1>
        <p className="text-slate-600">
          Manage employee performance, career development, and business expenses
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

export default GrowthHub;
