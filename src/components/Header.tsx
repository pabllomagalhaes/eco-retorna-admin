import React from 'react';
import { Menu, Bell, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../types';
import { isFirebaseConfigured } from '../firebase/config';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenMobileSidebar: () => void;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenMobileSidebar,
  title,
  subtitle,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left side: mobile menu trigger & page heading */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
          </div>
        </div>

        {/* Right side: quick stats badge, refresh & user pill */}
        <div className="flex items-center gap-3">
          {/* Status of Firebase Connection */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Ativo</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.name || 'Administrador'}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">Painel de Controle</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
