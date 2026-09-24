import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Layers,
  Filter,
  Check,
  AlertCircle,
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import { materialService } from '../services/materialService';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { formatDate, isCampaignCurrentlyActive } from '../utils/calculations';
import type { Campaign, CampaignType, Material } from '../types';

interface CampanhasPageProps {
  currentAdminUid: string;
  autoOpenCreate?: boolean;
}

export const CampanhasPage: React.FC<CampanhasPageProps> = ({
  currentAdminUid,
  autoOpenCreate = false,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(autoOpenCreate);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('multiplier');
  const [materialId, setMaterialId] = useState('');
  const [multiplier, setMultiplier] = useState(2);
  const [minimumQuantity, setMinimumQuantity] = useState(10);
  const [bonusPoints, setBonusPoints] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [camps, mats] = await Promise.all([
        campaignService.getAllCampaigns(),
        materialService.getAllMaterials(),
      ]);
      setCampaigns(camps);
      setMaterials(mats);
      if (mats.length > 0 && !materialId) {
        setMaterialId(mats[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar campanhas', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setTitle('');
    setDescription('');
    setType('multiplier');
    setMultiplier(2);
    setMinimumQuantity(10);
    setBonusPoints(5);
    const today = new Date().toISOString().split('T')[0];
    const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(inTwoWeeks);
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setTitle(camp.title);
    setDescription(camp.description);
    setType(camp.type);
    setMaterialId(camp.materialId);
    setMultiplier(camp.multiplier || 2);
    setMinimumQuantity(camp.minimumQuantity || 10);
    setBonusPoints(camp.bonusPoints || 5);
    setStartDate(camp.startDate);
    setEndDate(camp.endDate);
    setActive(camp.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (camp: Campaign) => {
    try {
      const updated = await campaignService.toggleStatus(camp.id, !camp.active);
      setCampaigns((prev) => prev.map((c) => (c.id === camp.id ? updated : c)));
    } catch (err: any) {
      console.error('Erro ao alterar status:', err);
      alert('Não foi possível alterar o status da campanha. Tente novamente.');
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await campaignService.saveCampaign({
        ...(editingCampaign?.id ? { id: editingCampaign.id } : {}),
        title,
        description,
        type,
        materialId,
        ...(type === 'multiplier' ? { multiplier: Number(multiplier) } : {}),
        ...(type === 'quantity_bonus'
          ? {
              minimumQuantity: Number(minimumQuantity),
              bonusPoints: Number(bonusPoints),
            }
          : {}),
        startDate,
        endDate,
        active,
        createdBy: editingCampaign?.createdBy || currentAdminUid,
      });

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao salvar campanha:', err);
      let userFriendlyMessage = 'Não foi possível salvar a campanha. Tente novamente.';
      if (
        err instanceof Error &&
        err.message &&
        !err.message.includes('{') &&
        !err.message.includes('FirebaseError') &&
        !err.message.includes('authInfo')
      ) {
        userFriendlyMessage = err.message;
      }
      setFormError(userFriendlyMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === 'active') return isCampaignCurrentlyActive(c);
    if (statusFilter === 'inactive') return !isCampaignCurrentlyActive(c);
    return true;
  });

  const getMaterialName = (id: string) => {
    return materials.find((m) => m.id === id)?.name || 'Material geral';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão de Campanhas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crie incentivos temporários de pontuação que aparecem imediatamente no app do participante.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todas ({campaigns.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Vigentes
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'inactive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inativas
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Campanha</span>
          </button>
        </div>
      </div>

      {/* Campaigns Table or Empty State */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha encontrada"
          description="Crie campanhas de multiplicador de pontos ou bônus por quantidade para engajar os participantes."
          action={{
            label: '+ Criar Primeira Campanha',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Título & Descrição</th>
                  <th className="py-3 px-5">Material Alvo</th>
                  <th className="py-3 px-5">Regra Promocional</th>
                  <th className="py-3 px-5">Período de Validade</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCampaigns.map((camp) => {
                  const isActiveNow = isCampaignCurrentlyActive(camp);
                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{camp.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 max-w-sm">
                              {camp.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                          {getMaterialName(camp.materialId)}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {camp.type === 'multiplier' ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            <span>{camp.multiplier}x Pontos</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            <span>
                              +{camp.bonusPoints} pts a cada {camp.minimumQuantity} un
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDate(camp.startDate)} até {formatDate(camp.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {isActiveNow ? (
                          <Badge variant="success" size="sm">
                            Vigente
                          </Badge>
                        ) : !camp.active ? (
                          <Badge variant="neutral" size="sm">
                            Desativada
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Fora do Período
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(camp)}
                            title={camp.active ? 'Desativar campanha' : 'Ativar campanha'}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                              camp.active
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {camp.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(camp)}
                            title="Editar campanha"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? 'Editar Campanha Promocional' : 'Nova Campanha Promocional'}
        subtitle="Alimenta automaticamente os bônus e avisos no aplicativo participante"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome da Campanha
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Semana do PET em Dobro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição para o Participante
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Até domingo, garrafas PET valem pontos em dobro em todos os ecopontos da cidade."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Material Bonificado
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.pointsPerUnit} pts base)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Regra
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CampaignType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="multiplier">Multiplicador (ex: 2x)</option>
                <option value="quantity_bonus">Bônus por Quantidade (ex: a cada 10 un)</option>
              </select>
            </div>
          </div>

          {/* Dynamic rule parameters */}
          {type === 'multiplier' ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <label className="block font-bold text-emerald-900 mb-1">
                Fator Multiplicador (ex: 2 para dobro)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min="1.5"
                  max="10"
                  required
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value) || 2)}
                  className="w-24 px-3 py-2 rounded-lg border border-emerald-300 font-black text-center text-sm"
                />
                <span className="text-emerald-700 text-xs">
                  Cada ponto base será multiplicado por {multiplier}x.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-amber-900 mb-1">Qtd Mínima</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minimumQuantity}
                  onChange={(e) => setMinimumQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-amber-900 mb-1">Pontos Bônus (+)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 font-bold text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data Final
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Campanha Ativa</span>
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
                {isSaving ? 'Salvando...' : 'Salvar Campanha'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
