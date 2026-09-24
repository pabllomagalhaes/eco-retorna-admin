/**
 * Verification Script: Firestore Campaign Creation & Serialization Integrity
 * Tests that no 'undefined' fields or 'id: undefined' are passed to Firestore.
 */

// Polyfill window & localStorage for Node runtime
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
}

async function run() {
  console.log('==================================================');
  console.log('INICIANDO VALIDAÇÃO: SERIALIZAÇÃO FIRESTORE ADMIN');
  console.log('==================================================\n');

  const { campaignService } = await import('../src/services/campaignService');
  const { benefitService } = await import('../src/services/benefitService');
  const { eventService } = await import('../src/services/eventService');
  const { ecopontoService } = await import('../src/services/ecopontoService');
  const { materialService } = await import('../src/services/materialService');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Teste ${total}: ${testName}`);
      if (detail) console.log(`       ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] Teste ${total}: ${testName}`);
      if (detail) console.error(`       FALHA: ${detail}`);
      process.exitCode = 1;
    }
  }

  // 1. Teste Exato do Usuário: Campanha Multiplicador
  const createdCamp = await campaignService.saveCampaign({
    title: 'Semana do PET - Teste',
    description: 'Pontos em dobro para garrafas PET 2L durante a semana especial',
    type: 'multiplier',
    materialId: 'pet_2l',
    multiplier: 2,
    active: true,
    startDate: '2026-09-24',
    endDate: '2026-09-30',
    createdBy: 'admin_test_01',
  });

  assert(
    typeof createdCamp.id === 'string' && createdCamp.id.startsWith('camp-'),
    'Criação de Campanha Multiplicador: ID válido gerado',
    `ID: ${createdCamp.id}`
  );

  assert(
    createdCamp.multiplier === 2,
    'Campanha Multiplicador: multiplier = 2 preservado',
    `multiplier: ${createdCamp.multiplier}`
  );

  assert(
    !('minimumQuantity' in createdCamp) && !('bonusPoints' in createdCamp),
    'Campanha Multiplicador: campos de quantity_bonus ausentes (não undefined)',
    `has minQty: ${'minimumQuantity' in createdCamp}, has bonusPts: ${'bonusPoints' in createdCamp}`
  );

  // Check no property has undefined value
  const hasUndefinedCamp = Object.entries(createdCamp).some(([_, val]) => val === undefined);
  assert(
    !hasUndefinedCamp,
    'Campanha Multiplicador: nenhum campo possui valor undefined',
    `Chaves gravadas: ${Object.keys(createdCamp).join(', ')}`
  );

  // 2. Teste de Campanha: quantity_bonus
  const createdBonusCamp = await campaignService.saveCampaign({
    title: 'Super Bônus de Latas',
    description: 'Bônus de 5 pontos a cada 10 latas de alumínio',
    type: 'quantity_bonus',
    materialId: 'lata_aluminio',
    minimumQuantity: 10,
    bonusPoints: 5,
    active: true,
    startDate: '2026-09-24',
    endDate: '2026-10-15',
    createdBy: 'admin_test_01',
  });

  assert(
    createdBonusCamp.minimumQuantity === 10 && createdBonusCamp.bonusPoints === 5,
    'Campanha Bônus por Quantidade: parâmetros gravados com sucesso',
    `minQty: ${createdBonusCamp.minimumQuantity}, bonusPts: ${createdBonusCamp.bonusPoints}`
  );

  assert(
    !('multiplier' in createdBonusCamp),
    'Campanha Bônus por Quantidade: campo multiplier ausente (não undefined)',
    `has multiplier: ${'multiplier' in createdBonusCamp}`
  );

  // 3. Teste de Benefício (sem id: undefined)
  const createdBenefit = await benefitService.saveBenefit({
    title: 'Ecobag Retornável Teste',
    description: 'Sacola ecológica de algodão cru 100% reciclável',
    category: 'gift',
    pointsRequired: 150,
    stock: 25,
    active: true,
  });

  assert(
    typeof createdBenefit.id === 'string' && createdBenefit.id.startsWith('ben-'),
    'Criação de Benefício: ID válido gerado sem id: undefined',
    `ID: ${createdBenefit.id}`
  );

  const hasUndefinedBenefit = Object.entries(createdBenefit).some(([_, val]) => val === undefined);
  assert(
    !hasUndefinedBenefit,
    'Benefício: nenhum campo possui valor undefined',
    `Chaves gravadas: ${Object.keys(createdBenefit).join(', ')}`
  );

  // 4. Teste de Evento (sem id: undefined e sem severity quando type === 'evento')
  const createdEvent = await eventService.saveEvent({
    title: 'Mutirão de Limpeza do Parque',
    description: 'Ação comunitária de coleta seletiva e conscientização',
    date: '2026-10-05',
    time: '09:00',
    location: 'Parque Barigui',
    category: 'Comunidade',
    type: 'evento',
    active: true,
  });

  assert(
    typeof createdEvent.id === 'string' && createdEvent.id.startsWith('ev-'),
    'Criação de Evento: ID válido gerado sem id: undefined',
    `ID: ${createdEvent.id}`
  );

  assert(
    !('severity' in createdEvent),
    'Evento type=evento: campo severity ausente (não undefined)',
    `has severity: ${'severity' in createdEvent}`
  );

  // 5. Teste de Ecoponto (sem id: undefined e sem notes: undefined)
  const createdPoint = await ecopontoService.savePoint({
    name: 'Ecoponto Central Teste',
    address: 'Rua das Flores, 100',
    neighborhood: 'Centro',
    city: 'Curitiba - PR',
    operatingHours: '08:00 às 18:00',
    acceptedMaterials: ['PET', 'Alumínio'],
    latitude: -25.4284,
    longitude: -49.2733,
    description: 'Ponto com esteira automatizada',
    active: true,
  });

  assert(
    typeof createdPoint.id === 'string' && createdPoint.id.startsWith('pt_'),
    'Criação de Ecoponto: ID válido gerado sem id: undefined',
    `ID: ${createdPoint.id}`
  );

  assert(
    !('notes' in createdPoint) || createdPoint.notes === '',
    'Ecoponto: sem campo notes undefined',
    `notes presente: ${'notes' in createdPoint}`
  );

  // 6. Teste de Material (sem id: undefined)
  const updatedMaterial = await materialService.saveMaterial({
    name: 'Garrafa PET 2 L',
    category: 'pet',
    pointsPerUnit: 2,
    co2eFactor: 0.18,
    active: true,
  });

  assert(
    updatedMaterial.id === 'pet_2l',
    'Material: ID canônico pet_2l preservado sem id: undefined',
    `ID: ${updatedMaterial.id}`
  );

  console.log('\n==================================================');
  console.log(`RESULTADO DOS TESTES: ${passed}/${total} APROVADOS`);
  console.log('==================================================\n');
}

run().catch((err) => {
  console.error('Erro na execução da suíte de validação:', err);
  process.exit(1);
});
