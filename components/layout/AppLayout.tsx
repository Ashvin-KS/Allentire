import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans">
      <Sidebar />
      {/* 
        Main content wrapper
        ml-16 matches the width of the sidebar (w-16) to prevent overlap 
      */}
      <main className="flex-1 ml-16 h-screen overflow-y-auto relative">
        <div className="h-full w-full p-2">
          {children}
        </div>
      </main>
    </div>
  );
};