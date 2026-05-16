# Manual do Usuário — Técnico

## 1. Objetivo do perfil

O técnico atua no fluxo operacional das ordens de serviço, podendo criar OS de `Manutenção ETA/ETE`, aceitar ordens disponíveis, executar, finalizar, marcar como não executada e anexar evidências.

## 2. Acesso ao sistema

1. Informe e-mail e senha no login.
2. Após autenticação, o perfil técnico é direcionado para `/tecnico`.
3. Se houver troca obrigatória de senha, conclua o primeiro acesso antes de continuar.
4. Se necessário, use `Esqueci minha senha` para receber um link de redefinição por e-mail.

## 3. Navegação principal

No painel do técnico existem duas áreas principais:

- `Criar OS`
- `Consultar OS`

No smartphone, o painel também pode exibir navegação inferior para facilitar a alternância entre as áreas.

## 4. Funcionalidades disponíveis

### 4.1 Criar OS de Manutenção ETA/ETE

O formulário técnico permite registrar:

- data e hora de abertura;
- unidade;
- local;
- setor requisitante;
- encarregado;
- tipo de manutenção;
- serviço;
- equipamento;
- diagnóstico;
- procedimento;
- material utilizado.

### 4.2 Consultar ordens

O painel do técnico exibe seções como:

- OS disponíveis;
- minhas OS;
- em execução;
- finalizadas.

Também é possível pesquisar por número, cliente, tipo, status ou responsável.

### 4.3 Aceitar OS

O técnico pode aceitar uma OS quando:

- ela estiver `aberta`;
- não houver responsável técnico definido.

### 4.4 Iniciar execução

Permitido apenas na OS sob responsabilidade do próprio técnico.

### 4.5 Finalizar execução

Permitido quando a OS estiver em `em_execucao` e houver execução aberta vinculada ao técnico.

Na finalização, o técnico pode:

- registrar observação final;
- informar equipe participante;
- ajustar data e hora individual de cada participante, quando necessário.

Esses dados alimentam o cálculo administrativo de horas extras, mas o resultado detalhado não é exibido ao perfil técnico.

### 4.6 Marcar OS como não executada

Exige preenchimento do motivo.

### 4.7 Anexar evidências

O técnico pode:

- selecionar o tipo do anexo;
- enviar arquivo suportado;
- incluir geolocalização;
- informar referência da localização;
- abrir o mapa da evidência quando houver coordenadas.

## 5. Ações permitidas

- criar OS ETA/ETE;
- aceitar OS;
- iniciar execução;
- finalizar execução;
- marcar como não executada;
- anexar evidências;
- consultar ordens e detalhes.

## 6. Ações não permitidas

- criar OS geral;
- operar em OS de outro técnico;
- acessar relatórios administrativos;
- acessar relatório de horas extras;
- gerenciar usuários.

## 7. Erros comuns

| Situação | Causa provável | Como resolver |
| --- | --- | --- |
| OS atribuída a outro técnico | a ordem já foi aceita | consultar outra OS ou procurar o responsável |
| A OS precisa ser aceita antes da ação | ausência de responsável técnico | aceitar a OS primeiro |
| Já existe uma execução em andamento | execução aberta duplicada | revisar o histórico da OS |
| Falha ao anexar evidência | arquivo inválido ou sem permissão | verificar tipo, tamanho e vínculo com a OS |
| Geolocalização indisponível | permissão do navegador negada ou GPS indisponível | permitir acesso à localização ou enviar sem geolocalização |

## 8. Boas práticas de uso

- aceitar apenas as OS que realmente serão executadas;
- registrar observações relevantes nas execuções;
- anexar evidências sempre que possível;
- revisar se a OS já está atribuída antes de tentar operar;
- usar geolocalização quando houver benefício operacional claro.
