# Documento de Requisitos

## 1. Objetivo

Este documento consolida os requisitos do TechOS Flow com base no comportamento real já implementado no sistema.

## 2. Premissas

- o sistema é acessado por navegador web;
- a API REST é a fonte oficial de negócio e autorização;
- os perfis válidos são `administrador`, `atendente` e `tecnico`;
- o backend utiliza Laravel e PostgreSQL;
- o envio de e-mails depende de configuração SMTP válida por ambiente.

## 3. Requisitos funcionais

| ID | Requisito funcional | Prioridade | Situação |
| --- | --- | --- | --- |
| RF-01 | O sistema deve autenticar usuários por e-mail e senha. | Alta | Implementado |
| RF-02 | O sistema deve permitir logout da sessão autenticada. | Alta | Implementado |
| RF-03 | O sistema deve expor os dados do usuário autenticado. | Alta | Implementado |
| RF-04 | O sistema deve exigir troca obrigatória de senha no primeiro acesso quando aplicável. | Alta | Implementado |
| RF-05 | O sistema deve permitir recuperação de senha por e-mail. | Alta | Implementado |
| RF-06 | O atendente deve poder criar OS geral. | Alta | Implementado |
| RF-07 | O técnico deve poder criar OS do tipo `Manutenção ETA/ETE`. | Alta | Implementado |
| RF-08 | O sistema deve gerar número único de ordem de serviço. | Alta | Implementado |
| RF-09 | O sistema deve permitir listar OS com busca, filtros e paginação. | Alta | Implementado |
| RF-10 | O sistema deve permitir consultar os detalhes completos de uma OS. | Alta | Implementado |
| RF-11 | O técnico deve poder aceitar OS aberta e sem responsável. | Alta | Implementado |
| RF-12 | O técnico responsável deve poder iniciar execução. | Alta | Implementado |
| RF-13 | O técnico responsável deve poder finalizar execução. | Alta | Implementado |
| RF-14 | O técnico responsável deve poder marcar OS como não executada. | Alta | Implementado |
| RF-15 | O técnico responsável deve poder anexar evidências à OS. | Alta | Implementado |
| RF-16 | O sistema deve permitir geolocalização opcional nas evidências. | Média | Implementado |
| RF-17 | O sistema deve oferecer dashboards específicos por perfil. | Alta | Implementado |
| RF-18 | O administrador deve poder consultar relatórios gerenciais. | Alta | Implementado |
| RF-19 | O administrador deve poder exportar relatórios em CSV, XLSX e PDF. | Alta | Implementado |
| RF-20 | O administrador deve poder gerar PDF detalhado de uma OS. | Alta | Implementado |
| RF-21 | O administrador deve poder consultar relatório de horas extras. | Alta | Implementado |
| RF-22 | O administrador deve poder exportar relatório de horas extras em CSV, XLSX e PDF. | Alta | Implementado |
| RF-23 | O sistema deve calcular horas extras e banco de folgas por funcionário ao finalizar execuções. | Alta | Implementado |
| RF-24 | O sistema deve permitir selecionar funcionários da execução a partir da base de usuários autorizados. | Alta | Implementado |
| RF-25 | O administrador deve poder listar usuários. | Alta | Implementado |
| RF-26 | O administrador deve poder criar usuários. | Alta | Implementado |
| RF-27 | O administrador deve poder editar usuários. | Alta | Implementado |
| RF-28 | O administrador deve poder inativar e reativar usuários. | Alta | Implementado |
| RF-29 | O sistema deve bloquear usuário inativo. | Alta | Implementado |
| RF-30 | O sistema deve manter rastreabilidade mínima sobre anexos privados. | Alta | Implementado |

## 4. Requisitos não funcionais

| ID | Requisito não funcional | Critério |
| --- | --- | --- |
| RNF-01 | O sistema deve adotar arquitetura web separando frontend, backend e banco de dados. | Frontend React, API Laravel e banco PostgreSQL |
| RNF-02 | A API deve ser versionada. | Uso de `/api/v1` |
| RNF-03 | O sistema deve operar com autenticação baseada em token. | Laravel Sanctum |
| RNF-04 | O sistema deve oferecer interface responsiva para desktop e smartphone. | Layouts ajustados com Tailwind e navegação mobile |
| RNF-05 | O sistema deve permitir manutenção evolutiva por modularização do frontend e uso de controllers/services no backend. | Estrutura atual do código |
| RNF-06 | O sistema deve suportar exportação de relatórios. | CSV, XLSX e PDF |
| RNF-07 | O sistema deve utilizar identificadores UUID nas entidades principais. | Usuários, endereços, ordens, execuções, anexos, equipe de execução e feriados |
| RNF-08 | O sistema deve manter logs mínimos para eventos sensíveis de autenticação e anexos. | Login com throttle e rastreabilidade de anexos |
| RNF-09 | O sistema deve manter tema claro padrão e modo escuro opcional. | Variáveis globais e classe `dark` no frontend |

## 5. Requisitos de segurança

| ID | Requisito de segurança | Situação |
| --- | --- | --- |
| RS-01 | Todas as rotas protegidas devem exigir autenticação. | Implementado |
| RS-02 | O acesso às funcionalidades deve respeitar o perfil do usuário. | Implementado |
| RS-03 | Técnicos não devem executar ações em OS de outro técnico. | Implementado |
| RS-04 | Técnicos só devem visualizar OS abertas sem responsável ou atribuídas a eles. | Implementado |
| RS-05 | Usuários inativos não devem acessar o sistema. | Implementado |
| RS-06 | Novos usuários devem trocar senha no primeiro acesso. | Implementado |
| RS-07 | A senha deve atender requisitos mínimos de força. | Implementado |
| RS-08 | O login deve possuir limitação de tentativas. | Implementado |
| RS-09 | Evidências e anexos devem ser armazenados em área privada. | Implementado |
| RS-10 | O acesso a anexos deve ser autenticado e autorizado. | Implementado |
| RS-11 | O sistema deve validar entradas vindas do cliente. | Implementado |
| RS-12 | O sistema deve evitar exposição desnecessária de caminhos internos de armazenamento. | Implementado |

## 6. Requisitos de usabilidade

| ID | Requisito de usabilidade | Situação |
| --- | --- | --- |
| RU-01 | O sistema deve apresentar telas separadas por perfil. | Implementado |
| RU-02 | O fluxo principal deve ser acessível a partir do painel de cada perfil. | Implementado |
| RU-03 | O usuário deve receber mensagens de erro compreensíveis em português. | Implementado |
| RU-04 | O sistema deve apresentar indicadores e agrupamentos visuais nas listagens. | Implementado |
| RU-05 | O usuário deve visualizar status da OS com identificação clara. | Implementado |
| RU-06 | A tela de login deve ser objetiva e sem excesso de informações. | Implementado |
| RU-07 | O sistema deve oferecer tema claro/escuro nas telas internas. | Implementado |
| RU-08 | O sistema deve oferecer fluxo básico de acessibilidade por teclado e leitor de tela. | Implementado parcialmente, com suíte automatizada inicial |

## 7. Requisitos de desempenho

| ID | Requisito de desempenho | Situação |
| --- | --- | --- |
| RD-01 | A consulta geral de OS deve utilizar paginação. | Implementado |
| RD-02 | Dashboards por perfil não devem depender de carregamento completo de todas as OS no frontend. | Implementado |
| RD-03 | Relatórios em tela devem ser paginados. | Implementado |
| RD-04 | Exportação CSV deve operar por stream quando aplicável. | Implementado |
| RD-05 | O sistema deve possuir índices nas colunas críticas de busca e ordenação. | Implementado |
| RD-06 | Revalidação de sessão deve evitar chamadas desnecessárias à API em toda navegação. | Implementado |
| RD-07 | O frontend deve reduzir carga inicial por separação de chunks e carregamento sob demanda. | Implementado |

## 8. Requisitos de conformidade com LGPD

| ID | Requisito de conformidade | Situação |
| --- | --- | --- |
| RL-01 | O sistema deve restringir visualização de dados por perfil. | Implementado |
| RL-02 | O sistema deve minimizar a exposição de dados em relatórios. | Implementado |
| RL-03 | O sistema deve tratar evidências e anexos com acesso controlado. | Implementado |
| RL-04 | O sistema deve documentar dados tratados, finalidade e retenção. | Parcial |
| RL-05 | O sistema deve evitar exposição pública de dados pessoais e operacionais. | Implementado |
| RL-06 | O sistema deve permitir revisão administrativa de retenção de anexos. | Implementado |
| RL-07 | O projeto deve possuir responsáveis e procedimentos operacionais de privacidade. | A preencher |

## 9. Restrições atuais conhecidas

- não há aplicativo mobile nativo;
- não existe, no estado atual, rotina automática de descarte de dados;
- anexos ainda usam storage local privado, exigindo volume persistente em produção;
- a política institucional formal de privacidade, incidentes e resposta ao titular precisa ser complementada pela organização usuária.
