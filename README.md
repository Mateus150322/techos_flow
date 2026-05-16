# TechOS Flow

Sistema web para gestão de ordens de serviço, com foco em rastreabilidade operacional, controle por perfil, evidências, relatórios, horas extras e banco de folgas.

## Visão geral

O TechOS Flow foi projetado para substituir fluxos manuais e em papel em operações como:

- atendimento e abertura de ordens de serviço;
- execução técnica em campo;
- gestão de ordens de manutenção ETA/ETE;
- controle de anexos e evidências;
- relatórios administrativos;
- horas extras e banco de folgas;
- recuperação de senha por e-mail.

Perfis atuais do sistema:

- `administrador`
- `atendente`
- `tecnico`

## Stack

- Backend: `Laravel`
- Frontend: `React + Vite + TypeScript`
- Banco de dados: `PostgreSQL`
- API: `REST versionada (/api/v1)`
- Autenticação: `Laravel Sanctum`
- E-mail transacional atual: `Zoho Mail`

## Estrutura do repositório

```text
techos-flow/
  backend/
  frontend/
  docs/
  scripts/
```

## Como rodar localmente

### Opção 1. Docker Compose

```bash
docker compose up --build
```

Serviços expostos:

- frontend: `http://localhost:5173`
- backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

Comandos úteis:

```bash
docker compose up --build
docker compose down
docker compose exec backend php artisan test
docker compose exec frontend npm run test:a11y
```

Observação:
- a estrutura Docker atual foi preparada para desenvolvimento e validação local;
- para produção, recomenda-se configuração específica de build, domínio, HTTPS e storage persistente.

### Opção 2. Ambiente local tradicional

#### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Para acessar o frontend local por nome em vez de IP, use:

- `http://techosflow.test:5173`

No Windows, isso depende de uma entrada local no arquivo `hosts` apontando `techosflow.test` para `127.0.0.1`.

## Comandos principais

### Backend

```bash
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

## Critérios mínimos de qualidade

Antes de consolidar uma entrega, o fluxo mínimo recomendado é:

```bash
# backend
php artisan test

# frontend
npm run lint
npx tsc -b
npm run build
npm run test:a11y
```

## Pipeline

O projeto já possui pipeline base para qualidade do frontend em:

- `.gitlab-ci.yml`

Esse pipeline executa:

- `npm run lint`
- `npx tsc -b`
- `npm run test:a11y`

## Documentação

A documentação completa do projeto está em:

- [docs/](c:/Users/VAIO/Documents/projetos/techos-flow/docs)

Pontos de entrada mais úteis:

- [docs/README.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/README.md)
- [docs/manuais/manual-tecnico-projeto.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/manuais/manual-tecnico-projeto.md)
- [docs/testes/plano-de-testes.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/testes/plano-de-testes.md)
- [docs/acessibilidade/checklist-acessibilidade.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/acessibilidade/checklist-acessibilidade.md)
- [docs/implantacao/documento-implantacao.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/implantacao/documento-implantacao.md)
- [docs/implantacao/docker.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/implantacao/docker.md)

## Observações

- o modo claro é o padrão do sistema, com suporte opcional a modo escuro;
- os PDFs permanecem com fundo claro, independentemente do tema da interface;
- a proteção de acesso depende de autenticação, perfil e validações no backend;
- o armazenamento de anexos ainda usa disco local privado, então deploy real exige volume persistente ou futura migração para object storage.

## Status atual

O projeto já conta com:

- fluxo operacional de OS por perfil;
- primeiro acesso com troca obrigatória de senha forte;
- recuperação de senha por e-mail;
- inativação de usuários;
- anexos privados com controle de acesso;
- relatórios administrativos e PDF detalhado da OS;
- módulo de horas extras e banco de folgas;
- melhorias práticas de segurança, privacidade, acessibilidade e mobile;
- documentação técnica organizada.
