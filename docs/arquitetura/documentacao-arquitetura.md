# Documentação da Arquitetura

## 1. Visão geral

O `TechOS Flow` adota arquitetura web em camadas, com separação entre:

- frontend para experiência do usuário;
- backend para autenticação, autorização e regras de negócio;
- banco de dados relacional para persistência;
- armazenamento privado de anexos;
- serviço de e-mail para recuperação de senha.

## 2. Camadas principais

### 2.1 Apresentação

Responsável por:

- páginas e componentes React;
- navegação por perfil;
- formulários de criação, consulta e execução;
- experiência mobile;
- acessibilidade inicial;
- exportação acionada pela interface administrativa.

### 2.2 Aplicação

Responsável por:

- controllers Laravel;
- middlewares de autenticação, usuário ativo, troca obrigatória de senha e papel;
- services de dashboards, relatórios, exportação, horas extras e anexos;
- notifications de recuperação de senha.

### 2.3 Domínio e persistência

Responsável por:

- models Eloquent;
- migrations;
- regras de relacionamento entre ordens, execuções, equipe, anexos e colaboradores;
- persistência em PostgreSQL.

### 2.4 Infraestrutura

Responsável por:

- Laravel Sanctum;
- SMTP;
- storage privado/local ou storage em nuvem configurável;
- geração de PDF;
- geração de planilhas com `PhpSpreadsheet`.

## 3. Módulos funcionais

### 3.1 Autenticação e acesso

- login;
- logout;
- usuário autenticado;
- primeiro acesso;
- recuperação de senha por e-mail.

### 3.2 Ordens de serviço

- criação de OS geral;
- criação de OS técnica ETA/ETE;
- consulta, filtros e detalhe;
- aceite;
- início de execução;
- finalização;
- não execução.

### 3.3 Evidências e anexos

- upload de arquivos;
- geolocalização opcional;
- armazenamento privado;
- leitura autenticada;
- campos estruturados do endereço capturado.

### 3.4 Dashboards

- dashboard do administrador;
- dashboard do atendente;
- dashboard do técnico.

### 3.5 Administração

- relatórios operacionais e gerenciais;
- relatório de horas extras;
- exportação em PDF, Excel e CSV;
- gestão de usuários;
- gestão de colaboradores operacionais.

## 4. Integrações externas

- `SMTP`: recuperação de senha;
- navegador + geolocalização: captura de coordenadas e contexto de evidência;
- storage persistente: necessário para produção;
- domínio com `HTTPS`: necessário para validação real do fluxo de geolocalização em smartphone.

## 5. Decisões arquiteturais relevantes

### DA-01 — A API é a fonte oficial da regra de negócio

As regras críticas não ficam apenas no frontend. O backend valida perfil, status, vínculo do técnico, composição da equipe, geração de relatório e acesso ao anexo.

### DA-02 — Separação entre usuário autenticável e colaborador operacional

Colaboradores operacionais participam da execução e das horas extras sem receber login. Isso reduz complexidade de permissões e reflete melhor o processo real.

### DA-03 — Evidência com geolocalização separada do endereço da OS

O endereço cadastral da OS representa o contexto do atendimento, enquanto a geolocalização da evidência representa o local capturado no campo.

### DA-04 — Anexos privados por padrão

Arquivos não são servidos por URL pública. O acesso é mediado por backend autenticado.

### DA-05 — Relatórios e exportações concentrados no backend

Consultas agregadas, exportações e PDFs são calculados no backend para manter consistência e reduzir lógica duplicada no frontend.

### DA-06 — Planilhas geradas com biblioteca dedicada

O projeto migrou a geração de Excel para `PhpSpreadsheet`, melhorando manutenibilidade e acabamento visual.

## 6. Visão de implantação recomendada

Para ambiente real, a arquitetura esperada inclui:

- frontend publicado em domínio com `HTTPS`;
- backend publicado em domínio ou subdomínio próprio;
- banco PostgreSQL persistente;
- storage persistente ou compatível com S3 para anexos;
- SMTP funcional para recuperação de senha.

## 7. Diagramas recomendados

Os seguintes diagramas devem ser mantidos junto desta arquitetura:

- diagrama de contexto do sistema;
- diagrama de arquitetura em camadas;
- diagrama de implantação;
- diagrama entidade-relacionamento;
- diagramas de sequência para login, recuperação de senha e evidência;
- diagramas de processo/BPMN para os fluxos principais.

Os arquivos-fonte sugeridos estão em:

- os diagramas podem ser gerados a partir desta documentação textual quando forem necessários como artefatos derivados.

## 8. Restrições conhecidas

- a geolocalização em smartphone depende de `HTTPS`;
- anexos exigem storage persistente em produção;
- o projeto ainda precisa de validação final em ambiente publicado;
- observabilidade e monitoramento ainda estão em nível básico de projeto acadêmico/produto inicial.
