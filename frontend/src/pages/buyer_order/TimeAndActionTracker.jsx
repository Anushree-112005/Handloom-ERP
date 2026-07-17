import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, AlertCircle, Search, Filter, Download } from 'lucide-react';

export default function TimeAndActionTracker() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dummy Data for the mockup
  const orders = [
    {
      id: 'ORD-1001',
      buyer: 'Zara International',
      style: 'SS26-Floral-Shirt',
      totalProgress: 60,
      status: 'On Track', // Overall status
      timeline: [
        { task: 'Yarn Sourcing', target: '2026-07-10', actual: '2026-07-09', status: 'Completed', delay: 0 },
        { task: 'Yarn Dyeing', target: '2026-07-15', actual: '2026-07-15', status: 'Completed', delay: 0 },
        { task: 'Weaving', target: '2026-07-20', actual: null, status: 'In Progress', delay: 0 }, // Future, on track
        { task: 'Processing', target: '2026-07-25', actual: null, status: 'Pending', delay: 0 },
        { task: 'Dispatch', target: '2026-07-30', actual: null, status: 'Pending', delay: 0 },
      ]
    },
    {
      id: 'ORD-1002',
      buyer: 'H&M',
      style: 'FW26-Denim-Jacket',
      totalProgress: 40,
      status: 'Delayed',
      timeline: [
        { task: 'Yarn Sourcing', target: '2026-07-05', actual: '2026-07-07', status: 'Completed', delay: 2 }, // Completed but delayed
        { task: 'Yarn Dyeing', target: '2026-07-12', actual: null, status: 'Pending', delay: 5 }, // 5 days delayed as of today (assume today is Jul 17)
        { task: 'Weaving', target: '2026-07-18', actual: null, status: 'Pending', delay: 0 },
        { task: 'Processing', target: '2026-07-25', actual: null, status: 'Pending', delay: 0 },
        { task: 'Dispatch', target: '2026-08-01', actual: null, status: 'Pending', delay: 0 },
      ]
    },
    {
      id: 'ORD-1003',
      buyer: 'Mango',
      style: 'SS26-Linen-Pant',
      totalProgress: 20,
      status: 'Warning',
      timeline: [
        { task: 'Yarn Sourcing', target: '2026-07-16', actual: '2026-07-16', status: 'Completed', delay: 0 },
        { task: 'Yarn Dyeing', target: '2026-07-18', actual: null, status: 'Pending', delay: 0 }, // Due tomorrow (Warning)
        { task: 'Weaving', target: '2026-07-24', actual: null, status: 'Pending', delay: 0 },
        { task: 'Processing', target: '2026-07-28', actual: null, status: 'Pending', delay: 0 },
        { task: 'Dispatch', target: '2026-08-05', actual: null, status: 'Pending', delay: 0 },
      ]
    }
  ];

  const getStatusColor = (status, delay, targetDate) => {
    // Determine color based on status and delay
    if (status === 'Completed' && delay <= 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (status === 'Completed' && delay > 0) return 'text-red-600 bg-red-50 border-red-200';
    
    if (delay > 0) return 'text-red-600 bg-red-50 border-red-200'; // Pending and delayed past target

    // Check for approaching deadline (Warning / Yellow) - let's assume today is 2026-07-17
    const today = new Date('2026-07-17');
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 2) return 'text-amber-600 bg-amber-50 border-amber-200'; // Within 2 days
    
    return 'text-slate-500 bg-slate-50 border-slate-200'; // Pending, on track (> 2 days)
  };

  const getStatusIcon = (colorClass) => {
    if (colorClass.includes('emerald')) return <CheckCircle2 size={18} />;
    if (colorClass.includes('amber')) return <Clock size={18} />;
    if (colorClass.includes('red')) return <AlertTriangle size={18} />;
    return <Calendar size={18} />;
  };

  const getDelayLabel = (delay) => {
    if (delay === 1) return '1 day delay';
    if (delay === 2) return '2 days delay';
    if (delay >= 3) return 'Critical Delay';
    return '';
  };

  return (
    <div className="animate-fade p-6 h-full overflow-y-auto" style={{ paddingBottom: 100 }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-primary" /> Time & Action (T&A) Plan
          </h2>
          <p className="text-slate-500">Track order timelines, detect delays, and monitor production progress.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Orders..." 
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card bg-white p-4 border border-slate-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Active Orders</p><h3 className="text-2xl font-bold text-slate-800">24</h3></div>
        </div>
        <div className="card bg-white p-4 border border-emerald-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">On Track</p><h3 className="text-2xl font-bold text-emerald-700">18</h3></div>
        </div>
        <div className="card bg-white p-4 border border-amber-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Approaching Delay</p><h3 className="text-2xl font-bold text-amber-700">4</h3></div>
        </div>
        <div className="card bg-white p-4 border border-red-200 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">Delayed</p><h3 className="text-2xl font-bold text-red-700">2</h3></div>
        </div>
      </div>

      {/* Orders List with Timelines */}
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{order.id}</h3>
                  <p className="text-sm text-slate-500">{order.buyer} • {order.style}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  order.status === 'On Track' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  order.status === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {order.status}
                </div>
              </div>
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Overall Progress</span>
                    <span className="font-bold text-slate-800">{order.totalProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        order.status === 'On Track' ? 'bg-emerald-500' :
                        order.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${order.totalProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 overflow-x-auto">
              <div className="flex items-start min-w-[800px]">
                {order.timeline.map((step, index) => {
                  const colorClass = getStatusColor(step.status, step.delay, step.target);
                  const isLast = index === order.timeline.length - 1;
                  
                  return (
                    <div key={index} className={`flex-1 relative ${isLast ? 'flex-none w-48' : ''}`}>
                      {/* Connecting Line */}
                      {!isLast && (
                        <div className={`absolute top-5 left-10 right-0 h-1 -translate-y-1/2 z-0 ${
                          step.status === 'Completed' ? 'bg-emerald-400' : 'bg-slate-200'
                        }`}></div>
                      )}
                      
                      {/* Node */}
                      <div className="relative z-10 flex flex-col items-start pr-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white ${colorClass} shadow-sm transition-transform hover:scale-110`}>
                          {getStatusIcon(colorClass)}
                        </div>
                        
                        <div className="mt-3">
                          <h4 className="font-semibold text-sm text-slate-800">{step.task}</h4>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar size={12} /> Tgt: {step.target}
                            </span>
                            {step.actual && (
                              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-500" /> Act: {step.actual}
                              </span>
                            )}
                            
                            {/* Delay Badge */}
                            {colorClass.includes('red') && step.delay > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 mt-1 border border-red-200 shadow-sm">
                                <AlertCircle size={10} /> {getDelayLabel(step.delay)}
                              </span>
                            )}
                            {/* Warning Badge */}
                            {colorClass.includes('amber') && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 mt-1 border border-amber-200 shadow-sm">
                                <Clock size={10} /> Due Soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
