# EcoRetorna Admin

Painel Administrativo da plataforma de sustentabilidade e incentivo ecológico **EcoRetorna**.

Este repositório contém o ambiente administrativo complementar ao **EcoRetorna Participante**, compartilhando o mesmo projeto Firebase e o mesmo esquema canônico de dados.

---

## 🔗 Repositórios do Projeto

- **EcoRetorna Participante:**
  https://github.com/pabllomagalhaes/eco_retorna_basico

- **EcoRetorna Admin:**
  https://github.com/pabllomagalhaes/eco-retorna-admin

---

## 🎯 Funcionalidades Atuais do Admin

- **Dashboard:** Visão geral e métricas consolidadas dos indicadores da plataforma.
- **Campanhas:** Criação e gestão de campanhas promocionais ativas (multiplicadores de pontos e bônus por volume).
- **Benefícios:** Catálogo demonstrativo de brindes e opções de doações sociais para engajamento.
- **Eventos e Alertas:** Publicação e manutenção de comunicados, oficinas ecológicas e avisos operacionais.
- **Materiais e Pontuação:** Configuração dos materiais aceitos (`pet_2l` e `lata_aluminio`), pontuação unitária e fatores ambientais.
- **Ecopontos:** Cadastro, validação de coordenadas e gerenciamento dos pontos de coleta de Fraiburgo - SC.
- **Impacto Geral:** Acompanhamento dos totais de embalagens e estimativas de mitigação ambiental.
- **Perfil Administrativo:** Consulta de privilégios de acesso e segurança da conta autenticada.

> **Importante:**
> O EcoRetorna Admin não registra manualmente ações de reciclagem nesta versão. Os `recyclingRecords` representam eventos externos. No protótipo acadêmico, a origem externa é simulada tecnicamente pelo projeto Participante.
>
> O painel administrativo não gerencia diretamente as contas dos participantes nem edita seus saldos. As opções de benefícios e doações possuem caráter demonstrativo. As estimativas de CO₂e possuem caráter educativo e são calculadas a partir de fatores definidos para o protótipo. Não representam medição oficial, certificação ambiental ou créditos de carbono.

---

## 🏗️ Arquitetura e Integração Firebase

Ambas as aplicações (Admin e Participante) conectam-se à mesma instância do **Google Firebase**:

- **Firebase Authentication:** Controle de acesso restrito. O acesso ao painel exige autenticação com verificação de perfil administrativo no Firestore (`role == "admin"` e `active == true`).
- **Cloud Firestore:** Banco de dados compartilhado com coleções canônicas:
  - `materials`: Definição de regras e fatores de conversão dos materiais recicláveis;
  - `settings/general`: Parâmetros globais do sistema, como equivalência financeira (`pointValueBRL = 0.125`);
  - `campaigns`: Campanhas de incentivo com regras temporais e bonificações;
  - `benefits`: Catálogo de benefícios e iniciativas de doação demonstrativas;
  - `events`: Agenda de eventos e alertas da rede;
  - `collectionPoints`: Ecopontos e coordenadas geográficas da localidade;
  - `recyclingRecords`: Histórico imutável de coletas reconhecidas externamente, consumido pelo Admin em modo de leitura para cálculo de métricas agregadas.

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js 18+ instalado;
- Gerenciador de pacotes `npm`.

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Modo Local (Desenvolvimento Offline)
Sem a definição de variáveis de ambiente do Firebase, a aplicação inicia automaticamente em modo demonstrativo com armazenamento local:
```bash
npm run dev
```

### 4. Conexão ao Firebase Real
Crie o arquivo `.env` (ou `.env.local`) na raiz do projeto com as chaves do Firebase compartilhado:
```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## 🔒 Regras de Segurança (Firestore Rules)

As regras de segurança estão unificadas nos arquivos `firestore.rules` e `firestore.rules.unified`, mantendo paridade com o EcoRetorna Participante:
- Participantes autenticados possuem acesso restrito aos seus próprios dados;
- Administradores autenticados e ativos possuem permissão de gravação nas coleções de configuração da plataforma;
- Os documentos de `recyclingRecords` são imutáveis e protegidos contra modificação ou deleção acidental;
- Qualquer acesso não expressamente previsto é bloqueado por padrão (*default deny*).
