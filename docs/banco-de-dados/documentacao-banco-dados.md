# Documentação do Banco de Dados

## 1. Visão geral

O TechOS Flow utiliza PostgreSQL como banco relacional principal. O modelo atual foi construído com foco em:

- rastreabilidade das ordens de serviço;
- separação entre usuários, endereços, ordens, execuções, equipe de execução e anexos;
- suporte ao cálculo de horas extras por funcionário;
- uso de UUID nas entidades centrais;
- integridade referencial por chaves estrangeiras;
- suporte a consultas por status, prioridade, responsável e período.

## 2. Entidades principais

| Entidade | Finalidade |
| --- | --- |
| `users` | cadastro de usuários e perfis de acesso |
| `enderecos` | endereço operacional associado à OS |
| `ordem_servicos` | núcleo do domínio de atendimento e execução |
| `execucoes` | histórico de execução técnica |
| `execucao_funcionarios` | equipe participante da execução e base para horas extras |
| `anexos` | evidências e arquivos vinculados à OS |
| `feriados` | calendário de feriados nacionais, estaduais e municipais |
| `personal_access_tokens` | tokens de autenticação Sanctum |
| `password_reset_tokens` | base para recuperação de senha por token |
| `sessions` | sessões do Laravel quando o driver em banco é usado |

## 3. Dicionário de dados

### 3.1 Tabela `users`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador do usuário |
| `name` | string | - | Sim | nome do usuário |
| `email` | string | Unique | Sim | e-mail de acesso |
| `email_verified_at` | timestamp | - | Não | verificação de e-mail |
| `password` | string | - | Sim | hash da senha |
| `role` | string | - | Sim | perfil: administrador, tecnico, atendente |
| `is_active` | boolean | - | Sim | indica se o acesso está ativo |
| `must_change_password` | boolean | - | Sim | exige troca de senha no primeiro acesso ou reset |
| `valor_hora` | decimal(10,2) | - | Não | valor-hora usado na estimativa financeira de horas extras |
| `remember_token` | string | - | Não | token do recurso remember me |
| `created_at` | timestamp | - | Sim | data de criação |
| `updated_at` | timestamp | - | Sim | data de atualização |

### 3.2 Tabela `enderecos`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador do endereço |
| `rua` | string(200) | - | Sim | logradouro principal |
| `numero` | string(10) | - | Não | número do imóvel |
| `complemento` | string(255) | - | Não | complemento |
| `bairro` | string(120) | - | Sim | bairro |
| `cidade` | string(120) | - | Sim | cidade |
| `estado` | string(2) | - | Sim | UF |
| `cep` | string(8) | - | Sim | CEP sem máscara |
| `latitude` | decimal(9,6) | - | Não | coordenada opcional |
| `longitude` | decimal(9,6) | - | Não | coordenada opcional |
| `created_at` | timestamp | - | Sim | data de criação |
| `updated_at` | timestamp | - | Sim | data de atualização |

### 3.3 Tabela `ordem_servicos`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador da OS |
| `numero` | string | Unique | Sim | número no padrão `AAAA-NNNNNN` |
| `tipo` | string | - | Sim | tipo da OS |
| `nome_cliente` | string | - | Não | nome do cliente ou referência |
| `status` | enum | - | Sim | aberta, em_execucao, finalizada, nao_executada, cancelada |
| `prioridade` | smallInteger | - | Sim | 1 alta, 2 média, 3 baixa |
| `data_abertura` | timestamp | - | Sim | abertura da OS |
| `data_encerramento` | timestamp | - | Não | encerramento da OS |
| `descricao` | text | - | Sim | descrição do atendimento |
| `observacoes` | text | - | Não | observações internas |
| `motivo_nao_execucao` | text | - | Não | motivo do encerramento sem execução |
| `endereco_id` | UUID | FK | Sim | referência ao endereço |
| `criada_por_id` | UUID | FK | Sim | usuário criador |
| `tecnico_responsavel_id` | UUID | FK | Não | técnico responsável |
| `created_at` | timestamp | - | Sim | criação |
| `updated_at` | timestamp | - | Sim | atualização |

### 3.4 Tabela `execucoes`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador da execução |
| `os_id` | UUID | FK | Sim | ordem de serviço vinculada |
| `tecnico_id` | UUID | FK | Sim | técnico executor responsável pelo fluxo |
| `data_inicio` | timestamp | - | Sim | início da execução |
| `data_fim` | timestamp | - | Não | fim da execução |
| `observacao` | text | - | Não | observação técnica |
| `created_at` | timestamp | - | Sim | criação |
| `updated_at` | timestamp | - | Sim | atualização |

### 3.5 Tabela `execucao_funcionarios`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador do vínculo de equipe |
| `execucao_id` | UUID | FK | Sim | execução vinculada |
| `funcionario_id` | UUID | FK | Sim | usuário participante da execução |
| `data_inicio` | timestamp | - | Sim | início individual considerado no cálculo |
| `data_fim` | timestamp | - | Sim | fim individual considerado no cálculo |
| `minutos_trabalhados` | integer | - | Sim | total bruto de minutos trabalhados |
| `minutos_normais` | integer | - | Sim | minutos dentro da jornada normal |
| `minutos_extras_50` | integer | - | Sim | minutos com adicional de 50% |
| `minutos_extras_100` | integer | - | Sim | minutos com adicional de 100% |
| `created_at` | timestamp | - | Sim | criação |
| `updated_at` | timestamp | - | Sim | atualização |

### 3.6 Tabela `anexos`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador do anexo |
| `os_id` | UUID | FK | Sim | OS vinculada |
| `caminho` | string(300) | - | Sim | caminho interno do arquivo |
| `tipo` | string(50) | - | Sim | foto, pdf ou arquivo |
| `latitude` | decimal(10,7) | - | Não | coordenada da evidência |
| `longitude` | decimal(10,7) | - | Não | coordenada da evidência |
| `precisao_metros` | decimal(8,2) | - | Não | precisão informada pela captura |
| `geolocalizacao_capturada_em` | timestamp | - | Não | data/hora da captura |
| `endereco_capturado` | text | - | Não | endereço informado no envio |
| `submetido_por_id` | UUID | FK | Sim | usuário que enviou o anexo |
| `criado_em` | timestamp | - | Sim | carimbo funcional de criação |
| `created_at` | timestamp | - | Sim | criação técnica |
| `updated_at` | timestamp | - | Sim | atualização |

### 3.7 Tabela `feriados`

| Coluna | Tipo | Chave | Obrigatório | Descrição |
| --- | --- | --- | --- | --- |
| `id` | UUID | PK | Sim | identificador do feriado |
| `nome` | string(150) | - | Sim | nome do feriado |
| `data` | date | - | Sim | data do feriado |
| `escopo` | enum | - | Sim | nacional, estadual ou municipal |
| `estado` | string(2) | - | Não | UF quando o escopo exigir |
| `municipio` | string(120) | - | Não | município quando o escopo exigir |
| `ativo` | boolean | - | Sim | indica se o feriado participa do cálculo |
| `created_at` | timestamp | - | Sim | criação |
| `updated_at` | timestamp | - | Sim | atualização |

### 3.8 Tabelas auxiliares

#### `password_reset_tokens`

- `email` (PK)
- `token`
- `created_at`

#### `sessions`

- `id` (PK)
- `user_id` (UUID indexado)
- `ip_address`
- `user_agent`
- `payload`
- `last_activity`

#### `personal_access_tokens`

Tabela padrão do Sanctum para gestão de tokens pessoais.

## 4. Chaves estrangeiras

| Origem | Destino | Regra |
| --- | --- | --- |
| `ordem_servicos.endereco_id` | `enderecos.id` | `cascadeOnDelete` |
| `ordem_servicos.criada_por_id` | `users.id` | referência simples |
| `ordem_servicos.tecnico_responsavel_id` | `users.id` | `nullOnDelete` |
| `execucoes.os_id` | `ordem_servicos.id` | `cascadeOnDelete` |
| `execucoes.tecnico_id` | `users.id` | referência simples |
| `execucao_funcionarios.execucao_id` | `execucoes.id` | `cascadeOnDelete` |
| `execucao_funcionarios.funcionario_id` | `users.id` | referência simples |
| `anexos.os_id` | `ordem_servicos.id` | `cascadeOnDelete` |
| `anexos.submetido_por_id` | `users.id` | referência simples |

## 5. Índices relevantes

### `ordem_servicos`

- `numero` único
- índice composto em `status`, `tipo`, `data_abertura`
- índice em `endereco_id`
- índice em `criada_por_id`
- índice em `tecnico_responsavel_id`
- índice em `prioridade`
- índice em `data_abertura`
- índice composto em `status`, `data_abertura`
- índice composto em `tecnico_responsavel_id`, `status`, `data_abertura`

### `execucoes`

- índice composto em `os_id`, `tecnico_id`

### `execucao_funcionarios`

- índice único em `execucao_id`, `funcionario_id`
- índice composto em `funcionario_id`, `data_inicio`

### `anexos`

- índice composto em `os_id`, `tipo`

### `users`

- índice composto em `role`, `is_active`

### `feriados`

- índice composto em `data`, `ativo`
- índice composto em `escopo`, `estado`, `municipio`

## 6. Relacionamentos principais

- um usuário pode criar muitas ordens de serviço;
- um usuário pode ser responsável por muitas ordens;
- uma ordem possui um endereço;
- uma ordem pode ter muitas execuções;
- uma execução pode ter muitos funcionários participantes;
- uma ordem pode ter muitos anexos;
- um anexo pertence a uma ordem e a um usuário remetente.

## 7. Domínios de campos

### 7.1 `users.role`

- `administrador`
- `tecnico`
- `atendente`

### 7.2 `ordem_servicos.status`

- `aberta`
- `em_execucao`
- `finalizada`
- `nao_executada`
- `cancelada`

### 7.3 `ordem_servicos.prioridade`

- `1` = alta
- `2` = média
- `3` = baixa

### 7.4 `anexos.tipo`

- `foto`
- `pdf`
- `arquivo`

### 7.5 `feriados.escopo`

- `nacional`
- `estadual`
- `municipal`

## 8. Observações de modelagem

- o endereço operacional da OS é persistido separadamente da evidência;
- a geolocalização da evidência é opcional e complementar;
- a equipe da execução é explicitamente persistida para cálculo individual de jornada;
- o uso de UUID exige atenção em integrações e seeds, mas reduz acoplamento com sequências numéricas;
- o storage de anexos ainda depende do disco local privado da aplicação no estado atual do projeto.
