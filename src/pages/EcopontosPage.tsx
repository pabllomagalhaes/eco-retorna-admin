import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Clock,
  Layers,
  AlertCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { ecopontoService } from '../services/ecopontoService';
import { materialService } from '../services/materialService';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import type { CollectionPoint, Material } from '../types';

export const EcopontosPage: React.FC = () => {
  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CollectionPoint | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Curitiba - PR');
  const [latitude, setLatitude] = useState(-25.4411);
  const [longitude, setLongitude] = useState(-49.2785);
  const [operatingHours, setOperatingHours] = useState('08:00 às 18:00');
  const [acceptedMaterials, setAcceptedMaterials] = useState<string[]>(['PET', 'Alumínio']);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pts, mats] = await Promise.all([
        ecopontoService.getAllPoints(),
        materialService.getAllMaterials(),
      ]);
      setPoints(pts);
      setMaterials(mats);
    } catch (err) {
      console.error('Falha ao carregar ecopontos', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPoint(null);
    setName('');
    setAddress('');
    setNeighborhood('');
    setCity('Curitiba - PR');
    setLatitude(-25.4411);
    setLongitude(-49.2785);
    setOperatingHours('08:00 às 18:00');
    setAcceptedMaterials(['PET', 'Alumínio']);
    setDescription('');
    setNotes('');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pt: CollectionPoint) => {
    setEditingPoint(pt);
    setName(pt.name);
    setAddress(pt.address);
    setNeighborhood(pt.neighborhood);
    setCity(pt.city || 'Curitiba - PR');
    setLatitude(pt.latitude);
    setLongitude(pt.longitude);
    setOperatingHours(pt.operatingHours || pt.openingHours || '08:00 às 18:00');
    setAcceptedMaterials(pt.acceptedMaterials || ['PET', 'Alumínio']);
    setDescription(pt.description || '');
    setNotes(pt.notes || '');
    setActive(pt.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleMaterial = (matName: string) => {
    if (acceptedMaterials.includes(matName)) {
      setAcceptedMaterials(acceptedMaterials.filter((m) => m !== matName));
    } else {
      setAcceptedMaterials([...acceptedMaterials, matName]);
    }
  };

  const handleToggleStatus = async (pt: CollectionPoint) => {
    try {
      const updated = await ecopontoService.toggleStatus(pt.id, !pt.active);
      setPoints((prev) => prev.map((p) => (p.id === pt.id ? updated : p)));
    } catch (err: any) {
      alert(`Erro ao alterar status do ecoponto: ${err.message}`);
    }
  };

  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await ecopontoService.savePoint({
        id: editingPoint?.id,
        name,
        address,
        neighborhood,
        city,
        latitude: Number(latitude),
        longitude: Number(longitude),
        operatingHours,
        acceptedMaterials,
        description,
        notes,
        active,
      });

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar ecoponto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ecopontos & Postos de Entrega</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os pontos de descarte físico exibidos no mapa do aplicativo participante.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Ecoponto</span>
        </button>
      </div>

      {/* Grid of Collection Points */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Carregando ecopontos...</div>
      ) : points.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhum ecoponto cadastrado"
          description="Adicione unidades de recebimento para que os participantes localizem postos de entrega."
          action={{
            label: 'Cadastrar Ecoponto',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {points.map((pt) => (
            <div
              key={pt.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                pt.active ? 'border-slate-200' : 'border-slate-200/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {pt.neighborhood} • {pt.city}
                  </span>
                  {pt.active ? (
                    <Badge variant="success" size="sm">
                      Operacional
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Inativo
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">{pt.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pt.address}</p>
                {pt.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 mb-3 italic">
                    {pt.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{pt.operatingHours || pt.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-500">
                      {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                    </span>
                  </div>
                  {pt.notes && (
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Obs:</strong> {pt.notes}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Materiais Aceitos:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pt.acceptedMaterials?.map((matName) => (
                      <span
                        key={matName}
                        className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                      >
                        {matName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(pt)}
                  className={`text-xs font-bold transition-colors cursor-pointer ${
                    pt.active
                      ? 'text-amber-700 hover:text-amber-800'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {pt.active ? 'Suspender Unidade' : 'Reativar Unidade'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(pt)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Editar Ecoponto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit Collection Point */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPoint ? 'Editar Ecoponto' : 'Novo Posto de Coleta'}
        subtitle="Alimenta o mapa e orientações de entrega do participante"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePoint} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome da Unidade / Ponto
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: EcoPonto Praça da Sustentabilidade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Sete de Setembro, 4200"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bairro / Região
              </label>
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Batel ou Centro"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cidade - UF
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Curitiba - PR"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                required
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="Ex: 08:00 às 18:00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Ponto de coleta de alta capacidade com fácil acesso para pedestres e ciclistas."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Instruções de Acesso
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acesso facilitado para pedestres e bicicletas."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2">
              Materiais Aceitos para Coleta
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
              {['PET', 'Alumínio'].map((matName) => {
                const isSelected = acceptedMaterials.includes(matName);
                return (
                  <label
                    key={matName}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleMaterial(matName)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{matName}</span>
                  </label>
                );
              })}
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
              <span className="font-semibold text-slate-800">Ecoponto em Operação</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Salvar Ecoponto'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
