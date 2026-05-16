# Plano de Testes

## 1. Objetivo

Definir a estratégia de testes do TechOS Flow, incluindo cobertura funcional, de API, autenticação, perfis, acessibilidade e regras de negócio.

## 2. Estratégia geral

O projeto adota estratégia em camadas:

- testes automatizados de backend para regras críticas de negócio e API;
- testes automatizados de frontend para acessibilidade básica e estrutura semântica;
- validação manual do frontend para fluxos operacionais, visuais e contraste;
- testes orientados a perfil;
- critérios mínimos de aceite para os fluxos principais.

## 3. Escopo dos testes

### 3.1 Dentro do escopo

- autenticação e sessão;
- primeiro acesso;
- recuperação de senha por e-mail;
- bloqueio de usuário inativo;
- criação, consulta e fluxo de OS;
- ações do técnico;
- relatório detalhado de OS;
- relatórios administrativos;
- relatório de horas extras;
- gestão de usuários;
- revisão de retenção de anexos;
- acessibilidade básica do frontend.

### 3.2 Fora do escopo atual

- testes automatizados end-to-end de frontend;
- testes de carga formais;
- testes de penetração;
- testes automatizados de infraestrutura em nuvem.

## 4. Testes automatizados existentes

Atualmente o backend possui cobertura em:

- `AuthSegurancaTest`
- `DashboardApiTest`
- `FluxoTecnicoTest`
- `PrimeiroAcessoTest`
- `RecuperacaoSenhaTest`
- `RelatoriosAdminTest`
- `RevisaoRetencaoAnexosCommandTest`
- `UsuariosAdminTest`
- `HorasExtrasTest`

No frontend, existe uma suíte inicial de acessibilidade com:

- `AdminShell.test.tsx`
- `HorasExtrasPage.test.tsx`
- `TabelaOrdensSection.test.tsx`
- `TecnicoOSDetailsModal.test.tsx`
- `ThemeToggle.test.tsx`
- `UsuariosPage.test.tsx`

## 5. Tipos de teste

### 5.1 Testes funcionais

Validam se o sistema entrega o comportamento esperado por requisito.

### 5.2 Testes de integração

Validam a interação entre controller, service, model, banco e autenticação.

### 5.3 Testes de API

Validam:

- contratos básicos;
- códigos de resposta;
- filtros;
- paginação;
- exportações;
- erros de validação;
- recuperação de senha.

### 5.4 Testes de autenticação

Validam:

- login;
- acesso autenticado;
- troca obrigatória de senha;
- bloqueio de usuário inativo;
- redefinição de senha por token;
- throttling nas rotas públicas sensíveis.

### 5.5 Testes por perfil

Validam o que cada perfil pode ou não pode fazer:

- atendente;
- técnico;
- administrador.

### 5.6 Testes de regras de negócio

Validam:

- aceite de OS;
- início e finalização de execução;
- não execução;
- upload de anexos;
- acesso privado a anexos;
- gestão de usuários e inativação;
- cálculo de horas extras e banco de folgas.

### 5.7 Testes de acessibilidade

Validam:

- landmarks principais;
- navegação por teclado em componentes críticos;
- nomes acessíveis de botões e controles;
- estrutura semântica de tabelas;
- ausência de violações básicas por `axe`.

## 6. Critérios de aceitação

Um fluxo é considerado aceito quando:

- o backend responde com código compatível com o cenário;
- as regras de acesso são respeitadas;
- a persistência no banco reflete o estado esperado;
- não há exposição indevida de dados;
- o frontend consegue consumir a resposta sem inconsistência.

## 7. Cenários críticos de falha

- login com credenciais inválidas;
- login de usuário inativo;
- acesso com senha pendente de troca;
- abuso do endpoint de login;
- recuperação com token inválido ou expirado;
- técnico tentando operar OS de outro técnico;
- aceite de OS já atribuída;
- início de segunda execução aberta para a mesma OS;
- finalização de execução inexistente ou já encerrada;
- upload de anexo sem autorização;
- acesso indevido a anexo privado;
- tentativa de inativar o último administrador ativo.

## 8. Estratégia de execução

### Backend

```bash
cd backend
php artisan test
```

### Frontend

```bash
cd frontend
npm run lint
npx tsc -b
npm run test:a11y
```

## 9. Critérios de regressão mínima

Antes de considerar uma entrega válida:

- `php artisan test` deve passar;
- `npm run lint` deve passar;
- `npx tsc -b` deve passar;
- `npm run build` deve passar;
- `npm run test:a11y` deve passar;
- os fluxos manuais principais devem ser revisados para os três perfis.

## 10. Melhorias futuras recomendadas

- testes end-to-end com Playwright ou ferramenta equivalente;
- cenários automatizados de frontend por perfil;
- testes de performance em relatórios e dashboards;
- testes de resiliência para upload e acesso a anexos;
- smoke tests de deploy por ambiente.
