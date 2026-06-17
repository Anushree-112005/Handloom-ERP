import React from 'react';
import FinanceApp from '../../finance_module/App';

export default function CubeBookPage() {
  return (
    <div className="hr-module-container" style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <FinanceApp />
    </div>
  );
}
