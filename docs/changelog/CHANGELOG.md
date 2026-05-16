# Changelog

Este arquivo registra a evolução funcional e técnica do TechOS Flow.

## [0.10.0] - 2026-05-16

### Adicionado

- recuperação de senha por e-mail com Zoho Mail;
- PDF detalhado por ordem de serviço;
- módulo de horas extras e banco de folgas;
- seleção estruturada de equipe por execução;
- testes automatizados de acessibilidade no frontend;
- navegação e formulários melhorados para smartphone;
- domínios locais de desenvolvimento com `techosflow.test`.

### Corrigido

- restrição de leitura de OS para o técnico enxergar apenas ordens sem responsável ou atribuídas a ele;
- mensagens de erro padronizadas em português;
- inconsistências de finalização de execução em estados parcialmente fechados;
- consultas excessivas no frontend com debounce e melhorias de carregamento.

### Melhorado

- tema institucional com modo claro padrão e modo escuro opcional;
- dashboards, relatórios e páginas administrativas;
- documentação técnica, de implantação e de uso;
- estrutura mobile e acessibilidade dos fluxos principais;
- exportações em PDF com visual mais institucional.

### Segurança

- throttle no login e nas rotas públicas de recuperação;
- revogação de tokens antigos no novo login;
- política de senha forte;
- recuperação de senha com token temporário;
- proteção reforçada das rotas administrativas no frontend e no backend.

## [0.9.0] - 2026-04-30

### Adicionado

- fluxo operacional completo de OS por perfil;
- dashboards por perfil;
- anexos privados com geolocalização;
- relatórios administrativos com exportação;
- gestão de usuários com primeiro acesso e inativação.

### Melhorado

- otimizações de consultas e paginação;
- documentação inicial do projeto;
- minimização de dados em relatórios e visualização de OS.

## Modelo para próximas versões

```md
## [X.Y.Z] - AAAA-MM-DD

### Adicionado
- item

### Corrigido
- item

### Melhorado
- item

### Segurança
- item
```
