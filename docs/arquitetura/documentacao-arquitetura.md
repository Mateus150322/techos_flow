# Documentação da Arquitetura

## 1. Visão geral

O TechOS Flow adota arquitetura web em camadas, com separação entre:

- **frontend**: aplicação React + TypeScript responsável pela interface do usuário;
- **backend**: API REST em Laravel responsável por autenticação, regras de negócio e persistência;
- **banco de dados**: PostgreSQL responsável pelo armazenamento estruturado;
- **armazenamento de arquivos**: disco local privado para anexos no estado atual.

## 2. Arquitetura geral do sistema

### 2.1 Camadas principais

1. **Apresentação**
   - páginas, componentes e hooks React;
   - dashboards por perfil;
   - formulários de criação, consulta e execução;
   - tema claro/escuro e componentes mobile.
2. **Aplicação**
   - controllers Laravel;
   - middlewares;
   - services de dashboard, relatórios, exportação e horas extras.
3. **Domínio e persistência**
   - models Eloquent;
   - migrations;
   - banco PostgreSQL.
4. **Infraestrutura**
   - Laravel Sanctum;
   - SMTP para recuperação de senha;
   - armazenamento privado de anexos;
   - logs de eventos sensíveis.

## 3. Organização entre frontend, backend e banco

### 3.1 Frontend

- responsável pela experiência de uso;
- consome a API REST versionada;
- mantém estado local de telas, filtros, formulários e sessão de usuário;
- aplica separação por módulos (`auth`, `dashboard`, `ordensServico`, `admin`, `shared`);
- inclui suíte inicial de testes de acessibilidade.

### 3.2 Backend

- centraliza autenticação e autorização;
- aplica validação de entrada;
- executa regras de negócio;
- retorna dados estruturados por perfil;
- controla acesso a arquivos privados;
- calcula horas extras e banco de folgas ao finalizar execuções;
- envia e-mails de recuperação de senha.

### 3.3 Banco de dados

- armazena usuários, endereços, ordens de serviço, execuções, equipe de execução, anexos, feriados, sessões, tokens e reset de senha;
- utiliza UUID como identificador principal nas entidades de domínio;
- mantém chaves estrangeiras e índices para suportar filtros, consultas e relatórios.

## 4. Módulos do sistema

### 4.1 Módulo de autenticação

- login;
- logout;
- consulta do usuário autenticado;
- primeiro acesso com troca obrigatória de senha;
- bloqueio de usuários inativos;
- recuperação de senha por e-mail.

### 4.2 Módulo de ordens de serviço

- criação de OS geral;
- criação de OS técnica ETA/ETE;
- listagem, filtros e detalhe;
- aceite;
- execução;
- finalização;
- não execução;
- PDF detalhado por OS.

### 4.3 Módulo de evidências

- envio de anexos;
- geolocalização opcional;
- armazenamento privado;
- consulta autenticada do arquivo.

### 4.4 Módulo de dashboards

- painel do atendente;
- painel do técnico;
- painel administrativo.

### 4.5 Módulo administrativo

- relatórios gerenciais;
- exportações;
- gestão de usuários;
- relatório de horas extras e banco de folgas.

## 5. Fluxo de autenticação

1. Usuário informa e-mail e senha no frontend.
2. Frontend chama `POST /api/v1/login`.
3. Backend valida credenciais e aplica throttle no endpoint público.
4. Em caso de sucesso, revoga tokens antigos do usuário e gera novo token do Sanctum.
5. Frontend armazena token e dados do usuário.
6. Requisições subsequentes usam cabeçalho `Authorization: Bearer <token>`.

## 6. Fluxo de autorização

O backend aplica autorização em camadas:

- autenticação obrigatória nas rotas protegidas;
- middleware de usuário ativo;
- middleware de troca obrigatória de senha;
- middleware por perfil;
- validações específicas por regra de negócio, como técnico responsável da OS;
- restrição de leitura para o técnico visualizar apenas OS abertas sem responsável ou OS atribuídas a ele.

## 7. Versionamento da API

A API utiliza versionamento por prefixo:

- `/api/v1`

Isso permite evolução futura sem quebrar o contrato atual de integração.

## 8. Estrutura de pastas do projeto

### 8.1 Backend

```text
backend/
  app/
    Http/
      Controllers/Api/V1/
      Middleware/
    Models/
    Notifications/
    Services/
      Dashboard/
      HorasExtras/
      Relatorios/
    Support/
  database/
    migrations/
    seeders/
  routes/
    api.php
    console.php
  tests/
    Feature/
```

### 8.2 Frontend

```text
frontend/
  src/
    app/
    modules/
      admin/
      auth/
      dashboard/
      ordensServico/
    shared/
      api/
      auth/
      components/
      hooks/
      utils/
    test/
```

## 9. Principais decisões arquiteturais

### DA-01 — API como fonte central de regra de negócio

As regras críticas não ficam apenas no frontend. O backend valida perfil, status, campos, execução, horas extras e acesso a anexos.

### DA-02 — Separação por perfil também no frontend

Embora o backend seja a fonte de autorização, o frontend organiza experiência, painéis e fluxos por papel de usuário.

### DA-03 — Uso de UUID

UUID foi adotado nas entidades centrais para reduzir acoplamento com sequências numéricas e melhorar consistência entre integrações futuras.

### DA-04 — Armazenamento privado de evidências

Anexos deixaram de ser expostos por URL pública e passaram a ser servidos por rota autenticada.

### DA-05 — Relatórios e dashboards orientados ao backend

Consultas agregadas e painéis deixaram de depender de carregamento completo no frontend, melhorando desempenho e previsibilidade.

### DA-06 — Recuperação de senha via backend

O reset de senha é iniciado por endpoint público, com notificação enviada pelo backend e aplicação da mesma política de senha forte usada no restante do sistema.

## 10. Compatibilidade e evolução

A arquitetura atual favorece:

- manutenção evolutiva por módulo;
- expansão da API sem alterar toda a interface;
- futura criação de PWA ou app mobile consumindo a mesma API;
- expansão de relatórios e integrações;
- futura migração de anexos locais para object storage sem refatoração completa do domínio.

## 11. Limitações arquiteturais atuais

- armazenamento de anexos ainda local no estado atual;
- ausência de fila estruturada para tarefas pesadas;
- ausência de observabilidade completa com métricas externas;
- políticas formais de produção e continuidade ainda dependem de definição institucional;
- deploy de produção ainda precisa de adaptação específica, pois o `compose.yaml` atual é voltado para desenvolvimento.
