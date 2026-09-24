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

    if (data.id) {
      return ecopontoRepository.update(data.id, data);
    } else {
      return ecopontoRepository.create({
        ...data,
        createdAt: new Date().toISOString(),
      });
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<CollectionPoint> {
    return ecopontoRepository.toggleActive(id, active);
  },

  async deletePoint(id: string): Promise<void> {
    return ecopontoRepository.delete(id);
  },
};
