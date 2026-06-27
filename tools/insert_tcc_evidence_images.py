from __future__ import annotations

from copy import deepcopy
from pathlib import Path
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
    "rel": REL,
}.items():
    ET.register_namespace(prefix, uri)


def qn(ns: str, tag: str) -> str:
    return f"{{{ns}}}{tag}"


def paragraph_text(p: ET.Element) -> str:
    return "".join(t.text or "" for t in p.findall(f".//{qn(W, 't')}"))


def make_text_paragraph(text: str, *, bold: bool = False, size: int = 22) -> ET.Element:
    p = ET.Element(qn(W, "p"))
    r = ET.SubElement(p, qn(W, "r"))
    if bold or size:
        rpr = ET.SubElement(r, qn(W, "rPr"))
        if bold:
            ET.SubElement(rpr, qn(W, "b"))
        if size:
            sz = ET.SubElement(rpr, qn(W, "sz"))
            sz.set(qn(W, "val"), str(size))
    t = ET.SubElement(r, qn(W, "t"))
    t.text = text
    return p


def make_page_break() -> ET.Element:
    p = ET.Element(qn(W, "p"))
    r = ET.SubElement(p, qn(W, "r"))
    br = ET.SubElement(r, qn(W, "br"))
    br.set(qn(W, "type"), "page")
    return p


def make_image_paragraph(rid: str, name: str, width_emu: int, height_emu: int, docpr_id: int) -> ET.Element:
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
    extent.set("cx", str(width_emu))
    extent.set("cy", str(height_emu))
    effect = ET.SubElement(inline, qn(WP, "effectExtent"))
    for attr in ("l", "t", "r", "b"):
        effect.set(attr, "0")
    docpr = ET.SubElement(inline, qn(WP, "docPr"))
    docpr.set("id", str(docpr_id))
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
    ext.set("cx", str(width_emu))
    ext.set("cy", str(height_emu))
    prst = ET.SubElement(sp_pr, qn(A, "prstGeom"))
    prst.set("prst", "rect")
    ET.SubElement(prst, qn(A, "avLst"))
    return p


def image_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    if data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            i += 2
            if marker in (0xD8, 0xD9):
                continue
            size = int.from_bytes(data[i : i + 2], "big")
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h = int.from_bytes(data[i + 3 : i + 5], "big")
                w = int.from_bytes(data[i + 5 : i + 7], "big")
                return w, h
            i += size
    raise ValueError(f"Unsupported image format: {path}")


def scaled_emu(path: Path) -> tuple[int, int]:
    w_px, h_px = image_size(path)
    max_w = int(5.9 * 914400)
    max_h = int(6.9 * 914400)
    w_emu = w_px * 9525
    h_emu = h_px * 9525
    scale = min(max_w / w_emu, max_h / h_emu, 1.0)
    return int(w_emu * scale), int(h_emu * scale)


def next_rel_id(root: ET.Element) -> int:
    max_id = 0
    for rel in root.findall(f".//{qn(REL, 'Relationship')}"):
        rid = rel.get("Id", "")
        if rid.startswith("rId") and rid[3:].isdigit():
            max_id = max(max_id, int(rid[3:]))
    return max_id + 1


def ensure_default(content_types: ET.Element, ext: str, content_type: str) -> None:
    for child in content_types.findall(f".//{qn(CT, 'Default')}"):
        if child.get("Extension") == ext:
            return
    default = ET.SubElement(content_types, qn(CT, "Default"))
    default.set("Extension", ext)
    default.set("ContentType", content_type)


def main() -> None:
    tcc_dir = Path(r"C:\Users\VAIO\Desktop\pasta tcc")
    evidence_root = Path(r"C:\Users\VAIO\Desktop\print de teste projeto\SELECAO_FINAL_TCC_TESTES_MANUAIS")
    src_docx = tcc_dir / "TCC_Mateus_Lima_atualizado_revisado.docx"
    out_docx = tcc_dir / "TCC_Mateus_Lima_atualizado_revisado_com_fotos.docx"
    tmp_dir = Path(r"C:\Users\VAIO\Documents\projetos\techos-flow\.codex-tcc-docx")

    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True)

    with zipfile.ZipFile(src_docx) as zin:
        zin.extractall(tmp_dir)

    doc_path = tmp_dir / "word" / "document.xml"
    rels_path = tmp_dir / "word" / "_rels" / "document.xml.rels"
    content_types_path = tmp_dir / "[Content_Types].xml"
    media_dir = tmp_dir / "word" / "media"
    media_dir.mkdir(exist_ok=True)

    doc_tree = ET.parse(doc_path)
    doc_root = doc_tree.getroot()
    body = doc_root.find(f".//{qn(W, 'body')}")
    if body is None:
        raise RuntimeError("DOCX body not found")

    rels_tree = ET.parse(rels_path)
    rels_root = rels_tree.getroot()
    content_tree = ET.parse(content_types_path)
    content_root = content_tree.getroot()
    ensure_default(content_root, "png", "image/png")
    ensure_default(content_root, "jpeg", "image/jpeg")
    ensure_default(content_root, "jpg", "image/jpeg")

    children = list(body)
    insert_at = None
    for idx, child in enumerate(children):
        if child.tag == qn(W, "p") and "TechOS Flow - atualizacao de apendices | pagina 44" in paragraph_text(child):
            insert_at = idx
            break
    if insert_at is None:
        raise RuntimeError("Could not find insertion point before appendix footer")

    rel_id = next_rel_id(rels_root)
    docpr_id = 1000
    new_nodes: list[ET.Element] = []
    new_nodes.append(make_page_break())
    new_nodes.append(make_text_paragraph("I.2 Evidências visuais dos testes manuais", bold=True, size=28))
    new_nodes.append(
        make_text_paragraph(
            "As imagens a seguir apresentam as principais telas utilizadas na validação manual dos cenários CT01 a CT25.",
            size=22,
        )
    )

    folders = [p for p in sorted(evidence_root.iterdir()) if p.is_dir() and p.name[:2].isdigit()]
    image_count = 0
    for folder in folders:
        images = sorted(
            [p for p in folder.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}],
            key=lambda p: p.name.lower(),
        )
        if not images:
            continue
        new_nodes.append(make_page_break())
        title = folder.name.replace("-", " ")
        new_nodes.append(make_text_paragraph(title, bold=True, size=24))
        for img in images:
            ext = "jpeg" if img.suffix.lower() in {".jpg", ".jpeg"} else "png"
            media_name = f"evidencia_tcc_{folder.name}_{image_count + 1}.{ext}"
            media_name = media_name.replace(" ", "_")
            shutil.copyfile(img, media_dir / media_name)
            rid = f"rId{rel_id}"
            rel_id += 1
            rel = ET.SubElement(rels_root, qn(REL, "Relationship"))
            rel.set("Id", rid)
            rel.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image")
            rel.set("Target", f"media/{media_name}")
            width_emu, height_emu = scaled_emu(img)
            new_nodes.append(make_text_paragraph(img.name, size=18))
            new_nodes.append(make_image_paragraph(rid, media_name, width_emu, height_emu, docpr_id))
            docpr_id += 1
            image_count += 1

    for offset, node in enumerate(new_nodes):
        body.insert(insert_at + offset, node)

    doc_tree.write(doc_path, encoding="utf-8", xml_declaration=True)
    rels_tree.write(rels_path, encoding="utf-8", xml_declaration=True)
    content_tree.write(content_types_path, encoding="utf-8", xml_declaration=True)

    original_root = (
        '<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:ve="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:o="urn:schemas-microsoft-com:office:office" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
        'xmlns:v="urn:schemas-microsoft-com:vml" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w10="urn:schemas-microsoft-com:office:word" '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" '
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'mc:Ignorable="w14" xml:space="preserve">'
    )

    doc_xml = doc_path.read_text(encoding="utf-8")
    start = doc_xml.find("<w:document")
    end = doc_xml.find(">", start)
    if start >= 0 and end >= 0:
        doc_xml = doc_xml[:start] + original_root + doc_xml[end + 1 :]
    doc_xml = doc_xml.replace("ns1:Ignorable", "mc:Ignorable")
    doc_xml = doc_xml.replace('xmlns:ns1="http://schemas.openxmlformats.org/markup-compatibility/2006" ', "")
    doc_path.write_text(doc_xml, encoding="utf-8")

    content_xml = content_types_path.read_text(encoding="utf-8")
    content_xml = content_xml.replace('<ns0:Types xmlns:ns0="http://schemas.openxmlformats.org/package/2006/content-types">', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">')
    content_xml = content_xml.replace("</ns0:Types>", "</Types>")
    content_xml = content_xml.replace("<ns0:Default", "<Default").replace("</ns0:Default>", "</Default>")
    content_xml = content_xml.replace("<ns0:Override", "<Override").replace("</ns0:Override>", "</Override>")
    content_types_path.write_text(content_xml, encoding="utf-8")

    rels_xml = rels_path.read_text(encoding="utf-8")
    rels_xml = rels_xml.replace('<rel:Relationships xmlns:rel="http://schemas.openxmlformats.org/package/2006/relationships">', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')
    rels_xml = rels_xml.replace("</rel:Relationships>", "</Relationships>")
    rels_xml = rels_xml.replace("<rel:Relationship", "<Relationship").replace("</rel:Relationship>", "</Relationship>")
    rels_path.write_text(rels_xml, encoding="utf-8")

    if out_docx.exists():
        out_docx.unlink()
    with zipfile.ZipFile(out_docx, "w", compression=zipfile.ZIP_DEFLATED) as zout:
        for file in tmp_dir.rglob("*"):
            if file.is_file():
                zout.write(file, file.relative_to(tmp_dir).as_posix())

    print(out_docx)
    print(f"imagens_inseridas={image_count}")


if __name__ == "__main__":
    main()
