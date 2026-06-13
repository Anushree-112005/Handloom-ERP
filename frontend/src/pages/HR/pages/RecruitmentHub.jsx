import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  FileText, 
  UserPlus, 
  Handshake,
  ArrowRight 
} from 'lucide-react';

const RecruitmentHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Job Requisitions',
      path: '/hr/requisitions',
      icon: FileText,
      description: 'Create and manage job openings and requisitions',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Recruitment',
      path: '/hr/recruitment',
      icon: Briefcase,
      description: 'Track candidates and manage hiring pipeline',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
      iconColor: 'text-green-600'
    },
    {
      title: 'Offers & Onboarding',
      path: '/hr/offers-onboarding',
      icon: Handshake,
      description: 'Send offers and onboard new employees',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Recruitment</h1>
        <p className="text-slate-600">
          Manage the complete hiring lifecycle from job posting to onboarding
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

export default RecruitmentHub;
