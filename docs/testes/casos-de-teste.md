# Casos de Teste

## 1. Legenda de status

- `Automatizado`: coberto por teste automatizado existente.
- `Planejado`: recomendado, mas ainda dependente de execução formal.
- `Manual recorrente`: validado no uso do sistema, mas sem automação dedicada.

## 2. Casos de teste

| ID | Objetivo | Pré-condição | Passos | Resultado esperado | Status | Observações |
| --- | --- | --- | --- | --- | --- | --- |
| CT-AUT-01 | Autenticar usuário válido | usuário ativo cadastrado | informar e-mail e senha válidos | token e usuário retornados | Planejado | coberto indiretamente em vários fluxos |
| CT-AUT-02 | Bloquear usuário inativo | usuário com `is_active=false` | tentar login | resposta 403 | Manual recorrente | mensagem amigável no frontend |
| CT-AUT-03 | Exigir troca de senha no primeiro acesso | usuário com `must_change_password=true` | autenticar e tentar acessar rota protegida | bloqueio até troca de senha | Automatizado | `PrimeiroAcessoTest` |
| CT-AUT-04 | Limitar tentativas de login | múltiplas tentativas inválidas no mesmo intervalo | insistir no login inválido | resposta 429 | Automatizado | `AuthSegurancaTest` |
| CT-AUT-05 | Solicitar recuperação de senha | usuário com e-mail cadastrado | informar e-mail em `Esqueci minha senha` | link de redefinição enviado ou solicitação processada | Automatizado | `RecuperacaoSenhaTest` |
| CT-AUT-06 | Redefinir senha com token válido | token de reset ativo | informar token, e-mail, nova senha e confirmação | senha atualizada | Automatizado | `RecuperacaoSenhaTest` |
| CT-OS-01 | Criar OS geral | atendente autenticado | preencher formulário e enviar | OS criada com status `aberta` | Manual recorrente | validar número e endereço |
| CT-OS-02 | Impedir técnico de criar OS geral | técnico autenticado | enviar tipo diferente de ETA/ETE | resposta 403 | Automatizado | coberto em fluxo técnico |
| CT-OS-03 | Listar OS com paginação | base com múltiplas ordens | consultar listagem | retorno paginado | Manual recorrente | validar filtros no frontend |
| CT-OS-04 | Consultar detalhe da OS | OS existente | abrir detalhe | dados completos exibidos | Manual recorrente | inclui endereço, execuções e anexos |
| CT-OS-05 | Gerar PDF detalhado de OS | OS existente e perfil autorizado | abrir detalhe e emitir PDF | arquivo PDF gerado | Automatizado | coberto por testes de fluxo com PDF |
| CT-TEC-01 | Aceitar OS aberta sem responsável | técnico autenticado | acionar aceite | responsável técnico gravado | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-02 | Impedir aceite de OS já atribuída | OS já aceita | tentar novo aceite | conflito ou bloqueio | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-03 | Iniciar execução válida | técnico responsável | iniciar execução | execução criada e OS em `em_execucao` | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-04 | Impedir segunda execução aberta | OS já com execução aberta | iniciar novamente | resposta 422 | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-05 | Finalizar execução válida | OS em execução | finalizar com `execucao_id` válido | execução encerrada e OS finalizada | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-06 | Marcar OS como não executada | OS sob responsabilidade do técnico | informar motivo e concluir | OS encerrada como `nao_executada` | Automatizado | `FluxoTecnicoTest` |
| CT-TEC-07 | Impedir operação em OS de outro técnico | OS atribuída a terceiro | tentar iniciar, finalizar ou anexar | resposta 403 | Automatizado | `FluxoTecnicoTest` |
| CT-HE-01 | Calcular horas extras na finalização | execução com equipe e horários válidos | finalizar execução com horários fora da jornada | minutos normais e extras calculados | Automatizado | `HorasExtrasTest` |
| CT-HE-02 | Incluir técnico responsável no cálculo mesmo sem envio explícito | execução em andamento | finalizar sem listar manualmente o responsável | responsável entra na apuração | Automatizado | `HorasExtrasTest` |
| CT-HE-03 | Consultar relatório de horas extras | administrador autenticado | aplicar filtros e consultar | indicadores e resumo retornados | Automatizado | `HorasExtrasTest` e validação manual da tela |
| CT-ANX-01 | Enviar evidência válida | técnico responsável e arquivo válido | anexar arquivo | anexo criado | Automatizado | `FluxoTecnicoTest` |
| CT-ANX-02 | Acessar anexo privado com autorização | anexo existente | solicitar arquivo autenticado | conteúdo retornado | Automatizado | `FluxoTecnicoTest` |
| CT-ANX-03 | Negar acesso a anexo de OS alheia | técnico sem vínculo com a OS | solicitar arquivo | resposta 403 | Automatizado | `FluxoTecnicoTest` |
| CT-REL-01 | Consultar relatório administrativo | administrador autenticado | aplicar filtros e gerar relatório | resumo e dados retornados | Automatizado | `RelatoriosAdminTest` |
| CT-REL-02 | Exportar relatório em CSV | administrador autenticado | chamar exportação CSV | arquivo exportado | Automatizado | `RelatoriosAdminTest` |
| CT-REL-03 | Bloquear exportação PDF acima do limite | volume acima do limite definido | exportar PDF | resposta de bloqueio | Automatizado | `RelatoriosAdminTest` |
| CT-USR-01 | Criar usuário administrativo | administrador autenticado | enviar nome, e-mail, perfil e senha | usuário criado | Automatizado | `UsuariosAdminTest` |
| CT-USR-02 | Editar usuário existente | usuário previamente cadastrado | alterar dados | atualização persistida | Automatizado | `UsuariosAdminTest` |
| CT-USR-03 | Inativar usuário sem ser o próprio | administrador autenticado | inativar outro usuário | usuário inativo | Automatizado | `UsuariosAdminTest` |
| CT-USR-04 | Impedir inativação do último administrador ativo | existir apenas um admin ativo | tentar inativar ou remover papel | resposta 422 | Automatizado | `UsuariosAdminTest` |
| CT-DASH-01 | Consultar dashboard administrativo | administrador autenticado | acessar endpoint | indicadores retornados | Automatizado | `DashboardApiTest` |
| CT-DASH-02 | Consultar dashboard do atendente | atendente autenticado | acessar endpoint | seções abertas, em execução e encerradas | Automatizado | `DashboardApiTest` |
| CT-DASH-03 | Consultar dashboard do técnico | técnico autenticado | acessar endpoint | seções disponíveis, minhas, em execução e finalizadas | Automatizado | `DashboardApiTest` |
| CT-RET-01 | Revisar retenção de anexos | base com anexos antigos | executar comando de retenção | lista de revisão gerada | Automatizado | `RevisaoRetencaoAnexosCommandTest` |
