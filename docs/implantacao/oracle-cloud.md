# Deploy na Oracle Cloud

## Objetivo

Subir o `TechOS Flow` em uma instancia `Compute` da Oracle Cloud com:

- frontend estatico;
- backend Laravel em modo de producao;
- PostgreSQL persistente;
- HTTPS automatico;
- estrutura simples de operacao com Docker Compose.

## Arquivos usados

- [compose.prod.yaml](../../compose.prod.yaml)
- [deploy/oracle/Caddyfile](../../deploy/oracle/Caddyfile)
- [deploy/oracle/.env.production.example](../../deploy/oracle/.env.production.example)
- [backend/Dockerfile.prod](../../backend/Dockerfile.prod)
- [frontend/Dockerfile.prod](../../frontend/Dockerfile.prod)

## Arquitetura recomendada

Para simplificar a operacao em uma unica VM:

- `Caddy` faz o TLS/HTTPS e o proxy reverso;
- `frontend` serve o build do React;
- `backend` roda Laravel em Apache + PHP 8.2;
- `postgres` mantem os dados;
- um volume/ponto persistente do host guarda banco, anexos e certificados.

## O que preparar na Oracle Cloud

### 1. Instancia Compute

Recomendacao pratica:

- Ubuntu 24.04 LTS ou 22.04 LTS;
- pelo menos `2 vCPU` e `4 GB RAM` para uso pequeno ou homologacao;
- para producao mais confortavel, subir acima disso quando houver muitos PDFs, anexos e uso simultaneo.

### 2. Rede

Liberar:

- `22/tcp` apenas para o seu IP;
- `80/tcp` publico;
- `443/tcp` publico.

Nao expor:

- `5432`;
- portas internas dos containers.

### 3. DNS

Apontar o dominio para o IP publico da instancia.

Exemplo:

- `app.seudominio.com.br` -> IP publico da VM

### 4. Persistencia

Criar ou reservar um caminho persistente no servidor.

Este guia usa:

```text
/srv/techos-flow/data
```

Se voce anexar um block volume da Oracle Cloud, monte esse volume nesse caminho.

## Instalacao na VM

### 1. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Git

```bash
sudo apt install -y git
```

### 3. Instalar Docker Engine e Compose

Siga a instalacao oficial do Docker para Ubuntu.

Referencia oficial:

- Docker Engine em Ubuntu: https://docs.docker.com/engine/install/ubuntu/

### 4. Criar diretorios persistentes

```bash
sudo mkdir -p /srv/techos-flow/data/postgres
sudo mkdir -p /srv/techos-flow/data/backend-storage
sudo mkdir -p /srv/techos-flow/data/caddy/data
sudo mkdir -p /srv/techos-flow/data/caddy/config
sudo chown -R $USER:$USER /srv/techos-flow
```

### 5. Clonar o projeto

```bash
cd /srv/techos-flow
git clone <URL_DO_REPOSITORIO> app
cd app
```

## Configuracao do ambiente

### 1. Criar o arquivo de ambiente

```bash
cp deploy/oracle/.env.production.example deploy/oracle/.env.production
```

### 2. Editar os valores reais

Preencha pelo menos:

- `APP_HOST`
- `SANCTUM_STATEFUL_DOMAINS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`

### 3. Gerar a `APP_KEY`

Antes de subir a stack completa, gere a chave:

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml run --rm backend php artisan key:generate --show
```

Copie o valor retornado e cole em:

```text
APP_KEY=
```

no arquivo:

```text
deploy/oracle/.env.production
```

## Subida do ambiente

### Build e inicializacao

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml up -d --build
```

### Ver logs

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml logs -f
```

## Comandos uteis

### Ver containers

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml ps
```

### Rodar migrations manualmente

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml exec backend php artisan migrate --force
```

### Limpar e recachear configuracao

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml exec backend php artisan optimize:clear
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml exec backend php artisan config:cache
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml exec backend php artisan route:cache
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml exec backend php artisan view:cache
```

### Reiniciar a stack

```bash
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml down
docker compose --env-file deploy/oracle/.env.production -f compose.prod.yaml up -d
```

## Como o roteamento funciona

- acesso web normal -> `frontend`
- chamadas `/api/*` -> `backend`
- HTTPS e certificados -> `Caddy`

Com isso, o frontend pode continuar usando:

- `VITE_API_URL` vazio em dev;
- `/api/v1` em producao, no mesmo dominio.

## O que validar depois do deploy

### Infraestrutura

- dominio resolvendo para a VM;
- HTTPS ativo;
- banco persistindo apos reinicio;
- anexos persistindo apos reinicio.

### Funcional

- login;
- recuperacao de senha;
- criacao de OS;
- aceite e inicio de execucao;
- envio de evidencia com foto;
- geolocalizacao no smartphone com HTTPS;
- PDF detalhado da OS;
- relatorio mensal de OS;
- exportacoes em PDF, Excel e CSV.

### Operacao

- logs do backend sem erro recorrente;
- e-mail SMTP funcionando;
- backup do banco e de anexos definido.

## Limitacoes atuais desta stack

- pensada para uma unica VM;
- sem worker dedicado de fila;
- sem balanceamento horizontal;
- PostgreSQL ainda no mesmo host da aplicacao.

Para uma evolucao futura, voce pode separar:

- banco em servico dedicado;
- storage de anexos;
- worker de filas;
- monitoramento e alertas.

## Referencias oficiais

- Oracle Cloud Infrastructure: criacao de instancia Compute  
  https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm

- Oracle Cloud Infrastructure: security lists  
  https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm

- Oracle Cloud Infrastructure: IP publico reservado  
  https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/reserved-public-ip-create.htm

- Oracle Cloud Infrastructure: anexar block volume  
  https://docs.oracle.com/en-us/iaas/Content/Block/Tasks/attachingablockvolume.htm

- Docker Engine em Ubuntu  
  https://docs.docker.com/engine/install/ubuntu/
