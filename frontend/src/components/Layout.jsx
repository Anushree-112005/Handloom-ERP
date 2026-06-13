import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UniversalChatbot from './UniversalChatbot';

export default function Layout({ title }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isCollapsed={isCollapsed} onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Header title={title} />
        <div className="page-content animate-fade">
          <Outlet />
        </div>
      </div>
      <UniversalChatbot />
    </div>
  );
}
