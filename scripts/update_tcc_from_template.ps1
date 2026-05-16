param(
  [Parameter(Mandatory = $true)]
  [string]$TemplatePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputDocx,

  [Parameter(Mandatory = $false)]
  [string]$OutputPdf
)

$ErrorActionPreference = "Stop"

$wdAlignParagraphLeft = 0
$wdAlignParagraphCenter = 1
$wdAlignParagraphJustify = 3
$wdPageBreak = 7
$wdFormatDocumentDefault = 16
$wdFormatPDF = 17
$wdStyleNormal = -1
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4

function Add-Paragraph {
  param(
    $Selection,
    [string]$Text,
    [int]$Style = $wdStyleNormal,
    [int]$Alignment = $wdAlignParagraphJustify,
    [int]$Size = 12,
    [bool]$Bold = $false,
    [int]$SpaceAfter = 12,
    [int]$SpaceBefore = 0
  )

  $Selection.Style = $Style
  $Selection.ParagraphFormat.Alignment = $Alignment
  $Selection.ParagraphFormat.SpaceAfter = $SpaceAfter
  $Selection.ParagraphFormat.SpaceBefore = $SpaceBefore
  $Selection.Font.Name = "Times New Roman"
  $Selection.Font.Size = $Size
  $Selection.Font.Bold = [int]$Bold
  $Selection.TypeText($Text)
  $Selection.TypeParagraph()
}

function Add-Bullets {
  param(
    $Selection,
    [string[]]$Items
  )

  foreach ($item in $Items) {
    Add-Paragraph -Selection $Selection -Text ("• " + $item) -Style $wdStyleNormal -Alignment $wdAlignParagraphJustify -Size 12 -Bold:$false -SpaceAfter 6
  }
}

function Add-Reference {
  param(
    $Selection,
    [string]$Text
  )

  Add-Paragraph -Selection $Selection -Text $Text -Style $wdStyleNormal -Alignment $wdAlignParagraphLeft -Size 11 -Bold:$false -SpaceAfter 8
}

$template = (Resolve-Path $TemplatePath).Path
$outputDocxResolved = [System.IO.Path]::GetFullPath($OutputDocx)
$outputPdfResolved = if ($OutputPdf) { [System.IO.Path]::GetFullPath($OutputPdf) } else { $null }

$word = $null
$doc = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $doc = $word.Documents.Open($template)
  $doc.SaveAs([ref]$outputDocxResolved, [ref]$wdFormatDocumentDefault)

  $selection = $word.Selection
  $doc.Content.Delete()
  $selection.HomeKey(6) | Out-Null

  Add-Paragraph -Selection $selection -Text "CENTRO UNIVERSITÁRIO UNINORTE" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$true -SpaceAfter 6
  Add-Paragraph -Selection $selection -Text "CURSO DE BACHARELADO EM SISTEMAS DE INFORMAÇÃO" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$true -SpaceAfter 80
  Add-Paragraph -Selection $selection -Text "MATEUS LIMA DA SILVA BRAGA" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$true -SpaceAfter 80
  Add-Paragraph -Selection $selection -Text "TechOS Flow: sistema web para gestão digital de ordens de serviço no setor de saneamento" -Alignment $wdAlignParagraphCenter -Size 14 -Bold:$true -SpaceAfter 50
  Add-Paragraph -Selection $selection -Text "Trabalho apresentado ao curso de graduação em Sistemas de Informação do Centro Universitário Uninorte, como atualização do projeto TechOS Flow, consolidando a evolução da proposta inicial para uma solução web funcional, segura e orientada à gestão operacional." -Alignment $wdAlignParagraphJustify -Size 12 -Bold:$false -SpaceAfter 18
  Add-Paragraph -Selection $selection -Text "Professor: Rodrigo Garcia" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$false -SpaceAfter 120
  Add-Paragraph -Selection $selection -Text "RIO BRANCO" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$false -SpaceAfter 6
  Add-Paragraph -Selection $selection -Text "2026" -Alignment $wdAlignParagraphCenter -Size 12 -Bold:$false -SpaceAfter 0
  $selection.InsertBreak($wdPageBreak)

  Add-Paragraph -Selection $selection -Text "RESUMO" -Style $wdStyleHeading1 -Alignment $wdAlignParagraphLeft -Size 12 -Bold:$true -SpaceAfter 16
  Add-Paragraph -Selection $selection -Text "O presente trabalho apresenta a atualização do projeto TechOS Flow, sistema web desenvolvido para digitalizar o fluxo de ordens de serviço no contexto operacional do setor de saneamento. A proposta evoluiu de um modelo conceitual para uma solução funcional com autenticação, controle por perfis, abertura de ordens, execução técnica, anexos com evidências, indicadores gerenciais, relatórios com exportação e gestão administrativa de usuários." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "A arquitetura adotada utiliza backend em Laravel com PostgreSQL, frontend em React com TypeScript e autenticação baseada em Sanctum. O sistema foi estruturado em torno de três perfis principais: atendente, técnico e administrador. O atendente realiza abertura e consulta de OS; o técnico atua na aceitação, execução, finalização, registro de não execução e envio de evidências; e o administrador acompanha a operação por meio de dashboards, relatórios e gestão de usuários." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Entre as melhorias consolidadas na versão atual destacam-se o endurecimento das regras de autorização, armazenamento privado de anexos, inativação de usuários, troca obrigatória de senha no primeiro acesso, geolocalização de evidências, relatórios em CSV, XLSX e PDF, otimizações de desempenho em dashboards e relatórios, e ações práticas de privacidade alinhadas à LGPD. Como resultado, o TechOS Flow deixou de ser apenas um protótipo conceitual e passou a representar uma aplicação demonstrável, organizada e pronta para entrega acadêmica e evolução futura." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Palavras-chave: ordem de serviço; saneamento; sistema web; gestão operacional; privacidade; relatórios." -Alignment $wdAlignLeft -Size 11 -Bold:$false -SpaceAfter 14

  Add-Paragraph -Selection $selection -Text "1. INTRODUÇÃO" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "A gestão de ordens de serviço é essencial em organizações com operação contínua, especialmente em ambientes como o saneamento, nos quais a abertura, a execução e o encerramento de atividades precisam ocorrer com rastreabilidade, rapidez e confiabilidade. O cenário que motivou o TechOS Flow partiu de processos predominantemente manuais, baseados em formulários físicos, registros dispersos e baixo aproveitamento de dados gerenciais." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "A proposta inicial do projeto consistia em transformar esse fluxo em um sistema web capaz de padronizar registros, reduzir retrabalho, apoiar a comunicação interna e fornecer indicadores úteis à gestão. Ao longo do desenvolvimento, o escopo foi amadurecido até resultar em uma aplicação com separação clara entre perfis, regras de negócio coerentes, relatórios gerenciais, anexos com evidências e medidas concretas de segurança e privacidade." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Esta atualização do TCC apresenta o estado real do projeto após sua implementação, substituindo trechos originalmente projetados como expectativa por funcionalidades efetivamente entregues. Assim, o documento passa a refletir o sistema como produto funcional e não apenas como concepção inicial." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "OBJETIVO GERAL" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12 -SpaceBefore 8
  Add-Paragraph -Selection $selection -Text "Consolidar e documentar a versão implementada do TechOS Flow, demonstrando como o sistema digitaliza o ciclo de vida das ordens de serviço e oferece suporte operacional e gerencial ao setor de saneamento." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "OBJETIVOS ESPECÍFICOS" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12 -SpaceBefore 8
  Add-Bullets -Selection $selection -Items @(
    "Apresentar a arquitetura e o conjunto de tecnologias utilizados na solução.",
    "Descrever o comportamento dos perfis atendente, técnico e administrador.",
    "Registrar as funcionalidades implementadas no fluxo de OS, execução e evidências.",
    "Demonstrar os mecanismos de segurança, privacidade e rastreabilidade já incorporados ao projeto.",
    "Evidenciar os resultados alcançados e as melhorias aplicadas ao longo da evolução do sistema."
  )

  Add-Paragraph -Selection $selection -Text "2. FUNDAMENTAÇÃO TEÓRICA" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "O desenvolvimento do TechOS Flow manteve como base conceitual os sistemas de informação, a gestão de processos, a inovação tecnológica e as boas práticas de engenharia de software. Na prática, esses pilares se materializam na centralização dos dados da OS, no controle do fluxo operacional, na geração de informação gerencial e na estrutura modular que permite manutenção e evolução contínua." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "A evolução do projeto também passou a considerar requisitos não funcionais mais fortes, como autenticação, autorização por perfil, proteção de anexos, privacidade no tratamento de dados pessoais, desempenho das consultas e organização da base de código. Esse movimento aproximou o sistema de referências como ISO/IEC/IEEE 12207, ISO/IEC/IEEE 29148, ISO/IEC 25010, ISO/IEC 27001, ISO/IEC 27701 e LGPD, tratadas no projeto como guias de alinhamento técnico e operacional." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "2.1 Relação entre a base teórica e a solução" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12 -SpaceBefore 8
  Add-Bullets -Selection $selection -Items @(
    "Sistemas de informação: centralização de OS, dados operacionais, indicadores e relatórios.",
    "Gestão de processos: padronização do fluxo de abertura, execução, finalização, não execução e evidências.",
    "Inovação tecnológica: substituição do papel por rastreabilidade digital, dashboards e exportações gerenciais.",
    "Engenharia de software: arquitetura separada em backend e frontend, refatorações incrementais e testes automatizados.",
    "Privacidade e segurança: anexos privados, inativação de usuários, troca obrigatória de senha e minimização de dados."
  )

  Add-Paragraph -Selection $selection -Text "3. METODOLOGIA" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "O projeto foi conduzido de forma incremental. A primeira etapa concentrou-se na modelagem do domínio e na definição do fluxo de ordens de serviço. Em seguida, foram implementadas as camadas essenciais de autenticação, cadastro de ordens, perfis de acesso e persistência em banco relacional. Posteriormente, o foco passou para o fechamento do bloco do técnico, seguido pelo bloco administrativo, melhorias de qualidade, segurança, privacidade e desempenho." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Esse processo iterativo permitiu validar funcionalidades por módulo, revisar incoerências entre frontend e backend, remover duplicações, reforçar autorização e melhorar a organização interna da base de código sem reescrever a arquitetura do zero. O trabalho combinou análise de requisitos, implementação prática, refatoração orientada a risco e validação contínua por testes e compilação." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Como estratégia, adotou-se evolução incremental com foco em fechamento por bloco funcional, correções mínimas com valor real e priorização de riscos de segurança, privacidade, desempenho e coerência operacional." -SpaceAfter 12

  Add-Paragraph -Selection $selection -Text "4. DESENVOLVIMENTO DO SISTEMA" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "4.1 Visão Geral da Solução" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12
  Add-Paragraph -Selection $selection -Text "O TechOS Flow é um sistema web para criação, execução, monitoramento e encerramento de ordens de serviço no saneamento, substituindo formulários físicos e centralizando o fluxo operacional. A solução foi implementada com backend em Laravel, banco PostgreSQL, frontend em React com TypeScript, autenticação com Sanctum e interface modular organizada por perfis." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "4.2 Perfis e regras de negócio implementadas" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12
  Add-Bullets -Selection $selection -Items @(
    "Atendente: abertura de OS geral, consulta de ordens e acompanhamento básico da operação.",
    "Técnico: criação de OS ETA/ETE, aceite de OS, início, finalização, não execução e envio de evidências.",
    "Administrador: indicadores, relatórios gerenciais, exportações e gestão de usuários."
  )
  Add-Paragraph -Selection $selection -Text "As regras de negócio foram endurecidas ao longo do projeto. O técnico não pode criar OS geral, não pode operar OS de outro técnico e só acessa anexos das ordens às quais está vinculado. O administrador possui visão gerencial, mas não executa o fluxo operacional técnico. O atendente permanece concentrado na abertura e na consulta." -SpaceAfter 10

  Add-Paragraph -Selection $selection -Text "4.3 Funcionalidades implementadas" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12
  Add-Paragraph -Selection $selection -Text "4.3.1 Autenticação e controle de acesso" -Style $wdStyleHeading3 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 8
  Add-Bullets -Selection $selection -Items @(
    "Login, logout e endpoint de sessão.",
    "Redirecionamento por perfil após autenticação.",
    "Primeiro acesso com troca obrigatória de senha forte.",
    "Inativação de usuários com bloqueio de login e de rotas protegidas.",
    "Controle de permissão por perfil e por vínculo com a OS."
  )
  Add-Paragraph -Selection $selection -Text "4.3.2 Fluxo operacional da ordem de serviço" -Style $wdStyleHeading3 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 8
  Add-Bullets -Selection $selection -Items @(
    "Abertura de OS geral pelo atendente.",
    "Abertura de OS técnica do tipo Manutenção ETA/ETE.",
    "Consulta, busca e detalhamento de ordens.",
    "Aceite de OS pelo técnico.",
    "Início da execução, finalização e registro de não execução.",
    "Histórico de execuções vinculado à ordem."
  )
  Add-Paragraph -Selection $selection -Text "4.3.3 Evidências e anexos" -Style $wdStyleHeading3 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 8
  Add-Bullets -Selection $selection -Items @(
    "Upload de foto, PDF e arquivos compatíveis.",
    "Geolocalização da evidência com latitude, longitude, precisão e momento da captura.",
    "Ligação com Google Maps por URL simples, sem custo de API.",
    "Exibição de endereço operacional da OS com recorte mínimo: rua, bairro, cidade e estado.",
    "Armazenamento privado dos anexos e leitura por rota autenticada."
  )
  Add-Paragraph -Selection $selection -Text "4.3.4 Módulo administrativo" -Style $wdStyleHeading3 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 8
  Add-Bullets -Selection $selection -Items @(
    "Dashboard com totais por status, produtividade e atividade recente.",
    "Relatórios por status, período, tipo de serviço e produtividade dos técnicos.",
    "Exportações reais em CSV, XLSX e PDF.",
    "Gestão de usuários com criação, edição, confirmação de senha e inativação/reativação."
  )

  Add-Paragraph -Selection $selection -Text "4.4 Segurança, privacidade e conformidade" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12
  Add-Paragraph -Selection $selection -Text "O projeto incorporou melhorias práticas de segurança e privacidade. Entre elas estão anexos privados, autorização específica para visualização de evidências, primeiro acesso com senha forte, inativação de usuários, minimização de dados nos relatórios, política mínima de privacidade e retenção e rotina manual de revisão de anexos antigos. Essas medidas foram guiadas por referências de qualidade, segurança e privacidade, incluindo ISO/IEC 27001, ISO/IEC 27701 e LGPD." -SpaceAfter 10
  Add-Bullets -Selection $selection -Items @(
    "Autenticação implementada com Sanctum, logout, sessão reativa e bloqueios por status do usuário.",
    "Autorização controlada por perfil e por regra de negócio da OS.",
    "Anexos privados, com acesso auditável e restrição por vínculo com a ordem.",
    "Dados minimizados em relatórios e política mínima documentada.",
    "Comando de revisão de retenção de anexos antigos."
  )

  Add-Paragraph -Selection $selection -Text "4.5 Qualidade, desempenho e manutenção" -Style $wdStyleHeading2 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 12
  Add-Paragraph -Selection $selection -Text "Além das funcionalidades, o projeto passou por uma fase extensa de refatoração e endurecimento técnico. Houve centralização de sessão, tema global, remoção de código morto, fatiamento de componentes grandes, extração de lógica compartilhada, paginação real nas consultas, dashboards com agregação no backend e otimizações nos relatórios para reduzir carga de memória." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "As consultas principais deixaram de baixar todas as ordens para o navegador, a geração de relatórios passou a combinar paginação e exportação sob demanda e o CSV passou a ser gerado por stream. Também foram adicionados índices úteis no banco para melhorar o comportamento das listagens e buscas." -SpaceAfter 12

  Add-Paragraph -Selection $selection -Text "5. RESULTADOS ALCANÇADOS E AVALIAÇÃO" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "A atualização do projeto demonstra que o TechOS Flow saiu de uma proposta planejada para um sistema web efetivamente implementado, com fluxo operacional fechado e módulo administrativo funcional. Os principais resultados observados foram a digitalização completa do fluxo principal de OS, a separação coerente dos perfis, a disponibilização de relatórios e indicadores gerenciais, o fortalecimento de segurança e privacidade e a melhoria de manutenção e desempenho da base de código." -SpaceAfter 10
  Add-Bullets -Selection $selection -Items @(
    "Digitalização completa do fluxo principal de OS.",
    "Separação coerente dos perfis atendente, técnico e administrador.",
    "Disponibilização de relatórios e indicadores gerenciais.",
    "Fortalecimento de segurança, privacidade e autorização.",
    "Melhoria de manutenção e desempenho da base de código."
  )
  Add-Paragraph -Selection $selection -Text "Em termos de validação técnica, o estado atual do projeto apresenta 35 testes backend passando, 113 assertions registradas, lint do frontend sem pendências e validação TypeScript concluída com sucesso. Isso reforça que o projeto já ultrapassou a etapa de prototipação e atingiu maturidade suficiente para apresentação acadêmica e demonstração funcional consistente." -SpaceAfter 12

  Add-Paragraph -Selection $selection -Text "6. CONCLUSÃO" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Paragraph -Selection $selection -Text "A atualização do TechOS Flow mostra que o projeto evoluiu substancialmente em relação ao documento inicial. O que antes era apresentado majoritariamente como proposta passou a existir como sistema funcional, com fluxo operacional consistente, módulo administrativo estruturado, controles de segurança, medidas de privacidade e base técnica organizada." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "O trabalho alcança seu objetivo ao demonstrar uma solução digital viável para gestão de ordens de serviço no setor de saneamento, com valor tanto operacional quanto gerencial. O sistema já se encontra adequado para apresentação acadêmica, demonstração funcional e continuidade de evolução." -SpaceAfter 10
  Add-Paragraph -Selection $selection -Text "Como trabalhos futuros, destacam-se a publicação em ambiente real, aprofundamento da governança de privacidade, eventual transformação em aplicativo ou PWA, integração com e-mail para recuperação de senha e ampliação da documentação institucional de operação, segurança e conformidade." -SpaceAfter 12

  Add-Paragraph -Selection $selection -Text "REFERÊNCIAS" -Style $wdStyleHeading1 -Alignment $wdAlignLeft -Size 12 -Bold:$true -SpaceAfter 16 -SpaceBefore 10
  Add-Reference -Selection $selection -Text "ANDREASSI, Tales. Gestão da Inovação Tecnológica. Porto Alegre: Cengage Learning Brasil, 2012."
  Add-Reference -Selection $selection -Text "BRASIL. Lei n.º 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD)."
  Add-Reference -Selection $selection -Text "CORRÊA, Henrique L.; CAON, Mauro. Gestão de serviços: lucratividade por meio de operações e de satisfação dos clientes. Rio de Janeiro: Atlas, 2012."
  Add-Reference -Selection $selection -Text "KROENKE, David M. Sistemas de informação gerenciais. Rio de Janeiro: Saraiva, 2012."
  Add-Reference -Selection $selection -Text "O'BRIEN, James A.; MARAKAS, George M. Administração de sistemas de informação. Porto Alegre: AMGH, 2012."
  Add-Reference -Selection $selection -Text "OLIVEIRA, Djalma de Pinho Rebouças de. Administração de processos. Rio de Janeiro: Atlas, 2019."
  Add-Reference -Selection $selection -Text "PRESSMAN, Roger S.; MAXIM, Bruce R. Engenharia de software. 9. ed. Porto Alegre: AMGH, 2021."
  Add-Reference -Selection $selection -Text "TIDD, Joe; BESSANT, John. Gestão da inovação. 5. ed. Porto Alegre: Bookman, 2015."

  $doc.Save()

  if ($outputPdfResolved) {
    $doc.ExportAsFixedFormat($outputPdfResolved, $wdFormatPDF)
  }
}
finally {
  if ($doc -ne $null) {
    $doc.Close()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
  }

  if ($word -ne $null) {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
