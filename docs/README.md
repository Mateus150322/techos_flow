# Documentação do Projeto

Esta pasta concentra a documentação funcional, técnica e acadêmica do `TechOS Flow`.

## Estado atual

- documentação central revisada para refletir o comportamento real do sistema;
- textos normalizados em UTF-8;
- exports acadêmicos (`.docx`, `.html`, `.pdf`) mantidos como artefatos derivados, não como fonte principal.

## Estrutura principal

- `visao/`: visão geral, objetivos e escopo do projeto.
- `requisitos/`: requisitos funcionais, não funcionais, de segurança e usabilidade.
- `regras-negocio/`: regras operacionais e administrativas do sistema.
- `casos-de-uso/`: casos de uso principais por ator e fluxo.
- `processos/`: modelagem textual dos processos que servem de base para BPMN.
- `arquitetura/`: arquitetura lógica, técnica e recomendações de diagramas.
- `banco-de-dados/`: modelagem relacional, entidades e relacionamentos.
- `api/`: documentação da API e especificação OpenAPI.
- `manuais/`: manuais por perfil e manual técnico do projeto.
- `testes/`: plano de testes e casos de teste.
- `implantacao/`: instruções de deploy, Docker e validação em ambiente real.
- `seguranca-lgpd/`: segurança, privacidade, retenção e alinhamento com LGPD.
- `changelog/`: histórico consolidado de evolução.

## Documentos de referência rápida

- [Visão do projeto](visao/documento-visao-projeto.md)
- [Documento de requisitos](requisitos/documento-requisitos.md)
- [Regras de negócio](regras-negocio/documento-regras-negocio.md)
- [Casos de uso principais](casos-de-uso/casos-de-uso-principais.md)
- [Modelagem de processos](processos/modelagem-processos.md)
- [Documentação da arquitetura](arquitetura/documentacao-arquitetura.md)
- [Documentação do banco de dados](banco-de-dados/documentacao-banco-dados.md)
- [Documentação da API](api/documentacao-api.md)
- [Manual técnico do projeto](manuais/manual-tecnico-projeto.md)
- [Validação em ambiente real](implantacao/validacao-ambiente-real.md)
- [Operação em produção](implantacao/operacao-producao.md)

## Observações importantes

- os documentos em `docs/` são a fonte oficial de texto do projeto;
- arquivos de TCC exportados em `.docx`, `.html` e `.pdf` são artefatos derivados e permanecem fora do repositório principal;
- o ambiente publicado já possui domínio, `HTTPS` e Resend configurados;
- a validação final ainda deve confirmar storage persistente para anexos, backup, restauração e monitoramento.
