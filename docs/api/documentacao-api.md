# Documentação da API

## 1. Visão geral

O `TechOS Flow` expõe uma API REST versionada em `/api/v1`. Ela é consumida pelo frontend React e concentra autenticação, regras operacionais, anexos, relatórios, horas extras e administração.

## 2. Base URL

### Desenvolvimento

- backend direto: `http://backend-flow.test/api/v1`
- frontend local com proxy do Vite: `http://techosflow.test:5173/api/v1`

### Produção

- `https://api.techosflow.com.br/api/v1`

## 3. Autenticação

- mecanismo: `Laravel Sanctum` com token Bearer;
- login público: `POST /login`;
- recuperação de senha:
  - `POST /esqueci-senha`
  - `POST /redefinir-senha`
- rotas protegidas exigem `Authorization: Bearer <token>`.

## 4. Headers principais

| Header | Uso |
| --- | --- |
| `Accept: application/json` | padronização de resposta |
| `Content-Type: application/json` | payload JSON |
| `Content-Type: multipart/form-data` | upload de anexo |
| `Authorization: Bearer <token>` | autenticação das rotas protegidas |

## 5. Regras de acesso por perfil

| Recurso | Atendente | Técnico | Administrador |
| --- | --- | --- | --- |
| Login, logout, me | Sim | Sim | Sim |
| Esqueci senha / redefinir senha | Sim | Sim | Sim |
| Alterar senha | Sim | Sim | Sim |
| Criar OS geral | Sim | Não | Não |
| Criar OS ETA/ETE | Não | Sim | Não no fluxo operacional padrão |
| Listar e consultar OS | Sim | Sim, com restrição de escopo | Sim |
| Aceitar OS | Não | Sim | Não |
| Iniciar execução | Não | Sim | Não |
| Finalizar execução | Não | Sim | Não |
| Marcar não executada | Não | Sim | Não |
| Enviar evidência | Não | Sim | Não |
| Dashboard do perfil | Sim | Sim | Sim |
| Funcionários elegíveis para equipe | Não | Sim | Sim |
| Relatórios administrativos | Não | Não | Sim |
| Relatório de horas extras | Não | Não | Sim |
| Gestão de usuários | Não | Não | Sim |
| Gestão de colaboradores operacionais | Não | Não | Sim |
| PDF detalhado da OS | Não | Não | Sim |

## 6. Endpoints principais

### 6.1 Saúde

- `GET /health`

### 6.2 Autenticação e senha

- `POST /login`
- `POST /logout`
- `GET /me`
- `POST /me/alterar-senha`
- `POST /esqueci-senha`
- `POST /redefinir-senha`

### 6.3 Dashboards

- `GET /dashboard/admin`
- `GET /dashboard/atendente`
- `GET /dashboard/tecnico`

### 6.4 Ordens de serviço

- `GET /ordens-servico`
- `GET /ordens-servico/resumo`
- `GET /ordens-servico/opcoes-filtro`
- `GET /ordens-servico/{id}`
- `POST /ordens-servico`
- `POST /ordens-servico/{id}/aceitar`
- `POST /ordens-servico/{id}/iniciar`
- `POST /ordens-servico/{id}/execucoes/finalizar`
- `POST /ordens-servico/{id}/nao-executada`
- `GET /ordens-servico/{id}/relatorio/pdf`

### 6.5 Anexos

- `POST /ordens-servico/{id}/anexos`
- `GET /anexos/{id}/arquivo`

### 6.6 Relatórios administrativos

- `GET /relatorios/ordens-servico`
- `GET /relatorios/ordens-servico/exportar/{format}`
- `GET /relatorios/horas-extras`
- `GET /relatorios/horas-extras/exportar/{format}`

Observações operacionais:

- o relatório de OS em PDF por período pode organizar as ordens em blocos individuais com suas evidências fotográficas;
- o formato `csv` foi ajustado para usar `;` como separador, visando melhor abertura no Excel em ambiente pt-BR.

### 6.7 Administração de pessoas

- `GET /usuarios`
- `GET /usuarios/{id}`
- `POST /usuarios`
- `PUT /usuarios/{id}`
- `GET /colaboradores-operacionais`
- `POST /colaboradores-operacionais`
- `PUT /colaboradores-operacionais/{id}`
- `GET /funcionarios`

## 7. Endpoints mais importantes por fluxo

### 7.1 Login

```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "admin@techosflow.com.br",
  "password": "Senha@123"
}
```

### 7.2 Solicitar recuperação de senha

```http
POST /api/v1/esqueci-senha
Content-Type: application/json

{
  "email": "admin@techosflow.com.br"
}
```

### 7.3 Redefinir senha

```http
POST /api/v1/redefinir-senha
Content-Type: application/json

{
  "email": "admin@techosflow.com.br",
  "token": "token-recebido-no-email",
  "password": "NovaSenha@123",
  "password_confirmation": "NovaSenha@123"
}
```

### 7.4 Criar OS geral

```http
POST /api/v1/ordens-servico
Authorization: Bearer <token>
Content-Type: application/json

{
  "tipo_servico": "manutencao",
  "nome_cliente": "João da Silva",
  "prioridade": 2,
  "descricao": "Verificar vazamento na ligação",
  "data_abertura": "2026-05-16T14:30:00-05:00",
  "endereco": {
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "",
    "bairro": "Centro",
    "cidade": "Rio Branco",
    "estado": "AC",
    "cep": "69900000"
  }
}
```

### 7.5 Finalizar execução

```http
POST /api/v1/ordens-servico/{id}/execucoes/finalizar
Authorization: Bearer <token>
Content-Type: application/json

{
  "execucao_id": "uuid-da-execucao",
  "data_fim": "2026-05-16T18:15:00-05:00",
  "observacao": "Execução concluída.",
  "funcionarios": [
    {
      "funcionario_id": "uuid-do-tecnico",
      "data_inicio": "2026-05-16T14:30:00-05:00",
      "data_fim": "2026-05-16T18:15:00-05:00"
    },
    {
      "colaborador_operacional_id": "uuid-do-auxiliar",
      "data_inicio": "2026-05-16T14:30:00-05:00",
      "data_fim": "2026-05-16T18:15:00-05:00"
    }
  ]
}
```

### 7.6 Enviar evidência com geolocalização

```http
POST /api/v1/ordens-servico/{id}/anexos
Authorization: Bearer <token>
Content-Type: multipart/form-data

arquivo=<binário>
tipo=foto
latitude=-9.97499
longitude=-67.82430
precisao_metros=12.5
geolocalizacao_capturada_em=2026-05-16T13:40:00Z
rua_capturada=Rua X
bairro_capturado=Bairro Y
cidade_capturada=Rio Branco
estado_capturado=Acre
endereco_capturado=Rua X, Bairro Y, Rio Branco - AC
```

### 7.7 Cadastrar colaborador operacional

```http
POST /api/v1/colaboradores-operacionais
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Auxiliar 01",
  "funcao": "Auxiliar técnico",
  "valor_hora": 11.82
}
```

## 8. Regras importantes da API

- o técnico só visualiza OS abertas sem responsável ou OS atribuídas a ele;
- o técnico só opera início, finalização, não execução e anexos na própria OS;
- o endpoint `/funcionarios` mistura usuários elegíveis e colaboradores operacionais ativos;
- o PDF detalhado da OS retorna `403` para não administradores;
- a resposta de recuperação de senha é neutra para reduzir vazamento de informação sobre contas.

## 9. Códigos de resposta esperados

| Código | Significado |
| --- | --- |
| `200` | operação concluída com sucesso |
| `201` | recurso criado |
| `204` | operação sem corpo de resposta |
| `401` | não autenticado |
| `403` | não autorizado |
| `404` | recurso inexistente |
| `409` | conflito de negócio |
| `422` | falha de validação |
| `429` | throttle/excesso de tentativas |

## 10. Especificação OpenAPI

O arquivo OpenAPI do projeto está disponível em:

- [openapi-techos-flow.yaml](c:/Users/VAIO/Documents/projetos/techos-flow/docs/api/openapi-techos-flow.yaml)
