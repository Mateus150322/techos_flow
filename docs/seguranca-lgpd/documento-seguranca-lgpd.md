# Documento de Segurança e LGPD

## 1. Objetivo

Este documento registra como o TechOS Flow trata segurança, privacidade e minimização de dados no estado atual do projeto.

## 2. Dados tratados pelo sistema

| Categoria | Exemplos | Finalidade |
| --- | --- | --- |
| Dados de usuários | nome, e-mail, perfil, status de acesso, valor-hora | autenticação, autorização, gestão administrativa e apuração de horas extras |
| Dados operacionais da OS | número, tipo, status, prioridade, descrição, datas | gestão do fluxo de atendimento |
| Dados de endereço | rua, número, bairro, cidade, estado, CEP | localização operacional da OS |
| Dados de execução | técnico, equipe, datas, observações | rastreabilidade e histórico |
| Evidências | arquivos, tipo, geolocalização, precisão, referência | comprovação e apoio operacional |
| Dados de sessão | token, sessão, IP e agente de usuário | autenticação e segurança |
| Dados de recuperação | e-mail, token e data de criação | recuperação de senha |

## 3. Finalidade de uso dos dados

- identificar e autenticar usuários do sistema;
- controlar permissões por perfil;
- abrir, acompanhar e encerrar ordens de serviço;
- registrar histórico operacional;
- comprovar atendimentos por anexos e evidências;
- fornecer visão gerencial para administração;
- apurar horas extras, banco de folgas e estimativa financeira;
- permitir recuperação segura de acesso por e-mail.

## 4. Controle de acesso

### 4.1 Autenticação

- realizada por e-mail e senha;
- token gerado com Laravel Sanctum;
- login público protegido por throttle;
- sessão inválida é bloqueada;
- usuário inativo não acessa o sistema;
- primeiro acesso exige troca de senha forte;
- recuperação de senha exige token temporário enviado por e-mail.

### 4.2 Autorização

- rotas protegidas por autenticação;
- autorização por perfil no backend;
- regras de negócio adicionais para técnico responsável;
- leitura de OS limitada para o técnico a ordens sem responsável ou sob sua responsabilidade;
- acesso a anexos condicionado ao contexto da OS;
- cálculos de horas extras visíveis apenas para administradores.

## 5. Rastreamento e auditoria

O sistema mantém trilha mínima para eventos sensíveis de anexos:

- upload de anexo;
- acesso autorizado ao arquivo;
- tentativa negada de acesso.

Também mantém rastreabilidade estrutural por:

- usuário criador da OS;
- técnico responsável pela OS;
- técnico executor da execução;
- usuário que enviou o anexo;
- equipe da execução utilizada no cálculo de horas extras.

## 6. Armazenamento seguro

- anexos são armazenados em área privada;
- o conteúdo do arquivo não é exposto por URL pública;
- o acesso ao arquivo ocorre por rota autenticada;
- o payload da API não retorna o caminho interno do arquivo;
- o sistema está preparado para futura migração para `s3`, mas ainda opera com `FILESYSTEM_DISK=local`.

## 7. Minimização de dados

Práticas já adotadas:

- relatórios evitam exposição desnecessária de texto livre completo por padrão;
- endereço principal exibido na OS foi reduzido ao recorte operacional relevante;
- relatórios e exportações priorizam dados gerenciais;
- o caminho interno do anexo não é exposto ao frontend;
- o endpoint `/funcionarios` não retorna e-mail;
- os relatórios de horas extras ficam restritos ao administrador.

## 8. Retenção de dados

O projeto possui documentação complementar em:

- [privacidade-retencao.md](c:/Users/VAIO/Documents/projetos/techos-flow/docs/privacidade-retencao.md)

Também existe comando administrativo de revisão de retenção:

```bash
php artisan anexos:revisar-retencao --days=365 --limit=50
```

### Situação atual

- revisão manual de anexos antigos: implementada;
- descarte automático: não implementado;
- política institucional formal: `A preencher`.

## 9. Riscos e cuidados com LGPD

### 9.1 Pontos de atenção

- nome e e-mail de usuários são dados pessoais;
- evidências podem conter dados sensíveis ou elementos identificáveis do ambiente;
- geolocalização exige cuidado especial por ser dado de contexto operacional e potencialmente pessoal;
- relatórios exportados ampliam o risco de disseminação indevida se não forem controlados;
- e-mails de recuperação de senha exigem proteção do SMTP e do domínio remetente.

### 9.2 Medidas já aplicadas

- segregação por perfil;
- anexos privados;
- minimização em relatórios;
- inativação de usuários;
- troca obrigatória de senha;
- política de senha forte;
- limitação de tentativas de login;
- recuperação de senha por token;
- retenção mínima documentada;
- revisão administrativa de retenção.

## 10. Tratamento de incidentes

### Estado atual

- existe base documental mínima de privacidade e retenção;
- não há ainda procedimento institucional completo de resposta a incidente.

### Recomendação

Definir documento operacional contendo:

- responsável pela triagem;
- classificação de severidade;
- comunicação interna;
- comunicação externa quando aplicável;
- avaliação de impacto para titulares e operação;
- registro de ações corretivas.

## 11. Alinhamento com LGPD

### Pontos já aderentes

- controle de acesso por necessidade de uso;
- minimização parcial de exposição;
- proteção de anexos;
- documentação inicial de retenção;
- restrição por perfil;
- recuperação de acesso sem exposição da senha original.

### Pontos parcialmente aderentes

- formalização de base legal por categoria de dado;
- definição de responsáveis institucionais;
- política formal de resposta ao titular;
- política formal de incidentes;
- definição de descarte automático por prazo.

## 12. Recomendações de melhoria

| Prioridade | Recomendação |
| --- | --- |
| Alta | formalizar base legal e papéis institucionais de tratamento |
| Alta | publicar procedimento de incidente de segurança |
| Média | definir rotina periódica de revisão de usuários e acessos |
| Média | formalizar política de backup, retenção e descarte |
| Média | ampliar logs de ações sensíveis além dos anexos |
| Baixa | avaliar anonimização adicional em relatórios externos |

## 13. Campos institucionais pendentes

- controlador dos dados: `A preencher`
- encarregado ou contato de privacidade: `A preencher`
- política institucional de retenção: `A preencher`
- procedimento oficial de incidente: `A preencher`
