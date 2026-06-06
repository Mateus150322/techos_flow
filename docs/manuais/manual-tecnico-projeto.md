# Manual Técnico do Projeto

## 1. Objetivo

Este manual descreve como preparar, executar, manter e evoluir o TechOS Flow em ambiente de desenvolvimento e como adaptar o projeto para produção.

## 2. Requisitos de ambiente

### Backend

- PHP 8.2 ou superior
- Composer
- PostgreSQL
- extensões necessárias do Laravel: `pdo_pgsql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `gd`, `zip`

### Frontend

- Node.js 20 ou superior recomendado
- npm

## 3. Estrutura do projeto

```text
techos-flow/
  backend/
  frontend/
  docs/
  scripts/
```

## 4. Configuração do backend

### 4.1 Instalação

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### 4.2 Banco de dados

Configurar no `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=techos_flow
DB_USERNAME=A_preencher
DB_PASSWORD=A_preencher
```

### 4.3 Migrations e seeders

```bash
php artisan migrate
php artisan db:seed
```

## 5. Configuração do frontend

```bash
cd frontend
npm install
cp .env.example .env
```

### 5.1 Desenvolvimento com proxy do Vite

O projeto pode operar com `VITE_API_URL` vazio e usar o proxy do Vite para encaminhar chamadas ao backend.

Exemplo de ambiente local:

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1
VITE_API_PROXY_HOST=backend-flow.test
VITE_APP_HOST=techosflow.test
```

Executar:

```bash
npm run dev
```

### 5.2 Domínios locais de desenvolvimento

O ambiente local atual usa:

- frontend: `http://techosflow.test:5173`
- backend: `http://backend-flow.test`

Isso depende de entradas locais no arquivo `hosts` da máquina.

### 5.3 Execução com Docker

Na raiz do projeto:

```bash
docker compose up --build
```

Serviços disponíveis:

- frontend em `http://localhost:5173`
- backend em `http://localhost:8000`
- PostgreSQL em `localhost:5432`

Comandos úteis:

```bash
docker compose down
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan test
docker compose exec frontend npm run lint
docker compose exec frontend npm run test:a11y
```

Observações:

- o container `backend` espera o PostgreSQL ficar saudável antes de subir;
- por padrão, as migrations são executadas no início do backend;
- o frontend usa proxy interno para falar com o backend sem expor URL de API no navegador durante o desenvolvimento;
- essa estrutura Docker atual é voltada para desenvolvimento, não para produção final.

## 6. Variáveis de ambiente principais

### Backend

- `APP_NAME`
- `APP_ENV`
- `APP_DEBUG`
- `APP_URL`
- `FRONTEND_URL`
- `DB_*`
- `SESSION_DRIVER`
- `FILESYSTEM_DISK`
- `ANEXOS_DISK`
- `SANCTUM_STATEFUL_DOMAINS`
- `MAIL_*`
- `RESEND_KEY`, quando `MAIL_MAILER=resend`

No ambiente publicado no Railway, o backend deve usar o Postgres interno do próprio Railway:

```env
DB_CONNECTION=pgsql
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_DATABASE=railway
DB_USERNAME=postgres
DB_PASSWORD=senha_configurada_no_Railway
DB_SSLMODE=prefer
```

Não registrar a senha real em documentação ou repositório. A conexão deve usar o endpoint privado do Railway, evitando `DATABASE_PUBLIC_URL` para não gerar tráfego externo desnecessário.

O banco foi migrado do Neon para o Postgres interno do Railway. Nos testes manuais de rede do navegador, o tempo das chamadas principais caiu de aproximadamente 3 segundos para menos de 1 segundo.

### Frontend

- `VITE_API_URL`
- `VITE_API_PROXY_TARGET`
- `VITE_API_PROXY_HOST`
- `VITE_APP_HOST`

## 7. E-mail e recuperação de senha

O projeto já possui fluxo de recuperação de senha por e-mail.

Em produção, o envio transacional atual usa Resend. O pacote `resend/resend-php` deve estar instalado no backend via Composer.

```env
MAIL_MAILER=resend
RESEND_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=suporte@mail.techosflow.com.br
MAIL_FROM_NAME="TechOS Flow"
```

O domínio de envio precisa estar verificado no painel do Resend. No ambiente atual, o domínio de envio configurado é `mail.techosflow.com.br`.

## 8. Comandos úteis

### Backend

```bash
php artisan serve
php artisan migrate
php artisan db:seed
php artisan test
php artisan route:list
php artisan config:clear
php artisan anexos:revisar-retencao --days=365 --limit=50
```

### Frontend

```bash
npm run dev
npm run lint
npx tsc -b
npm run build
npm run test:a11y
```

## 9. Qualidade contínua do frontend

O projeto possui uma suíte inicial de acessibilidade para validar partes críticas da interface:

- shell administrativo;
- alternância de tema;
- tabela operacional de OS;
- relatório de horas extras;
- gestão de usuários;
- modal técnico de detalhe da OS.

Além da suíte automatizada, a interface passou por uma rodada específica de responsividade mobile com foco em:

- remoção de rolagem horizontal indesejada;
- tabelas administrativas convertidas para cards no celular;
- formulários e ações da OS mais confortáveis em toque;
- melhor adaptação de dashboards, relatórios e painéis operacionais em telas pequenas.

Também fazem parte do comportamento atual do frontend:

- envio de múltiplas fotos no mesmo fluxo de evidência;
- miniaturas de imagens nos detalhes da OS para técnico e administrador;
- captura de geolocalização com uso da melhor posição disponível quando a precisão ideal não é alcançada;
- correção do mapeamento de prioridade para manter `Alta = 1`, `Média = 2` e `Baixa = 3`.

Execução local:

```bash
cd frontend
npm run test:a11y
```

## 10. Padrões adotados

- backend com controllers, middlewares, models, notifications e services;
- frontend modularizado por domínio;
- API versionada em `/api/v1`;
- UUID nas entidades principais;
- validação centralizada no backend;
- uso de Tailwind no frontend;
- autenticação por Sanctum;
- regras críticas protegidas por perfil e pelo backend.

## 11. Instruções de manutenção

- sempre executar migrations antes de validar fluxo novo no backend;
- revisar impacto em perfis ao alterar rotas protegidas;
- manter coerência entre nomes e contratos do backend e do frontend;
- revisar os relatórios em PDF e CSV sempre que houver mudança estrutural em OS, anexos ou geolocalização.
