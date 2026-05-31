# Checklist de Validação em Ambiente Real

## 1. Objetivo

Este checklist serve para homologar o `TechOS Flow` antes da publicação final em produção, com foco em:

- funcionamento por perfil;
- segurança básica;
- geolocalização em smartphone;
- persistência de anexos;
- relatórios e exportações;
- readiness para deploy em ambiente real, como Oracle Cloud.

## 2. Situação Atual

### Testes automatizados já validados

- [x] `backend`: `php artisan test`
- [x] `frontend`: `npm run lint`
- [x] `frontend`: `npx tsc -b`
- [x] `frontend`: `npm run test:a11y`

### O que ainda precisa de validação manual

- [ ] deploy com domínio real
- [ ] `HTTPS` válido no frontend e na API
- [ ] envio real de e-mail
- [ ] geolocalização em smartphone no domínio final
- [ ] persistência dos anexos após reinício e novo deploy
- [ ] backup e restauração mínima

## 3. Pré-requisitos

Antes de iniciar a homologação, o ambiente deve ter:

- [ ] frontend publicado
- [ ] backend publicado
- [ ] banco PostgreSQL acessível
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` configurado com URL pública
- [ ] `FRONTEND_URL` configurado com URL pública
- [ ] `MAIL_*` válidos
- [ ] `SANCTUM_STATEFUL_DOMAINS` alinhado ao domínio real
- [ ] storage persistente configurado para anexos
- [ ] pelo menos um usuário de cada perfil
- [ ] pelo menos um colaborador operacional cadastrado

## 4. Checklist de Infraestrutura

- [ ] o domínio do frontend abre sem erro
- [ ] a API responde sem erro
- [ ] `HTTPS` está válido no frontend
- [ ] `HTTPS` está válido na API
- [ ] o backend envia e-mail
- [ ] os anexos não dependem de diretório temporário
- [ ] anexos persistem após reinício do serviço
- [ ] anexos persistem após novo deploy
- [ ] relógio do servidor está correto
- [ ] variáveis sensíveis não estão expostas em tela ou log público

## 5. Checklist de Segurança Básica

- [ ] `APP_DEBUG` está desligado
- [ ] rotas protegidas exigem autenticação
- [ ] usuário inativo não consegue acessar o sistema
- [ ] primeiro acesso exige troca de senha
- [ ] recuperação de senha funciona
- [ ] técnico não emite PDF detalhado da OS
- [ ] atendente não emite PDF detalhado da OS
- [ ] somente administrador emite PDF detalhado da OS
- [ ] anexos privados não possuem URL pública direta

## 6. Smoke Test Funcional

### 6.1 Autenticação e sessão

- [ ] login com administrador
- [ ] login com atendente
- [ ] login com técnico
- [ ] consulta do usuário autenticado
- [ ] logout

### 6.2 Recuperação de senha

- [ ] solicitar recuperação de senha
- [ ] receber e-mail
- [ ] abrir link de redefinição
- [ ] redefinir senha com sucesso
- [ ] fazer login com a nova senha

### 6.3 Usuários e colaboradores operacionais

- [ ] administrador lista usuários
- [ ] administrador cria usuário
- [ ] administrador edita usuário
- [ ] administrador lista colaboradores operacionais
- [ ] administrador cria colaborador operacional
- [ ] administrador edita colaborador operacional

### 6.4 Fluxo de ordem de serviço

- [ ] atendente cria OS geral
- [ ] técnico cria OS técnica ETA/ETE
- [ ] consulta de OS funciona com busca e filtros
- [ ] técnico aceita OS aberta sem responsável
- [ ] técnico inicia execução
- [ ] equipe participante pode ser registrada
- [ ] equipe aceita usuário autenticado
- [ ] equipe aceita colaborador operacional sem login
- [ ] técnico finaliza execução
- [ ] técnico marca OS como não executada quando necessário
- [ ] administrador consulta detalhe da OS
- [ ] administrador gera PDF detalhado da OS

## 7. Checklist de Evidências e Geolocalização

> Validar em smartphone, usando o domínio final com `HTTPS`.

- [ ] abrir a OS no celular
- [ ] selecionar foto ou arquivo
- [ ] capturar geolocalização com permissão concedida
- [ ] confirmar latitude e longitude
- [ ] confirmar precisão aceitável
- [ ] confirmar rua, bairro, cidade e estado quando disponíveis
- [ ] confirmar que a evidência foi enviada
- [ ] reabrir a evidência depois do envio
- [ ] validar que o endereço da evidência não substitui o endereço cadastral da OS
- [ ] gerar PDF e verificar se a evidência aparece corretamente

### Checklist específico de smartphone

- [ ] a interface abre bem no celular
- [ ] o formulário é utilizável no mobile
- [ ] botões e campos são clicáveis sem dificuldade
- [ ] o detalhe da OS abre sem quebra de layout
- [ ] a câmera ou seleção de arquivo funciona
- [ ] a geolocalização funciona com `HTTPS`
- [ ] o envio de evidência conclui com sucesso

## 8. Checklist de Relatórios e Exportações

- [ ] relatório administrativo de ordens de serviço carrega
- [ ] contexto operacional aparece corretamente
- [ ] relatório de horas extras carrega
- [ ] exportação PDF funciona
- [ ] exportação Excel funciona
- [ ] exportação CSV funciona
- [ ] PDF detalhado da OS só aparece para administrador
- [ ] cálculo de hora extra 50% confere com cenário de teste
- [ ] cálculo de hora extra 100% confere com cenário de teste
- [ ] colaborador operacional aparece corretamente no relatório de horas extras

## 9. Checklist de Persistência

- [ ] ordens criadas continuam no banco após reinício
- [ ] execuções continuam no banco após reinício
- [ ] evidências continuam acessíveis após reinício
- [ ] evidências continuam acessíveis após novo deploy
- [ ] dados de horas extras permanecem consistentes

## 10. Checklist Operacional Mínimo

- [ ] logs são gerados em local conhecido
- [ ] erros podem ser localizados com facilidade
- [ ] backup do banco existe
- [ ] restauração foi simulada ou testada
- [ ] credenciais sensíveis não estão em repositório público
- [ ] storage dos anexos possui estratégia de backup

## 11. Critério de Aceite

O ambiente pode ser considerado pronto quando:

- [ ] o sistema abre com `HTTPS`
- [ ] login e recuperação de senha funcionam
- [ ] criação e execução de OS funcionam
- [ ] evidência com geolocalização funciona no smartphone
- [ ] relatórios e exportações funcionam
- [ ] anexos persistem após reinício e deploy
- [ ] não existe falha crítica de autenticação, permissão ou persistência

## 12. Pendências Comuns Antes do Oracle Cloud

Se algum ponto falhar, estas são as prioridades:

1. `HTTPS` e domínio funcionando corretamente
2. storage persistente para anexos
3. envio de e-mail de recuperação de senha
4. geolocalização real em smartphone
5. backup e logs

## 13. Registro Final da Homologação

Preencher ao final:

- Data da validação: `____/____/________`
- Ambiente validado: `________________________________`
- Responsável pela validação: `________________________________`
- Resultado final:
  - [ ] aprovado para publicação
  - [ ] aprovado com ressalvas
  - [ ] reprovado para publicação
- Observações:

```text
____________________________________________________________
____________________________________________________________
____________________________________________________________
```
