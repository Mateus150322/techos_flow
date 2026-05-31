# Documento de Visão do Projeto

## 1. Identificação

| Campo | Valor |
| --- | --- |
| Nome do projeto | TechOS Flow |
| Tipo de solução | Sistema web para gestão de ordens de serviço |
| Domínio | Operação e atendimento com ordens de serviço |
| Organização de referência | Não aplicável |
| Versão deste documento | 1.2 |
| Data de referência | 2026-05-28 |
| Responsável | A definir |

## 2. Descrição geral

O `TechOS Flow` é um sistema web criado para substituir controles manuais e registros dispersos na gestão de ordens de serviço. A solução cobre abertura, aceite, execução, encerramento, evidências, relatórios, horas extras, banco de folgas e administração de acessos, com separação por perfil e rastreabilidade operacional.

O projeto utiliza:

- frontend em `React + TypeScript + Vite`;
- backend em `Laravel`;
- banco de dados `PostgreSQL`;
- API REST versionada em `/api/v1`;
- envio de e-mail para recuperação de senha;
- armazenamento privado para anexos e evidências.

## 3. Problema que o projeto resolve

O sistema foi desenhado para reduzir problemas frequentes em operações de ordens de serviço, como:

- baixa rastreabilidade sobre quem abriu, aceitou, executou ou encerrou uma OS;
- dependência de planilhas e registros em papel;
- dificuldade de acompanhar andamento e produtividade;
- fragilidade no controle de acesso por perfil;
- ausência de evidências digitais e georreferenciadas;
- pouco controle gerencial sobre horas extras e banco de folgas.

## 4. Objetivo geral

Centralizar o fluxo operacional e administrativo das ordens de serviço em uma plataforma web segura, rastreável e preparada para uso em desktop e smartphone.

## 5. Objetivos específicos

- digitalizar a abertura e o acompanhamento das ordens de serviço;
- controlar acesso por perfil de usuário;
- permitir aceite, execução, finalização e não execução de OS;
- registrar evidências com foto, anexos e geolocalização;
- apoiar a gestão administrativa por meio de dashboards, relatórios e exportações;
- apurar horas extras e banco de folgas por participante da execução;
- oferecer recuperação de senha por e-mail;
- melhorar a consistência da operação em campo e a visibilidade gerencial.

## 6. Público-alvo

### 6.1 Público direto

- atendentes responsáveis pela abertura e consulta de OS;
- técnicos responsáveis pela operação em campo;
- administradores responsáveis por relatórios, horas extras, gestão de usuários e configuração operacional.

### 6.2 Público indireto

- gestores da organização usuária;
- áreas administrativas de apoio;
- equipes operacionais sem login direto, como colaboradores operacionais/auxiliares;
- público atendido indiretamente pela melhoria do processo.

## 7. Proposta de valor

O projeto entrega:

- centralização digital do ciclo da OS;
- rastreabilidade por usuário, perfil, status e execução;
- evidências com localização capturada no campo;
- relatórios administrativos com exportação em `PDF`, `Excel` e `CSV`;
- apuração estruturada de horas extras por participante;
- base técnica organizada para crescimento futuro.

## 8. Escopo atual implementado

O escopo atual contempla:

- autenticação por e-mail e senha com Sanctum;
- primeiro acesso com troca obrigatória de senha forte;
- recuperação de senha por e-mail;
- perfis `administrador`, `atendente` e `tecnico`;
- criação de OS geral por atendente;
- criação de OS `Manutenção ETA/ETE` por técnico;
- aceite de OS aberta sem responsável;
- início, finalização e não execução da OS;
- composição de equipe de execução com usuários e colaboradores operacionais sem login;
- cálculo de horas extras e banco de folgas;
- envio de evidências com foto e geolocalização;
- dashboards por perfil;
- relatórios administrativos e PDF detalhado por OS;
- gestão administrativa de usuários e colaboradores operacionais;
- melhorias de acessibilidade, responsividade e uso em smartphone.

## 9. Fora de escopo atual

Não fazem parte do escopo implementado:

- aplicativo mobile nativo;
- notificações push;
- integração com ERP ou sistemas legados;
- workflow formal de aprovação multiárea;
- observabilidade corporativa completa;
- descarte automático institucional de dados por prazo;
- storage em nuvem como padrão obrigatório;
- assinatura eletrônica avançada.

## 10. Benefícios esperados

- redução de controles paralelos e retrabalho;
- ganho de rastreabilidade operacional;
- maior velocidade de consulta e acompanhamento da OS;
- melhor visibilidade gerencial sobre fila, produtividade e horas extras;
- base mais segura para tratamento de anexos e evidências;
- documentação mais adequada para TCC, apresentação e evolução do produto.

## 11. Indicadores sugeridos

- quantidade de OS abertas, em execução, finalizadas e não executadas;
- tempo médio entre abertura e encerramento;
- percentual de OS com evidência anexada;
- distribuição por prioridade e tipo;
- produtividade por técnico;
- total de horas extras 50% e 100% por período;
- total de colaboradores com banco de folgas gerado.

## 12. Restrições e premissas

### 12.1 Restrições

- dependência de backend, frontend e banco integrados;
- necessidade de `SMTP` válido para recuperação de senha;
- necessidade de `HTTPS` para funcionamento confiável da geolocalização em smartphone;
- anexos exigem storage persistente em produção;
- uso por navegador moderno.

### 12.2 Premissas

- a organização usuária já opera por ordens de serviço;
- a API continuará sendo a fonte oficial de regras de negócio;
- os perfis principais continuarão sendo `administrador`, `atendente` e `tecnico`;
- colaboradores operacionais poderão participar da execução sem possuir login.
