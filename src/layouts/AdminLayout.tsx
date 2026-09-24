import React, { useState } from 'react';
import { Sidebar, type AdminTab } from '../components/Sidebar';
import { Header } from '../components/Header';
import type { UserProfile } from '../types';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  title,
  subtitle,
  children,
  onRefresh,
  isRefreshing,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop & Mobile Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        currentUser={currentUser}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
          <p>
            EcoRetorna Admin © 2026 • Painel Integrado ao EcoRetorna Participante • Dados em tempo real
          </p>
        </footer>
      </div>
    </div>
  );
};
