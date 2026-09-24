/**
 * EcoRetorna Admin - Core Type Definitions
 * Strict canonical types shared between EcoRetorna Admin & EcoRetorna Participante
 */

export const COLLECTIONS = {
  USERS: 'users',
  MATERIALS: 'materials',
  RECYCLING_RECORDS: 'recyclingRecords',
  REDEMPTIONS: 'redemptions',
  DONATIONS: 'donations',
  COLLECTION_POINTS: 'collectionPoints',
  EVENTS: 'events',
  SETTINGS: 'settings',
  BADGES: 'badges',
  USER_BADGES: 'userBadges',
  CAMPAIGNS: 'campaigns',
  BENEFITS: 'benefits',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export type UserRole = 'admin' | 'participant';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  status?: 'active' | 'inactive'; // Helper alias for legacy compatibility
  city?: string;
  neighborhood?: string;
  avatarUrl?: string;
  photoURL?: string; // Helper alias
  preferences?: {
    notificationsEnabled?: boolean;
    motivationalMessages?: boolean;
    highContrastMode?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt?: string;
}

export type MaterialCategory = 'pet' | 'aluminio';

export interface Material {
  id: string; // 'pet_2l' | 'lata_aluminio'
  name: string;
  category: MaterialCategory;
  unit: string; // 'unidade'
  pointsPerUnit: number;
  co2eFactor: number; // kg CO2e avoided per unit
  active: boolean;
  description?: string;
  updatedAt?: string;
}

export interface GeneralSettings {
  pointValueBRL: number; // 0.125 (1 point = R$ 0,125)
  environmentalFactors: {
    co2eKg: {
      pet: number; // 0.18
      aluminio: number; // 0.22
    };
    disclaimer: string;
  };
  pointsPerBottle?: number;
  pointsPerCan?: number;
  initialBonusPoints?: number;
  updatedAt?: string;
}

export type CampaignType = 'multiplier' | 'quantity_bonus';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  type: CampaignType;
  materialId: string;
  multiplier?: number; // e.g. 2 for 2x
  minimumQuantity?: number; // e.g. 10 units
  bonusPoints?: number; // e.g. +5 points
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string; // ISO date 'YYYY-MM-DD'
  active: boolean;
  createdAt: string;
  createdBy: string; // Admin UID
  updatedAt?: string;
}

export type BenefitCategory = 'gift' | 'donation' | 'other';

export interface Benefit {
  id: string;
  title: string;
  description: string;
  category: BenefitCategory;
  pointsRequired: number;
  stock: number | null; // null means unlimited (e.g. donations)
  active: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EcoItemType = 'evento' | 'alerta';
export type EcoItemSeverity = 'info' | 'aviso' | 'sucesso';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  location: string;
  category: string;
  type: EcoItemType;
  active: boolean;
  severity?: EcoItemSeverity;
  createdAt: string;
  updatedAt?: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  operatingHours: string;
  openingHours?: string; // Compatibility alias
  acceptedMaterials: string[];
  latitude: number;
  longitude: number;
  description: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RecyclingRecord {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  materialId: string;
  materialName: string;
  materialCategory: MaterialCategory;
  quantity: number;
  basePoints: number;
  campaignBonus: number;
  pointsEarned: number;
  reaisEquivalent: number; // pointsEarned * pointValueBRL
  co2eAvoidedKg: number; // quantity * co2eFactor
  collectionPointName: string;
  campaignId?: string | null;
  registeredByAdminUid: string;
  createdAt: string; // ISO format
}

export interface RedemptionRecord {
  id: string;
  userId: string;
  benefitId?: string;
  benefitTitle?: string;
  date?: string;
  pointsSpent: number;
  reaisValue?: number;
  description?: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'cancelled' | 'concluido' | 'processando';
  demonstrative?: boolean;
}

export interface DonationRecord {
  id: string;
  userId: string;
  date?: string;
  initiativeId?: string;
  initiativeName?: string;
  pointsDonated?: number;
  reaisValue?: number;
  createdAt: string;
  status: 'concluido';
  demonstrative?: boolean;
}

export interface AggregatedImpact {
  totalContainers: number;
  totalPoints: number;
  totalCO2eKg: number;
  totalRecyclingSessions: number;
  uniqueParticipants: number;
  materialsBreakdown: {
    materialId: string;
    materialName: string;
    quantity: number;
    points: number;
    co2eKg: number;
  }[];
  monthlyEvolution: {
    monthLabel: string;
    quantity: number;
    co2eKg: number;
    points: number;
  }[];
}

export interface CalculationItemResult {
  material: Material;
  quantity: number;
  basePointsPerUnit: number;
  totalBasePoints: number;
  applicableCampaign: Campaign | null;
  campaignBonusPoints: number;
  totalPointsEarned: number;
  reaisEquivalent: number;
  co2eAvoidedKg: number;
  ruleExplanation: string;
}

export interface RecyclingCalculationSummary {
  participant: UserProfile;
  items: CalculationItemResult[];
  totalQuantity: number;
  totalBasePoints: number;
  totalCampaignBonus: number;
  grandTotalPoints: number;
  totalReaisEquivalent: number;
  estimatedCO2eKg: number;
  collectionPointName: string;
}
