import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  Gift,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const CompensationHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Payroll',
      path: '/hr/payroll',
      icon: DollarSign,
      description: 'Process monthly payroll, taxes, and generate payslips seamlessly.',
      gradient: 'from-green-400 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Loans & Advances',
      path: '/hr/loans',
      icon: CreditCard,
      description: 'Manage employee loans, salary advances, and tracking.',
      gradient: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Benefits',
      path: '/hr/benefits',
      icon: Gift,
      description: 'Administer insurance, perks, and employee benefits.',
      gradient: 'from-purple-400 to-fuchsia-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-fuchsia-100',
      iconColor: 'text-fuchsia-600',
      borderColor: 'border-fuchsia-200'
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-slate-50/50">
      <div className="mb-10 relative">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-400/10 rounded-full blur-2xl"></div>
        <div className="absolute top-0 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Compensation & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Benefits</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl">
              Manage employee compensation, benefits, and financial transactions with ease.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.path}
              onClick={() => navigate(section.path)}
              className={`relative overflow-hidden ${section.bgColor} border border-white/50 backdrop-blur-sm rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] group flex flex-col min-h-[220px]`}
            >
              {/* Animated background gradient blob */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br ${section.gradient} rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-2xl bg-white shadow-sm border border-white/60 ${section.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    <ArrowRight className={`w-5 h-5 ${section.iconColor}`} />
                  </div>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight group-hover:text-slate-900">
                    {section.title}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompensationHub;
