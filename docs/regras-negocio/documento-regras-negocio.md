# Documento de Regras de Negócio

## 1. Objetivo

Descrever as regras operacionais e administrativas que governam o comportamento do `TechOS Flow`.

## 2. Regras de criação da OS

### RN-OS-01

Toda ordem de serviço deve possuir:

- número único;
- tipo;
- prioridade;
- descrição;
- endereço associado;
- usuário criador.

### RN-OS-02

Ordens criadas por atendente seguem o fluxo de OS geral, com preenchimento de cliente, descrição, prioridade, data/hora e endereço.

### RN-OS-03

Usuário com perfil `tecnico` não pode criar OS geral. Para esse perfil, a criação permitida é a OS de `Manutenção ETA/ETE`.

### RN-OS-04

Na OS técnica:

- o técnico informa unidade operacional e dados técnicos do serviço;
- a prioridade pode ser selecionada no momento da abertura;
- o endereço cadastral da OS não substitui a geolocalização das evidências.

### RN-OS-05

O número da OS deve seguir o padrão `AAAA-NNNNNN`, com sequência por ano.

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
| aberta | iniciar execução | em_execucao |
| aberta | marcar não executada | nao_executada |
| em_execucao | finalizar execução | finalizada |
| em_execucao | marcar não executada | nao_executada |

### 3.3 Restrições

- não é permitido iniciar execução em OS encerrada;
- não é permitido finalizar OS fora de `em_execucao`;
- não é permitido marcar como não executada uma OS já encerrada.

## 4. Regras de prioridade

O domínio de prioridade é:

- `1` = Alta
- `2` = Média
- `3` = Baixa

### RN-PRIO-01

Toda OS deve possuir prioridade definida.

### RN-PRIO-02

Na OS técnica ETA/ETE, a prioridade pode ser escolhida pelo usuário durante a abertura.

## 5. Regras por perfil

### 5.1 Atendente

Pode:

- autenticar-se;
- recuperar a senha;
- criar OS geral;
- consultar OS e detalhes;
- acessar dashboard do atendente.

Não pode:

- aceitar OS;
- iniciar ou finalizar execução;
- marcar OS como não executada;
- anexar evidências;
- acessar relatórios administrativos;
- emitir PDF detalhado da OS;
- gerenciar usuários ou colaboradores.

### 5.2 Técnico

Pode:

- autenticar-se;
- recuperar a senha;
- criar OS técnica ETA/ETE;
- consultar OS no escopo permitido;
- aceitar OS aberta sem responsável;
- iniciar e finalizar execução da própria OS;
- marcar a própria OS como não executada;
- anexar evidências na própria OS;
- acessar dashboard do técnico.

Não pode:

- criar OS geral;
- operar OS atribuída a outro técnico;
- consultar relatórios administrativos;
- emitir PDF detalhado da OS;
- gerenciar usuários ou colaboradores operacionais.

### 5.3 Administrador

Pode:

- autenticar-se;
- recuperar a senha;
- consultar dashboards;
- consultar e exportar relatórios;
- emitir PDF detalhado da OS;
- consultar horas extras;
- gerenciar usuários;
- gerenciar colaboradores operacionais;
- consultar ordens e detalhes.

Não deve:

- usar o sistema administrativo para substituir o fluxo técnico normal quando isso quebrar a rastreabilidade operacional;
- ampliar exposição de dados além do necessário em relatórios.

## 6. Regras de aceite e execução

### RN-EXE-01

Apenas o técnico responsável pela OS pode iniciar execução.

### RN-EXE-02

A OS precisa estar aceita por um técnico antes das ações operacionais que exigem responsável.

### RN-EXE-03

Não pode existir mais de uma execução aberta simultânea para a mesma OS.

### RN-EXE-04

Ao iniciar a execução:

- deve ser criada uma execução;
- `data_inicio` deve ser registrada;
- o status da OS deve mudar para `em_execucao`.

### RN-EXE-05

Ao finalizar a execução:

- `data_fim` da execução deve ser registrada;
- a OS deve mudar para `finalizada`;
- `data_encerramento` deve ser preenchida;
- os participantes da equipe devem ser registrados para cálculo de horas extras.

### RN-EXE-06

A equipe da execução pode ser composta por:

- usuários autenticáveis com papel operacional elegível;
- colaboradores operacionais sem login.

### RN-EXE-07

O mesmo participante não pode ser lançado duas vezes na mesma execução.

## 7. Regras de não execução

### RN-ENC-01

Uma OS pode ser encerrada como `nao_executada` quando a conclusão não for possível.

### RN-ENC-02

É obrigatório informar motivo de não execução.

### RN-ENC-03

Ao marcar como não executada:

- o status deve mudar para `nao_executada`;
- o motivo deve ser persistido;
- `data_encerramento` deve ser registrada.

## 8. Regras de horas extras e banco de folgas

### RN-HE-01

Toda apuração é individual por participante da execução.

### RN-HE-02

A jornada normal considerada é:

- `07:00 às 12:00`
- `14:00 às 17:00`

### RN-HE-03

Minutos fora da jornada normal, em dias úteis, contam como extra `50%`.

### RN-HE-04

Sábados, domingos e feriados contam como extra `100%`.

### RN-HE-05

O sistema deve respeitar períodos individuais por participante, inclusive quando o intervalo atravessar a meia-noite.

### RN-HE-06

O limite mensal remunerado é de `48 horas extras` por participante.

### RN-HE-07

Horas acima do limite remunerado passam a compor banco de folgas.

### RN-HE-08

Os cálculos detalhados de horas extras são visíveis apenas ao administrador.

## 9. Regras de evidências e anexos

### RN-ANX-01

Somente o técnico responsável pode anexar evidências na OS sob sua responsabilidade.

### RN-ANX-02

Os formatos aceitos incluem:

- imagens (`jpg`, `jpeg`, `png`);
- `pdf`;
- documentos e planilhas (`doc`, `docx`, `xls`, `xlsx`, `csv`, `txt`).

### RN-ANX-03

O tamanho máximo atual por arquivo é `5 MB`.

### RN-ANX-04

Os anexos devem permanecer em armazenamento privado, sem URL pública direta.

### RN-ANX-05

O acesso ao conteúdo do anexo depende de autenticação e autorização.

### RN-ANX-06

Quando a geolocalização for capturada, o sistema pode armazenar:

- latitude;
- longitude;
- precisão em metros;
- data/hora da captura;
- rua;
- bairro;
- cidade;
- estado;
- endereço capturado consolidado.

### RN-ANX-07

A geolocalização da evidência não substitui o endereço cadastral da OS.

## 10. Regras de relatórios

### RN-REL-01

Relatórios administrativos são restritos ao perfil `administrador`.

### RN-REL-02

O PDF detalhado da OS é restrito ao perfil `administrador`.

### RN-REL-03

Na interface, a exportação em planilha deve agrupar `Excel` e `CSV` em menu específico, mantendo `PDF` como ação separada.
