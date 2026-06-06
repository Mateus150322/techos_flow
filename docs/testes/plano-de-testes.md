# Plano de Testes

## 1. Objetivo

Definir a estratégia de testes do `TechOS Flow`, cobrindo backend, frontend, perfis, relatórios, horas extras e validação em ambiente real.

## 2. Estratégia geral

O projeto adota estratégia em camadas:

- testes automatizados de backend para regras críticas;
- testes automatizados de frontend para acessibilidade, tipagem e consistência visual básica;
- validação manual dos fluxos principais por perfil;
- smoke test em ambiente real para domínio, `HTTPS`, Resend, anexos e geolocalização.

## 3. Escopo de teste

### 3.1 Dentro do escopo

- autenticação e sessão;
- primeiro acesso;
- recuperação de senha;
- criação, consulta e ciclo de OS;
- ações do técnico;
- evidências e anexos privados;
- relatórios administrativos;
- horas extras;
- gestão de usuários;
- gestão de colaboradores operacionais;
- validação básica em smartphone.

### 3.2 Fora do escopo atual

- suíte E2E completa de frontend;
- testes formais de carga;
- pentest;
- automação de infraestrutura em nuvem.

## 4. Testes automatizados existentes

### Backend

- `AuthSegurancaTest`
- `DashboardApiTest`
- `FluxoTecnicoTest`
- `PrimeiroAcessoTest`
- `RecuperacaoSenhaTest`
- `RelatoriosAdminTest`
- `RevisaoRetencaoAnexosCommandTest`
- `UsuariosAdminTest`
- `HorasExtrasTest`
- `ColaboradoresOperacionaisAdminTest`

### Frontend

- suíte de acessibilidade (`test:a11y`);
- validação de tipagem com `npx tsc -b`;
- validação estática com `npm run lint`;
- testes de utilitários como geolocalização e normalização de erro;
- testes de componentes críticos do admin e detalhe da OS.

## 5. Critérios de aceite

Um fluxo é considerado aceito quando:

- o backend responde com código compatível com o cenário;
- as regras de acesso são respeitadas;
- a persistência reflete o estado esperado;
- o frontend consome a resposta sem inconsistência;
- em ambiente real, o fluxo continua funcional em domínio com `HTTPS`.

## 6. Regressão mínima obrigatória

Antes de considerar uma entrega válida:

- `php artisan test` deve passar;
- `npm run lint` deve passar;
- `npx tsc -b` deve passar;
- `npm run build` deve passar;
- `npm run test:a11y` deve passar;
- os fluxos manuais principais devem ser revisados por perfil.

## 7. Focos adicionais da rodada atual

Além do fluxo principal, a rodada mais recente de testes deve observar:

- manutenção correta da prioridade escolhida pelo atendente;
- envio de múltiplas fotos em um único fluxo de evidência;
- comportamento da geolocalização quando a precisão ideal não é alcançada;
- miniaturas das fotos nos detalhes da OS;
- relatório mensal de OS em PDF organizado por ordem de serviço;
- CSV com separador `;` para melhor abertura no Excel em pt-BR.

## 8. Validação em ambiente real

Deve incluir:

- login no domínio final;
- recuperação de senha com Resend;
- criação e execução de OS;
- envio de evidência em smartphone com `HTTPS`;
- consulta do anexo após novo acesso;
- relatório PDF e exportação Excel/CSV;
- persistência do anexo após reinício do serviço.

Referência:

- [Validação em ambiente real](../implantacao/validacao-ambiente-real.md)

## 9. Melhorias futuras recomendadas

- testes E2E com Playwright;
- smoke tests automatizados por ambiente;
- testes de performance em relatórios e dashboards;
- cenários automatizados de geolocalização assistida.
