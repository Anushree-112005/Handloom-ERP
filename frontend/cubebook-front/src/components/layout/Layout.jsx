const Layout = ({ children }) => {
  return (
    <div className="h-screen bg-[#f8f9fc] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

