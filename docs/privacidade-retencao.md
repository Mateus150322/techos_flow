# TechOS Flow — Privacidade e Retenção

Este documento registra a política mínima de privacidade e retenção adotada no projeto para uso operacional, auditoria técnica e alinhamento com LGPD e ISO 27701.

## 1. Dados tratados pelo sistema

- usuários: nome, e-mail, perfil, status de acesso e valor-hora quando aplicável;
- ordens de serviço: número, tipo, status, prioridade, descrição e datas;
- cliente/local: campo `nome_cliente` e endereço operacional da OS;
- execuções: técnico responsável, equipe participante, início, fim e observações operacionais;
- anexos e evidências: arquivo, tipo, data de envio, geolocalização e endereço ou referência informada;
- recuperação de senha: e-mail do usuário e token temporário.

## 2. Princípios adotados

- coleta mínima para executar a operação da OS;
- acesso por perfil (`administrador`, `tecnico`, `atendente`);
- evidências em armazenamento privado, com acesso autenticado;
- relatórios administrativos com foco gerencial e texto operacional resumido;
- sem exposição de caminho interno de arquivos no frontend;
- recuperação de senha baseada em token, sem envio de senha em texto aberto.

## 3. Regras de acesso por perfil

- Atendente:
  - abre e consulta OS
  - não executa fluxo técnico
  - não acessa gestão administrativa
- Técnico:
  - atua apenas na OS sob sua responsabilidade ou aberta sem responsável para aceite
  - envia evidências vinculadas à OS
  - não acessa gestão administrativa
- Administrador:
  - consulta relatórios, indicadores, horas extras e usuários
  - não executa ações operacionais do fluxo técnico

## 4. Regras mínimas de retenção

- ordens de serviço e execuções:
  - manter para histórico operacional e rastreabilidade
- usuários:
  - preferir inativação em vez de exclusão
- anexos e evidências:
  - manter apenas enquanto houver necessidade operacional, administrativa ou de auditoria
  - recomendação inicial: revisar evidências com mais de 365 dias
- exportações geradas:
  - evitar armazenamento manual prolongado fora do sistema
  - compartilhar apenas com necessidade administrativa legítima

## 5. Diretrizes operacionais

- não usar relatórios exportados como base pública;
- evitar incluir dados pessoais desnecessários em descrições livres;
- preferir referência operacional curta em relatórios;
- em evidências com geolocalização, usar somente quando necessário para comprovação de atendimento;
- proteger as credenciais SMTP usadas para recuperação de senha.

## 6. Próximos passos recomendados

- criar rotina administrativa de revisão e descarte de anexos antigos;
- registrar base legal e finalidade de tratamento por categoria de dado;
- revisar periodicamente relatórios e exportações para manter minimização de dados;
- formalizar política de incidentes e resposta ao titular.

## 7. Revisão manual de anexos antigos

O projeto possui um comando de revisão para apoiar retenção sem descarte automático:

```bash
cd backend
php artisan anexos:revisar-retencao --days=365 --limit=50
```

Uso recomendado:

- `--days`: define a idade mínima do anexo para entrar na revisão
- `--limit`: limita quantos registros aparecem na listagem

O comando:

- mostra quantos anexos já ultrapassaram a janela definida;
- lista OS, tipo, data de envio, responsável e uso de geolocalização;
- não remove arquivos;
- serve apenas como apoio administrativo para revisão manual.
