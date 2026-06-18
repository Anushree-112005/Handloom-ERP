import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="cubebook-module-root">
      {children || <Outlet />}
    </div>
  );
};

export default Layout;
