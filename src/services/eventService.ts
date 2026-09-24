/**
 * Event Service
 * Manages workshops, alerts, special collection drives, and community events.
 * Aligned with Eventos & Alertas do Participante.
 */

import { eventRepository } from '../repositories/eventRepository';
import type { EventItem, EcoItemType, EcoItemSeverity } from '../types';

export const eventService = {
  async getAllEvents(): Promise<EventItem[]> {
    return eventRepository.getAll();
  },

  async getUpcomingEvents(): Promise<EventItem[]> {
    const all = await eventRepository.getAll();
    const today = new Date().toISOString().split('T')[0];
    return all
      .filter((e) => e.active && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async saveEvent(data: {
    id?: string;
    title: string;
    description: string;
    fullDescription?: string;
    date: string;
    time: string;
    location: string;
    category: string;
    type: EcoItemType;
    severity?: EcoItemSeverity;
    active: boolean;
  }): Promise<EventItem> {
    if (!data.title.trim()) {
      throw new Error('O título do evento ou alerta é obrigatório.');
    }
    if (!data.date) {
      throw new Error('A data é obrigatória.');
    }

    const cleanPayload: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title: data.title.trim(),
      description: data.description.trim(),
      date: data.date,
      time: data.time || '09:00',
      location: data.location || '',
      category: data.category || 'Geral',
      type: data.type,
      active: Boolean(data.active),
      ...(data.fullDescription?.trim() ? { fullDescription: data.fullDescription.trim() } : {}),
      ...(data.type === 'alerta' && data.severity ? { severity: data.severity } : {}),
    };

    if (data.id) {
      return eventRepository.update(data.id, cleanPayload);
    } else {
      return eventRepository.create(cleanPayload);
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<EventItem> {
    return eventRepository.toggleActive(id, active);
  },

  async deleteEvent(id: string): Promise<void> {
    return eventRepository.delete(id);
  },
};
