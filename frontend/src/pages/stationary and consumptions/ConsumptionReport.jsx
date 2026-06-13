import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConsumptionReport() {
  const [issues, setIssues] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);

  useEffect(() => {
    const list = mockDb.get('consumables_issues');
    const itms = mockDb.get('consumables_items');
    setIssues(list);
    setItemsList(itms);

    // Calculate department summary
    const summary = {};
    list.forEach(iss => {
      let val = 0;
      iss.items.forEach(line => {
        const detail = itms.find(x => x.id === line.itemId);
        val += line.qty * (detail?.rate || 0);
      });
      summary[iss.department] = (summary[iss.department] || 0) + val;
    });

    const summaryArray = Object.keys(summary).map(dept => ({
      name: dept,
      value: summary[dept]
    }));
    setDeptSummary(summaryArray);
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Department Consumption Report</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Breakdown of monthly consumption cost and quantities by department units</p>
      </div>

      <div className="form-row">
        <div className="card">
          <h3 className="text-lg font-bold text-slate-950 border-b pb-2">Department-wise Consumption Value</h3>
          <div className="h-64">
            {deptSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptSummary}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No consumption data logged.</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-slate-950 border-b pb-2 mb-4">Detailed Issue Logs</h3>
          <table className="data-table">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Issue ID</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Employee</th>
                <th className="px-4 py-2 text-right">Items Count</th>
              </tr>
            </thead>
            <tbody >
              {issues.map(iss => (
                <tr key={iss.id} >
                  <td className="px-4 py-2 font-mono">{iss.id}</td>
                  <td className="px-4 py-2 font-semibold text-slate-900">{iss.department}</td>
                  <td className="px-4 py-2 text-slate-600">{iss.employee}</td>
                  <td className="px-4 py-2 text-right font-bold">{iss.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
