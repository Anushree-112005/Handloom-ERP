import React from 'react';
import { useLocation } from 'react-router-dom';

export default function CubeBookPage() {
  const location = useLocation();
  const subPath = location.pathname.substring('/cubebook'.length);
  const iframeSrc = `http://localhost:5174${subPath || '/'}`;

  return (
    <div className="cubebook-iframe-wrapper">
      <iframe
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="CubeBook Module"
        key={iframeSrc}
      />
    </div>
  );
}

