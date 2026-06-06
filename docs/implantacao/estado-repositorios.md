# Estado dos Repositórios

## 1. Referência atual

- branch principal: `main`
- commit local/GitHub/GitLab atual: `310fceb Update deployment docs and repository status`
- repositório usado pelo Railway: GitHub `Mateus150322/techos_flow`
- GitLab: espelho secundário para histórico e pipeline

## 2. Blocos de commits já sincronizados

### Deploy Railway, Apache e banco

- `86d5de9` desativa conflito de módulos Apache no Docker de produção.
- `c4f78a5` corrige MPM do Apache no Railway.
- `8795c27` ajusta o Apache para a porta esperada pelo Railway.
- `191fccc` melhora o script de inicialização de produção.
- `c9a5db0` aceita variáveis de banco do Railway/PostgreSQL.
- `004c3cb` força novo deploy no Railway.

### Saúde da aplicação e e-mail

- `e47da1d` retorna resposta de saúde na raiz do backend.
- `652cc45` adiciona transporte de e-mail via Resend.

### Fluxos de OS, usabilidade e performance

- `8fb28fe` melhora fluxos de OS, anexos, geolocalização com Leaflet, acessibilidade, relatórios e índices de performance.

### Consulta do técnico

- `9e2a1ad` corrige filtro de status na consulta de OS do técnico e amplia testes do dashboard.

### Texto do botão

- `49a5c5a` remove `ETA/ETE` do botão de criação de OS do técnico.

### Documentação de deploy

- `310fceb` atualiza documentação de implantação e estado dos repositórios.

## 3. Migração do banco de produção

O ambiente online passou a usar o Postgres interno do Railway em vez do Neon. A migração copiou os dados principais para o banco Railway e o backend passou a se conectar pelo endpoint privado `postgres.railway.internal`.

Resultado medido no navegador após a mudança:

- `login`: cerca de 682 ms;
- dashboard técnico: cerca de 478 ms.

Antes da migração, essas chamadas estavam próximas de 3 segundos.

## 4. Comando de sincronização

```bash
git push origin main
```

Depois de novas alterações, o GitLab deve apontar para o mesmo commit da `main` local/GitHub.
