import React from 'react';
import { FileText, Folder } from 'lucide-react';

const Documents = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Folder className="h-7 w-7 text-indigo-600" />
              Document Management
            </h1>
            <p className="text-gray-600 mt-1">Manage vehicle and driver documents</p>
          </div>
        </div>
      </div>
      <div className="card">
        <Folder className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Management</h3>
        <p className="text-gray-600">Coming soon - Comprehensive document management system.</p>
      </div>
    </div>
  );
};

export default Documents;
