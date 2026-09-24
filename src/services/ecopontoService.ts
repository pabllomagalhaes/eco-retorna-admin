/**
 * Ecoponto Service
 * Manages drop-off points, geolocation, operating hours, and accepted materials.
 * Aligned with Postos & Ecopontos do Participante.
 */

import { ecopontoRepository } from '../repositories/ecopontoRepository';
import type { CollectionPoint } from '../types';

export const ecopontoService = {
  async getAllPoints(): Promise<CollectionPoint[]> {
    return ecopontoRepository.getAll();
  },

  async getActivePoints(): Promise<CollectionPoint[]> {
    return ecopontoRepository.getActive();
  },

  async savePoint(data: {
    id?: string;
    name: string;
    address: string;
    neighborhood: string;
    city: string;
    operatingHours: string;
    acceptedMaterials: string[];
    latitude: number;
    longitude: number;
    description: string;
    active: boolean;
    notes?: string;
  }): Promise<CollectionPoint> {
    if (!data.name.trim()) {
      throw new Error('O nome do ecoponto é obrigatório.');
    }
    if (!data.address.trim()) {
      throw new Error('O endereço do ecoponto é obrigatório.');
    }

    const cleanPayload: Omit<CollectionPoint, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name.trim(),
      address: data.address.trim(),
      neighborhood: data.neighborhood.trim(),
      city: data.city.trim() || 'Curitiba - PR',
      operatingHours: data.operatingHours.trim() || '08:00 às 18:00',
      acceptedMaterials: data.acceptedMaterials,
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      description: data.description.trim(),
      active: Boolean(data.active),
      ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
    };

    if (data.id) {
      return ecopontoRepository.update(data.id, cleanPayload);
    } else {
      return ecopontoRepository.create(cleanPayload);
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<CollectionPoint> {
    return ecopontoRepository.toggleActive(id, active);
  },

  async deletePoint(id: string): Promise<void> {
    return ecopontoRepository.delete(id);
  },
};
