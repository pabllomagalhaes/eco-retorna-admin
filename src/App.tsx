import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CampanhasPage } from './pages/CampanhasPage';
import { BeneficiosPage } from './pages/BeneficiosPage';
import { EventosPage } from './pages/EventosPage';
import { MateriaisPage } from './pages/MateriaisPage';
import { EcopontosPage } from './pages/EcopontosPage';
import { ImpactoPage } from './pages/ImpactoPage';
import { PerfilPage } from './pages/PerfilPage';
import { authService } from './services/authService';
import type { AdminTab } from './components/Sidebar';
import type { UserProfile } from './types';
import { Leaf } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickCreateTrigger, setQuickCreateTrigger] = useState<
    'campanha' | 'beneficio' | 'evento' | null
  >(null);

  useEffect(() => {
    const unsubscribe = authService.initAuthListener((user, loading) => {
      setCurrentUser(user);
      setIsAuthLoading(loading);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const handleQuickModal = (type: 'campanha' | 'beneficio' | 'evento') => {
    if (type === 'campanha') {
      setQuickCreateTrigger('campanha');
      setCurrentTab('campanhas');
    } else if (type === 'beneficio') {
      setQuickCreateTrigger('beneficio');
      setCurrentTab('beneficios');
    } else if (type === 'evento') {
      setQuickCreateTrigger('evento');
      setCurrentTab('eventos');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Loading state during auth verification
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
          <Leaf className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Verificando credenciais...</p>
      </div>
    );
  }

  // If not authenticated, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine current page title and subtitle
  const tabMetadata: Record<AdminTab, { title: string; subtitle?: string }> = {
    dashboard: {
      title: 'Dashboard Operacional',
      subtitle: 'Indicadores em tempo real e visão geral do EcoRetorna',
    },
    campanhas: {
      title: 'Campanhas Promocionais',
      subtitle: 'Multiplicadores e bônus por período e material',
    },
    beneficios: {
      title: 'Benefícios & Brindes',
      subtitle: 'Gerenciamento do catálogo de recompensas e doações',
    },
    eventos: {
      title: 'Eventos & Ações Comunitárias',
      subtitle: 'Mutirões e encontros de conscientização ecológica',
    },
    materiais: {
      title: 'Materiais & Pontuação',
      subtitle: 'Regras base de pontuação e fatores de mitigação de CO₂e',
    },
    ecopontos: {
      title: 'Ecopontos & Postos',
      subtitle: 'Localização geográfica e materiais aceitos em cada unidade',
    },
    impacto: {
      title: 'Impacto Geral Derivado',
      subtitle: 'Métricas ambientais agregadas de todas as entregas',
    },
    perfil: {
      title: 'Perfil Administrativo',
      subtitle: 'Credenciais de acesso e segurança',
    },
  };

  const activeTab: AdminTab = tabMetadata[currentTab] ? currentTab : 'dashboard';
  const { title, subtitle } = tabMetadata[activeTab];

  return (
    <AdminLayout
      currentTab={activeTab}
      onSelectTab={(tab) => {
        setQuickCreateTrigger(null);
        setCurrentTab(tab);
      }}
      currentUser={currentUser}
      onLogout={handleLogout}
      title={title}
      subtitle={subtitle}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage
          onNavigateTab={setCurrentTab}
          onOpenQuickModal={handleQuickModal}
        />
      )}
      {activeTab === 'campanhas' && (
        <CampanhasPage
          currentAdminUid={currentUser.id}
          autoOpenCreate={quickCreateTrigger === 'campanha'}
        />
      )}
      {activeTab === 'beneficios' && (
        <BeneficiosPage autoOpenCreate={quickCreateTrigger === 'beneficio'} />
      )}
      {activeTab === 'eventos' && (
        <EventosPage autoOpenCreate={quickCreateTrigger === 'evento'} />
      )}
      {activeTab === 'materiais' && <MateriaisPage />}
      {activeTab === 'ecopontos' && <EcopontosPage />}
      {activeTab === 'impacto' && <ImpactoPage />}
      {activeTab === 'perfil' && (
        <PerfilPage currentUser={currentUser} onLogout={handleLogout} />
      )}
    </AdminLayout>
  );
};

export default App;
