# Casos de Teste

## 1. Legenda

- `Automatizado`: coberto por teste automatizado.
- `Manual`: depende de execução prática do usuário/testador.
- `Planejado`: ainda não coberto formalmente.

## 2. Casos principais

| ID | Objetivo | Pré-condição | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| CT-AUT-01 | Autenticar usuário válido | usuário ativo cadastrado | token e dados do usuário retornados | Automatizado |
| CT-AUT-02 | Bloquear usuário inativo | usuário com `is_active=false` | resposta `403` | Automatizado/Manual |
| CT-AUT-03 | Exigir troca de senha no primeiro acesso | `must_change_password=true` | acesso normal bloqueado até troca | Automatizado |
| CT-AUT-04 | Solicitar recuperação de senha | e-mail válido cadastrado | resposta neutra e envio de link | Automatizado |
| CT-AUT-05 | Redefinir senha com token válido | token ativo | senha atualizada | Automatizado |
| CT-OS-01 | Criar OS geral | atendente autenticado | OS criada com status `aberta` | Manual recorrente |
| CT-OS-02 | Criar OS ETA/ETE com prioridade | técnico autenticado | OS técnica criada com prioridade escolhida | Manual recorrente |
| CT-OS-03 | Manter prioridade correta na OS geral | atendente autenticado | prioridade exibida no detalhe corresponde ao valor selecionado no formulário | Manual recorrente |
| CT-OS-04 | Consultar listagem paginada | base com ordens existentes | resultado paginado | Manual recorrente |
| CT-TEC-01 | Aceitar OS aberta sem responsável | técnico autenticado | responsável técnico gravado | Automatizado |
| CT-TEC-02 | Iniciar execução válida | OS aceita pelo técnico | execução criada e OS em `em_execucao` | Automatizado |
| CT-TEC-03 | Finalizar execução com equipe mista | OS em execução | execução encerrada e horas extras calculadas | Automatizado |
| CT-TEC-04 | Marcar OS como não executada | OS sob responsabilidade do técnico | OS encerrada com motivo | Automatizado |
| CT-TEC-05 | Impedir técnico de operar OS de outro técnico | OS atribuída a terceiro | resposta `403` | Automatizado |
| CT-ANX-01 | Enviar evidência válida | técnico responsável e arquivo válido | anexo criado | Automatizado |
| CT-ANX-02 | Enviar múltiplas fotos no mesmo fluxo | técnico responsável e seleção múltipla de imagens | uma evidência é criada para cada arquivo enviado | Manual recorrente |
| CT-ANX-03 | Gravar geolocalização estruturada | captura disponível | latitude, longitude e endereço capturado salvos | Automatizado/Manual |
| CT-ANX-04 | Aceitar melhor localização disponível | captura sem atingir 100 m | sistema registra a melhor posição encontrada quando ela existe | Manual recorrente |
| CT-ANX-05 | Exibir miniaturas dos anexos no detalhe da OS | OS com fotos enviadas | miniaturas visíveis para técnico e administrador | Manual recorrente |
| CT-ANX-06 | Negar acesso a anexo privado sem autorização | usuário sem vínculo com a OS | resposta `403` | Automatizado |
| CT-HE-01 | Calcular extra 50% em dia útil | execução fora da jornada | minutos extras 50% calculados | Automatizado |
| CT-HE-02 | Calcular extra 100% em fim de semana/feriado | execução no sábado/domingo/feriado | minutos extras 100% calculados | Automatizado |
| CT-HE-03 | Incluir colaborador operacional na apuração | execução com auxiliar sem login | colaborador aparece no relatório | Automatizado |
| CT-REL-01 | Consultar relatório administrativo | administrador autenticado | resumo e tabela retornados | Automatizado |
| CT-REL-02 | Exportar relatório em PDF | administrador autenticado | arquivo PDF gerado | Automatizado |
| CT-REL-03 | Exportar relatório em Excel | administrador autenticado | planilha gerada | Automatizado |
| CT-REL-04 | Exportar relatório em CSV | administrador autenticado | arquivo CSV gerado com colunas separadas por `;` | Automatizado/Manual |
| CT-REL-05 | Organizar relatório mensal de OS por bloco | administrador autenticado e período definido | cada OS aparece em bloco próprio com suas evidências fotográficas | Manual recorrente |
| CT-REL-06 | Exibir fotos com geolocalização no relatório de OS | OS com evidências fotográficas | PDF mostra as fotos vinculadas à OS e seus metadados principais | Manual recorrente |
| CT-PDF-01 | Bloquear PDF detalhado da OS para não admin | técnico ou atendente autenticado | resposta `403` | Automatizado |
| CT-USR-01 | Criar usuário | administrador autenticado | usuário criado | Automatizado |
| CT-USR-02 | Editar usuário | usuário existente | atualização persistida | Automatizado |
| CT-COL-01 | Criar colaborador operacional | administrador autenticado | colaborador criado | Automatizado |
| CT-COL-02 | Inativar colaborador operacional | colaborador existente | `is_active=false` | Automatizado |
| CT-REAL-01 | Validar login em domínio real | ambiente com `HTTPS` | sessão válida no domínio publicado | Planejado |
| CT-REAL-02 | Validar recuperação de senha em ambiente real | SMTP configurado | e-mail recebido e senha redefinida | Planejado |
| CT-REAL-03 | Validar evidência com geolocalização em smartphone | domínio com `HTTPS` | anexo persistido com geolocalização | Planejado |
| CT-REAL-04 | Validar persistência do anexo após reinício | storage persistente configurado | arquivo continua disponível | Planejado |
