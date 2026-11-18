import React, { useState } from 'react';
import { Navbar } from '../common/Navbar.js';
import { Sidebar } from '../common/Sidebar.js';
import { Footer } from '../common/Footer.js';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] font-sans antialiased flex flex-col justify-between selection:bg-[#1E5AA8] selection:text-white">
      {/* Header / Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex w-full relative">
        {/* Sidebar Drawer */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content + Footer Area (offset on desktop so sidebar never covers footer) */}
        <div className="flex-1 flex flex-col min-w-0 md:ml-64 w-full">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-140px)] overflow-x-hidden">
            {children}
          </main>

          {/* Global University Portal Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};
