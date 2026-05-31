# Manual do Usuário — Técnico

## 1. Objetivo do perfil

O técnico atua no fluxo operacional das ordens de serviço. Ele pode criar OS técnicas, aceitar ordens disponíveis, iniciar execução, finalizar, marcar não execução e anexar evidências.

## 2. Acesso ao sistema

1. Informe e-mail e senha no login.
2. Após autenticação, o sistema direciona o perfil para o painel do técnico.
3. Se houver troca obrigatória de senha, conclua o primeiro acesso antes de continuar.
4. Se necessário, use `Esqueci minha senha` para receber o link de redefinição.

## 3. Navegação principal

No painel do técnico existem duas áreas principais:

- `Criar OS`
- `Consultar OS`

No smartphone, a navegação também pode aparecer em formato mais compacto, com foco em consulta e ações operacionais.

## 4. Funcionalidades disponíveis

### 4.1 Criar OS técnica ETA/ETE

O formulário permite registrar:

- data e hora de abertura;
- prioridade;
- unidade;
- local operacional;
- setor;
- encarregado;
- tipo de manutenção;
- serviço;
- equipamento;
- diagnóstico;
- procedimento;
- materiais e observações.

### 4.2 Consultar ordens

O painel mostra grupos como:

- OS disponíveis;
- minhas OS;
- em execução;
- concluídas.

Também é possível pesquisar por número, cliente, tipo, status ou responsável.

No mobile, a consulta operacional prioriza cards e blocos verticais para evitar rolagem horizontal e manter foco nas ações principais.

### 4.3 Aceitar OS

O técnico pode aceitar uma OS quando:

- ela estiver `aberta`;
- não houver responsável técnico definido.

### 4.4 Iniciar execução

Permitido apenas na OS sob responsabilidade do próprio técnico.

### 4.5 Finalizar execução

Na finalização, o técnico pode:

- registrar observação final;
- informar equipe participante;
- incluir usuários e colaboradores operacionais;
- ajustar data e hora individual por participante, inclusive quando o período atravessa a meia-noite.

Esses dados alimentam o cálculo administrativo de horas extras.

No smartphone, o bloco de equipe da execução aparece em cartões por participante, com campos empilhados de início, fim e ações.

### 4.6 Marcar OS como não executada

Exige preenchimento do motivo.

### 4.7 Anexar evidências

O técnico pode:

- selecionar o tipo do anexo;
- enviar foto ou arquivo;
- selecionar uma ou várias fotos no mesmo envio;
- capturar geolocalização;
- acompanhar latitude, longitude, precisão e endereço capturado quando disponível.

As evidências podem aproveitar:

- uma geolocalização precisa, quando o aparelho atinge a meta de precisão;
- ou a melhor localização disponível, quando não é possível chegar a 100 metros.

Observações importantes:

- a geolocalização funciona melhor em smartphone com `HTTPS` e permissão de localização ativa;
- a localização da evidência é diferente do endereço cadastral da OS;
- quando várias fotos são selecionadas no mesmo envio, a geolocalização capturada pode ser aplicada a todas elas naquele lote.

### 4.8 Visualização de miniaturas no detalhe da OS

Nos detalhes da OS, o técnico pode:

- visualizar miniaturas das fotos já anexadas;
- abrir a imagem completa;
- consultar os dados da geolocalização capturada.

## 5. Ações permitidas

- criar OS técnica ETA/ETE;
- aceitar OS;
- iniciar execução;
- finalizar execução;
- marcar OS como não executada;
- anexar evidências;
- consultar ordens e detalhes.

## 6. Ações não permitidas

- criar OS geral;
- operar OS de outro técnico;
- acessar relatórios administrativos;
- consultar relatório de horas extras;
- emitir PDF detalhado da OS;
- gerenciar usuários;
- gerenciar colaboradores operacionais.

## 7. Erros comuns

| Situação | Causa provável | Como resolver |
| --- | --- | --- |
| OS atribuída a outro técnico | a ordem já foi aceita | consultar outra OS ou procurar o responsável |
| A OS precisa ser aceita antes da ação | ausência de responsável técnico | aceitar a OS primeiro |
| Já existe execução em andamento | tentativa de abrir segunda execução | revisar o histórico da OS |
| Falha ao anexar evidência | arquivo inválido ou sem permissão | verificar tipo, tamanho e vínculo com a OS |
| Geolocalização indisponível | permissão negada, GPS fraco ou falta de HTTPS | permitir localização, testar em área aberta e validar ambiente |

## 8. Boas práticas

- aceitar apenas as OS que realmente serão executadas;
- preencher observações com contexto útil para o histórico;
- registrar corretamente os participantes da execução;
- anexar evidências sempre que possível;
- usar geolocalização quando houver benefício operacional claro.
