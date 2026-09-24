import React, { useState } from 'react';
import { Leaf, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import type { UserProfile } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl">
            <Leaf className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          EcoRetorna Admin
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400 font-medium">
          Acesso Restrito à Gestão e Operação
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                E-mail Administrativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ecoretorna.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Verification & testing helpers */}
          <div className="mt-6 pt-6 border-t border-slate-700/80 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ambiente de Avaliação & Testes</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-slate-200 font-semibold text-[11px]">Conta Administrador (role: admin)</p>
                  <p className="text-slate-400 text-[10px]">admin@ecoretorna.com</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@ecoretorna.com', 'admin123')}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/30 transition-all"
                >
                  Usar Admin
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-slate-200 font-semibold text-[11px]">Testar Bloqueio de Participante (role: participant)</p>
                  <p className="text-slate-400 text-[10px]">camila.demo@ecoretorna.com</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickFill('camila.demo@ecoretorna.com', 'senha123')}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/30 transition-all"
                >
                  Testar Bloqueio
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-4">
              Cadastro público de administradores não permitido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
