# Documentação do Projeto

Esta pasta concentra a documentação funcional, técnica e acadêmica do `TechOS Flow`.

## Estado atual

- documentação central revisada para refletir o comportamento real do sistema;
- textos normalizados em UTF-8;
- novos artefatos de modelagem disponíveis em `docs/diagramas`;
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
- `diagramas/`: fontes Mermaid e PlantUML para geração de artefatos visuais.
- `issues/`: backlog e histórico de issues do projeto.
- `changelog/`: histórico consolidado de evolução.
- `tcc_media/`: artefatos acadêmicos auxiliares e imagens exportadas.

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
- [Guia de estrutura do TCC](tcc_media/guia-estrutura-tcc.md)
- [TCC consolidado com apêndices e figuras](tcc_media/TCC_consolidado_2026-05-28.md)
- [TCC pronto para colar no Word](tcc_media/TCC_pronto_para_word.txt)
- [TCC final formatado em HTML](tcc_media/TCC_final_formatado.html)
- [TCC final formatado em RTF](tcc_media/TCC_final_formatado.rtf)
- [TCC final em DOCX no padrão UNINORTE/ABNT](tcc_media/TCC_final_UNINORTE_ABNT.docx)
- [Revisão do TCC para banca](tcc_media/revisao_banca_tcc_2026-05-28.md)

## Diagramas e modelagens

Os arquivos-fonte para diagramas e imagens dos artefatos estão em:

- [Índice de diagramas](diagramas/README.md)
- [Prompt mestre para artefatos visuais](diagramas/prompt-artefatos-visuais.md)

## Observações importantes

- os documentos em `docs/` são a fonte oficial de texto do projeto;
- arquivos de TCC exportados em `.docx`, `.html` e `.pdf` devem ser regenerados quando a documentação-base for alterada;
- o ambiente publicado já possui domínio, `HTTPS` e Resend configurados;
- a validação final ainda deve confirmar storage persistente para anexos, backup, restauração e monitoramento.
