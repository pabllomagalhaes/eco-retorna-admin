import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  HeartHandshake,
  Sparkles,
  Layers,
  Archive,
  AlertCircle,
  TrendingUp,
  Award,
} from 'lucide-react';
import { benefitService } from '../services/benefitService';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { formatPoints } from '../utils/calculations';
import type { Benefit, BenefitCategory } from '../types';
import type { RedemptionAggregateMetrics } from '../repositories/redemptionRepository';

interface BeneficiosPageProps {
  autoOpenCreate?: boolean;
}

export const BeneficiosPage: React.FC<BeneficiosPageProps> = ({
  autoOpenCreate = false,
}) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [metrics, setMetrics] = useState<RedemptionAggregateMetrics | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | BenefitCategory>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(autoOpenCreate);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BenefitCategory>('gift');
  const [pointsRequired, setPointsRequired] = useState(100);
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(false);
  const [stock, setStock] = useState<number>(20);
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bens, stats] = await Promise.all([
        benefitService.getAllBenefits(),
        benefitService.getRedemptionStats(),
      ]);
      setBenefits(bens);
      setMetrics(stats);
    } catch (err) {
      console.error('Falha ao carregar benefícios', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBenefit(null);
    setTitle('');
    setDescription('');
    setCategory('gift');
    setPointsRequired(100);
    setIsUnlimitedStock(false);
    setStock(20);
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ben: Benefit) => {
    setEditingBenefit(ben);
    setTitle(ben.title);
    setDescription(ben.description);
    setCategory(ben.category);
    setPointsRequired(ben.pointsRequired);
    setIsUnlimitedStock(ben.stock === null);
    setStock(ben.stock ?? 0);
    setActive(ben.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (ben: Benefit) => {
    try {
      const updated = await benefitService.toggleStatus(ben.id, !ben.active);
      setBenefits((prev) => prev.map((b) => (b.id === ben.id ? updated : b)));
    } catch (err: any) {
      alert(`Erro ao alterar status do benefício: ${err.message}`);
    }
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await benefitService.saveBenefit({
        id: editingBenefit?.id,
        title,
        description,
        category,
        pointsRequired: Number(pointsRequired),
        stock: isUnlimitedStock ? null : Number(stock),
        active,
      });

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar benefício.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBenefits = benefits.filter((b) => {
    if (categoryFilter === 'all') return true;
    return b.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Benefícios & Brindes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os itens disponíveis para resgate de pontos e doações no EcoRetorna Participante.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setCategoryFilter('gift')}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'gift'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Brindes
            </button>
            <button
              onClick={() => setCategoryFilter('donation')}
              className={`px-3 py-1 rounded-lg transition-all ${
                categoryFilter === 'donation'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Doações
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Benefício</span>
          </button>
        </div>
      </div>

      {/* Aggregate Redemption Metrics (Section 20 requirement) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Métricas Agregadas de Resgates dos Participantes
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Resgates solicitados pelo app do participante
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400">Total de Resgates</p>
            <p className="text-xl font-black text-white mt-0.5">
              {metrics?.totalRedemptions ?? 0} resgates
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400">Pontos Utilizados</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {metrics ? formatPoints(metrics.totalPointsSpent) : '0 pts'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400">Benefício Mais Popular</p>
            <p className="text-sm font-bold text-amber-300 mt-0.5 truncate">
              {metrics?.mostPopularBenefit
                ? `${metrics.mostPopularBenefit.benefitTitle} (${metrics.mostPopularBenefit.count}x)`
                : 'Nenhum resgate ainda'}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      {filteredBenefits.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhum benefício cadastrado"
          description="Cadastre brindes ecológicos ou opções de doação social para troca de pontos."
          action={{
            label: '+ Cadastrar Benefício',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBenefits.map((ben) => {
            const isDonation = ben.category === 'donation';
            return (
              <div
                key={ben.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  ben.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/60 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isDonation
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isDonation ? (
                        <HeartHandshake className="w-5 h-5" />
                      ) : (
                        <Gift className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {ben.pointsRequired} pts
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{ben.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                    {ben.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {ben.stock !== null ? (
                      <span className="font-semibold text-slate-600">
                        Estoque: <strong>{ben.stock} un</strong>
                      </span>
                    ) : (
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Ilimitado (Doação)
                      </span>
                    )}
                    {ben.active ? (
                      <Badge variant="success" size="sm">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Inativo
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(ben)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                        ben.active
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {ben.active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(ben)}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Editar benefício"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Benefit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBenefit ? 'Editar Benefício' : 'Novo Benefício ou Brinde'}
        subtitle="Itens visíveis aos participantes na aba Benefícios"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBenefit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título do Benefício
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ecobag EcoRetorna ou Doação Mata Viva"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Bolsa ecológica 100% algodão para uso diário."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as BenefitCategory;
                  setCategory(cat);
                  if (cat === 'donation') {
                    setIsUnlimitedStock(true);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="gift">Brinde Físico</option>
                <option value="donation">Doação Social</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pontos Necessários
              </label>
              <input
                type="number"
                min="1"
                required
                value={pointsRequired}
                onChange={(e) => setPointsRequired(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-sm"
              />
            </div>
          </div>

          {/* Stock configuration */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isUnlimitedStock}
                onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">
                Estoque Ilimitado (ideal para doações)
              </span>
            </label>

            {!isUnlimitedStock && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantidade em Estoque
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                  className="w-32 px-3 py-2 rounded-lg border border-slate-300 font-bold text-sm bg-white"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Benefício Ativo no Catálogo</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Benefício'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
