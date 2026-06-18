import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="w-full h-full">
      {children || <Outlet />}
    </div>
  );
};

export default Layout;

