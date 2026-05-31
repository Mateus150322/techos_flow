# Documento de Segurança e LGPD

## 1. Objetivo

Registrar como o `TechOS Flow` trata segurança, privacidade e minimização de dados no estado atual do projeto.

## 2. Dados tratados

| Categoria | Exemplos | Finalidade |
| --- | --- | --- |
| Dados de usuários | nome, e-mail, papel, status de acesso, valor-hora | autenticação, autorização, gestão administrativa e horas extras |
| Dados operacionais da OS | número, tipo, status, prioridade, descrição, datas | gestão do fluxo de atendimento |
| Dados de endereço da OS | logradouro, número, bairro, cidade, estado, CEP | referência operacional/cadastral da ordem |
| Dados de execução | técnico, equipe, datas, observações | rastreabilidade e histórico |
| Evidências | arquivos, tipo, coordenadas, precisão, rua, bairro, cidade, estado | comprovação da execução |
| Dados de sessão | token, IP, user agent, sessão | autenticação e segurança |
| Dados de recuperação | e-mail, token e data | redefinição segura de senha |

## 3. Finalidade do uso dos dados

- autenticar e identificar usuários;
- controlar permissões por perfil;
- abrir, acompanhar e encerrar ordens de serviço;
- comprovar atendimentos por anexos e evidências;
- apurar horas extras e banco de folgas;
- fornecer visão gerencial para administração;
- permitir recuperação segura de acesso.

## 4. Controles de segurança

### 4.1 Autenticação

- login por e-mail e senha;
- token com `Laravel Sanctum`;
- throttle nas rotas públicas sensíveis;
- bloqueio de usuário inativo;
- primeiro acesso com troca obrigatória de senha;
- recuperação de senha por token temporário.

### 4.2 Autorização

- rotas protegidas por autenticação;
- autorização por papel;
- validações de negócio adicionais para técnico responsável;
- PDF detalhado da OS restrito ao administrador;
- acesso a anexos condicionado ao contexto da OS;
- horas extras detalhadas restritas ao administrador.

### 4.3 Armazenamento

- anexos armazenados em área privada;
- sem URL pública direta para arquivo;
- backend media o acesso ao conteúdo;
- o projeto pode operar com disk configurável para anexos.

## 5. Minimização de dados

Práticas já adotadas:

- relatórios priorizam visão gerencial, não texto bruto desnecessário;
- `/funcionarios` retorna apenas os dados necessários para composição da equipe;
- colaboradores operacionais participam da execução sem obter login;
- o endereço capturado da evidência é separado do endereço cadastral da OS;
- cálculos detalhados de horas extras são restritos ao administrador.

## 6. Retenção de dados

Existe documentação complementar em:

- [privacidade-retencao.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/privacidade-retencao.md)

Também existe comando administrativo de revisão:

```bash
php artisan anexos:revisar-retencao --days=365 --limit=50
```

Situação atual:

- revisão manual/assistida: implementada;
- descarte automático institucional: não implementado;
- política formal da organização usuária: depende de definição externa ao código.

## 7. Riscos e cuidados

- nome e e-mail de usuários são dados pessoais;
- evidências podem conter elementos identificáveis do ambiente;
- geolocalização exige cuidado adicional por expor contexto operacional;
- exportações ampliam risco de disseminação indevida;
- recuperação de senha depende de proteção adequada do domínio e do SMTP.

## 8. Aderência à LGPD

### Pontos já aderentes

- segregação por perfil;
- anexos privados;
- documentação inicial de retenção;
- política de senha forte;
- troca obrigatória de senha;
- recuperação de acesso sem exposição da senha original.

### Pontos parcialmente aderentes

- formalização da base legal por categoria de dado;
- definição institucional de controlador e encarregado;
- política formal de incidente;
- política formal de descarte automático.

## 9. Recomendações

| Prioridade | Recomendação |
| --- | --- |
| Alta | formalizar papéis institucionais de tratamento |
| Alta | publicar procedimento de incidente de segurança |
| Média | definir rotina de revisão de usuários e acessos |
| Média | formalizar política de backup, retenção e descarte |
| Média | validar ambiente real com storage persistente e `HTTPS` |
| Baixa | avaliar anonimização adicional em relatórios externos |
