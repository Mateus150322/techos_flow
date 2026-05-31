# Documentação do Banco de Dados

## 1. Visão geral

O `TechOS Flow` utiliza `PostgreSQL` como banco relacional principal. O modelo foi estruturado para dar suporte a:

- rastreabilidade das ordens de serviço;
- separação entre usuários autenticáveis e colaboradores operacionais;
- histórico de execução e equipe participante;
- evidências com geolocalização estruturada;
- cálculos de horas extras e banco de folgas;
- autenticação, sessão e recuperação de senha.

## 2. Entidades principais

| Entidade | Finalidade |
| --- | --- |
| `users` | usuários autenticáveis do sistema |
| `enderecos` | endereço cadastral/operacional associado à OS |
| `ordem_servicos` | núcleo do domínio de atendimento |
| `execucoes` | histórico de execução técnica |
| `execucao_funcionarios` | equipe participante da execução e base para horas extras |
| `colaboradores_operacionais` | participantes sem login usados em execução e horas extras |
| `anexos` | evidências e arquivos vinculados à OS |
| `feriados` | calendário para cálculo de horas extras |
| `password_reset_tokens` | recuperação de senha |
| `personal_access_tokens` | autenticação via Sanctum |
| `sessions` | sessões do Laravel quando armazenadas em banco |

## 3. Tabelas de negócio

### 3.1 `users`

Principais campos:

- `id` (UUID, PK)
- `name`
- `email`
- `password`
- `role` (`administrador`, `tecnico`, `atendente`)
- `is_active`
- `must_change_password`
- `valor_hora`
- `created_at`
- `updated_at`

### 3.2 `enderecos`

Principais campos:

- `id` (UUID, PK)
- `rua`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `estado`
- `cep`
- `latitude`
- `longitude`

### 3.3 `ordem_servicos`

Principais campos:

- `id` (UUID, PK)
- `numero` (único)
- `tipo`
- `nome_cliente`
- `status`
- `prioridade`
- `data_abertura`
- `data_encerramento`
- `descricao`
- `observacoes`
- `motivo_nao_execucao`
- `endereco_id` (FK)
- `criada_por_id` (FK)
- `tecnico_responsavel_id` (FK, nullable)

### 3.4 `execucoes`

Principais campos:

- `id` (UUID, PK)
- `os_id` (FK)
- `tecnico_id` (FK)
- `data_inicio`
- `data_fim`
- `observacao`

### 3.5 `execucao_funcionarios`

Tabela de equipe da execução.

Principais campos:

- `id` (UUID, PK)
- `execucao_id` (FK)
- `funcionario_id` (FK, nullable)
- `colaborador_operacional_id` (FK, nullable)
- `data_inicio`
- `data_fim`
- `minutos_trabalhados`
- `minutos_normais`
- `minutos_extras_50`
- `minutos_extras_100`

Regra importante:

- cada registro representa um participante individual da execução;
- um participante pode ser um `user` ou um `colaborador_operacional`.

### 3.6 `colaboradores_operacionais`

Tabela usada para auxiliares e outros participantes sem login.

Principais campos:

- `id` (UUID, PK)
- `name`
- `funcao`
- `valor_hora`
- `is_active`
- `created_at`
- `updated_at`

### 3.7 `anexos`

Principais campos:

- `id` (UUID, PK)
- `os_id` (FK)
- `caminho`
- `tipo`
- `latitude`
- `longitude`
- `precisao_metros`
- `geolocalizacao_capturada_em`
- `rua_capturada`
- `bairro_capturado`
- `cidade_capturada`
- `estado_capturado`
- `endereco_capturado`
- `submetido_por_id` (FK)
- `criado_em`

Observação:

- os campos `rua_capturada`, `bairro_capturado`, `cidade_capturada`, `estado_capturado` e `endereco_capturado` representam o contexto da evidência, não o endereço cadastral da OS.

### 3.8 `feriados`

Principais campos:

- `id` (UUID, PK)
- `nome`
- `data`
- `escopo`
- `estado`
- `municipio`
- `ativo`

## 4. Relacionamentos principais

- um `user` pode criar muitas `ordem_servicos`;
- uma `ordem_servico` possui um `endereco`;
- uma `ordem_servico` pode possuir um `tecnico_responsavel`;
- uma `ordem_servico` pode possuir muitas `execucoes`;
- uma `execucao` possui muitos registros em `execucao_funcionarios`;
- um registro em `execucao_funcionarios` referencia um `user` ou um `colaborador_operacional`;
- uma `ordem_servico` possui muitos `anexos`;
- um `anexo` pertence a um `user` remetente;
- `feriados` influenciam o cálculo das horas extras.

## 5. Chaves estrangeiras relevantes

| Origem | Destino | Observação |
| --- | --- | --- |
| `ordem_servicos.endereco_id` | `enderecos.id` | vínculo da OS ao endereço |
| `ordem_servicos.criada_por_id` | `users.id` | criador da OS |
| `ordem_servicos.tecnico_responsavel_id` | `users.id` | responsável técnico |
| `execucoes.os_id` | `ordem_servicos.id` | execução da OS |
| `execucoes.tecnico_id` | `users.id` | técnico que iniciou/operou a execução |
| `execucao_funcionarios.execucao_id` | `execucoes.id` | equipe da execução |
| `execucao_funcionarios.funcionario_id` | `users.id` | participante autenticável |
| `execucao_funcionarios.colaborador_operacional_id` | `colaboradores_operacionais.id` | participante sem login |
| `anexos.os_id` | `ordem_servicos.id` | anexo da OS |
| `anexos.submetido_por_id` | `users.id` | usuário que enviou a evidência |

## 6. Índices importantes

### `ordem_servicos`

- `numero` único;
- índices por `status`, `prioridade`, `data_abertura` e `tecnico_responsavel_id`;
- índice composto para consultas frequentes por status e data.

### `execucoes`

- índice por `os_id` e `tecnico_id`.

### `execucao_funcionarios`

- índice por `execucao_id`;
- índice por `funcionario_id` + `data_inicio`;
- índice por `colaborador_operacional_id` + `data_inicio`, quando aplicável.

### `anexos`

- índice por `os_id` e `tipo`.

### `users`

- índice por `role` e `is_active`.

### `colaboradores_operacionais`

- índice por `is_active` e `name`.

## 7. Observações de modelagem

- o projeto usa UUID nas entidades principais para reduzir acoplamento com sequências numéricas internas;
- o endereço da OS e o endereço capturado da evidência são conceitos distintos;
- colaboradores operacionais permitem cálculo de horas extras sem ampliar o conjunto de usuários autenticáveis;
- o relatório detalhado da OS e os relatórios administrativos dependem diretamente dessa separação entre OS, execução, equipe e anexos.
