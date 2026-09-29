import type {
  UserProfile,
  Material,
  Campaign,
  Benefit,
  EventItem,
  CollectionPoint,
  RecyclingRecord,
  RedemptionRecord,
} from '../types';

export const SEED_USERS: UserProfile[] = [
  {
    id: 'admin-master',
    name: 'Coordenação EcoRetorna',
    email: 'admin@ecoretorna.com',
    role: 'admin',
    active: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-camila',
    name: 'Camila Ribeiro',
    email: 'camila.ribeiro@ecoretorna.com',
    role: 'participant',
    active: true,
    status: 'active',
    city: 'Fraiburgo - SC',
    neighborhood: 'Centro',
    createdAt: '2025-08-15T10:00:00.000Z',
  },
  {
    id: 'user-lucas',
    name: 'Lucas Silveira',
    email: 'lucas.demo@ecoretorna.com',
    role: 'participant',
    active: true,
    status: 'active',
    city: 'Fraiburgo - SC',
    neighborhood: 'São Sebastião',
    createdAt: '2026-03-01T14:15:00.000Z',
  },
  {
    id: 'user-mariana',
    name: 'Mariana Costa',
    email: 'mariana.demo@ecoretorna.com',
    role: 'participant',
    active: false,
    status: 'inactive',
    city: 'Fraiburgo - SC',
    neighborhood: 'Nações',
    createdAt: '2026-04-10T09:00:00.000Z',
  },
];

/**
 * Materiais Canônicos Compartilhados com EcoRetorna Participante:
 * Apenas 'pet_2l' e 'lata_aluminio' nesta versão.
 * Fatores ambientais oficiais: PET = 0.18 kg CO2e, Alumínio = 0.22 kg CO2e.
 */
export const SEED_MATERIALS: Material[] = [
  {
    id: 'pet_2l',
    name: 'Garrafa PET 2 L',
    category: 'pet',
    unit: 'unidade',
    pointsPerUnit: 2,
    co2eFactor: 0.18, // 0.18 kg CO2e evitado estimado por unidade
    active: true,
    description: 'Embalagem PET de 2 litros limpa e seca.',
  },
  {
    id: 'lata_aluminio',
    name: 'Lata de Alumínio',
    category: 'aluminio',
    unit: 'unidade',
    pointsPerUnit: 2,
    co2eFactor: 0.22, // 0.22 kg CO2e evitado estimado por unidade
    active: true,
    description: 'Latas de bebidas em alumínio amassadas ou limpas.',
  },
];

export const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-pet-semana',
    title: 'Semana do PET',
    description: 'Até o fim da semana, embalagens PET valem pontos em dobro em todos os ecopontos.',
    type: 'multiplier',
    materialId: 'pet_2l',
    multiplier: 2,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    active: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    createdBy: 'admin-master',
  },
  {
    id: 'camp-lata-bonus',
    title: 'Desafio Latas de Alumínio',
    description: 'Entregue 10 ou mais latas de alumínio e ganhe +5 pontos de bônus imediato.',
    type: 'quantity_bonus',
    materialId: 'lata_aluminio',
    minimumQuantity: 10,
    bonusPoints: 5,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    active: true,
    createdAt: '2026-09-05T10:00:00.000Z',
    createdBy: 'admin-master',
  },
];

export const SEED_BENEFITS: Benefit[] = [
  {
    id: 'ben-ecobag',
    title: 'Ecobag EcoRetorna',
    description: 'Sacola ecológica 100% algodão cru reciclado com alta resistência e estampa exclusiva.',
    category: 'gift',
    pointsRequired: 120,
    stock: 20,
    active: true,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'ben-squeeze',
    title: 'Squeeze Sustentável',
    description: 'Garrafa térmica 500ml em aço inoxidável reciclado com tampa hermética.',
    category: 'gift',
    pointsRequired: 200,
    stock: 10,
    active: true,
    createdAt: '2026-08-15T11:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'ben-mata-viva',
    title: 'Doação — Projeto Mata Viva',
    description: 'Conversão de pontos em plantio e manutenção de mudas nativas em áreas de reflorestamento.',
    category: 'donation',
    pointsRequired: 40,
    stock: null,
    active: true,
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'ben-copo',
    title: 'Copo Retrátil de Silicone',
    description: 'Copo retrátil portátil e reutilizável com tampa e bico dosador.',
    category: 'gift',
    pointsRequired: 90,
    stock: 15,
    active: true,
    createdAt: '2026-08-20T14:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

export const SEED_EVENTS: EventItem[] = [
  {
    id: 'ev-mutirao-parque',
    title: 'Mutirão Ecológico no Lago das Araucárias',
    description: 'Sensibilização ecológica e recolhimento de materiais recicláveis com a comunidade.',
    fullDescription: 'Encontro comunitário para conscientização ambiental com gincana de coleta seletiva e oficinas práticas de reciclagem para toda a família.',
    date: '2026-09-28',
    time: '09:00',
    location: 'Lago das Araucárias - Entrada Principal',
    category: 'Mutirão',
    type: 'evento',
    active: true,
    severity: 'info',
    createdAt: '2026-09-10T09:00:00.000Z',
  },
  {
    id: 'ev-oficina-reciclagem',
    title: 'Oficina de Separação de Resíduos Urbanos',
    description: 'Palestra prática sobre como lavar, prensar e preparar recicláveis para entrega rápida.',
    fullDescription: 'Aprenda as melhores práticas para aumentar o rendimento da sua reciclagem e evitar contaminação dos lotes nos ecopontos.',
    date: '2026-10-05',
    time: '14:30',
    location: 'Mercado Municipal - Auditório Verde',
    category: 'Workshop',
    type: 'evento',
    active: true,
    severity: 'info',
    createdAt: '2026-09-12T14:00:00.000Z',
  },
  {
    id: 'ev-alerta-manutencao',
    title: 'Manutenção Programada no EcoPonto Central',
    description: 'O Ecoponto Praça da Sustentabilidade operará com capacidade reduzida neste sábado.',
    fullDescription: 'Devido a melhorias na prensa compactadora, haverá manutenção entre 08h e 12h. Recomendamos utilizar a Estação Central Verde.',
    date: '2026-10-12',
    time: '08:00',
    location: 'EcoPonto Praça da Sustentabilidade',
    category: 'Alerta Operacional',
    type: 'alerta',
    active: true,
    severity: 'aviso',
    createdAt: '2026-09-15T11:00:00.000Z',
  },
];

export const SEED_COLLECTION_POINTS: CollectionPoint[] = [
  {
    id: 'pt_01',
    name: 'EcoPonto Praça da Sustentabilidade',
    address: 'Av. Rio das Antas, 100',
    neighborhood: 'Centro',
    city: 'Fraiburgo - SC',
    operatingHours: '08:00 às 19:00',
    acceptedMaterials: ['PET', 'Alumínio'],
    latitude: -27.0261,
    longitude: -50.9214,
    description: 'Ponto de coleta de alta capacidade com fácil acesso para pedestres e ciclistas na praça central.',
    active: true,
    notes: 'Acesso facilitado para pedestres e bicicletas.',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'pt_02',
    name: 'Estação Central Verde',
    address: 'Rua Nereu Ramos, 250',
    neighborhood: 'Centro',
    city: 'Fraiburgo - SC',
    operatingHours: '07:30 às 20:00',
    acceptedMaterials: ['PET', 'Alumínio'],
    latitude: -27.0284,
    longitude: -50.9190,
    description: 'Localizada no centro, com grande fluxo e recebimento contínuo de embalagens.',
    active: true,
    notes: 'Próximo à área comercial central.',
    createdAt: '2026-07-05T09:00:00.000Z',
  },
  {
    id: 'pt_03',
    name: 'Ponto Verde Lago das Araucárias',
    address: 'Av. Beira Lago, s/n',
    neighborhood: 'Araucárias',
    city: 'Fraiburgo - SC',
    operatingHours: '08:00 às 18:00',
    acceptedMaterials: ['PET', 'Alumínio'],
    latitude: -27.0225,
    longitude: -50.9160,
    description: 'Estação situada no entorno do Lago das Araucárias, com ampla sinalização.',
    active: true,
    notes: 'Localizado no estacionamento de acesso ao lago.',
    createdAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: 'pt_04',
    name: 'Estação Parque das Maçãs',
    address: 'Rua Arnoldo Frey, 500',
    neighborhood: 'Jardim das Hortênsias',
    city: 'Fraiburgo - SC',
    operatingHours: '08:00 às 18:00',
    acceptedMaterials: ['PET', 'Alumínio'],
    latitude: -27.0180,
    longitude: -50.9250,
    description: 'Ponto ecológico integrado ao parque com grande atendimento aos finais de semana.',
    active: true,
    notes: 'Próximo ao centro de convivência do parque.',
    createdAt: '2026-07-15T09:00:00.000Z',
  },
];

/**
 * Registros de reciclagem canônicos:
 * 1 ponto = R$ 0,125
 * PET 2 L (0.18 kg CO2e / 2 pts)
 * Lata Alumínio (0.22 kg CO2e / 2 pts)
 */
export const SEED_RECYCLING_RECORDS: RecyclingRecord[] = [
  {
    id: 'rec-001',
    userId: 'user-camila',
    date: '2026-09-18',
    materialId: 'pet_2l',
    materialName: 'Garrafa PET 2 L',
    materialCategory: 'pet',
    quantity: 12,
    basePoints: 24, // 12 * 2
    campaignBonus: 24, // 2x
    pointsEarned: 48,
    reaisEquivalent: 6.0, // 48 * 0.125
    co2eAvoidedKg: 2.16, // 12 * 0.18
    collectionPointName: 'EcoPonto Praça da Sustentabilidade',
    campaignId: 'camp-pet-semana',
    registeredByAdminUid: 'system:external-demo',
    createdAt: '2026-09-18T10:14:00.000Z',
  },
  {
    id: 'rec-002',
    userId: 'user-camila',
    date: '2026-09-18',
    materialId: 'lata_aluminio',
    materialName: 'Lata de Alumínio',
    materialCategory: 'aluminio',
    quantity: 15,
    basePoints: 30, // 15 * 2
    campaignBonus: 5, // bonus 5
    pointsEarned: 35,
    reaisEquivalent: 4.38, // 35 * 0.125
    co2eAvoidedKg: 3.3, // 15 * 0.22
    collectionPointName: 'EcoPonto Praça da Sustentabilidade',
    campaignId: 'camp-lata-bonus',
    registeredByAdminUid: 'system:external-demo',
    createdAt: '2026-09-18T10:15:00.000Z',
  },
  {
    id: 'rec-003',
    userId: 'user-lucas',
    date: '2026-09-19',
    materialId: 'lata_aluminio',
    materialName: 'Lata de Alumínio',
    materialCategory: 'aluminio',
    quantity: 8,
    basePoints: 16,
    campaignBonus: 0,
    pointsEarned: 16,
    reaisEquivalent: 2.0,
    co2eAvoidedKg: 1.76, // 8 * 0.22
    collectionPointName: 'Estação Central Verde',
    campaignId: null,
    registeredByAdminUid: 'system:external-demo',
    createdAt: '2026-09-19T14:30:00.000Z',
  },
  {
    id: 'rec-004',
    userId: 'user-lucas',
    date: '2026-09-20',
    materialId: 'pet_2l',
    materialName: 'Garrafa PET 2 L',
    materialCategory: 'pet',
    quantity: 6,
    basePoints: 12,
    campaignBonus: 12,
    pointsEarned: 24,
    reaisEquivalent: 3.0,
    co2eAvoidedKg: 1.08, // 6 * 0.18
    collectionPointName: 'EcoPonto Praça da Sustentabilidade',
    campaignId: 'camp-pet-semana',
    registeredByAdminUid: 'system:external-demo',
    createdAt: '2026-09-20T11:00:00.000Z',
  },
];

export const SEED_REDEMPTIONS: RedemptionRecord[] = [
  {
    id: 'red-001',
    userId: 'user-camila',
    benefitId: 'ben-mata-viva',
    benefitTitle: 'Doação — Projeto Mata Viva',
    pointsSpent: 40,
    reaisValue: 5.0,
    createdAt: '2026-09-19T18:00:00.000Z',
    status: 'concluido',
    demonstrative: true,
  },
  {
    id: 'red-002',
    userId: 'user-lucas',
    benefitId: 'ben-ecobag',
    benefitTitle: 'Ecobag EcoRetorna',
    pointsSpent: 120,
    reaisValue: 15.0,
    createdAt: '2026-09-20T15:00:00.000Z',
    status: 'concluido',
    demonstrative: true,
  },
];
