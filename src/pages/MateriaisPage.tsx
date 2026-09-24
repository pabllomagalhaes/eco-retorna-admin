import React, { useState, useEffect } from 'react';
import {
  Layers,
  Edit2,
  AlertTriangle,
  Info,
  CheckCircle,
  Plus,
  ShieldAlert,
  Leaf,
  Archive,
} from 'lucide-react';
import { materialService } from '../services/materialService';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Material } from '../types';

export const MateriaisPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit scoring modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [newPoints, setNewPoints] = useState<number>(2);
  const [newCO2eFactor, setNewCO2eFactor] = useState<number>(0.18);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<Material['category']>('pet');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Toggle active dialog
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [materialToToggle, setMaterialToToggle] = useState<Material | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await materialService.getAllMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Falha ao carregar materiais', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (mat: Material) => {
    setSelectedMaterial(mat);
    setNewName(mat.name);
    setNewDescription(mat.description || '');
    setNewCategory(mat.category);
    setNewPoints(mat.pointsPerUnit);
    setNewCO2eFactor(mat.co2eFactor);
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedMaterial(null);
    setNewName('');
    setNewDescription('');
    setNewCategory('pet');
    setNewPoints(2);
    setNewCO2eFactor(0.18);
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleCategoryChange = (cat: Material['category']) => {
    setNewCategory(cat);
    if (!selectedMaterial) {
      if (cat === 'pet') {
        setNewName('Garrafa PET 2 L');
        setNewCO2eFactor(0.18);
      } else if (cat === 'aluminio') {
        setNewName('Lata de Alumínio');
        setNewCO2eFactor(0.22);
      }
    }
  };

  const handleSaveScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    try {
      await materialService.saveMaterial({
        ...(selectedMaterial?.id ? { id: selectedMaterial.id } : {}),
        name: newName,
        category: newCategory,
        pointsPerUnit: Number(newPoints),
        co2eFactor: Number(newCO2eFactor),
        active: selectedMaterial ? selectedMaterial.active : true,
        ...(newDescription.trim() ? { description: newDescription.trim() } : {}),
      });

      await loadMaterials();
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao atualizar regras do material:', err);
      let userMsg = 'Não foi possível salvar o material. Tente novamente.';
      if (
        err instanceof Error &&
        err.message &&
        !err.message.includes('{') &&
        !err.message.includes('FirebaseError') &&
        !err.message.includes('authInfo')
      ) {
        userMsg = err.message;
      }
      setModalError(userMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptToggle = (mat: Material) => {
    setMaterialToToggle(mat);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!materialToToggle) return;
    try {
      await materialService.toggleStatus(materialToToggle.id, !materialToToggle.active);
      await loadMaterials();
      setIsConfirmOpen(false);
    } catch (err: any) {
      console.error('Falha ao alterar status do material:', err);
      alert('Não foi possível alterar o status do material. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Materiais & Tabela de Pontos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie as pontuações e fatores de mitigação de carbono para cada tipo de embalagem aceita.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Material</span>
          </button>
        </div>
      </div>

      {/* Critical Invariant Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Regra Canônica de Integridade Histórica</p>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            Nesta versão, o sistema gerencia exclusivamente <strong>Garrafa PET 2 L</strong> e <strong>Lata de Alumínio</strong>. Alterações de pontuação base aplicam-se apenas a futuros registros em <code>recyclingRecords</code>.
          </p>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Catálogo de Materiais</h3>
          </div>
          <span className="text-xs text-slate-500">{materials.length} cadastrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-5">Material</th>
                <th className="py-3 px-5">ID Canônico</th>
                <th className="py-3 px-5">Categoria</th>
                <th className="py-3 px-5 text-center">Pontos Base</th>
                <th className="py-3 px-5 text-center">Fator CO₂e</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-5">
                    <p className="font-bold text-sm text-slate-900">{mat.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {mat.description || 'Sem descrição cadastrada'}
                    </p>
                  </td>
                  <td className="py-4 px-5 font-mono text-[11px] text-slate-500">
                    <code>{mat.id}</code>
                  </td>
                  <td className="py-4 px-5">
                    <span className="capitalize font-semibold text-slate-700">
                      {mat.category === 'pet' ? 'PET' : 'Alumínio'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="font-extrabold text-sm text-emerald-700">
                      {mat.pointsPerUnit} pts
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ {mat.unit || 'un'}</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="font-semibold text-slate-800">
                      {mat.co2eFactor} kg
                    </span>
                    <span className="text-[10px] text-slate-400 block">por {mat.unit || 'un'}</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {mat.active ? (
                      <Badge variant="success" size="sm">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Desativado
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePromptToggle(mat)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          mat.active
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {mat.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(mat)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Editar pontuação e fator"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Scoring Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={selectedMaterial ? `Editar ${selectedMaterial.name}` : 'Cadastrar Novo Material'}
        subtitle="Regra será aplicada imediatamente em futuras entregas"
        maxWidth="md"
      >
        <form onSubmit={handleSaveScoring} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {modalError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Material
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Garrafa PET 2 L ou Lata de Alumínio"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ex: Embalagens plásticas limpas e sem resíduos orgânicos."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={newCategory}
                onChange={(e) => handleCategoryChange(e.target.value as Material['category'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="pet">PET (Garrafa PET 2 L)</option>
                <option value="aluminio">Alumínio (Lata de Alumínio)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pontos por Unidade
              </label>
              <input
                type="number"
                min="1"
                required
                value={newPoints}
                onChange={(e) => setNewPoints(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-black text-sm text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fator CO₂e Evitado por Unidade (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newCO2eFactor}
              onChange={(e) => setNewCO2eFactor(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Fator oficial participante: PET = 0.18 kg CO₂e, Alumínio = 0.22 kg CO₂e.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar Regra'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={materialToToggle?.active ? 'Desativar Material' : 'Reativar Material'}
        message={
          materialToToggle?.active
            ? `Deseja desativar "${materialToToggle?.name}"? O material deixará de ser aceito para novos registros de entrega, mas todos os históricos anteriores permanecerão preservados.`
            : `Deseja reativar "${materialToToggle?.name}" para novas entregas?`
        }
        confirmLabel={materialToToggle?.active ? 'Desativar' : 'Reativar'}
        variant={materialToToggle?.active ? 'warning' : 'info'}
      />
    </div>
  );
};
