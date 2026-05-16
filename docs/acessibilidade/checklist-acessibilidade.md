# Checklist de Acessibilidade

## Objetivo

Este documento registra uma checagem prática de acessibilidade do frontend do TechOS Flow, com foco em navegação por teclado, leitura por tecnologias assistivas e contraste visual.

## Testes automatizados

No frontend, a suíte básica de acessibilidade pode ser executada com:

```bash
npm run test:a11y
```

Cobertura inicial:

- `ThemeToggle`
- `AdminShell`
- `TabelaOrdensSection`

Esses testes validam estrutura semântica básica e fazem verificação com `axe`.

## Checklist visual e funcional

### Navegação por teclado

- `OK` O usuário consegue usar `Tab` para navegar pelos controles principais.
- `OK` Existe link “Pular para o conteúdo principal” nas áreas protegidas.
- `OK` O modal técnico fecha com `Esc` e mantém o foco preso enquanto está aberto.
- `Pendente` Revisar navegação por teclado em todas as telas administrativas secundárias após novas alterações visuais.

### Formulários

- `OK` Campos principais possuem rótulo visível ou nome acessível.
- `OK` Mensagens de erro relevantes usam `role="alert"`.
- `OK` Mensagens de sucesso ou atualização usam `role="status"` quando apropriado.
- `Pendente` Revisar futuras telas novas para evitar uso exclusivo de `placeholder` como identificação.

### Tabelas

- `OK` Tabelas operacionais e administrativas revisadas possuem `caption`.
- `OK` Cabeçalhos principais usam `scope="col"`.
- `OK` A primeira coluna relevante usa `scope="row"` nas linhas de dados.
- `Pendente` Sempre repetir esse padrão em novas tabelas do sistema.

### Contraste visual

Verificações manuais recomendadas:

- `OK` Texto principal sobre fundo do card
- `OK` Texto principal sobre fundo da página
- `OK` Texto de botão primário
- `OK` Texto de botão secundário contornado
- `OK` Cabeçalho de tabela com texto branco
- `OK` Badges de status com texto visível
- `Pendente` Validar com ferramenta de contraste antes de publicação externa sempre que a paleta for alterada

Pontos críticos para revisão manual:

- fundos suaves com texto secundário
- badges de aviso e erro
- estados `hover` em tema escuro
- painéis administrativos com informação densa

### Relatórios e PDF

- `OK` A interface dos relatórios respeita o tema do sistema.
- `OK` O PDF continua em fundo branco e não depende do modo escuro.
- `Pendente` Revisar periodicamente o contraste de tabelas e blocos do PDF após ajustes de layout.

## Boas práticas para manutenção

- Manter texto de status sempre visível, sem depender apenas de cor.
- Toda ação com ícone deve ter texto visível ou `aria-label`.
- Todo modal novo deve ter `role="dialog"`, `aria-modal`, suporte a `Esc` e controle de foco.
- Toda nova área com carregamento assíncrono deve considerar `aria-busy`, `role="status"` ou `role="alert"`.
- Toda tabela nova deve nascer com `caption`, `scope` e botões com nome acessível.

## Próximos passos recomendados

- Adicionar testes de acessibilidade para `HorasExtrasPage`, `UsuariosPage` e `TecnicoOSDetailsModal`.
- Incluir revisão automatizada de acessibilidade no fluxo de CI quando houver pipeline de frontend.
- Complementar a validação com ferramenta de contraste visual em ambiente de homologação.
