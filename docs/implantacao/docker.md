# Docker do TechOS Flow

## Objetivo

Padronizar a instalação e execução local do projeto com containers, reduzindo diferenças de ambiente entre máquinas.

## Estrutura criada

Arquivos principais:

- [compose.yaml](c:/Users/VAIO/Documents/projetos/techos-flow/compose.yaml)
- [backend/Dockerfile](c:/Users/VAIO/Documents/projetos/techos-flow/backend/Dockerfile)
- [backend/docker/start.sh](c:/Users/VAIO/Documents/projetos/techos-flow/backend/docker/start.sh)
- [frontend/Dockerfile](c:/Users/VAIO/Documents/projetos/techos-flow/frontend/Dockerfile)
- [frontend/docker/start.sh](c:/Users/VAIO/Documents/projetos/techos-flow/frontend/docker/start.sh)

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

## Observações importantes

- o ambiente Docker atual foi preparado para desenvolvimento e validação local;
- o fluxo atual com Herd continua possível, sem conflito com esta estrutura;
- o `compose.yaml` usa `APP_ENV=local` e `APP_DEBUG=true`;
- o frontend sobe via Vite dev server, não como build estático;
- para produção, recomenda-se uma adaptação específica de build, domínio, HTTPS, storage persistente e segredos.
