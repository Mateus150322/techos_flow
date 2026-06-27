from __future__ import annotations

from pathlib import Path
import textwrap

from pypdf import PdfReader, PdfWriter, PageObject
from pypdf.generic import DictionaryObject, NameObject, StreamObject


PAGE_W = 595.28
PAGE_H = 841.89
MARGIN_X = 56
MARGIN_TOP = 64
MARGIN_BOTTOM = 56
LINE_HEIGHT = 14


def pdf_escape(text: str) -> str:
    text = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return text


def normalize_pdf_text(text: str) -> str:
    replacements = {
        "—": "-",
        "–": "-",
        "“": '"',
        "”": '"',
        "’": "'",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def wrap_text(text: str, width: int = 92) -> list[str]:
    if not text:
        return [""]
    return textwrap.wrap(text, width=width, break_long_words=False, replace_whitespace=False)


def add_text_pages(writer: PdfWriter, blocks: list[dict[str, object]]) -> None:
    page = None
    commands: list[str] = []
    y = 0
    page_number_start = len(writer.pages) + 1
    current_extra_page = 0

    def new_page() -> None:
        nonlocal page, commands, y, current_extra_page
        if page is not None:
            finish_page()
        current_extra_page += 1
        page = PageObject.create_blank_page(width=PAGE_W, height=PAGE_H)
        y = PAGE_H - MARGIN_TOP
        commands = []
        page[NameObject("/Resources")] = DictionaryObject(
            {
                NameObject("/Font"): DictionaryObject(
                    {
                        NameObject("/F1"): DictionaryObject(
                            {
                                NameObject("/Type"): NameObject("/Font"),
                                NameObject("/Subtype"): NameObject("/Type1"),
                                NameObject("/BaseFont"): NameObject("/Helvetica"),
                                NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
                            }
                        ),
                        NameObject("/F2"): DictionaryObject(
                            {
                                NameObject("/Type"): NameObject("/Font"),
                                NameObject("/Subtype"): NameObject("/Type1"),
                                NameObject("/BaseFont"): NameObject("/Helvetica-Bold"),
                                NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
                            }
                        ),
                    }
                )
            }
        )

    def finish_page() -> None:
        nonlocal page, commands
        if page is None:
            return
        footer = f"TechOS Flow - atualizacao de apendices | pagina {page_number_start + current_extra_page - 1}"
        commands.append(f"BT /F1 8 Tf {MARGIN_X} 28 Td ({pdf_escape(footer)}) Tj ET")
        stream = StreamObject()
        stream._data = ("\n".join(commands)).encode("latin-1", errors="replace")
        page[NameObject("/Contents")] = stream
        writer.add_page(page)

    def write_line(text: str, size: int = 10, bold: bool = False, leading: int | None = None) -> None:
        nonlocal y
        if page is None:
            new_page()
        actual_leading = leading or LINE_HEIGHT
        if y < MARGIN_BOTTOM + actual_leading:
            new_page()
        font = "F2" if bold else "F1"
        clean = normalize_pdf_text(text)
        commands.append(f"BT /{font} {size} Tf {MARGIN_X} {y:.2f} Td ({pdf_escape(clean)}) Tj ET")
        y -= actual_leading

    def write_paragraph(text: str, size: int = 10, width: int = 92, space_after: int = 8) -> None:
        for line in wrap_text(text, width=width):
            write_line(line, size=size)
        nonlocal y
        y -= space_after

    new_page()
    for block in blocks:
        kind = block.get("kind", "p")
        text = str(block.get("text", ""))
        if kind == "h1":
            y -= 8
            write_line(text.upper(), size=14, bold=True, leading=19)
            y -= 8
        elif kind == "h2":
            y -= 4
            write_line(text, size=12, bold=True, leading=17)
            y -= 4
        elif kind == "small":
            write_paragraph(text, size=8, width=110, space_after=5)
        elif kind == "list":
            items = block.get("items", [])
            for item in items:
                lines = wrap_text(str(item), width=88)
                first = True
                for line in lines:
                    prefix = "- " if first else "  "
                    write_line(prefix + line, size=10)
                    first = False
                y -= 2
            y -= 6
        elif kind == "table":
            rows = block.get("rows", [])
            for row in rows:
                text_row = " | ".join(str(x) for x in row)
                for line in wrap_text(text_row, width=100):
                    write_line(line, size=8.5)
                y -= 2
            y -= 8
        elif kind == "pagebreak":
            new_page()
        else:
            write_paragraph(text, size=10)
    finish_page()


def make_front_matter_page() -> PageObject:
    page = PageObject.create_blank_page(width=PAGE_W, height=PAGE_H)
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {
                    NameObject("/F1"): DictionaryObject(
                        {
                            NameObject("/Type"): NameObject("/Font"),
                            NameObject("/Subtype"): NameObject("/Type1"),
                            NameObject("/BaseFont"): NameObject("/Helvetica"),
                            NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
                        }
                    ),
                    NameObject("/F2"): DictionaryObject(
                        {
                            NameObject("/Type"): NameObject("/Font"),
                            NameObject("/Subtype"): NameObject("/Type1"),
                            NameObject("/BaseFont"): NameObject("/Helvetica-Bold"),
                            NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
                        }
                    ),
                }
            )
        }
    )

    lines = [
        ("LISTA DE FIGURAS", 13, True, 20),
        ("Figura A.1 - Diagrama de caso de uso do TechOS Flow.", 9, False, 13),
        ("Figura B.1 - Diagrama de contexto do TechOS Flow.", 9, False, 13),
        ("Figura C.1 - Diagrama de arquitetura em camadas do TechOS Flow.", 9, False, 13),
        ("Figura D.1 - Fluxo do ciclo da ordem de serviço.", 9, False, 13),
        ("Figura E.1 - Diagrama de sequência de login.", 9, False, 13),
        ("Figura F.1 - Diagrama de sequência de recuperação de senha.", 9, False, 13),
        ("Figura G.1 - Diagrama de sequência de envio de evidência com geolocalização.", 9, False, 13),
        ("Figura H.1 - Modelo entidade-relacionamento principal.", 9, False, 13),
        ("Figura H.2 - Modelo entidade-relacionamento estendido.", 9, False, 13),
        ("Figura H.3 - Diagrama de implantação.", 9, False, 13),
        ("Figura H.4 - Sequência de criação de OS geral.", 9, False, 13),
        ("Figura H.5 - Sequência de aceite e início da execução.", 9, False, 13),
        ("Figura H.6 - Sequência de finalização ou não execução.", 9, False, 13),
        ("Figura H.7 - Fluxo de relatórios e exportação.", 9, False, 19),
        ("LISTA DE QUADROS", 13, True, 20),
        ("Quadro 1 - Perfis contemplados pelo sistema.", 9, False, 13),
        ("Quadro 2 - Requisitos funcionais.", 9, False, 13),
        ("Quadro 3 - Requisitos não funcionais.", 9, False, 13),
        ("Quadro 4 - Tecnologias utilizadas.", 9, False, 13),
        ("Quadro 5 - Módulos do sistema.", 9, False, 13),
        ("Quadro 6 - Principais entidades do banco de dados.", 9, False, 13),
        ("Quadro 7 - Status utilizados no fluxo das ordens de serviço.", 9, False, 13),
        ("Quadro 8 - Prioridades utilizadas no sistema.", 9, False, 13),
        ("Quadro 9 - Controles de segurança e acesso.", 9, False, 13),
        ("Quadro 10 - Cenários representativos para homologação.", 9, False, 13),
        ("Quadro 11 - Estrutura de implantação.", 9, False, 13),
    ]

    y = PAGE_H - MARGIN_TOP
    commands: list[str] = []
    for text, size, bold, leading in lines:
        font = "F2" if bold else "F1"
        commands.append(
            f"BT /{font} {size} Tf {MARGIN_X} {y:.2f} Td ({pdf_escape(normalize_pdf_text(text))}) Tj ET"
        )
        y -= leading

    stream = StreamObject()
    stream._data = ("\n".join(commands)).encode("latin-1", errors="replace")
    page[NameObject("/Contents")] = stream
    return page


def main() -> None:
    base = Path(r"C:\Users\VAIO\Desktop\pasta tcc")
    source = base / "TCC_Mateus_Lima_atualizado.pdf"
    output = base / "TCC_Mateus_Lima_atualizado_revisado.pdf"

    reader = PdfReader(str(source))
    writer = PdfWriter()
    for index, page in enumerate(reader.pages, 1):
        if index == 7:
            writer.add_page(make_front_matter_page())
        else:
            writer.add_page(page)

    manual_tests = [
        ("CT01", "Login com usuário válido", "01-login-usuario-valido"),
        ("CT02", "Login com senha errada", "02-login-senha-errada"),
        ("CT03", "Recuperação de senha por e-mail", "03-recuperacao-de-senha"),
        ("CT04", "Dashboard do administrador com gráfico de status", "04-dashboard-admin-grafico-status"),
        ("CT05", "Cadastro, edição e desativação de usuário", "05-usuarios-cadastro-edicao-desativacao"),
        ("CT06", "Criar OS como atendente", "06-criar-os-atendente"),
        ("CT07", "Criar OS ETA/ETE como técnico", "07-criar-os-eta-ete-tecnico"),
        ("CT08", "Consultar OS por status", "08-consultar-os-por-status"),
        ("CT09", "Técnico aceitar OS", "09-tecnico-aceitar-os"),
        ("CT10", "Técnico iniciar execução", "10-tecnico-iniciar-execucao"),
        ("CT11", "Adicionar participante na finalização", "11-adicionar-participante-finalizacao"),
        ("CT12", "Finalizar OS com data fim correta", "12-finalizar-os-data-fim-correta"),
        ("CT13", "Mensagem de sucesso ou erro após finalizar", "13-mensagem-sucesso-ou-erro-finalizar"),
        ("CT14", "Marcar OS como não executada", "14-marcar-os-nao-executada"),
        ("CT15", "Enviar evidência/foto", "15-enviar-evidencia-foto"),
        ("CT16", "Enviar várias fotos na mesma evidência", "16-varias-fotos-mesma-evidencia"),
        ("CT17", "Testar geolocalização no celular", "17-geolocalizacao-celular"),
        ("CT18", "Ver anexos/fotos dentro dos detalhes da OS", "18-anexos-fotos-detalhes-os"),
        ("CT19", "Gerar PDF detalhado da OS", "19-gerar-pdf-detalhado-os"),
        ("CT20", "Gerar relatório administrativo", "20-gerar-relatorio-administrativo"),
        ("CT21", "Exportar relatório em CSV/XLSX/PDF", "21-exportar-relatorio-csv-xlsx-pdf"),
        ("CT22", "Conferir relatório de horas extras", "22-relatorio-horas-extras"),
        ("CT23", "Validar hora extra 50%, 100% e banco de horas", "23-validar-hora-extra-50-100-banco"),
        ("CT24", "Usuário sem permissão tentando acessar área restrita", "24-usuario-sem-permissao-area-restrita"),
        ("CT25", "Teste no celular: criar OS, abrir detalhes, finalizar e enviar foto", "25-fluxo-celular-criar-detalhes-finalizar-foto"),
    ]

    blocks: list[dict[str, object]] = [
        {"kind": "h1", "text": "Apêndice I - Evidências dos testes manuais"},
        {
            "text": "Este apêndice complementa a seção de testes do TechOS Flow com as evidências organizadas para a validação manual do sistema. As capturas foram separadas em pastas numeradas, preservando os arquivos originais e facilitando a conferência por requisito funcional.",
        },
        {
            "kind": "small",
            "text": r"Pasta de evidencias: C:\Users\VAIO\Desktop\print de teste projeto\SELECAO_FINAL_TCC_TESTES_MANUAIS",
        },
        {"kind": "h2", "text": "I.1 Quadro de testes manuais"},
        {
            "kind": "table",
            "rows": [("Código", "Cenário validado", "Resultado", "Evidência")] + [(code, desc, "Aprovado", folder) for code, desc, folder in manual_tests],
        },
        {
            "text": "Os cenários CT01 a CT25 validam os principais fluxos do sistema: autenticação, recuperação de senha, dashboards, cadastro e gestão de usuários, criação e consulta de ordens de serviço, aceite técnico, início e finalização da execução, participantes, evidências, geolocalização, anexos, PDF detalhado, relatórios administrativos, exportações, horas extras e controle de acesso por perfil.",
        },
        {"kind": "pagebreak"},
        {"kind": "h1", "text": "Apêndice J - Implantação em produção e validação técnica"},
        {
            "text": "Além do ambiente local utilizado durante o desenvolvimento, o TechOS Flow foi implantado em ambiente de produção para validação prática do acesso pela web. O frontend foi disponibilizado com domínio próprio e o backend foi publicado em serviço de hospedagem em nuvem, mantendo separação entre interface, API, banco de dados, armazenamento privado e serviço de e-mail.",
        },
        {"kind": "h2", "text": "J.1 Ambiente de produção"},
        {
            "kind": "list",
            "items": [
                "Frontend publicado em https://www.techosflow.com.br.",
                "Backend publicado em ambiente Railway, com API REST Laravel.",
                "Banco de dados PostgreSQL utilizado para persistência das informações operacionais, administrativas e de autenticação.",
                "Recuperação de senha configurada com envio de e-mail transacional por Resend.",
                "Domínio próprio configurado para acesso público ao sistema.",
                "Uso de HTTPS para suporte a autenticação, recuperação de senha e geolocalização no celular.",
                "Controle de versão mantido com Git e repositório remoto.",
            ],
        },
        {"kind": "h2", "text": "J.2 Validação técnica executada"},
        {
            "text": "Foram executadas validações técnicas no backend e no frontend para verificar regras de negócio, filtros, cálculo de horas extras, compilação TypeScript e geração do build de produção.",
        },
        {
            "kind": "list",
            "items": [
                "php artisan test --filter=DashboardApiTest: validação dos dashboards por perfil e consultas relacionadas.",
                "php artisan test --filter=HorasExtrasTest: validação do cálculo de horas extras, participantes, colaboradores operacionais, banco de horas e exportação.",
                "npm run lint: verificação estática do frontend.",
                "npx tsc -b: verificação de tipos TypeScript.",
                "npm run build: geração do build de produção do frontend.",
            ],
        },
        {
            "kind": "small",
            "text": r"Evidencias tecnicas complementares: C:\Users\VAIO\Desktop\print de teste projeto\SELECAO_FINAL_TCC_TESTES_MANUAIS\00-comprovantes-tecnicos-testes-build",
        },
        {"kind": "h2", "text": "J.3 Atualização dos resultados"},
        {
            "text": "Com a implantação em produção e a organização das evidências, os resultados do TechOS Flow passam a contemplar não apenas a implementação dos módulos planejados, mas também a validação dos fluxos principais em ambiente real de uso. A solução demonstrou capacidade de autenticar usuários por perfil, criar e acompanhar ordens de serviço, registrar execuções, anexar evidências com geolocalização, emitir relatórios, exportar dados e apoiar o controle administrativo de horas extras.",
        },
        {
            "text": "Essas evidências reforçam que os objetivos específicos definidos no trabalho foram atendidos: desenvolvimento de API Laravel, interface web em React e TypeScript, persistência em PostgreSQL, autenticação e controle por perfil, criação e execução de OS, registro de evidências georreferenciadas, relatórios operacionais e cálculo administrativo de horas extras.",
        },
        {"kind": "h2", "text": "J.4 Observação sobre trabalhos futuros"},
        {
            "text": "A integração com mapas externos e a evolução para uma aplicação mobile permanecem como trabalhos futuros. Entretanto, a validação atual já inclui uso no celular por meio do navegador, captura de geolocalização e registro de evidências fotográficas em ordens de serviço.",
        },
    ]

    add_text_pages(writer, blocks)

    with output.open("wb") as f:
        writer.write(f)

    print(output)
    print(f"paginas_originais={len(reader.pages)}")
    print(f"paginas_revisadas={len(writer.pages)}")


if __name__ == "__main__":
    main()
