import React from 'react';
import FinanceApp from '../../../cubebook-front/src/App';

export default function CubeBookPage() {
  return (
    <div className="hr-module-container cubebook-module-root" style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <FinanceApp />
    </div>
  );
}
