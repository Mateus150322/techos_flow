# Casos de Uso Principais

## UC-01 — Autenticar usuário

- **Objetivo:** permitir acesso ao sistema com credenciais válidas.
- **Ator principal:** usuário autenticável.
- **Pré-condições:** usuário cadastrado e ativo.
- **Fluxo principal:** informa e-mail e senha, o sistema valida, gera token e devolve os dados do usuário.
- **Fluxos alternativos:** credenciais inválidas, usuário inativo, excesso de tentativas.
- **Pós-condição:** sessão autenticada disponível.

## UC-02 — Realizar primeiro acesso

- **Objetivo:** obrigar troca da senha inicial por uma senha forte.
- **Ator principal:** usuário com troca pendente.
- **Pré-condições:** `must_change_password = true`.
- **Fluxo principal:** usuário informa senha atual, nova senha e confirmação; o sistema valida e libera o acesso normal.
- **Fluxos alternativos:** senha atual incorreta, nova senha fraca ou confirmação inválida.
- **Pós-condição:** troca obrigatória removida.

## UC-03 — Recuperar senha por e-mail

- **Objetivo:** permitir redefinição segura da senha.
- **Ator principal:** usuário autenticável.
- **Pré-condições:** conta existente e ativa.
- **Fluxo principal:** usuário solicita o link, recebe e-mail, abre o token e redefine a senha.
- **Fluxos alternativos:** token inválido/expirado, nova senha fora da política.
- **Pós-condição:** credencial redefinida.

## UC-04 — Criar OS geral

- **Objetivo:** registrar ordem de serviço geral.
- **Ator principal:** atendente.
- **Pré-condições:** usuário autenticado com papel `atendente`.
- **Fluxo principal:** preenche cliente, prioridade, descrição e endereço; o sistema valida e cria a OS.
- **Fluxos alternativos:** dados obrigatórios ausentes ou endereço inválido.
- **Pós-condição:** OS criada com status `aberta`.

## UC-05 — Criar OS técnica ETA/ETE

- **Objetivo:** registrar ordem técnica de manutenção operacional.
- **Ator principal:** técnico.
- **Pré-condições:** usuário autenticado com papel `tecnico`.
- **Fluxo principal:** preenche unidade, local operacional, prioridade e dados técnicos; o sistema monta a descrição e cria a OS.
- **Fluxos alternativos:** campos técnicos obrigatórios ausentes.
- **Pós-condição:** OS técnica criada.

## UC-06 — Consultar ordens de serviço

- **Objetivo:** localizar ordens por filtros e busca.
- **Ator principal:** atendente, técnico ou administrador.
- **Pré-condições:** usuário autenticado.
- **Fluxo principal:** acessa a listagem, informa filtros, consulta o resultado paginado.
- **Fluxos alternativos:** nenhum registro encontrado ou filtros inválidos.
- **Pós-condição:** conjunto de ordens exibido.

## UC-07 — Visualizar detalhes da OS

- **Objetivo:** consultar o conteúdo completo da ordem.
- **Ator principal:** atendente, técnico ou administrador.
- **Pré-condições:** OS existente e acesso autorizado.
- **Fluxo principal:** seleciona a OS e o sistema apresenta descrição, endereço, responsável, execuções e anexos.
- **Fluxos alternativos:** OS inexistente ou acesso negado.
- **Pós-condição:** usuário acessa o detalhe completo.

## UC-08 — Aceitar OS

- **Objetivo:** assumir responsabilidade por uma OS aberta.
- **Ator principal:** técnico.
- **Pré-condições:** OS aberta e sem responsável técnico.
- **Fluxo principal:** técnico aciona o aceite, o sistema valida e registra o responsável.
- **Fluxos alternativos:** OS já atribuída ou fora do estado permitido.
- **Pós-condição:** OS vinculada ao técnico.

## UC-09 — Iniciar execução

- **Objetivo:** abrir a execução operacional da OS.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS aceita pelo próprio técnico.
- **Fluxo principal:** técnico aciona o início; o sistema cria a execução e muda a OS para `em_execucao`.
- **Fluxos alternativos:** OS de outro técnico, OS encerrada, execução aberta existente.
- **Pós-condição:** execução registrada.

## UC-10 — Finalizar execução

- **Objetivo:** encerrar a execução da OS.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS em `em_execucao`.
- **Fluxo principal:** técnico informa observação final, equipe participante e horários individuais; o sistema encerra a execução e a OS.
- **Fluxos alternativos:** equipe inválida, execução já encerrada, estado incompatível.
- **Pós-condição:** OS finalizada e horas extras apuradas.

## UC-11 — Marcar OS como não executada

- **Objetivo:** registrar encerramento sem conclusão operacional.
- **Ator principal:** técnico responsável.
- **Pré-condições:** OS sob responsabilidade do técnico.
- **Fluxo principal:** técnico informa motivo e o sistema encerra a OS como `nao_executada`.
- **Fluxos alternativos:** motivo ausente ou OS já encerrada.
- **Pós-condição:** OS encerrada com motivo registrado.

## UC-12 — Anexar evidência

- **Objetivo:** adicionar arquivo comprobatório à OS.
- **Ator principal:** técnico responsável.
- **Pré-condições:** técnico responsável e arquivo válido.
- **Fluxo principal:** seleciona arquivo, opcionalmente captura geolocalização e envia a evidência.
- **Fluxos alternativos:** falha de permissão, arquivo inválido, geolocalização indisponível.
- **Pós-condição:** anexo persistido em storage privado.

## UC-13 — Consultar relatórios gerenciais

- **Objetivo:** analisar contexto operacional e indicadores.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com papel `administrador`.
- **Fluxo principal:** aplica filtros, consulta o relatório e visualiza resumo, gargalos e tabela.
- **Fluxos alternativos:** filtros sem resultado ou exportação bloqueada por regra.
- **Pós-condição:** relatório exibido.

## UC-14 — Exportar relatórios

- **Objetivo:** gerar saídas formais ou analíticas dos relatórios.
- **Ator principal:** administrador.
- **Pré-condições:** relatório disponível para exportação.
- **Fluxo principal:** administrador escolhe `PDF`, `Excel` ou `CSV`; o sistema gera e devolve o arquivo.
- **Fluxos alternativos:** formato inválido, volume incompatível ou falha de geração.
- **Pós-condição:** arquivo exportado.

## UC-15 — Consultar horas extras

- **Objetivo:** acompanhar extras, banco de folgas e estimativa financeira.
- **Ator principal:** administrador.
- **Pré-condições:** execuções finalizadas com equipe registrada.
- **Fluxo principal:** administrador aplica filtros, consulta indicadores e lista analítica.
- **Fluxos alternativos:** filtros sem resultado.
- **Pós-condição:** relatório de horas extras exibido.

## UC-16 — Gerenciar usuários

- **Objetivo:** manter a base de usuários autenticáveis.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com papel `administrador`.
- **Fluxo principal:** listar, criar, editar, inativar e reativar usuários.
- **Fluxos alternativos:** e-mail duplicado, senha inválida, tentativa de remover o último administrador ativo.
- **Pós-condição:** base de usuários atualizada.

## UC-17 — Gerenciar colaboradores operacionais

- **Objetivo:** manter a base de participantes sem login.
- **Ator principal:** administrador.
- **Pré-condições:** usuário autenticado com papel `administrador`.
- **Fluxo principal:** listar, cadastrar, editar e inativar colaboradores operacionais.
- **Fluxos alternativos:** dados obrigatórios ausentes ou valor-hora inválido.
- **Pós-condição:** base operacional atualizada.

## UC-18 — Emitir PDF detalhado da OS

- **Objetivo:** gerar documento formal detalhado da ordem.
- **Ator principal:** administrador.
- **Pré-condições:** OS existente e acesso administrativo.
- **Fluxo principal:** administrador acessa a OS e solicita o PDF detalhado.
- **Fluxos alternativos:** perfil não autorizado recebe `403`.
- **Pós-condição:** PDF detalhado gerado.
