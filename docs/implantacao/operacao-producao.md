# Operacao em producao

Este guia cobre as rotinas operacionais adicionadas ao TechOS Flow.

## Variaveis obrigatorias

Em producao, configure pelo menos:

```env
APP_KEY=base64:...
TECHOS_BACKUP_ENABLED=true
TECHOS_BACKUP_RETENTION_DAYS=30
TECHOS_BACKUP_SCHEDULE=02:00
SENTRY_LARAVEL_DSN=
VITE_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0.1
PULSE_USERNAME=monitoramento
PULSE_PASSWORD=uma-senha-longa-e-exclusiva
```

O volume definido por `BACKUP_PATH` deve ficar fora do container e, idealmente,
ser copiado para outro servidor ou armazenamento de objetos. Um backup no mesmo
disco da aplicacao nao protege contra perda do servidor.

## Backup e restauracao

Gerar banco e anexos:

```bash
php artisan techos:backup
```

Gerar apenas uma parte:

```bash
php artisan techos:backup --database-only
php artisan techos:backup --files-only
```

Restaurar em um ambiente isolado:

```bash
php artisan techos:restore \
  --database=techos_database_AAAAMMDD_HHMMSS.dump \
  --attachments=techos_anexos_AAAAMMDD_HHMMSS.zip
```

O comando pede confirmacao. Use `--force` somente em automacao controlada.
Realize um teste de restauracao mensal e confira login, uma OS, seus anexos e o
historico de auditoria.

No Compose de producao, o servico `scheduler` executa o backup automatico no
horario definido por `TECHOS_BACKUP_SCHEDULE`.

## Saude e monitoramento

- `GET /api/v1/health`: verifica banco e escrita no storage de anexos.
- `/up`: verifica se o processo Laravel esta respondendo.
- `/pulse`: painel de desempenho do Laravel; em ambiente local fica liberado e,
  nos demais ambientes, exige `PULSE_USERNAME` e `PULSE_PASSWORD`.
- Sentry: recebe excecoes do backend e frontend quando os respectivos DSNs
  estiverem configurados.

Configure alertas externos para o endpoint de saude e para erros novos no
Sentry. O Pulse e uma ferramenta de diagnostico, nao substitui alertas.

## Testes

Validacao local completa:

```bash
cd backend
php artisan test

cd ../frontend
npm run lint
npx tsc -b
npm run test:a11y
npm run test:e2e
```

Os testes E2E publicos verificam responsividade, instalacao PWA e navegacao sem
internet em desktop e celular. Para habilitar o fluxo autenticado do tecnico:

```env
E2E_TECH_EMAIL=tecnico@example.com
E2E_TECH_PASSWORD=senha-de-teste
```

Use uma conta exclusiva de homologacao, nunca credenciais de producao.

## Sincronizacao offline

O frontend persiste operacoes pendentes no IndexedDB e tenta sincroniza-las:

1. quando a conexao retorna;
2. ao voltar para a janela;
3. periodicamente enquanto o aplicativo esta aberto;
4. pelo Background Sync do service worker, quando suportado.

Antes de uma implantacao em campo, valide em um aparelho real: aceite, inicio,
finalizacao com foto, fechamento do navegador sem rede e sincronizacao posterior.
