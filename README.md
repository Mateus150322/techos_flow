# TechOS Flow

Sistema web para gestão de ordens de serviço, com foco em rastreabilidade operacional, controle por perfil, evidências, relatórios, horas extras, banco de folgas e recuperação de senha por e-mail.

## Visão geral

O TechOS Flow foi estruturado para substituir fluxos manuais e em papel em operações como:

- atendimento e abertura de ordens de serviço;
- execução técnica em campo;
- gestão de ordens de manutenção ETA/ETE;
- controle de anexos e evidências com geolocalização;
- relatórios administrativos e PDF detalhado por OS;
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
- E-mail transacional atual: `Resend`

## Estrutura do repositório

```text
techos-flow/
  backend/
  frontend/
  docs/
  .gitlab-ci.yml
  compose.yaml
  README.md
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

Observações:

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

## Ambiente publicado atual

O ambiente online atual usa:

- frontend/domínio público: `https://www.techosflow.com.br`
- backend Railway: `https://techosflow-production.up.railway.app`
- API consumida pelo frontend: `/api/v1` no domínio publicado ou `https://techosflow-production.up.railway.app/api/v1`, conforme a configuração do build;
- banco de produção: PostgreSQL interno do Railway, acessado pelo endpoint privado;
- e-mail transacional: `Resend`;
- repositório usado pelo Railway: `GitHub`, branch `main`;
- GitLab: espelho secundário do projeto, mantido para histórico e pipeline.

O banco de produção foi migrado do Neon para o Postgres interno do Railway. Após a migração, as chamadas medidas no navegador caíram de aproximadamente 3 segundos para menos de 1 segundo (`login` em cerca de 682 ms e dashboard técnico em cerca de 478 ms).

## Validação em ambiente real

Antes de homologar a entrega final, vale validar o sistema em domínio com `HTTPS`, e-mail transacional e storage persistente.

Checklist prático:

1. Publicar frontend, backend e banco em ambiente de homologação.
2. Configurar domínio, HTTPS, Resend e volume persistente para anexos.
3. Executar smoke test completo:
   - login;
   - recuperação de senha;
   - abertura de OS;
   - aceite e finalização de OS;
   - evidência com foto e geolocalização no celular;
   - relatório PDF da OS;
   - relatório administrativo;
   - horas extras.
4. Testar restauração básica de banco e anexos.
5. Confirmar logs, monitoramento e alertas mínimos.

Guia detalhado:

- [validação em ambiente real](docs/implantacao/validacao-ambiente-real.md)

## Pipeline

O projeto possui pipeline base para qualidade do frontend em:

- `.gitlab-ci.yml`

Quando o repositório do GitLab está sincronizado com a `main`, esse pipeline executa:

- `npm run lint`
- `npx tsc -b`
- `npm run test:a11y`

## Documentação

A documentação completa do projeto está em:

- [docs/](docs/)

Pontos de entrada mais úteis:

- [docs/README.md](docs/README.md)
- [manual técnico do projeto](docs/manuais/manual-tecnico-projeto.md)
- [plano de testes](docs/testes/plano-de-testes.md)
- [documento de implantação](docs/implantacao/documento-implantacao.md)
- [guia de Docker](docs/implantacao/docker.md)
- [validação em ambiente real](docs/implantacao/validacao-ambiente-real.md)

Guias de deploy em nuvem:

- [deploy na Oracle Cloud](docs/implantacao/oracle-cloud.md)
- [documento de implantação](docs/implantacao/documento-implantacao.md)

## Pontos de infraestrutura ainda pendentes

O sistema já está funcionalmente maduro e possui domínio publicado. Os principais pontos ainda dependentes de fechamento operacional são:

- storage persistente para anexos;
- rotina de backup e restauração;
- monitoramento e logs.

## Status atual

O projeto já conta com:

- fluxo operacional de OS por perfil;
- primeiro acesso com troca obrigatória de senha forte;
- recuperação de senha por e-mail;
- inativação de usuários;
- anexos privados com controle de acesso;
- relatórios administrativos e PDF detalhado da OS;
- módulo de horas extras e banco de folgas;
- melhorias práticas de segurança, privacidade e mobile;
- documentação técnica organizada.
