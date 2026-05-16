# Casos de Uso Principais

## UC-01 — Autenticar usuário

- **Objetivo:** permitir acesso ao sistema por meio de credenciais válidas.
- **Ator principal:** usuário autenticável.
- **Pré-condições:** usuário cadastrado e ativo.
- **Fluxo principal:**
  1. O usuário informa e-mail e senha.
  2. O sistema valida as credenciais.
  3. O sistema cria um token de acesso.
  4. O sistema retorna os dados do usuário autenticado.
- **Fluxos alternativos:**
  - credenciais inválidas: erro 401;
  - usuário inativo: erro 403;
  - excesso de tentativas: erro 429.
- **Pós-condições:** sessão autenticada disponível para uso.

## UC-02 — Realizar primeiro acesso

- **Objetivo:** obrigar a troca da senha inicial por uma senha forte.
- **Ator principal:** usuário recém-criado ou com troca pendente.
- **Pré-condições:** usuário autenticado com `must_change_password = true`.
- **Fluxo principal:**
  1. O usuário acessa o sistema.
  2. O sistema redireciona para a tela de primeiro acesso.
  3. O usuário informa senha atual, nova senha e confirmação.
  4. O sistema valida força, diferença da senha atual e confirmação.
  5. O sistema atualiza a senha e libera o acesso normal.
- **Fluxos alternativos:**
  - senha atual incorreta;
  - nova senha não atende à política;
  - confirmação inválida.
- **Pós-condições:** `must_change_password = false`.

## UC-03 — Recuperar senha por e-mail

- **Objetivo:** permitir que o usuário redefina a própria senha sem intervenção manual do administrador.
- **Ator principal:** usuário autenticável.
- **Pré-condições:** conta existente com e-mail válido.
- **Fluxo principal:**
  1. O usuário acessa `Esqueci minha senha`.
  2. Informa o e-mail cadastrado.
  3. O sistema gera token temporário.
  4. O sistema envia link de redefinição por e-mail.
  5. O usuário abre o link.
  6. Informa nova senha e confirmação.
  7. O sistema redefine a credencial.
- **Fluxos alternativos:**
  - e-mail inválido;
  - token expirado ou inválido;
  - nova senha fora da política.
- **Pós-condições:** senha redefinida e acesso liberado.

## UC-04 — Criar OS geral

- **Objetivo:** registrar uma nova ordem de serviço geral.
- **Ator principal:** atendente.
- **Pré-condições:** usuário autenticado com perfil `atendente`.
- **Fluxo principal:**
  1. O atendente acessa a área de criação.
  2. Preenche tipo, cliente, prioridade, data e hora de abertura, descrição e endereço.
  3. Solicita o envio do formulário.
  4. O sistema valida os campos.
  5. O sistema gera número da OS e registra os vínculos.
- **Fluxos alternativos:**
  - campos obrigatórios ausentes;
  - dados de endereço inválidos.
- **Pós-condições:** OS criada com status `aberta`.

## UC-05 — Criar OS técnica ETA/ETE

- **Objetivo:** registrar uma ordem técnica de manutenção operacional.
- **Ator principal:** técnico.
- **Pré-condições:** usuário autenticado com perfil `tecnico`.
- **Fluxo principal:**
  1. O técnico acessa a área de criação.
  2. Preenche os campos do formulário ETA/ETE.
  3. O sistema monta a descrição técnica consolidada.
  4. O sistema cria a OS do tipo `Manutenção ETA/ETE`.
- **Fluxos alternativos:**
  - campos técnicos obrigatórios ausentes;
  - tentativa de criação de OS fora do tipo permitido.
- **Pós-condições:** OS criada e vinculada ao técnico criador.

## UC-06 — Consultar ordens de serviço

- **Objetivo:** localizar ordens por busca, status, tipo, prioridade ou responsável.
- **Ator principal:** atendente, técnico ou administrador.
- **Pré-condições:** usuário autenticado e autorizado.
- **Fluxo principal:**
  1. O usuário acessa a listagem.
  2. Informa filtros ou termo de busca.
  3. O sistema consulta a API com paginação.
  4. O sistema retorna o recorte correspondente.
- **Fluxos alternativos:**
  - filtro inválido;
  - nenhum registro encontrado.
- **Pós-condições:** ordens exibidas conforme os filtros aplicados.

## UC-07 — Visualizar detalhes de uma OS

- **Objetivo:** consultar o conteúdo completo da ordem de serviço.
- **Ator principal:** atendente, técnico ou administrador.
- **Pré-condições:** OS existente e usuário autenticado.
- **Fluxo principal:**
  1. O usuário seleciona uma OS.
  2. O sistema busca os detalhes com relacionamentos necessários.
  3. O sistema apresenta descrição, endereço, criador, responsável, execuções e anexos.
- **Fluxos alternativos:**
  - OS inexistente;
  - falha de comunicação com a API.
- **Pós-condições:** usuário acessa a visão detalhada da OS.

## UC-08 — Aceitar OS

- **Objetivo:** assumir responsabilidade sobre uma OS aberta.
- **Ator principal:** técnico.
- **Pré-condições:** OS em status `aberta` e sem responsável técnico.
- **Fluxo principal:**
  1. O técnico visualiza a OS disponível.
  2. Aciona a operação de aceite.
  3. O sistema valida status e ausência de responsável.
  4. O sistema grava `tecnico_responsavel_id`.
- **Fluxos alternativos:**
  - OS já atribuída a outro técnico;
  - OS não está aberta.
- **Pós-condições:** OS permanece aberta, porém vinculada ao técnico.

## UC-09 — Iniciar execução

- **Objetivo:** registrar o início da execução de uma OS.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS aceita pelo próprio técnico e ainda não encerrada.
- **Fluxo principal:**
  1. O técnico acessa a OS.
  2. Informa observação inicial, se desejar.
  3. Solicita o início da execução.
  4. O sistema cria uma execução aberta.
  5. O status da OS muda para `em_execucao`.
- **Fluxos alternativos:**
  - OS sem responsável;
  - OS de outro técnico;
  - já existe execução aberta para a OS.
- **Pós-condições:** execução em andamento registrada.

## UC-10 — Finalizar execução

- **Objetivo:** encerrar uma execução em andamento.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS em `em_execucao` e execução aberta vinculada ao técnico.
- **Fluxo principal:**
  1. O técnico acessa a OS.
  2. Informa observação final, se desejar.
  3. Informa equipe participante e horários individuais quando necessário.
  4. Solicita finalização.
  5. O sistema encerra a execução.
  6. O sistema calcula os dados de horas extras por funcionário.
  7. O sistema muda a OS para `finalizada`.
- **Fluxos alternativos:**
  - execução já encerrada;
  - OS fora do estado `em_execucao`;
  - equipe inválida.
- **Pós-condições:** execução finalizada, OS encerrada e horas extras apuradas.

## UC-11 — Marcar OS como não executada

- **Objetivo:** registrar encerramento sem execução concluída.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS sob responsabilidade do técnico e ainda não encerrada.
- **Fluxo principal:**
  1. O técnico acessa a opção de não execução.
  2. Informa o motivo.
  3. Solicita a operação.
  4. O sistema registra o motivo e encerra a OS como `nao_executada`.
- **Fluxos alternativos:**
  - motivo não informado;
  - OS já encerrada.
- **Pós-condições:** OS encerrada com motivo registrado.

## UC-12 — Anexar evidência

- **Objetivo:** adicionar arquivo comprobatório à OS.
- **Ator principal:** técnico responsável.
- **Pré-condições:** técnico responsável pela OS e arquivo válido.
- **Fluxo principal:**
  1. O técnico seleciona o tipo do anexo.
  2. Escolhe o arquivo.
  3. Opcionalmente captura geolocalização.
  4. Solicita envio.
  5. O sistema valida arquivo e grava metadados.
  6. O sistema registra o anexo em armazenamento privado.
- **Fluxos alternativos:**
  - arquivo inválido ou acima do limite;
  - geolocalização indisponível;
  - técnico sem autorização na OS.
- **Pós-condições:** anexo persistido e associado à OS.

## UC-13 — Consultar relatórios gerenciais

- **Objetivo:** fornecer visão gerencial da operação.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com perfil `administrador`.
- **Fluxo principal:**
  1. O administrador acessa a área de relatórios.
  2. Define tipo de relatório e filtros.
  3. O sistema gera resumo, dados analíticos e tabela paginada.
  4. O administrador pode exportar em formato suportado.
- **Fluxos alternativos:**
  - filtros inválidos;
  - nenhum dado encontrado;
  - exportação excede limite seguro para PDF ou XLSX.
- **Pós-condições:** relatório visualizado ou exportado.

## UC-14 — Consultar horas extras

- **Objetivo:** fornecer visão administrativa da jornada excedente por funcionário.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com perfil `administrador`.
- **Fluxo principal:**
  1. O administrador acessa a área de horas extras.
  2. Define filtros por funcionário, mês, ano ou período.
  3. O sistema gera indicadores, tabela e resumo individual.
  4. O administrador pode exportar em formato suportado.
- **Fluxos alternativos:**
  - período inválido;
  - nenhum dado encontrado.
- **Pós-condições:** relatório visualizado ou exportado.

## UC-15 — Gerenciar usuários

- **Objetivo:** administrar acessos do sistema.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com perfil `administrador`.
- **Fluxo principal:**
  1. O administrador acessa a tela de usuários.
  2. Pesquisa, filtra, cria ou edita usuários.
  3. O sistema valida os dados.
  4. O sistema persiste a alteração.
  5. Opcionalmente o administrador inativa ou reativa um usuário.
- **Fluxos alternativos:**
  - e-mail já cadastrado;
  - senha fora do padrão;
  - tentativa de inativar o próprio usuário;
  - tentativa de remover o último administrador ativo.
- **Pós-condições:** base de usuários atualizada.
