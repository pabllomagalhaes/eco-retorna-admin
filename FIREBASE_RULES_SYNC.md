# Sincronização Obrigatória de Firestore Security Rules

## Contexto Arquitetural

O **EcoRetorna Participante** e o **EcoRetorna Admin** são duas interfaces de acesso que operam sobre o **mesmo projeto Cloud Firestore**.

No Google Firebase, as **Security Rules são globais no nível do projeto**. Isso significa que quando um comando `firebase deploy --only firestore:rules` é executado a partir de qualquer um dos repositórios, as regras do projeto remoto inteiro são substituídas pelo arquivo local daquele deploy.

---

## ⚠️ Risco de Dessincronização

Se um desenvolvedor ou pipeline de CI/CD executar o deploy de regras desatualizadas a partir de um dos projetos, **as permissões unificadas da plataforma poderão ser corrompidas**.

Isso causaria:
1. Bloqueio no gerenciamento de materiais, ecopontos, campanhas, benefícios e eventos.
2. Erros de `permission-denied` nas consultas de métricas e indicadores.
3. Inconsistência nos fluxos de validação de permissões administrativas.

---

## 📌 Fonte Canônica das Regras

A fonte canônica unificada de regras está mantida no arquivo:
```
firestore.rules.unified
```
(também espelhado em `firestore.rules` de ambos os repositórios).

---

## 🔄 Procedimento de Sincronização

Sempre que houver alteração nas regras de segurança:

1. **Garantir a Paridade de Conteúdo:**
   Certifique-se de que os arquivos `firestore.rules` e `firestore.rules.unified` estejam idênticos em ambos os projetos (`ecoretorna-admin` e `eco_retorna_basico`).

2. **Deploy Seguro:**
   O deploy pode ser executado a partir de qualquer um dos projetos, desde que ambos estejam estritamente sincronizados:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 📋 Resumo das Proteções Principais Contidas nas Regras

1. **Função `isAdmin()`**:
   Exige usuário autenticado, documento existente em `users/{auth.uid}`, `role == "admin"` e `active == true`.
2. **Imutabilidade e Consulta de `recyclingRecords`**:
   - A interface do EcoRetorna Admin não possui cadastro manual de reciclagens; os registros representam eventos de coleta externa.
   - O Admin consulta `recyclingRecords` para o cálculo de métricas agregadas e indicadores de impacto.
   - Os registros históricos permanecem estritamente imutáveis (`update = false`, `delete = false`) para garantir a integridade dos dados.
3. **Allowlist de Perfil do Participante**:
   Participantes só podem atualizar os campos: `name`, `email`, `city`, `neighborhood`, `avatarUrl`, `preferences`, `updatedAt`. Campos de controle como `role`, `active`, `createdAt` e `isAdmin` são bloqueados contra alteração via cliente.
4. **Catálogos e Configurações**:
   Participantes possuem apenas permissão de leitura em `materials`, `settings`, `collectionPoints`, `events`, `campaigns`, `benefits` e `badges`. Administradores ativos possuem permissão para configurar essas coleções.
5. **Default Deny**:
   Qualquer coleção ou caminho não expressamente autorizado tem acesso bloqueado (`allow read, write: if false;`).
