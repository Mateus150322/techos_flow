# Documento de Visão do Projeto

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Nome do projeto | TechOS Flow |
| Tipo de solução | Sistema web para gestão de ordens de serviço |
| Domínio | Operação e atendimento com ordens de serviço |
| Organização de referência | Não aplicável |
| Versão deste documento | 1.1 |
| Data de referência | 2026-05-16 |
| Responsável | A preencher |

## 2. Descrição geral

O TechOS Flow é um sistema web desenvolvido para substituir controles manuais e processos em papel na gestão de ordens de serviço. A solução organiza o fluxo de abertura, aceite, execução, acompanhamento, evidências, relatórios, horas extras e gestão administrativa das ordens de serviço, com autenticação e autorização por perfil.

O sistema foi estruturado com backend em Laravel, frontend em React com TypeScript e banco de dados PostgreSQL, operando por meio de API REST versionada.

## 3. Problema que o projeto resolve

Antes da informatização, a gestão de ordens de serviço tende a apresentar:

- baixa rastreabilidade sobre quem abriu, aceitou, executou e encerrou uma OS;
- dependência de formulários manuais e registros em papel;
- dificuldade de consultar histórico de atendimento;
- demora no acompanhamento gerencial;
- fragilidade no controle de acesso por perfil;
- ausência de evidências digitais e georreferenciadas das execuções;
- pouca visibilidade sobre carga de trabalho, horas extras e banco de folgas.

O TechOS Flow resolve esses problemas ao centralizar o fluxo operacional em uma plataforma única, com histórico auditável, separação por perfil, suporte a anexos e evidências e apuração administrativa mais estruturada.

## 4. Objetivo geral

Desenvolver um sistema web para gerenciar ordens de serviço de forma estruturada, rastreável e segura, melhorando a operação técnica, o atendimento e a visão gerencial da organização usuária.

## 5. Objetivos específicos

- digitalizar a abertura e o acompanhamento das ordens de serviço;
- permitir controle de acesso por perfil de usuário;
- registrar aceite, execução, finalização e não execução das ordens;
- possibilitar envio de evidências e anexos com suporte à geolocalização;
- oferecer dashboards, relatórios, exportações e PDF detalhado de OS;
- apoiar o cálculo de horas extras e banco de folgas;
- garantir maior rastreabilidade, segurança e minimização de dados;
- disponibilizar recuperação de senha por e-mail;
- reduzir improvisos operacionais e inconsistências entre equipes.

## 6. Público-alvo

### 6.1 Público direto

- atendentes responsáveis pela abertura e consulta de ordens;
- técnicos responsáveis pela execução operacional;
- administradores responsáveis por acompanhamento, relatórios, horas extras e gestão de usuários.

### 6.2 Público indireto

- gestores da organização usuária;
- áreas de controle interno e apoio administrativo;
- cidadãos atendidos pelo serviço público, de forma indireta, pela melhoria operacional.

## 7. Proposta de valor

O projeto entrega:

- centralização do processo de OS em ambiente digital;
- rastreabilidade por usuário, perfil e status;
- ganho de controle operacional para técnico, atendimento e administração;
- melhor visibilidade gerencial por meio de relatórios, indicadores e horas extras;
- maior segurança na manipulação de evidências e dados operacionais;
- base estruturada para evolução futura do sistema.

## 8. Escopo do projeto

O escopo atual contempla:

- autenticação com Laravel Sanctum;
- perfis de acesso `administrador`, `atendente` e `tecnico`;
- criação de OS geral pelo atendente e pelo administrador;
- criação de OS de `Manutenção ETA/ETE` pelo técnico e pelo administrador;
- consulta, filtros e detalhamento de ordens de serviço;
- aceite de OS pelo técnico;
- início e finalização de execução;
- marcação de OS como não executada;
- upload de evidências e anexos;
- suporte a geolocalização em evidências;
- dashboards por perfil;
- relatórios administrativos com exportação em CSV, XLSX e PDF;
- PDF detalhado por OS;
- módulo administrativo de horas extras e banco de folgas;
- gestão administrativa de usuários;
- primeiro acesso com troca obrigatória de senha forte;
- recuperação de senha por e-mail;
- inativação de usuários;
- armazenamento privado de anexos;
- melhorias de acessibilidade, responsividade e uso em smartphone.

## 9. Fora de escopo

Os itens abaixo não fazem parte do escopo atual implementado:

- aplicativo mobile nativo;
- notificações push;
- workflow formal de aprovação entre múltiplos setores;
- assinatura eletrônica avançada;
- integração com ERP ou outros sistemas legados;
- exclusão física de usuários;
- automação completa de descarte de dados por retenção;
- object storage externo como padrão de anexos;
- observabilidade corporativa completa com métricas e alertas externos.

## 10. Benefícios esperados

- redução do uso de papel e controles paralelos;
- maior agilidade na abertura e no acompanhamento de OS;
- rastreabilidade mais forte sobre ações operacionais;
- visão gerencial mais clara sobre status, produtividade, horas extras e volume de serviços;
- maior segurança de acesso e privacidade dos dados tratados;
- base documental e técnica mais adequada para expansão futura.

## 11. Indicadores de sucesso sugeridos

- percentual de OS abertas e encerradas dentro do período esperado;
- tempo médio entre abertura e encerramento;
- percentual de OS com evidência anexada;
- percentual de OS não executadas;
- produtividade por técnico;
- volume de ordens por tipo de serviço;
- total de horas extras por período;
- número de acessos inativados ou revisados por período.

## 12. Restrições e premissas

### 12.1 Restrições

- dependência de infraestrutura web com backend e frontend separados;
- necessidade de conexão com banco PostgreSQL;
- armazenamento de anexos local no estado atual do projeto;
- uso de navegador moderno no frontend;
- envio de e-mails depende de SMTP válido em cada ambiente.

### 12.2 Premissas

- a organização usuária já possui equipe segregada por perfil;
- o fluxo operacional continuará baseado em ordens de serviço;
- a autenticação permanecerá centralizada na API;
- o sistema será operado em ambiente autenticado e controlado.
