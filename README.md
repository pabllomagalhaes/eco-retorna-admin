# EcoRetorna Admin

Painel Administrativo e Operacional da plataforma de reciclagem e incentivo ecológico **EcoRetorna**.

O **EcoRetorna Admin** é a interface de gestão e operação que compartilha a mesma infraestrutura Firebase e contratos canônicos com o aplicativo **EcoRetorna Participante**.

---

## 🎯 Finalidade do Painel

- **Campanhas Promocionais**: Gestão de campanhas sazonais (multiplicadores e bônus por quantidade mínima).
- **Catálogo de Benefícios**: Administração de brindes e opções de doações sociais.
- **Eventos & Alertas**: Divulgação de mutirões, workshops e avisos para os participantes.
- **Materiais & Regras**: Gerenciamento das pontuações base e fatores de mitigação de CO₂e (`pet_2l` e `lata_aluminio`).
- **Ecopontos**: Gerenciamento de postos de coleta, endereços, horários e coordenadas.
- **Métricas de Impacto**: Indicadores derivados estritamente dos registros históricos de reciclagem (`recyclingRecords`).

---

## 🏗️ Arquitetura Compartilhada (Admin + Participante)

EcoRetorna Participante e EcoRetorna Admin utilizam o mesmo projeto Cloud Firestore e, portanto, compartilham um único conjunto de Firestore Security Rules.

O arquivo `firestore.rules.unified` deve ser considerado a fonte canônica das regras de segurança (veja detalhes e procedimentos de sincronização em `FIREBASE_RULES_SYNC.md`).

Ambas as aplicações compartilham o mesmo banco Cloud Firestore:
- **Coleções Canônicas**: `users`, `materials`, `recyclingRecords`, `redemptions`, `donations`, `collectionPoints`, `events`, `settings`, `badges`, `userBadges`, `campaigns`, `benefits`.
- **Materiais Padrão**: `pet_2l` (Garrafa PET 2 L - 2 pts, 0.18 kg CO₂e) e `lata_aluminio` (Lata de Alumínio - 2 pts, 0.22 kg CO₂e).
- **Configurações Globais**: Documento `settings/general` centraliza o valor do ponto (`pointValueBRL = 0.125`) e fatores ambientais.
- **Segurança RBAC**: Administradores autenticados via Firebase Auth com documento em `users/{uid}` com `role: "admin"` e `active: true`.

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js 18+ instalado.

### 2. Instalar Dependências
```bash
npm install
```

### 3. Modo Local (Desenvolvimento Offline)
Sem configurar o arquivo `.env.local`, a aplicação opera em **modo reativo local/offline**, permitindo testar todas as rotas com dados de semente integrados.
```bash
npm run dev
```

### 4. Modo Firebase Compartilhado (Produção/Homologação)
Crie o arquivo `.env.local` na raiz com as credenciais do projeto Firebase compartilhado:
```env
VITE_FIREBASE_API_KEY="sua-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
VITE_FIREBASE_APP_ID="seu-app-id"
```
Execute o servidor:
```bash
npm run dev
```

---

## 🔒 Regras de Segurança Firestore

O arquivo unificado de regras `firestore.rules` protege a integridade dos dados para o Participante e para o Admin:
- Participantes só leem seus próprios registros e criam doações/resgates demonstrativos.
- Administradores autenticados (`role: "admin"`) possuem permissão de gravação operacional.
- Registros em `recyclingRecords` são imutáveis (`update = false`, `delete = false`).
