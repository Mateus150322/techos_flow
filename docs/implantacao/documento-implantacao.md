# Documento de Implantação

## 1. Objetivo

Descrever os requisitos mínimos e o processo recomendado para implantação do TechOS Flow em ambiente de produção.

## 2. Estado atual do projeto para deploy

O projeto já está pronto para:

- homologação online;
- deploy controlado em pequena escala;
- separação entre frontend, backend e banco;
- uso do Resend para recuperação de senha por e-mail;
- uso de domínio próprio com HTTPS.

Ambiente online atual:

- frontend/domínio público: `https://www.techosflow.com.br`
- backend Railway: `https://techosflow-production.up.railway.app`
- API: `/api/v1` pelo domínio publicado ou `https://techosflow-production.up.railway.app/api/v1`, conforme o build do frontend;
- banco: PostgreSQL interno do Railway;
- e-mail transacional: Resend.

O banco de produção inicialmente usava Neon. Os dados foram migrados para o Postgres interno do Railway, usando conexão privada, para reduzir latência entre backend e banco e evitar tráfego externo desnecessário.

Pontos que ainda exigem definição de infraestrutura:

- storage persistente para anexos;
- política de backup;
- monitoramento;
- estratégia de hospedagem definitiva, caso o Railway deixe de ser usado.

## 3. Requisitos do servidor

### Backend

- sistema operacional Linux recomendado;
- PHP 8.2 ou superior;
- Composer;
- servidor web (Nginx ou Apache);
- PostgreSQL;
- extensão e permissões para armazenamento de arquivos;
- HTTPS obrigatório em produção.

### Frontend

- ambiente para build estático do Vite;
- hospedagem estática ou servidor web para publicação dos arquivos gerados.

## 4. Configuração de produção

### Backend

Definir no `.env`:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://techosflow-production.up.railway.app` ou a URL pública final do backend
- `FRONTEND_URL=https://www.techosflow.com.br`
- `DB_CONNECTION=pgsql`
- `DB_HOST=postgres.railway.internal` ou referência equivalente ao domínio privado do serviço Postgres
- `DB_PORT=5432`
- `DB_DATABASE=railway`
- `DB_USERNAME=postgres`
- `DB_PASSWORD` com a senha do usuário PostgreSQL no Railway
- `DB_SSLMODE=prefer`
- `ANEXOS_DISK=local` ou storage institucional definido
- `SESSION_DRIVER=database` ou outro conforme estratégia
- `SANCTUM_STATEFUL_DOMAINS`
- `MAIL_MAILER=resend`
- `RESEND_KEY`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`

### Frontend

Definir conforme o tipo de publicação:

- mesmo domínio/proxy: `VITE_API_URL=/api/v1`
- backend Railway direto: `VITE_API_URL=https://techosflow-production.up.railway.app/api/v1`

### Observação sobre conexão com banco

No Railway, evitar `DATABASE_PUBLIC_URL` ou `RAILWAY_TCP_PROXY_DOMAIN` para o backend quando ele estiver no mesmo projeto do banco. A conexão pública pode gerar tráfego externo e custos de egress. Preferir sempre o domínio privado, como `postgres.railway.internal` ou a variável baseada em `RAILWAY_PRIVATE_DOMAIN`.

## 5. Build do frontend

```bash
cd frontend
npm install
npm run build
```

Publicar o conteúdo gerado em `frontend/dist`.

## 6. Publicação da API

### Passos sugeridos

1. instalar dependências do backend;
2. configurar `.env`;
3. gerar chave da aplicação;
4. executar migrations;
5. validar storage privado;
6. configurar servidor web apontando para `backend/public`;
7. validar rotas de saúde, autenticação e recuperação de senha.

## 7. Configuração de domínio

### Sugestão

- frontend: `www.techosflow.com.br`
- backend/API: `www.techosflow.com.br/api/v1` quando houver proxy no domínio próprio, ou `techosflow-production.up.railway.app/api/v1` quando o frontend chamar o Railway diretamente

### Campos pendentes

- domínio oficial do frontend: `www.techosflow.com.br`
- domínio oficial do backend: definir entre domínio próprio com proxy ou URL Railway
- DNS institucional: `A preencher`

## 8. HTTPS

Produção deve operar com HTTPS para:

- proteger credenciais;
- proteger sessão e autenticação;
- proteger links de recuperação de senha;
- permitir geolocalização no navegador do celular com muito mais confiabilidade;
- cumprir boas práticas mínimas de segurança.

## 9. Backups

### Recomendação mínima

- backup periódico do PostgreSQL;
- backup controlado do diretório de anexos ou do volume persistente;
- teste periódico de restauração.

### Campos institucionais

- periodicidade do backup: `A preencher`
- retenção dos backups: `A preencher`
- responsável pelo backup: `A preencher`

## 10. Monitoramento

### Recomendado

- disponibilidade da API;
- erro de aplicação;
- uso de disco para anexos;
- crescimento do banco;
- falhas de autenticação anormais;
- falhas de envio de e-mail.

### Ferramentas

- `A preencher`

## 11. Logs

O ambiente de produção deve preservar:

- logs da aplicação;
- logs do servidor web;
- logs de eventos sensíveis quando aplicável;
- logs de autenticação e recuperação de senha quando viável.

## 12. Atualização do sistema

### Procedimento sugerido

1. publicar nova versão em homologação;
2. executar testes mínimos;
3. aplicar migrations em produção;
4. publicar backend;
5. publicar frontend;
6. validar login, recuperação de senha, listagem de OS, anexos e relatórios.

## 13. Opções de hospedagem já avaliadas

### Railway

Ambiente usado atualmente para simplificar:

- backend Laravel;
- PostgreSQL no mesmo projeto, via endpoint privado;
- volume persistente para anexos;
- domínios customizados;
- deploy pela branch `main` do GitHub.

Resultado observado após migrar o banco do Neon para o Postgres interno do Railway:

- `login`: de aproximadamente 3,55 s para cerca de 682 ms;
- dashboard técnico: de aproximadamente 3,21 s para cerca de 478 ms.

Ponto de atenção:

- para o projeto real, considerar pelo menos o plano `Hobby`, pois o plano gratuito é muito limitado para banco, anexos e uso contínuo.

### Oracle Cloud

Boa opção para reduzir custo com maior esforço operacional:

- VM Linux;
- PostgreSQL na própria instância;
- frontend servido por Nginx;
- storage local persistido em volume.

Ponto de atenção:

- exige mais administração de infraestrutura.

## 14. Checklist de implantação

- [ ] variáveis de ambiente configuradas
- [ ] banco criado e acessível
- [ ] migrations executadas
- [ ] usuários iniciais preparados
- [ ] frontend buildado
- [x] domínio configurado
- [x] HTTPS ativo
- [ ] backup definido
- [ ] monitoramento definido
- [ ] política de logs definida
- [ ] estratégia de storage persistente validada
- [x] recuperação de senha testada no ambiente final
- [ ] evidência com geolocalização testada em smartphone com HTTPS

## 15. Próximo passo recomendado

Depois da implantação técnica, executar o guia de [validação em ambiente real](validacao-ambiente-real.md).
