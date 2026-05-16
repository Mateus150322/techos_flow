# Documentação do Projeto TechOS Flow

## Objetivo

Este diretório centraliza a documentação técnica, acadêmica e organizacional do projeto **TechOS Flow**, sistema web para gestão de ordens de serviço.

## Estrutura

- `visao/`: documento de visão do projeto.
- `requisitos/`: requisitos funcionais, não funcionais, segurança, usabilidade, desempenho e LGPD.
- `regras-negocio/`: regras operacionais e restrições do domínio.
- `casos-de-uso/`: casos de uso principais por ator e objetivo.
- `processos/`: modelagem textual dos fluxos preparada para futura conversão em BPMN.
- `arquitetura/`: arquitetura, módulos, decisões técnicas e estrutura do código.
- `api/`: documentação da API REST e especificação OpenAPI.
- `banco-de-dados/`: entidades, dicionário de dados e relacionamentos.
- `seguranca-lgpd/`: segurança, privacidade, minimização de dados e retenção.
- `testes/`: plano de testes e catálogo de casos de teste.
- `manuais/`: manuais por perfil e manual técnico do projeto.
- `implantacao/`: guia de implantação, Docker e opções de hospedagem.
- `changelog/`: histórico de versões e mudanças relevantes.
- `acessibilidade/`: checklist, verificações e referência para acessibilidade do frontend.

## Convenções adotadas

- linguagem: português técnico e objetivo;
- campos dependentes de definição institucional ou operacional permanecem marcados como `A preencher`;
- os documentos refletem o estado atual do código e da configuração local do projeto;
- nomes de perfis, módulos, rotas e entidades seguem a implementação existente.

## Atualizações recentes já refletidas

- recuperação de senha por e-mail com Zoho Mail;
- endurecimento do login com rate limit e política de senha forte;
- módulo de horas extras e banco de folgas;
- PDF detalhado de OS;
- tema claro/escuro, acessibilidade e melhorias mobile;
- domínios locais de desenvolvimento com `techosflow.test`;
- documentação de deploy para Railway, Oracle Cloud e ambientes Linux tradicionais.

## Documentos adicionais sugeridos

Os artefatos abaixo não são obrigatórios para o projeto funcionar, mas agregam valor para evolução e auditoria:

- `matriz-rastreabilidade-requisitos.md`
- `runbook-incidentes.md`
- `politica-backup-e-recuperacao.md`
- diretório `adrs/` para decisões arquiteturais
- coleção de API em Postman ou Insomnia

## Observação sobre os artefatos acadêmicos

O diretório `docs/` também contém arquivos de apoio ao TCC e materiais de apresentação. Eles não substituem a documentação técnica do produto, mas registram a evolução acadêmica do projeto.
