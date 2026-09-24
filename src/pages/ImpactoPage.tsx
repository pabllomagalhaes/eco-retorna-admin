import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Leaf,
  Package,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';
import { impactService } from '../services/impactService';
import { StatCard } from '../components/StatCard';
import { formatPoints, formatCO2e } from '../utils/calculations';
import type { AggregatedImpact } from '../types';

export const ImpactoPage: React.FC = () => {
  const [impact, setImpact] = useState<AggregatedImpact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadImpact();
  }, []);

  const loadImpact = async () => {
    setIsLoading(true);
    try {
      const data = await impactService.getGeneralImpact();
      setImpact(data);
    } catch (err) {
      console.error('Falha ao calcular impacto ecológico', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Impacto Ecológico Geral</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Estatísticas consolidadas derivadas diretamente de todos os registros de reciclagem do sistema.
        </p>
      </div>

      {/* Mandatory Disclaimer (Section 25 requirement) */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-extrabold text-blue-950 text-sm">Nota Metodológica:</p>
          <p className="mt-0.5 leading-relaxed text-blue-800">
            <strong>Os indicadores ambientais apresentados são estimativas.</strong> Os cálculos utilizam
            os mesmos coeficientes de conversão de CO₂e adotados no aplicativo participante,
            garantindo consistência técnica em toda a rede.
          </p>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Embalagens Recicladas"
          value={impact?.totalContainers ?? 0}
          subtext="Volume total desviado de aterros"
          icon={Package}
          color="blue"
        />
        <StatCard
          label="CO₂e Evitado Estimado"
          value={impact ? formatCO2e(impact.totalCO2eKg) : '0 kg'}
          subtext="Gases de efeito estufa prevenidos"
          icon={Leaf}
          color="emerald"
        />
        <StatCard
          label="Pontos Concedidos"
          value={impact ? formatPoints(impact.totalPoints) : '0 pts'}
          subtext="Créditos ecológicos emitidos"
          icon={Award}
          color="amber"
        />
        <StatCard
          label="Participantes Ativos"
          value={impact?.uniqueParticipants ?? 0}
          subtext="Com entregas registradas"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Breakdown by Material Stream & Monthly Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Distribution Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Distribuição por Material</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Volumes & Impacto</span>
          </div>

          <div className="space-y-4">
            {impact?.materialsBreakdown.map((item) => {
              const percentage =
                impact.totalContainers > 0
                  ? Math.round((item.quantity / impact.totalContainers) * 100)
                  : 0;

              return (
                <div key={item.materialId} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-800">{item.materialName}</span>
                    <span className="text-slate-600 font-semibold">
                      {item.quantity} un ({percentage}%) •{' '}
                      <strong className="text-emerald-700">{formatCO2e(item.co2eKg)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{item.points} pontos concedidos</span>
                    <span>CO₂e evitado derivado</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend Evolution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Evolução Mensal de Coleta</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Série histórica</span>
          </div>

          <div className="space-y-3">
            {impact?.monthlyEvolution.map((month, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 capitalize">{month.monthLabel}</p>
                    <p className="text-xs text-slate-500">
                      {month.quantity} embalagens processadas
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-emerald-700">
                    {formatCO2e(month.co2eKg)}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatPoints(month.points)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
