# Docker do TechOS Flow

## Objetivo

Padronizar a instalacao e execucao local do projeto com containers, reduzindo diferencas de ambiente entre maquinas.

## Estrutura usada

Arquivos principais de desenvolvimento:

- [compose.yaml](../../compose.yaml)
- [backend/Dockerfile](../../backend/Dockerfile)
- [backend/docker/start.sh](../../backend/docker/start.sh)
- [frontend/Dockerfile](../../frontend/Dockerfile)
- [frontend/docker/start.sh](../../frontend/docker/start.sh)

Arquivos principais de producao:

- [compose.prod.yaml](../../compose.prod.yaml)
- [backend/Dockerfile.prod](../../backend/Dockerfile.prod)
- [frontend/Dockerfile.prod](../../frontend/Dockerfile.prod)
- [deploy/oracle/Caddyfile](../../deploy/oracle/Caddyfile)
- [deploy/oracle/.env.production.example](../../deploy/oracle/.env.production.example)
- [oracle-cloud.md](oracle-cloud.md)

## Servicos do ambiente local

### `postgres`

- imagem: `postgres:16-alpine`
- porta: `5432`
- volume persistente: `postgres_data`

### `backend`

- PHP 8.4
- instala dependencias com Composer quando necessario
- gera `APP_KEY` se necessario
- aguarda o PostgreSQL
- executa migrations ao iniciar
- sobe em `http://localhost:8000`

### `frontend`

- Node 22
- instala dependencias com `npm install` quando necessario
- sobe o Vite em `http://localhost:5173`
- usa proxy interno para o backend Docker

## Subida do ambiente local

```bash
docker compose up --build
```

## Parada do ambiente local

```bash
docker compose down
```

## Comandos uteis no ambiente local

```bash
docker compose exec backend php artisan test
docker compose exec backend php artisan route:list
docker compose exec backend php artisan migrate --force
docker compose exec frontend npm run lint
docker compose exec frontend npx tsc -b
docker compose exec frontend npm run test:a11y
```

## Verificacao do estado atual

O `compose.yaml` continua coerente com a documentacao e hoje define:

- `postgres` com volume persistente local;
- `backend` em modo `local`, com `APP_DEBUG=true` e disco `local`;
- `frontend` com Vite em modo de desenvolvimento e proxy interno para o backend.

## Producao

Para deploy em nuvem, use a stack especifica de producao:

- [guia de deploy na Oracle Cloud](oracle-cloud.md)

Ela adiciona:

- frontend estatico;
- backend Laravel em modo de producao;
- HTTPS com Caddy;
- persistencia parametrizada por caminhos do host;
- `compose.prod.yaml` separado do ambiente local.

## Observacoes importantes

- o ambiente Docker atual foi preparado para desenvolvimento e validacao local;
- o fluxo atual com Herd continua possivel, sem conflito com esta estrutura;
- o frontend local sobe via Vite dev server, nao como build estatico;
- para producao, use a stack especifica de `compose.prod.yaml`.
