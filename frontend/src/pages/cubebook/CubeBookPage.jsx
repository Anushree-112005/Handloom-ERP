import React from 'react';

export default function CubeBookPage() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <iframe
        src="http://localhost:5174"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="CubeBook Module"
      />
    </div>
  );
}
