# Docker do TechOS Flow

## Objetivo

Padronizar a instalação e execução local do projeto com containers, reduzindo diferenças de ambiente entre máquinas.

## Estrutura usada

Arquivos principais:

- [compose.yaml](../../compose.yaml)
- [backend/Dockerfile](../../backend/Dockerfile)
- [backend/docker/start.sh](../../backend/docker/start.sh)
- [frontend/Dockerfile](../../frontend/Dockerfile)
- [frontend/docker/start.sh](../../frontend/docker/start.sh)

## Serviços

### `postgres`

- imagem: `postgres:16-alpine`
- porta: `5432`
- volume persistente: `postgres_data`

### `backend`

- PHP 8.2
- instala dependências com Composer quando necessário
- gera `APP_KEY` se necessário
- aguarda o PostgreSQL
- executa migrations ao iniciar
- sobe em `http://localhost:8000`

### `frontend`

- Node 20
- instala dependências com `npm install` quando necessário
- sobe o Vite em `http://localhost:5173`
- usa proxy interno para o backend Docker

## Subida do ambiente

```bash
docker compose up --build
```

## Parada do ambiente

```bash
docker compose down
```

## Comandos úteis

```bash
docker compose exec backend php artisan test
docker compose exec backend php artisan route:list
docker compose exec backend php artisan migrate --force
docker compose exec frontend npm run lint
docker compose exec frontend npx tsc -b
docker compose exec frontend npm run test:a11y
```

## Verificação do estado atual

O `compose.yaml` do projeto continua coerente com esta documentação e hoje define:

- `postgres` com volume persistente local;
- `backend` em modo `local`, com `APP_DEBUG=true` e disco `local`;
- `frontend` com Vite em modo de desenvolvimento e proxy interno para o backend.

## Observações importantes

- o ambiente Docker atual foi preparado para desenvolvimento e validação local;
- o fluxo atual com Herd continua possível, sem conflito com esta estrutura;
- o frontend sobe via Vite dev server, não como build estático;
- para produção, recomenda-se uma adaptação específica de build, domínio, HTTPS, storage persistente e segredos.
