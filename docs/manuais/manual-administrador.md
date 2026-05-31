# Manual do Usuário — Administrador

## 1. Objetivo do perfil

O administrador possui visão gerencial e administrativa do sistema. Ele acompanha indicadores, relatórios, horas extras, PDF detalhado da OS, gestão de usuários e gestão de colaboradores operacionais.

## 2. Acesso ao sistema

1. Informe e-mail e senha na tela de login.
2. Se o usuário estiver ativo e sem troca pendente, o sistema direciona para o dashboard administrativo.
3. Se necessário, use `Esqueci minha senha` para recuperar o acesso.

## 3. Navegação principal

O administrador utiliza principalmente:

- dashboard principal;
- `Consultar OS`;
- `Relatórios`;
- `Horas Extras`;
- `Usuários`.

## 4. Funcionalidades disponíveis

### 4.1 Dashboard administrativo

Exibe indicadores como:

- total de ordens;
- abertas;
- em execução;
- encerradas;
- distribuição por status;
- tipos de serviço;
- produtividade;
- atividade recente.

### 4.2 Relatórios

O administrador pode:

- aplicar filtros por status, tipo, prioridade, técnico e período;
- consultar contexto operacional;
- visualizar gargalos, fila e resultados;
- exportar em `PDF`, `Excel` e `CSV`;
- abrir o PDF detalhado da OS.

Observações importantes:

- `Excel` e `CSV` ficam agrupados em menu de exportação de planilha;
- `PDF` permanece como ação separada;
- em telas pequenas, os resultados passam a aparecer em cards responsivos para manter a leitura sem rolagem horizontal;
- no relatório de OS em PDF por período, o sistema mantém o resumo geral no topo e organiza as ordens de serviço em blocos individuais abaixo;
- cada bloco da OS pode mostrar as evidências fotográficas vinculadas àquela ordem, com dados de geolocalização da própria evidência;
- o CSV agora usa `;` como separador para abrir melhor no Excel em ambiente pt-BR.

### 4.3 Relatório mensal de OS em PDF

Quando o administrador exporta o relatório de OS em PDF, o documento pode apresentar:

- resumo geral do período no topo;
- blocos organizados por OS;
- informações da OS, como número, tipo, status, prioridade, cliente/local e responsável;
- fotos da evidência ligadas àquela OS;
- geolocalização da evidência, quando disponível.

Importante:

- a geolocalização exibida na evidência é diferente do endereço cadastral da OS;
- o PDF detalhado da OS continua sendo um documento diferente do relatório geral por período.

### 4.4 Relatório de horas extras

Permite:

- filtrar por participante, mês, ano e período;
- visualizar horas 50% e 100%;
- visualizar horas pagas e banco;
- identificar usuários e colaboradores operacionais;
- exportar os dados.

No smartphone, o consolidado por participante também é exibido em cards, preservando os dados principais sem depender da tabela larga do desktop.

### 4.5 Gestão de usuários

Permite:

- listar usuários;
- filtrar por papel e status;
- criar e editar usuários;
- ajustar `valor_hora`;
- inativar e reativar acessos.

Em telas pequenas, a listagem administrativa de usuários troca a tabela por cards com ações diretas de edição e status.

### 4.6 Gestão de colaboradores operacionais

Permite:

- listar auxiliares e demais colaboradores sem login;
- cadastrar nome, função e valor-hora;
- editar dados;
- ativar e inativar colaboradores.

Assim como em usuários, a área de colaboradores operacionais apresenta cartões no mobile para evitar quebra de layout.

### 4.7 Visualização de anexos e miniaturas

Nos detalhes da OS, o administrador pode:

- visualizar miniaturas de imagens anexadas;
- abrir o arquivo completo;
- verificar geolocalização capturada na evidência, quando houver.

## 5. Ações permitidas

- consultar indicadores, ordens e relatórios;
- exportar relatórios;
- emitir PDF detalhado da OS;
- consultar horas extras;
- gerenciar usuários;
- gerenciar colaboradores operacionais.

## 6. Ações não recomendadas

- compartilhar exportações fora do contexto administrativo;
- manter usuários ou colaboradores inativos como ativos sem necessidade;
- expor relatórios operacionais sem necessidade funcional ou gerencial.

## 7. Erros comuns

| Situação | Causa provável | Como resolver |
| --- | --- | --- |
| Não foi possível gerar relatório | filtro inválido ou resposta temporariamente indisponível | revisar filtros e tentar novamente |
| Não foi possível exportar planilha | formato inválido ou volume excessivo | revisar formato e reduzir o recorte |
| Não é possível remover o último administrador ativo | regra de proteção do sistema | manter ao menos um administrador ativo |
| Não é possível inativar o próprio acesso em contexto crítico | regra de segurança | solicitar apoio de outro administrador |
| Erro ao criar usuário | senha fraca ou e-mail duplicado | revisar os dados informados |

## 8. Boas práticas

- revisar periodicamente usuários ativos e inativos;
- revisar colaboradores operacionais sem login;
- exportar relatórios apenas quando necessário;
- acompanhar anexos e evidências somente quando houver finalidade legítima;
- validar o ambiente publicado com `HTTPS`, storage persistente e SMTP real antes de homologar.
