from __future__ import annotations

import base64
import mimetypes
import re
import shutil
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types"

ET.register_namespace("w", NS_W)
ET.register_namespace("r", NS_R)


def fix_mojibake(text: str) -> str:
    if "Ã" not in text and "Â" not in text:
        return text

    try:
        return text.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def inline_local_images(html: str, base_dir: Path) -> str:
    def replace(match: re.Match[str]) -> str:
        original = match.group(1)
        image_path = (base_dir / original).resolve()
        if not image_path.exists():
            return match.group(0)

        mime_type, _ = mimetypes.guess_type(image_path.name)
        mime_type = mime_type or "application/octet-stream"
        encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
        return f'src="data:{mime_type};base64,{encoded}"'

    return re.sub(r'src="([^":]+)"', replace, html)


def extract_html_chunk(source_html: str, base_dir: Path) -> str:
    fixed = fix_mojibake(source_html)
    fixed = inline_local_images(fixed, base_dir)
    style_match = re.search(r"<style>(.*?)</style>", fixed, re.DOTALL | re.IGNORECASE)
    style_block = style_match.group(0) if style_match else ""

    sections = re.findall(r"<section\b.*?</section>", fixed, re.DOTALL | re.IGNORECASE)
    if len(sections) < 2:
        raise RuntimeError("Nao foi possivel localizar as secoes esperadas no HTML de origem.")

    body_sections = "".join(sections[1:])

    return (
        "<!doctype html>"
        '<html lang="pt-BR">'
        "<head>"
        '<meta charset="utf-8" />'
        f"{style_block}"
        "</head>"
        "<body>"
        '<main class="page">'
        f"{body_sections}"
        "</main>"
        "</body>"
        "</html>"
    )


def find_resume_index(body: ET.Element) -> int:
    children = list(body)
    for index, child in enumerate(children):
        text = "".join(child.itertext()).strip()
        if "RESUMO" in text.upper():
            return index
    raise RuntimeError("Nao foi possivel localizar o ponto inicial 'RESUMO' no modelo.")


def update_document_xml(document_xml: bytes) -> bytes:
    root = ET.fromstring(document_xml)
    body = root.find(f".//{{{NS_W}}}body")
    if body is None:
        raise RuntimeError("Corpo do documento nao encontrado.")

    resume_index = find_resume_index(body)
    children = list(body)
    sect_pr = next((child for child in children if child.tag == f"{{{NS_W}}}sectPr"), None)

    for child in children[resume_index:]:
        if child is not sect_pr:
            body.remove(child)

    for text_node in root.findall(f".//{{{NS_W}}}t"):
        if text_node.text == "2025":
            text_node.text = "2026"
            break

    alt_chunk = ET.Element(f"{{{NS_W}}}altChunk", {f"{{{NS_R}}}id": "htmlChunk1"})
    insert_at = len(body)
    if sect_pr is not None:
        insert_at = list(body).index(sect_pr)
    body.insert(insert_at, alt_chunk)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def update_relationships_xml(rels_xml: bytes) -> bytes:
    root = ET.fromstring(rels_xml)
    exists = any(
        rel.attrib.get("Id") == "htmlChunk1"
        for rel in root.findall(f".//{{{NS_REL}}}Relationship")
    )
    if not exists:
        ET.SubElement(
            root,
            f"{{{NS_REL}}}Relationship",
            {
                "Id": "htmlChunk1",
                "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk",
                "Target": "afchunk/tcc-atualizado.html",
            },
        )
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def update_content_types_xml(content_types_xml: bytes) -> bytes:
    root = ET.fromstring(content_types_xml)
    exists = any(
        node.attrib.get("Extension") == "html"
        for node in root.findall(f".//{{{NS_CT}}}Default")
    )
    if not exists:
        ET.SubElement(
            root,
            f"{{{NS_CT}}}Default",
            {"Extension": "html", "ContentType": "text/html"},
        )
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build_docx(template_path: Path, source_html_path: Path, output_docx_path: Path) -> None:
    html_chunk = extract_html_chunk(
        source_html_path.read_text(encoding="utf-8"),
        source_html_path.parent,
    )

    with zipfile.ZipFile(template_path, "r") as source_zip:
        files = {info.filename: source_zip.read(info.filename) for info in source_zip.infolist()}

    files["word/document.xml"] = update_document_xml(files["word/document.xml"])
    files["word/_rels/document.xml.rels"] = update_relationships_xml(files["word/_rels/document.xml.rels"])
    files["[Content_Types].xml"] = update_content_types_xml(files["[Content_Types].xml"])
    files["word/afchunk/tcc-atualizado.html"] = html_chunk.encode("utf-8")

    output_docx_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output_docx_path, "w", zipfile.ZIP_DEFLATED) as target_zip:
        for name, content in files.items():
            target_zip.writestr(name, content)


def main() -> int:
    if len(sys.argv) != 4:
        print(
            "Uso: python build_tcc_from_template.py <template.docx> <source.html> <output.docx>",
            file=sys.stderr,
        )
        return 1

    template = Path(sys.argv[1])
    source_html = Path(sys.argv[2])
    output_docx = Path(sys.argv[3])

    build_docx(template, source_html, output_docx)

    workspace_copy = Path("docs") / output_docx.name.replace(" ", "_")
    shutil.copy2(output_docx, workspace_copy)

    print(f"DOCX:{output_docx}")
    print(f"DOCX_WORKSPACE:{workspace_copy.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
