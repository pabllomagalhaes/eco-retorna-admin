import React, { useEffect, useState } from 'react';
import {
  Recycle,
  Package,
  Leaf,
  Users,
  Award,
  Megaphone,
  Gift,
  Calendar,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { impactService, type DashboardMetrics } from '../services/impactService';
import { campaignService } from '../services/campaignService';
import { benefitService } from '../services/benefitService';
import { eventService } from '../services/eventService';
import { materialService } from '../services/materialService';
import { formatPoints, formatCO2e, formatDate } from '../utils/calculations';
import type { Campaign, Benefit, EventItem, Material } from '../types';
import type { AdminTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigateTab: (tab: AdminTab) => void;
  onOpenQuickModal: (type: 'campanha' | 'beneficio' | 'evento') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onOpenQuickModal,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [activeBenefits, setActiveBenefits] = useState<Benefit[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mets, camps, bens, evs, mats] = await Promise.all([
        impactService.getDashboardMetrics(),
        campaignService.getActiveCampaigns(),
        benefitService.getAllBenefits(),
        eventService.getUpcomingEvents(),
        materialService.getAllMaterials(),
      ]);

      setMetrics(mets);
      setActiveCampaigns(camps);
      setActiveBenefits(bens.filter((b) => b.active));
      setUpcomingEvents(evs);
      setMaterials(mats);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMaterialName = (id: string) => {
    return materials.find((m) => m.id === id)?.name || id;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel Executivo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Visão Geral EcoRetorna
            </h2>
            <p className="text-emerald-100 text-sm max-w-xl mt-1.5 leading-relaxed">
              Monitore indicadores agregados de reciclagem, gerencie campanhas ativas e alimente as operações do aplicativo participante em tempo real.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenQuickModal('campanha')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-400/40 text-white transition-all cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-emerald-300" />
              <span>+ Nova Campanha</span>
            </button>
            <button
              onClick={() => onOpenQuickModal('beneficio')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-400/40 text-white transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4 text-emerald-300" />
              <span>+ Novo Benefício</span>
            </button>
            <button
              onClick={() => onOpenQuickModal('evento')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-400/40 text-white transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>+ Novo Evento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Indicators Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Indicadores Agregados Operacionais
          </h3>
          <span className="text-xs text-slate-500 font-medium">Dados derivados dos registros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Reciclagens Registradas"
            value={metrics?.totalRecords ?? '-'}
            subtext="Transações de entrega"
            icon={Recycle}
            color="emerald"
          />
          <StatCard
            label="Embalagens Recicladas"
            value={metrics?.totalContainers ?? '-'}
            subtext="Unidades totais recolhidas"
            icon={Package}
            color="blue"
          />
          <StatCard
            label="CO₂e Evitado Estimado"
            value={metrics ? formatCO2e(metrics.totalCO2eKg) : '-'}
            subtext="Impacto atmosférico evitado"
            icon={Leaf}
            color="emerald"
          />
          <StatCard
            label="Participantes Recicladores"
            value={metrics?.uniqueParticipants ?? '-'}
            subtext="Pessoas que já reciclaram"
            icon={Users}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Pontos Concedidos"
            value={metrics ? formatPoints(metrics.totalPointsGranted) : '-'}
            subtext="Créditos totais gerados"
            icon={Award}
            color="amber"
          />
          <StatCard
            label="Campanhas Ativas"
            value={metrics?.activeCampaignsCount ?? '-'}
            subtext="Multiplicadores & bônus"
            icon={Megaphone}
            color="emerald"
          />
          <StatCard
            label="Benefícios Ativos"
            value={metrics?.activeBenefitsCount ?? '-'}
            subtext="Brindes & doações na loja"
            icon={Gift}
            color="blue"
          />
          <StatCard
            label="Eventos Futuros"
            value={metrics?.upcomingEventsCount ?? '-'}
            subtext="Próximas ações na agenda"
            icon={Calendar}
            color="purple"
          />
        </div>
      </div>

      {/* Main Grid: Active Campaigns & Next Event / Active Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Campaigns Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">Campanhas Ativas</h4>
                  <p className="text-xs text-slate-500">
                    Regras promocionais vigentes no aplicativo participante
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('campanhas')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeCampaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma campanha ativa no momento.{' '}
                <button
                  onClick={() => onOpenQuickModal('campanha')}
                  className="text-emerald-600 font-bold underline ml-1"
                >
                  Criar agora
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Campanha</th>
                      <th className="py-3 px-5">Material Alvo</th>
                      <th className="py-3 px-5">Regra Promocional</th>
                      <th className="py-3 px-5">Período</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {camp.title}
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1">
                            {camp.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {getMaterialName(camp.materialId)}
                        </td>
                        <td className="py-3.5 px-5">
                          {camp.type === 'multiplier' ? (
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {camp.multiplier}x Pontos
                            </span>
                          ) : (
                            <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              +{camp.bonusPoints} pts a cada {camp.minimumQuantity} un
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">
                          {formatDate(camp.startDate)} até {formatDate(camp.endDate)}
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge variant="success" size="sm">
                            Ativa
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Regras ativas são aplicadas automaticamente no registro de entrega.</span>
          </div>
        </div>

        {/* Right Column (1 span): Next Event & Active Benefits summary */}
        <div className="space-y-6">
          {/* Next Event Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h4 className="font-bold text-sm text-slate-900">Próximo Evento</h4>
              </div>
              <button
                onClick={() => onNavigateTab('eventos')}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <span>Agenda</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhum evento futuro agendado.</p>
            ) : (
              <div className="mt-3.5 space-y-2">
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-800 mb-1">
                    <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-200">
                      {upcomingEvents[0].category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-purple-600" />
                      {formatDate(upcomingEvents[0].date)} às {upcomingEvents[0].time}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900 mt-1">
                    {upcomingEvents[0].title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {upcomingEvents[0].description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{upcomingEvents[0].location}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Benefits Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900">Benefícios em Destaque</h4>
              </div>
              <button
                onClick={() => onNavigateTab('beneficios')}
                className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Catálogo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {activeBenefits.slice(0, 3).map((ben) => (
                <div
                  key={ben.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{ben.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {ben.stock !== null ? `${ben.stock} un em estoque` : 'Doação contínua'}
                    </p>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    {ben.pointsRequired} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
