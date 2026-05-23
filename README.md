# Barba, Cabelo e Unha 💈

Plataforma marketplace/SaaS de agendamento para barbearias e salões de beleza.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Prisma ORM** + **PostgreSQL** (Supabase)
- **NextAuth.js** (autenticação com roles)
- **Stripe** (assinaturas recorrentes)
- **Vercel** (deploy)

---

## Configuração Inicial

### 1. Clonar e instalar dependências

```bash
git clone <seu-repositorio>
cd beauty-platform
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
# Edite .env.local com suas credenciais reais
```

### 3. Configurar banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **Settings → Database → Connection String** e copie o modo **Prisma**
3. Cole em `DATABASE_URL` no `.env.local`

### 4. Configurar NextAuth

```bash
# Gerar secret seguro
openssl rand -base64 32
# Cole o resultado em NEXTAUTH_SECRET no .env.local
```

### 5. Rodar migrations e seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Iniciar o servidor

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Credenciais de Teste (após o seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@bcu.com | admin123 |
| Proprietário (Barbearia) | joao@barbearia.com | senha123 |
| Proprietário (Salão) | maria@salao.com | senha123 |
| Cliente | cliente@email.com | senha123 |

---

## Rotas da Plataforma

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Home com marketplace | Público |
| `/estabelecimentos` | Listagem e busca | Público |
| `/estabelecimentos/[slug]` | Perfil do estabelecimento | Público |
| `/agendar/[slug]` | Fluxo de agendamento | Público (login no final) |
| `/login` | Login / Cadastro | Público |
| `/minha-conta` | Agendamentos do cliente | Cliente |
| `/parceiros` | Onboarding do proprietário | Público |
| `/painel` | Dashboard do proprietário | Owner |
| `/painel/servicos` | CRUD de serviços | Owner |
| `/painel/agenda` | Agenda semanal | Owner |
| `/admin` | Moderação de estabelecimentos | Admin |

---

## APIs Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/cadastrar` | POST | Cadastro de usuário |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth |
| `/api/venues/[slug]` | GET | Dados do venue |
| `/api/horarios-disponiveis` | GET | Slots disponíveis (anti double-booking) |
| `/api/agendamentos` | GET/POST | Criar/listar agendamentos |
| `/api/owner/venue` | GET/POST | Dados do venue do owner |
| `/api/owner/servicos` | GET/POST | Listar/criar serviços |
| `/api/owner/servicos/[id]` | PUT/DELETE | Editar/remover serviço |
| `/api/admin/venues/[id]` | PATCH | Aprovar/rejeitar venue |
| `/api/stripe/checkout` | POST | Criar sessão de checkout |
| `/api/webhooks/stripe` | POST | Webhook do Stripe |

---

## Configurar Stripe (Fase 6)

### 1. Criar produto e preço
1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Products → Add product**
3. Configure o preço recorrente mensal
4. Copie o **Price ID** (`price_...`) para `STRIPE_PRICE_ID` no `.env.local`

### 2. Configurar webhook local (desenvolvimento)

```bash
# Instalar a CLI do Stripe
npm install -g stripe-cli

# Login
stripe login

# Redirecionar webhooks para o servidor local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o **webhook signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`.

### 3. Eventos que o webhook trata

- `invoice.payment_succeeded` → renova `subscriptionExpiresAt`
- `invoice.payment_failed` → marca como `past_due`
- `customer.subscription.deleted` → define data de expiração e remove do marketplace
- `customer.subscription.updated` → reativa quando pago

---

## Deploy na Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PRICE_ID
vercel env add STRIPE_WEBHOOK_SECRET
```

**Importante:** No Stripe Dashboard, adicione o webhook de produção apontando para:
`https://seu-dominio.vercel.app/api/webhooks/stripe`

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/login/          ← Login e cadastro
│   ├── (marketplace)/         ← Páginas públicas
│   │   ├── page.tsx           ← Home
│   │   ├── estabelecimentos/  ← Listagem e perfil
│   │   ├── agendar/[slug]/    ← Fluxo de agendamento
│   │   └── minha-conta/       ← Painel do cliente
│   ├── (owner)/               ← Área do proprietário
│   │   ├── parceiros/         ← Onboarding
│   │   └── painel/            ← Dashboard + Serviços + Agenda
│   ├── (admin)/admin/         ← Moderação
│   └── api/                   ← Route Handlers
├── components/                ← Navbar, AssinaturaCard, etc.
├── lib/                       ← prisma.ts, auth.ts, stripe.ts
└── middleware.ts              ← Proteção de rotas por role
prisma/
├── schema.prisma              ← Modelos do banco de dados
└── seed.ts                    ← Dados de exemplo
```
