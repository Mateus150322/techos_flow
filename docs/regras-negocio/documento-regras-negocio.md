# Documento de Regras de Negócio

## 1. Objetivo

Este documento descreve as regras de negócio que governam o comportamento do TechOS Flow no contexto de ordens de serviço, perfis de usuário, execução operacional, horas extras e rastreabilidade.

## 2. Regras de criação de ordem de serviço

### RN-OS-01

Toda ordem de serviço deve possuir:

- número único;
- tipo;
- prioridade;
- descrição;
- endereço associado;
- usuário criador.

### RN-OS-02

Ordens criadas por atendente são abertas como OS geral, com preenchimento manual de cliente, descrição, data e hora de abertura e endereço.

### RN-OS-03

Técnico não pode abrir OS geral. Quando o usuário autenticado possui perfil `tecnico`, somente é permitido criar OS do tipo `Manutenção ETA/ETE`.

### RN-OS-04

Ao criar a OS:

- `criada_por_id` deve receber o usuário autenticado;
- `tecnico_responsavel_id` deve permanecer nulo, exceto quando a OS for criada pelo próprio técnico no fluxo ETA/ETE;
- o status inicial da OS deve ser `aberta`.

### RN-OS-05

O número da OS deve ser gerado automaticamente no padrão `AAAA-NNNNNN`, com sequência por ano.

## 3. Regras de status

### 3.1 Estados válidos

- `aberta`
- `em_execucao`
- `finalizada`
- `nao_executada`
- `cancelada`

### 3.2 Transições válidas

| Estado atual | Ação | Próximo estado |
| --- | --- | --- |
| aberta | aceite pelo técnico | aberta |
| aberta | início de execução | em_execucao |
| aberta | marcar como não executada | nao_executada |
| em_execucao | finalizar execução | finalizada |
| em_execucao | marcar como não executada | nao_executada |

### 3.3 Transições inválidas

- não é permitido iniciar execução em OS `finalizada`, `cancelada` ou `nao_executada`;
- não é permitido finalizar execução se a OS não estiver `em_execucao`;
- não é permitido marcar como não executada uma OS já encerrada.

## 4. Regras de prioridade

O campo `prioridade` utiliza domínio numérico:

- `1` = Alta
- `2` = Média
- `3` = Baixa

### RN-PRIO-01

Toda OS deve possuir prioridade definida na abertura.

### RN-PRIO-02

Na abertura técnica ETA/ETE, a prioridade padrão atual é `2` (Média).

## 5. Regras por perfil de usuário

### 5.1 Atendente

Pode:

- autenticar-se no sistema;
- solicitar recuperação de senha;
- abrir OS geral;
- consultar OS e detalhes;
- acessar dashboard do atendente;
- emitir PDF detalhado de uma OS.

Não pode:

- aceitar OS;
- iniciar execução;
- finalizar execução;
- marcar OS como não executada;
- anexar evidências;
- acessar relatórios ou gestão de usuários.

### 5.2 Técnico

Pode:

- autenticar-se no sistema;
- solicitar recuperação de senha;
- abrir OS do tipo `Manutenção ETA/ETE`;
- consultar OS dentro do escopo permitido;
- aceitar OS aberta sem responsável;
- iniciar execução da OS sob sua responsabilidade;
- finalizar execução da OS sob sua responsabilidade;
- marcar OS como não executada;
- anexar evidências à OS sob sua responsabilidade;
- acessar dashboard do técnico.

Não pode:

- criar OS geral;
- executar ação operacional em OS atribuída a outro técnico;
- acessar telas administrativas;
- visualizar cálculos detalhados de horas extras.

### 5.3 Administrador

Pode:

- autenticar-se no sistema;
- solicitar recuperação de senha;
- consultar dashboards e indicadores;
- consultar relatórios e exportações;
- consultar relatório de horas extras;
- listar, criar, editar, inativar e reativar usuários;
- consultar ordens e detalhes.

Não deve:

- assumir o fluxo operacional do técnico;
- acessar dados além do necessário em relatórios amplos.

## 6. Regras de execução

### RN-EXE-01

Apenas o técnico responsável pela OS pode iniciar a execução.

### RN-EXE-02

A OS precisa ser aceita por um técnico antes das ações operacionais que exigem responsável.

### RN-EXE-03

Não pode existir mais de uma execução aberta simultânea para a mesma OS.

### RN-EXE-04

Ao iniciar a execução:

- deve ser criada uma execução em `execucoes`;
- `data_inicio` deve ser preenchida com a data e hora atual ou valor informado;
- o status da OS deve passar para `em_execucao` se ainda estiver `aberta`.

### RN-EXE-05

Ao finalizar:

- a execução deve ser encerrada com `data_fim`;
- a OS deve mudar para `finalizada`;
- `data_encerramento` da OS deve ser preenchida.

### RN-EXE-06

A equipe da execução deve ser formada por usuários com perfil `tecnico` ou `administrador`.

### RN-EXE-07

Um funcionário não pode ser incluído duas vezes na mesma execução.

## 7. Regras de encerramento

### RN-ENC-01

Uma OS pode ser encerrada por finalização regular ou por não execução.

### RN-ENC-02

Para marcar uma OS como não executada, é obrigatório informar o motivo.

### RN-ENC-03

Ao marcar como não executada:

- o status deve mudar para `nao_executada`;
- `motivo_nao_execucao` deve ser preenchido;
- `data_encerramento` deve ser registrada.

## 8. Regras de horas extras e banco de folgas

### RN-HE-01

Toda apuração é individual por funcionário participante da execução.

### RN-HE-02

Jornada normal considerada:

- `07:00 às 12:00`
- `14:00 às 17:00`

### RN-HE-03

Minutos fora da jornada normal em dias úteis contam como hora extra com adicional de 50%.

### RN-HE-04

Sábados, domingos e feriados contam como hora extra com adicional de 100%.

### RN-HE-05

O limite mensal remunerado é de 48 horas extras por funcionário.

### RN-HE-06

Horas acima de 48 no mês não entram no pagamento e passam a compor banco de folgas.

### RN-HE-07

A cada 8 horas excedentes, deve ser gerado 1 dia de folga.

### RN-HE-08

Os cálculos detalhados de horas extras são visíveis apenas ao perfil `administrador`.

## 9. Regras de evidências e anexos

### RN-ANX-01

Somente o técnico responsável pode anexar evidências em uma OS sob sua responsabilidade.

### RN-ANX-02

Os formatos aceitos atualmente são:

- imagem (`jpg`, `jpeg`, `png`)
- `pdf`
- documentos e planilhas (`doc`, `docx`, `xls`, `xlsx`, `csv`, `txt`)

### RN-ANX-03

O tamanho máximo por arquivo é 5 MB.

### RN-ANX-04

Os anexos são armazenados em área privada, sem exposição direta por URL pública.

### RN-ANX-05

O acesso ao conteúdo do anexo deve passar por autenticação e autorização.

## 10. Regras de geolocalização

### RN-GEO-01

A geolocalização da evidência é opcional.

### RN-GEO-02

Quando informada, a evidência pode registrar:

- latitude;
- longitude;
- precisão em metros;
- data e hora da captura;
- endereço de referência informado no cliente.

### RN-GEO-03

A geolocalização não substitui o endereço cadastrado da OS; ela funciona como evidência complementar da execução.

### RN-GEO-04

O endereço principal exibido na OS deve priorizar:

- rua;
- bairro;
- cidade;
- estado.

## 11. Regras de autenticação e recuperação de senha

### RN-AUT-01

Usuário inativo não deve acessar o sistema.

### RN-AUT-02

Usuário com troca obrigatória de senha pendente não deve acessar funcionalidades regulares antes da atualização da credencial.

### RN-AUT-03

O login público deve possuir limitação de tentativas para reduzir brute force.

### RN-AUT-04

O reset de senha deve ocorrer apenas por token temporário enviado ao e-mail do usuário.

## 12. Regras de auditoria e rastreabilidade

### RN-AUD-01

Toda OS deve manter vínculo com o usuário criador.

### RN-AUD-02

Toda execução deve manter vínculo com o técnico executor.

### RN-AUD-03

Todo anexo deve manter vínculo com a OS e com o usuário que enviou a evidência.

### RN-AUD-04

Eventos de anexo devem gerar rastreabilidade mínima em log:

- upload;
- acesso autorizado;
- acesso negado.
