from __future__ import annotations

from pathlib import Path
import re
import shutil
import zipfile
import xml.etree.ElementTree as ET


W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"

for prefix, uri in {
    "w": W,
    "r": R,
    "wp": WP,
    "a": A,
    "pic": PIC,
}.items():
    ET.register_namespace(prefix, uri)


def qn(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def read_docx_paragraphs(path: Path) -> list[str]:
    ns = {"w": W}
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    out: list[str] = []
    for p in root.findall(".//w:body/w:p", ns):
        text = "".join((t.text or "") for t in p.findall(".//w:t", ns)).strip()
        if text:
            out.append(text)
    return out


def image_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    if data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data) - 10:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            i += 2
            if marker in (0xD8, 0xD9):
                continue
            seg = int.from_bytes(data[i : i + 2], "big")
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h = int.from_bytes(data[i + 3 : i + 5], "big")
                w = int.from_bytes(data[i + 5 : i + 7], "big")
                return w, h
            i += seg
    raise ValueError(f"Formato de imagem não suportado: {path}")


def scaled_emu(path: Path, max_w_in: float = 5.9, max_h_in: float = 7.0) -> tuple[int, int]:
    w_px, h_px = image_size(path)
    w_emu = w_px * 9525
    h_emu = h_px * 9525
    max_w = int(max_w_in * 914400)
    max_h = int(max_h_in * 914400)
    scale = min(max_w / w_emu, max_h / h_emu, 1.0)
    return int(w_emu * scale), int(h_emu * scale)


def make_p(
    text: str = "",
    *,
    align: str | None = None,
    bold: bool = False,
    size: int = 24,
    font: str = "Times New Roman",
    style: str | None = None,
    first_line: bool = False,
    line: int = 360,
    before: int = 0,
    after: int = 0,
    page_break_before: bool = False,
) -> ET.Element:
    p = ET.Element(qn(W, "p"))
    ppr = ET.SubElement(p, qn(W, "pPr"))
    if style:
        pstyle = ET.SubElement(ppr, qn(W, "pStyle"))
        pstyle.set(qn(W, "val"), style)
    if page_break_before:
        ET.SubElement(ppr, qn(W, "pageBreakBefore"))
    if align:
        jc = ET.SubElement(ppr, qn(W, "jc"))
        jc.set(qn(W, "val"), align)
    spacing = ET.SubElement(ppr, qn(W, "spacing"))
    spacing.set(qn(W, "before"), str(before))
    spacing.set(qn(W, "after"), str(after))
    spacing.set(qn(W, "line"), str(line))
    spacing.set(qn(W, "lineRule"), "auto")
    if first_line:
        ind = ET.SubElement(ppr, qn(W, "ind"))
        ind.set(qn(W, "firstLine"), "708")

    r = ET.SubElement(p, qn(W, "r"))
    rpr = ET.SubElement(r, qn(W, "rPr"))
    rfonts = ET.SubElement(rpr, qn(W, "rFonts"))
    rfonts.set(qn(W, "ascii"), font)
    rfonts.set(qn(W, "hAnsi"), font)
    if bold:
        ET.SubElement(rpr, qn(W, "b"))
    sz = ET.SubElement(rpr, qn(W, "sz"))
    sz.set(qn(W, "val"), str(size))
    t = ET.SubElement(r, qn(W, "t"))
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    return p


def page_break() -> ET.Element:
    p = ET.Element(qn(W, "p"))
    r = ET.SubElement(p, qn(W, "r"))
    br = ET.SubElement(r, qn(W, "br"))
    br.set(qn(W, "type"), "page")
    return p


def table(rows: list[list[str]], widths: list[int] | None = None) -> ET.Element:
    tbl = ET.Element(qn(W, "tbl"))
    tblpr = ET.SubElement(tbl, qn(W, "tblPr"))
    tblw = ET.SubElement(tblpr, qn(W, "tblW"))
    tblw.set(qn(W, "w"), "0")
    tblw.set(qn(W, "type"), "auto")
    borders = ET.SubElement(tblpr, qn(W, "tblBorders"))
    for side in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        el = ET.SubElement(borders, qn(W, side))
        el.set(qn(W, "val"), "single")
        el.set(qn(W, "sz"), "6")
        el.set(qn(W, "space"), "0")
        el.set(qn(W, "color"), "000000")
    if widths:
        grid = ET.SubElement(tbl, qn(W, "tblGrid"))
        for w in widths:
            gc = ET.SubElement(grid, qn(W, "gridCol"))
            gc.set(qn(W, "w"), str(w))
    for r_i, row in enumerate(rows):
        tr = ET.SubElement(tbl, qn(W, "tr"))
        for c_i, cell_text in enumerate(row):
            tc = ET.SubElement(tr, qn(W, "tc"))
            tcpr = ET.SubElement(tc, qn(W, "tcPr"))
            if widths:
                tcw = ET.SubElement(tcpr, qn(W, "tcW"))
                tcw.set(qn(W, "w"), str(widths[min(c_i, len(widths) - 1)]))
                tcw.set(qn(W, "type"), "dxa")
            tc.append(
                make_p(
                    cell_text,
                    align="center" if r_i == 0 else "left",
                    bold=r_i == 0,
                    size=20,
                    line=300,
                    after=60,
                    before=60,
                )
            )
    return tbl


class DocBuilder:
    def __init__(self, package_dir: Path) -> None:
        self.package_dir = package_dir
        self.media_dir = package_dir / "word" / "media"
        self.media_dir.mkdir(parents=True, exist_ok=True)
        self.body = ET.Element(qn(W, "body"))
        self.rels_root = ET.Element(qn(REL, "Relationships"))
        for rid, typ, target in [
            ("rId1", "styles", "styles.xml"),
            ("rId2", "fontTable", "fontTable.xml"),
            ("rId3", "theme", "theme/theme1.xml"),
            ("rId4", "settings", "settings.xml"),
        ]:
            rel = ET.SubElement(self.rels_root, qn(REL, "Relationship"))
            rel.set("Id", rid)
            rel.set("Type", f"http://schemas.openxmlformats.org/officeDocument/2006/relationships/{typ}")
            rel.set("Target", target)
        self.next_rid = 5
        self.next_docpr = 1

    def add(self, node: ET.Element) -> None:
        self.body.append(node)

    def p(self, *args, **kwargs) -> None:
        self.add(make_p(*args, **kwargs))

    def h1(self, text: str, page_break_before: bool = True) -> None:
        self.p(text.upper(), bold=True, align="left", size=24, before=240, after=120, page_break_before=page_break_before)

    def h2(self, text: str) -> None:
        self.p(text, bold=True, align="left", size=24, before=180, after=80)

    def body_p(self, text: str) -> None:
        self.p(text, align="both", first_line=True, size=24, line=360, after=0)

    def caption(self, text: str) -> None:
        self.p(text, align="center", size=20, line=300, before=100, after=120)

    def copy_image(self, src: Path, name: str) -> tuple[str, Path]:
        suffix = src.suffix.lower()
        if suffix == ".jpg":
            suffix = ".jpeg"
        safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", name)
        if not safe.lower().endswith(suffix):
            safe += suffix
        dest = self.media_dir / safe
        shutil.copyfile(src, dest)
        rid = f"rId{self.next_rid}"
        self.next_rid += 1
        rel = ET.SubElement(self.rels_root, qn(REL, "Relationship"))
        rel.set("Id", rid)
        rel.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image")
        rel.set("Target", f"media/{safe}")
        return rid, dest

    def image(self, src: Path, name: str, max_h_in: float = 7.0) -> None:
        rid, copied = self.copy_image(src, name)
        width, height = scaled_emu(copied, max_h_in=max_h_in)
        p = ET.Element(qn(W, "p"))
        ppr = ET.SubElement(p, qn(W, "pPr"))
        jc = ET.SubElement(ppr, qn(W, "jc"))
        jc.set(qn(W, "val"), "center")
        r = ET.SubElement(p, qn(W, "r"))
        drawing = ET.SubElement(r, qn(W, "drawing"))
        inline = ET.SubElement(drawing, qn(WP, "inline"))
        for attr in ("distT", "distB", "distL", "distR"):
            inline.set(attr, "0")
        extent = ET.SubElement(inline, qn(WP, "extent"))
        extent.set("cx", str(width))
        extent.set("cy", str(height))
        effect = ET.SubElement(inline, qn(WP, "effectExtent"))
        for attr in ("l", "t", "r", "b"):
            effect.set(attr, "0")
        docpr = ET.SubElement(inline, qn(WP, "docPr"))
        docpr.set("id", str(self.next_docpr))
        self.next_docpr += 1
        docpr.set("name", name)
        cnv = ET.SubElement(inline, qn(WP, "cNvGraphicFramePr"))
        ET.SubElement(cnv, qn(A, "graphicFrameLocks")).set("noChangeAspect", "1")
        graphic = ET.SubElement(inline, qn(A, "graphic"))
        graphic_data = ET.SubElement(graphic, qn(A, "graphicData"))
        graphic_data.set("uri", "http://schemas.openxmlformats.org/drawingml/2006/picture")
        pic = ET.SubElement(graphic_data, qn(PIC, "pic"))
        nv = ET.SubElement(pic, qn(PIC, "nvPicPr"))
        c_nv_pr = ET.SubElement(nv, qn(PIC, "cNvPr"))
        c_nv_pr.set("id", "0")
        c_nv_pr.set("name", name)
        ET.SubElement(nv, qn(PIC, "cNvPicPr"))
        blip_fill = ET.SubElement(pic, qn(PIC, "blipFill"))
        blip = ET.SubElement(blip_fill, qn(A, "blip"))
        blip.set(qn(R, "embed"), rid)
        stretch = ET.SubElement(blip_fill, qn(A, "stretch"))
        ET.SubElement(stretch, qn(A, "fillRect"))
        sp_pr = ET.SubElement(pic, qn(PIC, "spPr"))
        xfrm = ET.SubElement(sp_pr, qn(A, "xfrm"))
        off = ET.SubElement(xfrm, qn(A, "off"))
        off.set("x", "0")
        off.set("y", "0")
        ext = ET.SubElement(xfrm, qn(A, "ext"))
        ext.set("cx", str(width))
        ext.set("cy", str(height))
        prst = ET.SubElement(sp_pr, qn(A, "prstGeom"))
        prst.set("prst", "rect")
        ET.SubElement(prst, qn(A, "avLst"))
        self.add(p)

    def finish(self) -> None:
        sect = ET.SubElement(self.body, qn(W, "sectPr"))
        pg_sz = ET.SubElement(sect, qn(W, "pgSz"))
        pg_sz.set(qn(W, "w"), "11906")
        pg_sz.set(qn(W, "h"), "16838")
        pg_mar = ET.SubElement(sect, qn(W, "pgMar"))
        pg_mar.set(qn(W, "top"), "1701")
        pg_mar.set(qn(W, "right"), "1134")
        pg_mar.set(qn(W, "bottom"), "1134")
        pg_mar.set(qn(W, "left"), "1701")
        pg_mar.set(qn(W, "header"), "708")
        pg_mar.set(qn(W, "footer"), "708")
        pg_mar.set(qn(W, "gutter"), "0")

        root = ET.Element(
            qn(W, "document"),
            {
                "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
                "mc:Ignorable": "w14",
                "{http://www.w3.org/XML/1998/namespace}space": "preserve",
            },
        )
        root.append(self.body)
        ET.ElementTree(root).write(self.package_dir / "word" / "document.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(self.rels_root).write(
            self.package_dir / "word" / "_rels" / "document.xml.rels", encoding="utf-8", xml_declaration=True
        )


def reset_content_types(package_dir: Path) -> None:
    root = ET.Element(qn(CT, "Types"))
    defaults = [
        ("rels", "application/vnd.openxmlformats-package.relationships+xml"),
        ("xml", "application/xml"),
        ("png", "image/png"),
        ("jpeg", "image/jpeg"),
        ("jpg", "image/jpeg"),
    ]
    for ext, ctype in defaults:
        el = ET.SubElement(root, qn(CT, "Default"))
        el.set("Extension", ext)
        el.set("ContentType", ctype)
    overrides = [
        ("/word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"),
        ("/word/styles.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"),
        ("/word/settings.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"),
        ("/word/fontTable.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"),
        ("/word/theme/theme1.xml", "application/vnd.openxmlformats-officedocument.theme+xml"),
        ("/word/numbering.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"),
        ("/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml"),
        ("/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml"),
    ]
    for part, ctype in overrides:
        el = ET.SubElement(root, qn(CT, "Override"))
        el.set("PartName", part)
        el.set("ContentType", ctype)
    ET.ElementTree(root).write(package_dir / "[Content_Types].xml", encoding="utf-8", xml_declaration=True)


def normalize_package_namespaces(package_dir: Path) -> None:
    doc_path = package_dir / "word" / "document.xml"
    doc_xml = doc_path.read_text(encoding="utf-8")
    start = doc_xml.find("<w:document")
    end = doc_xml.find(">", start)
    root = (
        '<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'mc:Ignorable="w14" xml:space="preserve">'
    )
    if start >= 0 and end >= 0:
        doc_xml = doc_xml[:start] + root + doc_xml[end + 1 :]
    doc_path.write_text(doc_xml, encoding="utf-8")

    rels_path = package_dir / "word" / "_rels" / "document.xml.rels"
    rels_xml = rels_path.read_text(encoding="utf-8")
    rels_xml = rels_xml.replace(
        '<ns0:Relationships xmlns:ns0="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    )
    rels_xml = rels_xml.replace("</ns0:Relationships>", "</Relationships>")
    rels_xml = rels_xml.replace("<ns0:Relationship", "<Relationship").replace("</ns0:Relationship>", "</Relationship>")
    rels_path.write_text(rels_xml, encoding="utf-8")

    types_path = package_dir / "[Content_Types].xml"
    types_xml = types_path.read_text(encoding="utf-8")
    types_xml = types_xml.replace(
        '<ns0:Types xmlns:ns0="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    )
    types_xml = types_xml.replace("</ns0:Types>", "</Types>")
    types_xml = types_xml.replace("<ns0:Default", "<Default").replace("</ns0:Default>", "</Default>")
    types_xml = types_xml.replace("<ns0:Override", "<Override").replace("</ns0:Override>", "</Override>")
    types_path.write_text(types_xml, encoding="utf-8")


def main() -> None:
    tcc_dir = Path(r"C:\Users\VAIO\Desktop\pasta tcc")
    workspace = Path(r"C:\Users\VAIO\Documents\projetos\techos-flow")
    base_docx = tcc_dir / "TCC_Mateus_Lima_atualizado_revisado_com_fotos.docx"
    abnt_docx = tcc_dir / "TCC_Mateus_Lima_Revisado_ABNT_gmn.docx"
    evidence_root = Path(r"C:\Users\VAIO\Desktop\print de teste projeto\SELECAO_FINAL_TCC_TESTES_MANUAIS")
    out_docx = tcc_dir / "TCC_Mateus_Lima_FINAL_ABNT_com_fotos.docx"
    tmp = workspace / ".tcc-final-build"

    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    with zipfile.ZipFile(base_docx) as z:
        z.extractall(tmp)
    media = tmp / "word" / "media"
    if media.exists():
        shutil.rmtree(media)
    media.mkdir(parents=True)

    # Extract original diagrams/logo from the richer document.
    diagram_src = workspace / ".tcc-final-diagrams"
    if diagram_src.exists():
        shutil.rmtree(diagram_src)
    diagram_src.mkdir()
    with zipfile.ZipFile(base_docx) as z:
        for name in z.namelist():
            if name.startswith("word/media/image"):
                (diagram_src / Path(name).name).write_bytes(z.read(name))

    paras = read_docx_paragraphs(abnt_docx)
    replacements = {
        "transform registros": "transformar registros",
        "global da organization": "global da organização",
        "Git e GitLab": "Git e repositório remoto",
    }
    paras = [re.sub("|".join(map(re.escape, replacements.keys())), lambda m: replacements[m.group(0)], p) for p in paras]

    b = DocBuilder(tmp)
    logo = diagram_src / "image1.png"

    # Cover
    if logo.exists():
        b.image(logo, "Logo Uninorte", max_h_in=0.8)
    for line in paras[0:4]:
        b.p(line, align="center", bold=line == paras[3], size=24, line=360, before=80, after=80)
    b.p("RIO BRANCO", align="center", size=24, line=360, before=2200)
    b.p("2026", align="center", size=24, line=360)
    b.add(page_break())

    # Approval
    for idx, line in enumerate(paras[6:16]):
        b.p(line, align="center", bold=idx == 0 or idx == 2, size=24, line=360, before=180 if idx in (0, 2) else 80)
    b.add(page_break())

    # Resumo / Abstract / abbreviations
    b.h1("RESUMO", page_break_before=False)
    b.body_p(paras[17])
    b.p(paras[18], align="left", size=24, line=360, before=160)
    b.add(page_break())
    b.h1("ABSTRACT", page_break_before=False)
    b.body_p(paras[20])
    b.p(paras[21], align="left", size=24, line=360, before=160)
    b.add(page_break())
    b.h1("LISTA DE ABREVIATURAS E SIGLAS", page_break_before=False)
    for p in paras[23:30]:
        b.p(p, align="left", size=24, line=360, after=40)
    b.add(page_break())

    figures = [
        "Figura A.1 - Diagrama de caso de uso do TechOS Flow.",
        "Figura B.1 - Diagrama de contexto do TechOS Flow.",
        "Figura C.1 - Diagrama de arquitetura em camadas do TechOS Flow.",
        "Figura D.1 - Fluxo do ciclo da ordem de serviço.",
        "Figura E.1 - Diagrama de sequência de login.",
        "Figura F.1 - Diagrama de sequência de recuperação de senha.",
        "Figura G.1 - Diagrama de sequência de envio de evidência com geolocalização.",
        "Figura H.1 - Modelo entidade-relacionamento principal.",
        "Figura H.2 - Modelo entidade-relacionamento estendido.",
        "Figura H.3 - Diagrama de implantação.",
        "Figura H.4 - Sequência de criação de OS geral.",
        "Figura H.5 - Sequência de aceite e início da execução.",
        "Figura H.6 - Sequência de finalização ou não execução.",
        "Figura H.7 - Fluxo de relatórios e exportação.",
    ]
    b.h1("LISTA DE FIGURAS", page_break_before=False)
    for item in figures:
        b.p(item, size=22, line=300, after=20)
    b.add(page_break())
    quadros = [
        "Quadro 1 - Perfis contemplados pelo sistema.",
        "Quadro 2 - Resumo de requisitos funcionais.",
        "Quadro 3 - Requisitos não funcionais por categoria.",
        "Quadro 4 - Principais entidades do banco de dados.",
        "Quadro 5 - Cenários de testes manuais.",
    ]
    b.h1("LISTA DE QUADROS", page_break_before=False)
    for item in quadros:
        b.p(item, size=22, line=300, after=20)
    b.add(page_break())
    b.h1("SUMÁRIO", page_break_before=False)
    for item in [
        "1 INTRODUÇÃO",
        "1.1 PROBLEMA DE PESQUISA",
        "1.2 OBJETIVOS",
        "1.3 JUSTIFICATIVA",
        "2 FUNDAMENTAÇÃO TEÓRICA",
        "3 METODOLOGIA",
        "4 DESENVOLVIMENTO DO SISTEMA TECHOS FLOW",
        "5 TESTES E IMPLANTAÇÃO",
        "6 RESULTADOS",
        "7 CONCLUSÃO",
        "REFERÊNCIAS",
        "APÊNDICES",
    ]:
        b.p(item, size=22, line=300, after=30)
    b.add(page_break())

    objective_items = set(paras[42:52])
    skip_captions = {
        "Quadro 1 - Perfis contemplados pelo sistema",
        "Quadro 2 - Resumo de Requisitos Funcionais",
        "Quadro 3 - Requisitos Não Funcionais por Categoria",
        "Quadro 4 - Principais entidades do banco de dados",
    }
    test_names = [
        ("CT01", "Login com usuário válido"),
        ("CT02", "Login com senha errada"),
        ("CT03", "Recuperação de senha"),
        ("CT04", "Dashboard administrativo"),
        ("CT05", "Usuários: cadastro, edição e desativação"),
        ("CT06", "Criar OS como atendente"),
        ("CT07", "Criar OS ETA/ETE como técnico"),
        ("CT08", "Consultar OS por status"),
        ("CT09", "Técnico aceitar OS"),
        ("CT10", "Técnico iniciar execução"),
        ("CT11", "Adicionar participante"),
        ("CT12", "Finalizar OS com data fim correta"),
        ("CT13", "Mensagem após finalizar"),
        ("CT14", "Marcar OS como não executada"),
        ("CT15", "Enviar evidência/foto"),
        ("CT16", "Enviar várias fotos"),
        ("CT17", "Geolocalização no celular"),
        ("CT18", "Anexos nos detalhes da OS"),
        ("CT19", "PDF detalhado da OS"),
        ("CT20", "Relatório administrativo"),
        ("CT21", "Exportação CSV/XLSX/PDF"),
        ("CT22", "Relatório de horas extras"),
        ("CT23", "Hora extra 50%, 100% e banco"),
        ("CT24", "Área restrita sem permissão"),
        ("CT25", "Fluxo completo no celular"),
    ]

    def add_validation_block() -> None:
        b.h2("Quadro 5 - Cenários de testes manuais")
        test_rows = [["Código", "Cenário", "Resultado"]]
        for code, name in test_names:
            test_rows.append([code, name, "Aprovado"])
        b.add(table(test_rows, [1200, 6200, 1300]))
        b.body_p("As evidências visuais dos testes encontram-se no Apêndice I, organizadas por código e por fluxo funcional.")
        b.body_p("A implantação final utilizou domínio próprio para o frontend, API Laravel em ambiente Railway, PostgreSQL, HTTPS e serviço Resend para recuperação de senha.")
        b.body_p("A validação técnica incluiu execução de testes automatizados no Laravel, verificação TypeScript, lint e build de produção do frontend.")

    for p in paras[30:119]:
        if p in skip_captions:
            b.caption(p)
            if "Quadro 1" in p:
                b.add(
                    table(
                        [
                            ["Perfil", "Responsabilidades principais"],
                            ["Administrador", "Relatórios, horas extras, usuários, colaboradores e PDF detalhado."],
                            ["Atendente", "Abertura e consulta de ordens de serviço gerais."],
                            ["Técnico", "Aceite, execução, evidências, finalização e não execução de OS."],
                        ],
                        [2200, 6500],
                    )
                )
            elif "Quadro 2" in p:
                b.add(
                    table(
                        [
                            ["Código", "Resumo do requisito"],
                            ["RF01-RF05", "Autenticação, sessão, primeiro acesso e recuperação de senha."],
                            ["RF06-RF10", "Criação, consulta, aceite, execução e finalização de OS."],
                            ["RF11-RF15", "Evidências, geolocalização, relatórios, exportações e horas extras."],
                        ],
                        [1800, 6900],
                    )
                )
            elif "Quadro 3" in p:
                b.add(
                    table(
                        [
                            ["Categoria", "Requisito não funcional"],
                            ["Arquitetura", "Aplicação web com frontend React e API REST Laravel."],
                            ["Segurança", "Autenticação Sanctum, perfis e anexos privados."],
                            ["Dados", "Persistência em PostgreSQL e exportações administrativas."],
                        ],
                        [2500, 6200],
                    )
                )
            else:
                b.add(
                    table(
                        [
                            ["Tabela", "Finalidade"],
                            ["users", "Usuários autenticáveis e perfis."],
                            ["ordem_servicos", "Dados principais das ordens de serviço."],
                            ["execucoes / execucao_funcionarios", "Execução, equipe e horas extras."],
                            ["anexos", "Evidências, fotos e geolocalização."],
                        ],
                        [3000, 5700],
                    )
                )
            continue
        if p in objective_items:
            letter = chr(ord("a") + list(paras[42:52]).index(p))
            b.p(f"{letter}) {p}", align="both", size=24, line=360, after=0)
            continue
        if p == "6 RESULTADOS":
            add_validation_block()
            b.h1(p, page_break_before=True)
        elif re.match(r"^\d+\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]", p) or p == "REFERÊNCIAS":
            b.h1(p, page_break_before=True)
        elif re.match(r"^\d+\.\d+\.\d+", p):
            b.h2(p)
        elif re.match(r"^\d+\.\d+", p):
            b.h2(p)
        elif p.startswith("ANDREASSI") or p.startswith("CORRÊA") or p.startswith("FILHO") or p.startswith("KROENKE") or p.startswith("O’BRIEN") or p.startswith("OLIVEIRA") or p.startswith("PRESSMAN") or p.startswith("PRIKLADNICKI") or p.startswith("TIDD"):
            b.p(p, align="left", size=24, line=360, after=120)
        else:
            b.body_p(p)

    # Appendices
    b.h1("APÊNDICES", page_break_before=True)
    b.h1("APÊNDICE A - DIAGRAMA DE CASO DE USO", page_break_before=False)
    diagram_captions = [
        ("image2.jpeg", "Figura A.1 - Diagrama de caso de uso do TechOS Flow."),
        ("image3.jpeg", "Figura B.1 - Diagrama de contexto do TechOS Flow."),
        ("image4.jpeg", "Figura C.1 - Diagrama de arquitetura em camadas do TechOS Flow."),
        ("image5.jpeg", "Figura D.1 - Fluxo do ciclo da ordem de serviço."),
        ("image6.png", "Figura E.1 - Diagrama de sequência de login."),
        ("image7.png", "Figura F.1 - Diagrama de sequência de recuperação de senha."),
        ("image8.jpeg", "Figura G.1 - Diagrama de sequência de envio de evidência com geolocalização."),
        ("image9.jpeg", "Figura H.1 - Modelo entidade-relacionamento principal."),
        ("image10.jpeg", "Figura H.2 - Modelo entidade-relacionamento estendido."),
        ("image11.jpeg", "Figura H.3 - Diagrama de implantação."),
        ("image12.jpeg", "Figura H.4 - Sequência de criação de OS geral."),
        ("image13.jpeg", "Figura H.5 - Sequência de aceite e início da execução."),
        ("image14.png", "Figura H.6 - Sequência de finalização ou não execução."),
        ("image15.jpeg", "Figura H.7 - Fluxo de relatórios e exportação."),
    ]
    appendix_names = ["A", "B", "C", "D", "E", "F", "G", "H"]
    for idx, (img, caption) in enumerate(diagram_captions):
        if idx > 0:
            b.add(page_break())
            letter = appendix_names[min(idx, len(appendix_names) - 1)]
            b.h1(f"APÊNDICE {letter} - {caption.split(' - ', 1)[1].replace('.', '').upper()}", page_break_before=False)
        b.image(diagram_src / img, img, max_h_in=7.1)
        b.caption(caption)

    b.add(page_break())
    b.h1("APÊNDICE I - EVIDÊNCIAS DOS TESTES MANUAIS", page_break_before=False)
    b.body_p("Este apêndice reúne as principais telas utilizadas na validação manual do sistema, organizadas conforme os cenários CT01 a CT25.")
    for folder in sorted([p for p in evidence_root.iterdir() if p.is_dir() and p.name[:2].isdigit() and p.name != "00-comprovantes-tecnicos-testes-build"]):
        images = sorted([p for p in folder.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}], key=lambda p: p.name.lower())
        if not images:
            continue
        b.add(page_break())
        b.h2(folder.name.replace("-", " ").upper())
        for img in images:
            b.image(img, img.name, max_h_in=6.5)
            b.caption(img.name)

    tech_folder = evidence_root / "00-comprovantes-tecnicos-testes-build"
    if tech_folder.exists():
        b.add(page_break())
        b.h1("APÊNDICE J - COMPROVANTES TÉCNICOS E IMPLANTAÇÃO", page_break_before=False)
        b.body_p("Este apêndice apresenta evidências técnicas complementares de testes automatizados, build do frontend e validação da implantação em produção.")
        for img in sorted([p for p in tech_folder.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}], key=lambda p: p.name.lower()):
            b.image(img, img.name, max_h_in=6.5)
            b.caption(img.name)
        b.h2("Ambiente de produção")
        for item in [
            "Frontend publicado em https://www.techosflow.com.br.",
            "Backend publicado em ambiente Railway com API REST Laravel.",
            "Banco de dados PostgreSQL utilizado para persistência.",
            "Recuperação de senha configurada por e-mail transacional com Resend.",
            "Uso de HTTPS para autenticação e geolocalização no celular.",
        ]:
            b.p(f"- {item}", align="left", size=24, line=360, after=40)

    b.finish()
    reset_content_types(tmp)
    normalize_package_namespaces(tmp)

    if out_docx.exists():
        out_docx.unlink()
    with zipfile.ZipFile(out_docx, "w", zipfile.ZIP_DEFLATED) as zout:
        for file in tmp.rglob("*"):
            if file.is_file():
                zout.write(file, file.relative_to(tmp).as_posix())
    print(out_docx)


if __name__ == "__main__":
    main()
