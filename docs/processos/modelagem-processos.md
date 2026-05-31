# Modelagem de Processos do Sistema

## 1. Objetivo

Descrever os processos principais do `TechOS Flow` em formato textual estruturado, servindo como base para BPMN, fluxogramas e artefatos do TCC.

## 2. Convenção textual

Cada processo é descrito com:

- participantes;
- evento inicial;
- atividades principais;
- decisões;
- evento final.

## 3. Processo de abertura de OS

### Participantes

- atendente;
- técnico;
- sistema.

### Evento inicial

Necessidade de registrar uma ordem de serviço.

### Atividades principais

1. O usuário autenticado acessa a área de criação.
2. O sistema identifica o perfil.
3. O atendente preenche OS geral ou o técnico preenche OS ETA/ETE.
4. O sistema valida os campos obrigatórios.
5. O sistema gera número único da OS.
6. O sistema persiste endereço, descrição e vínculos.
7. A OS é gravada com status `aberta`.

### Decisões

- se o usuário for `tecnico`, o fluxo permitido é o de OS técnica;
- se houver falha de validação, o processo retorna ao formulário;
- se houver conflito na sequência da numeração, o backend repete a geração.

### Evento final

OS criada e disponível para consulta.

## 4. Processo de aceite e início de execução

### Participantes

- técnico;
- sistema.

### Evento inicial

Existência de OS aberta e sem responsável.

### Atividades principais

1. O técnico consulta ordens disponíveis.
2. Seleciona a OS.
3. Aciona o aceite.
4. O sistema verifica status e ausência de responsável técnico.
5. O sistema vincula o técnico responsável.
6. O técnico aciona `Iniciar execução`.
7. O sistema cria uma execução aberta.
8. O status da OS muda para `em_execucao`.

### Decisões

- se a OS já estiver atribuída, o aceite é negado;
- se a OS não estiver `aberta`, o aceite é negado;
- se já existir execução aberta, o início é bloqueado.

### Evento final

Execução aberta e OS em andamento.

## 5. Processo de finalização com equipe e horas extras

### Participantes

- técnico responsável;
- colaboradores/usuários da equipe;
- sistema.

### Evento inicial

OS em `em_execucao`.

### Atividades principais

1. O técnico acessa a OS.
2. Informa observação final, se necessário.
3. Informa participantes da equipe.
4. Registra intervalos individuais de início e fim.
5. Aciona a finalização.
6. O sistema encerra a execução.
7. O sistema muda a OS para `finalizada`.
8. O sistema calcula horas normais, extras 50%, extras 100% e banco de folgas por participante.

### Decisões

- se a OS não estiver em execução, o encerramento é bloqueado;
- se a equipe estiver inconsistente, a finalização é rejeitada;
- se o período individual atravessar a meia-noite, o cálculo é segmentado por dia.

### Evento final

OS finalizada e horas extras apuradas.

## 6. Processo de não execução

### Participantes

- técnico responsável;
- sistema.

### Evento inicial

Impossibilidade de concluir a OS.

### Atividades principais

1. O técnico aciona `Não executada`.
2. Informa o motivo.
3. O sistema valida o estado e o vínculo do técnico.
4. O sistema registra o motivo.
5. O status da OS muda para `nao_executada`.
6. O sistema registra `data_encerramento`.

### Decisões

- se o motivo não for informado, o encerramento é bloqueado;
- se a OS já estiver encerrada, a ação é negada.

### Evento final

OS encerrada como não executada.

## 7. Processo de envio de evidência com geolocalização

### Participantes

- técnico responsável;
- navegador/smartphone;
- sistema;
- serviço de geolocalização reversa.

### Evento inicial

Necessidade de anexar foto ou evidência à OS.

### Atividades principais

1. O técnico seleciona o arquivo.
2. Opcionalmente aciona a captura de localização.
3. O navegador solicita permissão de geolocalização.
4. O sistema obtém coordenadas e precisão.
5. O sistema tenta identificar rua, bairro, cidade e estado.
6. O técnico confirma o envio.
7. O backend valida arquivo e metadados.
8. O anexo é gravado em storage privado.

### Decisões

- se a localização falhar, a evidência pode seguir sem geolocalização, conforme o fluxo permitido;
- em smartphone, a captura confiável depende de `HTTPS`;
- o endereço capturado da evidência não substitui o endereço cadastral da OS.

### Evento final

Anexo persistido com ou sem geolocalização.

## 8. Processo de recuperação de senha

### Participantes

- usuário;
- sistema;
- serviço de e-mail.

### Evento inicial

Usuário esqueceu a senha.

### Atividades principais

1. O usuário acessa `Esqueci minha senha`.
2. Informa o e-mail cadastrado.
3. O sistema gera token temporário.
4. O sistema envia link de redefinição por e-mail.
5. O usuário acessa o link.
6. Informa nova senha e confirmação.
7. O sistema valida a política de senha.
8. O sistema redefine a credencial.

### Decisões

- se o e-mail não existir ou estiver inativo, a resposta pública continua neutra;
- se o token estiver inválido ou expirado, a redefinição é rejeitada.

### Evento final

Senha redefinida com sucesso.

## 9. Processo administrativo de relatórios

### Participantes

- administrador;
- sistema.

### Evento inicial

Necessidade de acompanhar contexto operacional, produtividade ou horas extras.

### Atividades principais

1. O administrador acessa a área de relatórios.
2. Define filtros.
3. O sistema consulta dados agregados.
4. O administrador visualiza resumo, gargalos e resultados.
5. Opcionalmente exporta em PDF, Excel ou CSV.

### Decisões

- o PDF detalhado da OS é restrito ao administrador;
- Excel e CSV são acessados por menu de exportação em planilha;
- relatórios podem restringir exportações em caso de volume excessivo, conforme regras do backend.

### Evento final

Relatório consultado ou exportado.
