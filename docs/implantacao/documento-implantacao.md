# Documento de Implantação

## 1. Objetivo

Descrever os requisitos mínimos e o processo recomendado para implantação do TechOS Flow em ambiente de produção.

## 2. Estado atual do projeto para deploy

O projeto já está pronto para:

- homologação online;
- deploy controlado em pequena escala;
- separação entre frontend, backend e banco.

Pontos que ainda exigem decisão de infraestrutura:

- storage persistente para anexos;
- política de backup;
- monitoramento;
- domínio final e HTTPS;
- estratégia de hospedagem.

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
- `APP_URL=A_preencher`
- `FRONTEND_URL=A_preencher`
- `DB_*`
- `FILESYSTEM_DISK=local` ou estratégia institucional definida
- `SESSION_DRIVER=database` ou outro conforme estratégia
- `SANCTUM_STATEFUL_DOMAINS`
- `MAIL_*`

### Frontend

Definir:

- `VITE_API_URL=https://api.exemplo.gov.br/api/v1`

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
- backend: `api.techosflow.com.br`

### Campos pendentes

- domínio oficial do frontend: `A preencher`
- domínio oficial do backend: `A preencher`
- DNS institucional: `A preencher`

## 8. HTTPS

Produção deve operar com HTTPS para:

- proteger credenciais;
- proteger tokens de autenticação;
- proteger links de recuperação de senha;
- reduzir risco de interceptação;
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

Boa opção para simplificar:

- backend Laravel;
- PostgreSQL no mesmo projeto;
- volume persistente para anexos;
- domínios customizados.

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
- [ ] domínio configurado
- [ ] HTTPS ativo
- [ ] backup definido
- [ ] monitoramento definido
- [ ] política de logs definida
- [ ] estratégia de storage persistente validada
