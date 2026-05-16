# Modelagem de Processos do Sistema

## 1. Objetivo

Este documento descreve, em formato textual estruturado, os principais processos do
TechOS Flow. O objetivo é facilitar entendimento operacional e futura conversão para BPMN.

## 2. Convenção textual sugerida para BPMN

Cada processo abaixo está organizado com os elementos:

- participantes;
- evento inicial;
- atividades principais;
- pontos de decisão;
- evento final.

## 3. Processo de abertura de OS

### Participantes

- atendente;
- técnico;
- sistema.

### Evento inicial

Necessidade de registrar uma ordem de serviço.

### Atividades principais

1. Usuário autenticado acessa a área de criação.
2. Sistema identifica o perfil do usuário.
3. Atendente preenche formulário de OS geral ou técnico preenche formulário ETA/ETE.
4. Sistema valida os campos obrigatórios.
5. Sistema cria o endereço.
6. Sistema gera número único da OS.
7. Sistema persiste a OS com status `aberta`.

### Pontos de decisão

- Se o usuário for `tecnico`, o tipo deve ser `Manutenção ETA/ETE`.
- Se houver erro de validação, o processo retorna à edição do formulário.
- Se houver conflito de numeração, o backend repete a geração de número.

### Evento final

OS criada com sucesso e disponível para consulta.

## 4. Processo de atribuição ou encaminhamento

### Participantes

- técnico;
- sistema.

### Evento inicial

Existência de OS aberta e sem responsável.

### Atividades principais

1. Técnico consulta painel de ordens disponíveis.
2. Técnico seleciona uma OS.
3. Técnico aciona o aceite.
4. Sistema verifica status da OS.
5. Sistema verifica ausência de responsável técnico.
6. Sistema grava o técnico responsável.

### Pontos de decisão

- Se a OS já estiver atribuída, o aceite é negado.
- Se a OS não estiver `aberta`, o aceite é negado.

### Evento final

OS vinculada ao técnico responsável.

## 5. Processo de execução da OS

### Participantes

- técnico responsável;
- sistema.

### Evento inicial

OS aceita pelo técnico.

### Atividades principais

1. Técnico abre a OS.
2. Técnico informa observação inicial, se necessário.
3. Técnico aciona `Iniciar execução`.
4. Sistema verifica autorização do técnico.
5. Sistema verifica se já existe execução aberta.
6. Sistema cria execução com `data_inicio`.
7. Sistema atualiza status da OS para `em_execucao`.

### Pontos de decisão

- Se a OS estiver encerrada, a execução não inicia.
- Se existir execução aberta, a operação é rejeitada.
- Se o técnico não for o responsável, a operação é negada.

### Evento final

Execução aberta registrada e OS em andamento.

## 6. Processo de finalização

### Participantes

- técnico responsável;
- sistema.

### Evento inicial

OS em `em_execucao`.

### Atividades principais

1. Técnico acessa a OS em execução.
2. Técnico informa observação final, se necessário.
3. Técnico aciona `Finalizar`.
4. Sistema valida execução e vínculo do técnico.
5. Sistema registra `data_fim`.
6. Sistema atualiza a OS para `finalizada`.
7. Sistema define `data_encerramento`.

### Pontos de decisão

- Se a OS não estiver em execução, o encerramento é bloqueado.
- Se a execução já estiver finalizada, a operação é rejeitada.

### Evento final

OS finalizada.

## 7. Processo de não execução

### Participantes

- técnico responsável;
- sistema.

### Evento inicial

Impossibilidade de concluir a execução da OS.

### Atividades principais

1. Técnico acessa a opção `Não executada`.
2. Informa o motivo.
3. Sistema valida autorização e integridade do estado.
4. Sistema grava o motivo de não execução.
5. Sistema atualiza a OS para `nao_executada`.
6. Sistema registra `data_encerramento`.

### Pontos de decisão

- Se o motivo não for informado, o sistema não conclui a ação.
- Se a OS já estiver encerrada, a operação é negada.

### Evento final

OS encerrada como não executada.

## 8. Processo de consulta e acompanhamento

### Participantes

- atendente;
- técnico;
- administrador;
- sistema.

### Evento inicial

Necessidade de localizar ou acompanhar uma OS.

### Atividades principais

1. Usuário acessa a listagem ou dashboard do seu perfil.
2. Usuário informa busca e filtros, quando necessário.
3. Sistema executa consulta paginada.
4. Usuário abre o detalhe da OS.
5. Sistema retorna relacionamento de endereço, criador, responsável, execuções e anexos.

### Pontos de decisão

- O conteúdo exibido depende do perfil do usuário e do contexto da OS.
- O acesso a anexos privados depende de autenticação e autorização.

### Evento final

Usuário acompanha o estado atual e o histórico da ordem.

## 9. Processo de gestão administrativa

### Participantes

- administrador;
- sistema.

### Evento inicial

Necessidade de acompanhar operação ou administrar acessos.

### Atividades principais

1. Administrador acessa dashboard gerencial.
2. Analisa indicadores de total, pendências, produtividade e tipos de serviço.
3. Acessa relatórios.
4. Aplica filtros por período, status, tipo, prioridade ou técnico.
5. Visualiza relatório paginado.
6. Opcionalmente exporta relatório.
7. Acessa gestão de usuários.
8. Cria, edita, inativa ou reativa usuários.

### Pontos de decisão

- Exportações pesadas podem ser limitadas por volume em formatos específicos.
- O sistema não permite inativar o próprio usuário.
- O sistema não permite remover o último administrador ativo.

### Evento final

Administrador obtém visão gerencial da operação e mantém o controle de acessos.

## 10. Processo de evidência com geolocalização

### Participantes

- técnico responsável;
- navegador ou dispositivo;
- sistema.

### Evento inicial

Necessidade de anexar evidência à OS.

### Atividades principais

1. Técnico seleciona o arquivo.
2. Técnico define o tipo do anexo.
3. Técnico escolhe se deseja incluir geolocalização.
4. Navegador solicita permissão de localização.
5. Se permitido, a localização é capturada.
6. Técnico envia a evidência.
7. Sistema grava o arquivo e os metadados.

### Pontos de decisão

- Geolocalização é opcional.
- Se a captura falhar, o anexo ainda pode ser enviado sem coordenadas.
- O endereço operacional da OS continua sendo referência principal da ordem.

### Evento final

Evidência registrada e disponível no detalhe da OS.

