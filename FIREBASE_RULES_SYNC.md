# Sincronização Obrigatória de Firestore Security Rules

## Contexto Arquitetural

O **EcoRetorna Participante** e o **EcoRetorna Admin** são duas interfaces de acesso que operam sobre o **mesmo projeto Cloud Firestore**.

No Google Firebase, as **Security Rules são globais no nível do projeto**. Isso significa que quando um comando `firebase deploy --only firestore:rules` é executado a partir de qualquer um dos repositórios, as regras do projeto remoto inteiro são substituídas pelo arquivo local daquele deploy.

---

## ⚠️ Risco Crítico de Sobrescrita

Se um desenvolvedor ou pipeline de CI/CD executar o deploy de regras a partir do projeto **EcoRetorna Participante** contendo um arquivo `firestore.rules` antigo (que não reconheça as funções administrativas ou não permita que admins criem `recyclingRecords`), **todas as permissões do EcoRetorna Admin serão imediatamente revogadas em produção**.

Isso causará:
1. Bloqueio no painel administrativo para registro de reciclagens.
2. Bloqueio no gerenciamento de materiais, ecopontos, campanhas e eventos.
3. Erros de `permission-denied` nas telas de gestão.

---

## 📌 Fonte Canônica das Regras

A fonte canônica unificada de regras está mantida no arquivo:
```
firestore.rules.unified
```
(também espelhado em `firestore.rules` deste repositório).

---

## 🔄 Procedimento de Sincronização

Sempre que houver alteração nas regras de segurança:

1. **Copiar o arquivo unificado para o projeto Participante:**
   Copie o conteúdo de `firestore.rules.unified` (ou `firestore.rules`) do **EcoRetorna Admin** para o arquivo `firestore.rules` do **EcoRetorna Participante**:
   ```bash
   # Exemplo (ajustar caminhos conforme ambiente):
   cp ./firestore.rules.unified ../eco_retorna_basico-main/firestore.rules
   ```

2. **Verificar a paridade dos dois arquivos:**
   Certifique-se de que os dois repositórios possuam exatamente o mesmo conteúdo para `firestore.rules`.

3. **Deploy Seguro:**
   O deploy pode ser executado a partir de qualquer um dos projetos, desde que ambos estejam estritamente sincronizados:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 📋 Resumo das Proteções Principais Contidas nas Regras

1. **Função `isAdmin()`**:
   Exige usuário autenticado, documento existente em `users/{auth.uid}`, `role == "admin"` e `active == true`.
2. **Imutabilidade de `recyclingRecords`**:
   Registros históricos de reciclagem só podem ser criados por administradores ativos e **nunca** podem ser alterados ou excluídos por ninguém.
3. **Allowlist de Perfil do Participante**:
   Participantes só podem atualizar os campos: `name`, `email`, `city`, `neighborhood`, `avatarUrl`, `preferences`, `updatedAt`. Campos sensíveis como `role`, `active`, `createdAt` e `isAdmin` são bloqueados contra alteração via cliente.
4. **Catálogos Protegidos**:
   Participantes possuem apenas permissão de leitura em `materials`, `settings`, `collectionPoints`, `events`, `campaigns`, `benefits` e `badges`.
5. **Default Deny**:
   Qualquer coleção ou caminho não expressamente autorizado tem acesso bloqueado (`allow read, write: if false;`).
