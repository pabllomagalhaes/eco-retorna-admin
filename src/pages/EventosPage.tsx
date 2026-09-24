import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Bell,
  Trash2,
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { formatDate } from '../utils/calculations';
import type { EventItem, EcoItemType, EcoItemSeverity } from '../types';

interface EventosPageProps {
  autoOpenCreate?: boolean;
}

export const EventosPage: React.FC<EventosPageProps> = ({
  autoOpenCreate = false,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(autoOpenCreate);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Mutirão');
  const [type, setType] = useState<EcoItemType>('evento');
  const [severity, setSeverity] = useState<EcoItemSeverity>('info');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Falha ao carregar eventos', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setFullDescription('');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setDate(tomorrow);
    setTime('09:00');
    setLocation('');
    setCategory('Mutirão Comunitário');
    setType('evento');
    setSeverity('info');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setFullDescription(ev.fullDescription || '');
    setDate(ev.date);
    setTime(ev.time || '09:00');
    setLocation(ev.location || '');
    setCategory(ev.category || 'Geral');
    setType(ev.type || 'evento');
    setSeverity(ev.severity || 'info');
    setActive(ev.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (ev: EventItem) => {
    try {
      const updated = await eventService.toggleStatus(ev.id, !ev.active);
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? updated : e)));
    } catch (err: any) {
      console.error('Erro ao alterar status do evento:', err);
      alert('Não foi possível alterar o status do evento. Tente novamente.');
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await eventService.saveEvent({
        ...(editingEvent?.id ? { id: editingEvent.id } : {}),
        title,
        description,
        ...(fullDescription.trim() ? { fullDescription: fullDescription.trim() } : {}),
        date,
        time,
        location,
        category,
        type,
        ...(type === 'alerta' ? { severity } : {}),
        active,
      });

      await loadEvents();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      let userMsg = 'Não foi possível salvar o evento. Tente novamente.';
      if (
        err instanceof Error &&
        err.message &&
        !err.message.includes('{') &&
        !err.message.includes('FirebaseError') &&
        !err.message.includes('authInfo')
      ) {
        userMsg = err.message;
      }
      setFormError(userMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Eventos & Alertas Comunitários</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre mutirões, workshops ou avisos operacionais exibidos em Eventos & Alertas no participante.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Evento ou Alerta</span>
        </button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Carregando eventos...</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum evento cadastrado"
          description="Crie ações ecológicas ou avisos para engajar os participantes."
          action={{
            label: 'Criar Primeiro Evento',
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                ev.active ? 'border-slate-200' : 'border-slate-200/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        ev.type === 'alerta'
                          ? ev.severity === 'aviso'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : ev.severity === 'sucesso'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {ev.type === 'alerta' ? <Bell className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                      <span className="capitalize">{ev.type || 'evento'}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {ev.category}
                    </span>
                  </div>
                  {ev.active ? (
                    <Badge variant="success" size="sm">
                      Publicado
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Rascunho
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1.5">{ev.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {ev.description}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(ev.date)}</span>
                    {ev.time && (
                      <>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ev.time}</span>
                      </>
                    )}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(ev)}
                  className={`text-xs font-bold transition-colors cursor-pointer ${
                    ev.active
                      ? 'text-amber-700 hover:text-amber-800'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  {ev.active ? 'Suspender' : 'Publicar'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(ev)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Editar evento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Evento ou Alerta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Editar Item de Comunicação' : 'Novo Evento ou Alerta'}
        subtitle="Sincronizado diretamente com a aba Eventos & Alertas do participante"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Registro
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EcoItemType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
              >
                <option value="evento">Evento Comunitário / Ação</option>
                <option value="alerta">Alerta / Aviso aos Participantes</option>
              </select>
            </div>

            {type === 'alerta' ? (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nível de Severidade
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as EcoItemSeverity)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
                >
                  <option value="info">Informativo (Info)</option>
                  <option value="aviso">Aviso / Importante</option>
                  <option value="sucesso">Conquista / Sucesso</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Mutirão, Workshop, Campanha"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mutirão de Limpeza no Parque Barigui"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-sm"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resumo / Chamada
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Traga suas embalagens recicláveis limpas. Haverá entrega de brindes."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição Completa & Instruções (Opcional)
            </label>
            <textarea
              rows={3}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Ex: Detalhes sobre ponto de encontro, regras de segurança e separação de materiais..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Horário
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Localização
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Estação Parque Barigui - Portão Principal"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Ativo e Visível no Aplicativo</span>
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
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
