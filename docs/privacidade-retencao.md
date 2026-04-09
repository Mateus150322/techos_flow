# TechOS Flow — Privacidade e Retenção

Este documento registra a política mínima de privacidade e retenção adotada no projeto para uso operacional, auditoria técnica e alinhamento com LGPD/ISO 27701.

## 1. Dados tratados pelo sistema

- Usuários: nome, e-mail, perfil, status de acesso.
- Ordens de serviço: número, tipo, status, prioridade, descrição e datas.
- Cliente/local: campo `nome_cliente` e endereço operacional da OS.
- Execuções: técnico responsável, início, fim e observações operacionais.
- Anexos/evidências: arquivo, tipo, data de envio, geolocalização e endereço/referência informada.

## 2. Princípios adotados

- Coleta mínima para executar a operação da OS.
- Acesso por perfil (`administrador`, `tecnico`, `atendente`).
- Evidências em armazenamento privado, com acesso autenticado.
- Relatórios administrativos com foco gerencial e texto operacional resumido.
- Sem exposição de caminho interno de arquivos no frontend.

## 3. Regras de acesso por perfil

- Atendente:
  - abre e consulta OS
  - não executa fluxo técnico
  - não acessa gestão administrativa
- Técnico:
  - atua apenas na OS sob sua responsabilidade
  - envia evidências vinculadas à OS
  - não acessa gestão administrativa
- Administrador:
  - consulta relatórios, indicadores e usuários
  - não executa ações operacionais do fluxo técnico

## 4. Regras mínimas de retenção

- Ordens de serviço e execuções:
  - manter para histórico operacional e rastreabilidade
- Usuários:
  - preferir inativação em vez de exclusão
- Anexos/evidências:
  - manter apenas enquanto houver necessidade operacional, administrativa ou de auditoria
  - recomendação inicial: revisar evidências com mais de 365 dias
- Exportações geradas:
  - evitar armazenamento manual prolongado fora do sistema
  - compartilhar apenas com necessidade administrativa legítima

## 5. Diretrizes operacionais

- Não usar relatórios exportados como base pública.
- Evitar incluir dados pessoais desnecessários em descrições livres.
- Preferir referência operacional curta em relatórios.
- Em evidências com geolocalização, usar somente quando necessário para comprovação de atendimento.

## 6. Próximos passos recomendados

- criar rotina administrativa de revisão e descarte de anexos antigos
- registrar base legal e finalidade de tratamento por categoria de dado
- revisar periodicamente relatórios/exportações para manter minimização de dados

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

- mostra quantos anexos já ultrapassaram a janela definida
- lista OS, tipo, data de envio, responsável e uso de geolocalização
- não remove arquivos
- serve apenas como apoio administrativo para revisão manual
