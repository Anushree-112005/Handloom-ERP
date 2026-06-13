import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UniversalChatbot from './UniversalChatbot';

export default function Layout({ title }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        <div className="page-content animate-fade">
          <Outlet />
        </div>
      </div>
      <UniversalChatbot />
    </div>
  );
}
