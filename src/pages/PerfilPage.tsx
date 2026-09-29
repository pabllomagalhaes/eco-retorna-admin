import React from 'react';
import { User, ShieldCheck, Mail, Calendar, Key, LogOut } from 'lucide-react';
import type { UserProfile } from '../types';
import { Badge } from '../components/Badge';

interface PerfilPageProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const PerfilPage: React.FC<PerfilPageProps> = ({
  currentUser,
  onLogout,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black ring-4 ring-emerald-500/30">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-black text-slate-900">{currentUser?.name}</h2>
              <Badge variant="success" size="sm">
                Administrador
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser?.email}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
            Privilégios e Credenciais de Sistema
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 text-[11px]">Nível de Acesso (RBAC)</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">Administrador</p>
              <span className="text-[10px] text-slate-500">Documento users/{currentUser?.id}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-400 text-[11px]">Consulta de histórico</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">recyclingRecords</p>
              <span className="text-[10px] text-slate-500">Somente leitura pela interface administrativa</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 mt-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Segurança da Informação</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              O painel opera sob as diretrizes de privacidade do EcoRetorna. Nenhum dado privado,
              endereço residencial ou histórico financeiro é exposto desnecessariamente.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={onLogout}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
