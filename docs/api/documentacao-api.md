# Documentação da API

## 1. Visão geral

O TechOS Flow expõe uma API REST versionada em `/api/v1`, usada pelo frontend React e estruturada para autenticação, recuperação de senha, operação de ordens de serviço, relatórios, horas extras e administração.

## 2. Base URL

### Desenvolvimento

- acesso direto ao backend: `http://backend-flow.test/api/v1`
- acesso pelo frontend local com proxy do Vite: `http://techosflow.test:5173/api/v1`

### Produção

- `https://api.techosflow.com.br/api/v1` ou domínio equivalente definido no ambiente

## 3. Autenticação

- mecanismo: Laravel Sanctum com token Bearer;
- obtenção do token: `POST /login`;
- envio: cabeçalho `Authorization: Bearer <token>`;
- recuperação de senha: `POST /esqueci-senha` e `POST /redefinir-senha`;
- o login público possui limitação de tentativas por throttle.

## 4. Headers principais

| Header | Uso |
| --- | --- |
| `Accept: application/json` | padronização de resposta |
| `Content-Type: application/json` | payload JSON |
| `Content-Type: multipart/form-data` | upload de anexos |
| `Authorization: Bearer <token>` | autenticação das rotas protegidas |

## 5. Convenções de resposta

- respostas de sucesso retornam `200`, `201` ou `204` quando aplicável;
- erros de validação retornam `422`;
- falta de autenticação retorna `401`;
- falta de autorização retorna `403`;
- recurso inexistente retorna `404`;
- conflitos de negócio podem retornar `409`;
- excesso de tentativas em rotas limitadas pode retornar `429`.

## 6. Regras de acesso por perfil

| Recurso | Atendente | Técnico | Administrador |
| --- | --- | --- | --- |
| Login, logout, me | Sim | Sim | Sim |
| Esqueci senha / redefinir senha | Sim | Sim | Sim |
| Alterar senha | Sim | Sim | Sim |
| Criar OS geral | Sim | Não | Sim |
| Criar OS ETA/ETE | Não | Sim | Sim |
| Listar e consultar OS | Sim | Sim, com restrição de escopo | Sim |
| Aceitar OS | Não | Sim | Não |
| Iniciar execução | Não | Sim | Não |
| Finalizar execução | Não | Sim | Não |
| Marcar não executada | Não | Sim | Não |
| Enviar evidência | Não | Sim | Não |
| Dashboard do perfil | Sim | Sim | Sim |
| Funcionários para equipe | Não | Sim | Sim |
| Relatórios administrativos | Não | Não | Sim |
| Relatório de horas extras | Não | Não | Sim |
| Gestão de usuários | Não | Não | Sim |

### Observação sobre o perfil técnico

O técnico pode consultar:

- OS `abertas` e sem responsável;
- OS já atribuídas a ele.

## 7. Endpoints principais

### 7.1 Saúde

- `GET /health`

### 7.2 Autenticação

- `POST /login`
- `POST /logout`
- `GET /me`
- `POST /me/alterar-senha`
- `POST /esqueci-senha`
- `POST /redefinir-senha`

### 7.3 Dashboards

- `GET /dashboard/admin`
- `GET /dashboard/atendente`
- `GET /dashboard/tecnico`

### 7.4 Ordens de serviço

- `GET /ordens-servico`
- `GET /ordens-servico/resumo`
- `GET /ordens-servico/opcoes-filtro`
- `GET /ordens-servico/{id}`
- `POST /ordens-servico`
- `POST /ordens-servico/{id}/aceitar`
- `POST /ordens-servico/{id}/iniciar`
- `POST /ordens-servico/{id}/execucoes/finalizar`
- `POST /ordens-servico/{id}/nao-executada`
- `POST /ordens-servico/{id}/anexos`
- `GET /ordens-servico/{id}/relatorio/pdf`

### 7.5 Anexos

- `GET /anexos/{id}/arquivo`

### 7.6 Relatórios administrativos

- `GET /relatorios/ordens-servico`
- `GET /relatorios/ordens-servico/exportar/{format}`
- `GET /relatorios/horas-extras`
- `GET /relatorios/horas-extras/exportar/{format}`

### 7.7 Usuários e equipe

- `GET /usuarios`
- `GET /usuarios/{id}`
- `POST /usuarios`
- `PUT /usuarios/{id}`
- `GET /funcionarios`

## 8. Exemplos resumidos

### 8.1 Login

```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "admin@techosflow.com.br",
  "password": "Senha@123"
}
```

### 8.2 Solicitar recuperação de senha

```http
POST /api/v1/esqueci-senha
Content-Type: application/json

{
  "email": "admin@techosflow.com.br"
}
```

### 8.3 Criar OS geral

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

### 8.4 Finalizar execução

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
    }
  ]
}
```

### 8.5 Enviar evidência

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
endereco_capturado=Rua X, Bairro Y, Rio Branco - AC
```

## 9. Especificação OpenAPI

O arquivo principal de especificação compatível com Swagger está disponível em:

- [openapi-techos-flow.yaml](c:/Users/VAIO/Documents/projetos/techos-flow/docs/api/openapi-techos-flow.yaml)

## 10. Observações importantes

- a recuperação de senha por e-mail faz parte da versão atual;
- exportações em PDF e XLSX possuem restrição por perfil e volume;
- o acesso ao conteúdo de anexos privados depende de autenticação e autorização;
- o relatório detalhado em PDF de uma OS é disponível por rota autenticada;
- o endpoint `/funcionarios` não expõe e-mail, apenas os dados mínimos necessários para seleção de equipe.
