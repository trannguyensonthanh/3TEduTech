# src/rag/document_parser.py
"""
Bóc text từ tài liệu (PDF / DOCX / PPTX / ODT / ODP).

[THÊM 18/08/2026 — COURSE IMPORT, Giai đoạn A]

==============================================================================
VÌ SAO GẦN NHƯ KHÔNG THÊM THƯ VIỆN NÀO
==============================================================================

Ràng buộc thực tế của dự án: hai ổ đĩa gần đầy và RAM hạn chế. Mỗi thư viện
thêm vào đây là dung lượng cộng thẳng vào Docker image, và image AI Service
vốn đã nặng vì `faster-whisper` + `chromadb`.

Cách làm ở đây:

  • DOCX / PPTX / ODT / ODP → 0 THƯ VIỆN MỚI.
    Bốn định dạng này thực chất chỉ là tệp ZIP chứa XML. `zipfile` và
    `xml.etree.ElementTree` của thư viện chuẩn Python đọc được trọn vẹn.
    Bỏ được `python-docx` + `python-pptx` + `lxml` (~40MB sau khi cài).

  • PDF → `pypdf` (~1MB, giấy phép BSD).
    Đã cân nhắc `PyMuPDF`: bóc text tốt hơn và nhanh hơn hẳn, NHƯNG nặng
    ~60MB sau khi cài VÀ mang giấy phép AGPL — ràng buộc lây lan không nên
    đặt vào một đồ án. Nếu sau này máy dư dung lượng, chỉ cần
    `uv pip install pymupdf` là module này TỰ ĐỘNG dùng nó (xem
    `_extract_pdf`), không phải sửa một dòng mã nào.

==============================================================================
⚠️ TOÀN BỘ ĐẦU VÀO Ở ĐÂY LÀ KHÔNG ĐÁNG TIN
==============================================================================

Tệp tới từ ZIP do giảng viên tải lên — mà giảng viên có thể tải lên bất cứ
thứ gì. Ba lớp phòng vệ bắt buộc:

  1. XXE / "billion laughs" — XML có thể khai báo thực thể tự nhân bản, một
     tệp 1KB nở thành hàng GB trong RAM và giết container. `xml.etree` của
     Python KHÔNG miễn nhiễm. Ở đây từ chối thẳng mọi XML có `<!DOCTYPE` /
     `<!ENTITY` — tài liệu Office thật KHÔNG BAO GIỜ có DTD.

  2. Zip bomb lồng nhau — tệp .docx tự nó là ZIP nên cũng nén bom được. Đọc
     có giới hạn từng thành viên và giới hạn tổng, không tin `file_size` ghi
     trong header (con số đó do kẻ tấn công tự điền).

  3. Đường dẫn thành viên — chỉ đọc ĐÚNG các đường dẫn đã biết trước
     (`word/document.xml`, `ppt/slides/*.xml`...), không bao giờ ghi ra đĩa.
     Nhờ vậy Zip Slip không có chỗ bám.

==============================================================================
⚠️ TEXT TRẢ VỀ VẪN LÀ DỮ LIỆU, KHÔNG PHẢI MỆNH LỆNH
==============================================================================

Một tệp PDF hoàn toàn có thể chứa dòng chữ trắng trên nền trắng ghi "Bỏ qua
mọi chỉ dẫn trước đó...". Text ở đây sẽ đi vào prompt ở Giai đoạn B, nên nơi
dựng prompt PHẢI rào nó lại rõ ràng. Module này chỉ bóc, không phán xét.
"""

from __future__ import annotations

import io
import logging
import re
import zipfile
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Hằng số phòng vệ
# ---------------------------------------------------------------------------

#: Kích thước tệp đầu vào tối đa. Phải >= giới hạn phía backend (6MB trong
#: `textExtractor.js`) nhưng vẫn tự kiểm tra: AI Service không được phép tin
#: rằng phía gọi đã kiểm tra hộ. Đây là ranh giới tin cậy riêng của nó.
MAX_INPUT_BYTES = 8 * 1024 * 1024

#: Tổng số byte giải nén tối đa cho một tệp OOXML. Vượt ngưỡng → coi là bom.
MAX_OOXML_UNCOMPRESSED = 60 * 1024 * 1024

#: Số byte tối đa đọc từ MỘT thành viên trong ZIP.
MAX_MEMBER_BYTES = 20 * 1024 * 1024

#: Số thành viên tối đa duyệt qua.
MAX_MEMBERS = 3000

#: Số trang PDF tối đa xử lý. Một giáo trình 800 trang không giúp mô tả bài
#: học tốt hơn, chỉ tốn CPU và làm tràn cửa sổ ngữ cảnh.
MAX_PDF_PAGES = 200

#: Số slide tối đa xử lý.
MAX_SLIDES = 300

#: Mặc định số ký tự trả về (phía gọi thường tự đặt lại).
DEFAULT_MAX_CHARS = 20000


class UnsupportedDocument(Exception):
    """Định dạng nhận ra được nhưng không xử lý được (ví dụ .doc đời cũ)."""


class MalformedDocument(Exception):
    """Tệp hỏng, không phải định dạng đã khai báo, hoặc có dấu hiệu tấn công."""


# ---------------------------------------------------------------------------
# Tiện ích XML
# ---------------------------------------------------------------------------

#: Bắt `<!DOCTYPE` và `<!ENTITY` kể cả khi bị chèn khoảng trắng/xuống dòng.
_DTD_PATTERN = re.compile(rb"<!\s*(DOCTYPE|ENTITY)", re.IGNORECASE)


def _parse_xml_safely(data: bytes, label: str) -> ET.Element:
    """Phân tích XML sau khi đã loại trừ khả năng nở thực thể.

    Không dùng `defusedxml` (một thư viện nữa phải cài) vì với tài liệu Office
    thì phép kiểm tra đúng đắn lại đơn giản hơn nhiều: chuẩn OOXML/ODF không
    cho phép DTD trong các phần nội dung, nên chỉ cần thấy DTD là biết chắc
    tệp đã bị can thiệp.
    """
    if _DTD_PATTERN.search(data):
        raise MalformedDocument(
            f"{label}: tệp chứa khai báo DTD/ENTITY — tài liệu Office hợp lệ "
            "không bao giờ có. Từ chối xử lý."
        )
    try:
        return ET.fromstring(data)
    except ET.ParseError as exc:
        raise MalformedDocument(f"{label}: XML không hợp lệ ({exc}).") from exc


def _read_member(zf: zipfile.ZipFile, name: str, budget: list[int]) -> bytes | None:
    """Đọc một thành viên trong ZIP, có giới hạn và trừ vào ngân sách chung.

    `budget` là danh sách một phần tử để truyền theo tham chiếu — mỗi lần đọc
    trừ đi số byte thực sự giải nén được, nên một tệp gồm nhiều thành viên
    nhỏ nhưng tổng cộng khổng lồ vẫn bị chặn.
    """
    try:
        with zf.open(name, "r") as fh:
            # Đọc dư 1 byte để phân biệt "vừa đủ giới hạn" và "vượt giới hạn".
            limit = min(MAX_MEMBER_BYTES, max(budget[0], 0)) + 1
            data = fh.read(limit)
    except KeyError:
        return None
    except (zipfile.BadZipFile, OSError, EOFError) as exc:
        raise MalformedDocument(f"Không đọc được '{name}': {exc}") from exc

    if len(data) >= limit:
        raise MalformedDocument(
            f"'{name}' giải nén vượt giới hạn cho phép — nghi ngờ zip bomb."
        )
    budget[0] -= len(data)
    if budget[0] <= 0:
        raise MalformedDocument(
            "Tổng dung lượng giải nén vượt giới hạn — nghi ngờ zip bomb."
        )
    return data


def _open_ooxml(data: bytes) -> zipfile.ZipFile:
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as exc:
        raise MalformedDocument(
            "Tệp không phải định dạng ZIP hợp lệ (docx/pptx/odt/odp đều là ZIP)."
        ) from exc
    if len(zf.namelist()) > MAX_MEMBERS:
        raise MalformedDocument("Tệp chứa quá nhiều thành phần bên trong.")
    return zf


# ---------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------

_W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def _extract_docx(data: bytes) -> tuple[str, dict]:
    budget = [MAX_OOXML_UNCOMPRESSED]
    with _open_ooxml(data) as zf:
        names = set(zf.namelist())
        if "word/document.xml" not in names:
            raise MalformedDocument(
                "Không tìm thấy 'word/document.xml' — tệp .docx không hợp lệ."
            )
        xml = _read_member(zf, "word/document.xml", budget)
        if xml is None:
            raise MalformedDocument("Không đọc được nội dung .docx.")

        root = _parse_xml_safely(xml, "word/document.xml")

        lines: list[str] = []
        # `w:p` (đoạn văn) CÓ THỂ lồng nhau: một đoạn nằm trong text-box lại
        # nằm trong một đoạn khác. Duyệt thẳng bằng `root.iter` sẽ khiến text
        # của đoạn bên trong bị lặp lại hai lần. Ghi nhớ các nút `w:t` đã lấy
        # (theo id đối tượng) để mỗi mẩu chữ chỉ xuất hiện đúng một lần.
        used: set[int] = set()
        for para in root.iter(_W + "p"):
            parts: list[str] = []
            for node in para.iter():
                tag = node.tag
                if tag == _W + "t":
                    if id(node) in used:
                        continue
                    used.add(id(node))
                    parts.append(node.text or "")
                elif tag == _W + "tab":
                    parts.append("\t")
                elif tag == _W + "br":
                    parts.append("\n")
            line = "".join(parts).strip()
            if line:
                lines.append(line)

        text = "\n\n".join(lines)
        return text, {"paragraphs": len(lines)}


# ---------------------------------------------------------------------------
# PPTX
# ---------------------------------------------------------------------------

_A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

_SLIDE_RE = re.compile(r"^ppt/slides/slide(\d+)\.xml$")
_NOTES_RE = re.compile(r"^ppt/notesSlides/notesSlide(\d+)\.xml$")


def _pptx_slide_text(root: ET.Element) -> str:
    """Gom text của một slide, giữ nguyên thứ tự đọc trong tài liệu."""
    lines: list[str] = []
    for para in root.iter(_A + "p"):
        parts = [node.text or "" for node in para.iter(_A + "t")]
        line = "".join(parts).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def _extract_pptx(data: bytes) -> tuple[str, dict]:
    budget = [MAX_OOXML_UNCOMPRESSED]
    with _open_ooxml(data) as zf:
        names = zf.namelist()

        slides: list[tuple[int, str]] = []
        for name in names:
            m = _SLIDE_RE.match(name)
            if m:
                slides.append((int(m.group(1)), name))
        if not slides:
            raise MalformedDocument(
                "Không tìm thấy slide nào — tệp .pptx không hợp lệ."
            )
        # Sắp theo SỐ chứ không theo chuỗi: sắp theo chuỗi thì slide10 đứng
        # trước slide2, và toàn bộ bài giảng bị đảo lộn thứ tự.
        slides.sort(key=lambda pair: pair[0])
        slides = slides[:MAX_SLIDES]

        notes_by_index: dict[int, str] = {}
        for name in names:
            m = _NOTES_RE.match(name)
            if m:
                notes_by_index[int(m.group(1))] = name

        blocks: list[str] = []
        for index, name in slides:
            xml = _read_member(zf, name, budget)
            if xml is None:
                continue
            body = _pptx_slide_text(_parse_xml_safely(xml, name))

            # Ghi chú của người trình bày thường chứa phần giảng giải đầy đủ
            # nhất — chính là thứ hữu ích để AI viết mô tả bài học, trong khi
            # slide chỉ có gạch đầu dòng cụt lủn.
            note_name = notes_by_index.get(index)
            note_text = ""
            if note_name:
                note_xml = _read_member(zf, note_name, budget)
                if note_xml:
                    note_text = _pptx_slide_text(
                        _parse_xml_safely(note_xml, note_name)
                    )

            if not body and not note_text:
                continue
            block = f"--- Slide {index} ---"
            if body:
                block += f"\n{body}"
            if note_text:
                block += f"\n[Ghi chú] {note_text}"
            blocks.append(block)

        return "\n\n".join(blocks), {"slides": len(slides)}


# ---------------------------------------------------------------------------
# ODT / ODP (OpenDocument — LibreOffice)
# ---------------------------------------------------------------------------

_ODF_TEXT = "{urn:oasis:names:tc:opendocument:xmlns:text:1.0}"


def _extract_odf(data: bytes) -> tuple[str, dict]:
    budget = [MAX_OOXML_UNCOMPRESSED]
    with _open_ooxml(data) as zf:
        if "content.xml" not in set(zf.namelist()):
            raise MalformedDocument(
                "Không tìm thấy 'content.xml' — tệp OpenDocument không hợp lệ."
            )
        xml = _read_member(zf, "content.xml", budget)
        if xml is None:
            raise MalformedDocument("Không đọc được nội dung OpenDocument.")

        root = _parse_xml_safely(xml, "content.xml")

        lines: list[str] = []
        used: set[int] = set()
        for tag in (_ODF_TEXT + "h", _ODF_TEXT + "p"):
            for node in root.iter(tag):
                if id(node) in used:
                    continue
                used.add(id(node))
                # ODF đặt chữ rải rác trong `text:span`, `text:a`... nên phải
                # dùng `itertext()` thay vì đọc `.text` của riêng nút này.
                line = "".join(node.itertext()).strip()
                if line:
                    lines.append(line)

        return "\n\n".join(lines), {"paragraphs": len(lines)}


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------


def _extract_pdf(data: bytes) -> tuple[str, dict]:
    """Bóc text PDF: ưu tiên PyMuPDF nếu có sẵn, mặc định dùng pypdf.

    Việc dò `import` tại thời điểm chạy cho phép nâng cấp chất lượng bằng một
    lệnh `uv pip install pymupdf` mà không phải sửa mã — và cũng không bắt
    mọi người phải tải về 60MB nếu họ không cần.
    """
    # --- Đường nhanh: PyMuPDF (không bắt buộc) ---
    try:
        import fitz  # type: ignore  # noqa: PLC0415  (cố ý import tại chỗ)
    except ImportError:
        fitz = None

    if fitz is not None:
        try:
            with fitz.open(stream=data, filetype="pdf") as doc:
                if doc.needs_pass:
                    raise UnsupportedDocument(
                        "PDF được đặt mật khẩu — không thể đọc nội dung."
                    )
                pages = min(doc.page_count, MAX_PDF_PAGES)
                chunks = [doc.load_page(i).get_text("text") for i in range(pages)]
            return "\n\n".join(c for c in chunks if c.strip()), {
                "pages": pages,
                "engine": "pymupdf",
            }
        except UnsupportedDocument:
            raise
        except Exception as exc:  # noqa: BLE001 — rơi xuống pypdf, không chết
            logger.warning("PyMuPDF thất bại (%s) — thử lại bằng pypdf.", exc)

    # --- Đường mặc định: pypdf ---
    try:
        from pypdf import PdfReader  # noqa: PLC0415
        from pypdf.errors import PdfReadError  # noqa: PLC0415
    except ImportError as exc:
        raise UnsupportedDocument(
            "Chưa cài thư viện đọc PDF (pypdf). Chạy: uv pip install pypdf"
        ) from exc

    try:
        reader = PdfReader(io.BytesIO(data), strict=False)
        if reader.is_encrypted:
            # PDF chỉ đặt mật khẩu CHỦ SỞ HỮU (chống in/sửa) vẫn mở được bằng
            # mật khẩu rỗng. Thử trước rồi mới kết luận là không đọc nổi.
            try:
                if reader.decrypt("") == 0:
                    raise UnsupportedDocument(
                        "PDF được đặt mật khẩu — không thể đọc nội dung."
                    )
            except UnsupportedDocument:
                raise
            except Exception as exc:  # noqa: BLE001
                raise UnsupportedDocument(
                    f"PDF được mã hóa, không giải mã được: {exc}"
                ) from exc

        total_pages = len(reader.pages)
        pages = min(total_pages, MAX_PDF_PAGES)
        chunks: list[str] = []
        for i in range(pages):
            try:
                chunks.append(reader.pages[i].extract_text() or "")
            except Exception as exc:  # noqa: BLE001
                # Một trang hỏng KHÔNG được làm hỏng cả tệp: giáo trình quét
                # ảnh thường có vài trang lỗi font, phần còn lại vẫn dùng được.
                logger.debug("Bỏ qua trang PDF %d: %s", i + 1, exc)
    except UnsupportedDocument:
        raise
    except PdfReadError as exc:
        raise MalformedDocument(f"PDF hỏng hoặc không hợp lệ: {exc}") from exc

    return "\n\n".join(c for c in chunks if c.strip()), {
        "pages": pages,
        "total_pages": total_pages,
        "engine": "pypdf",
    }


# ---------------------------------------------------------------------------
# Chuẩn hóa & điều phối
# ---------------------------------------------------------------------------

#: Ký tự điều khiển (giữ lại \t và \n). Chúng có thể phá vỡ cấu trúc prompt.
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def normalize_text(raw: str, max_chars: int) -> tuple[str, bool]:
    """Dọn text và cắt theo giới hạn. Trả về (text, đã_bị_cắt)."""
    if not raw:
        return "", False

    text = _CONTROL_RE.sub(" ", raw)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # PDF bóc ra thường đầy khoảng trắng rác. Mỗi ký tự thừa là một phần token
    # phải trả tiền ở Giai đoạn B.
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = "\n".join(line.rstrip() for line in text.split("\n")).strip()

    if max_chars > 0 and len(text) > max_chars:
        return text[:max_chars].rstrip(), True
    return text, False


#: Phần mở rộng → hàm bóc.
_EXTRACTORS = {
    "pdf": _extract_pdf,
    "docx": _extract_docx,
    "docm": _extract_docx,
    "pptx": _extract_pptx,
    "pptm": _extract_pptx,
    "odt": _extract_odf,
    "odp": _extract_odf,
    "ods": _extract_odf,
}

#: Định dạng nhị phân đời cũ. Đọc được chúng cần LibreOffice (~400MB) hoặc
#: `antiword` — hoàn toàn không tương xứng với lợi ích thu về.
_LEGACY = {"doc", "ppt", "xls"}


def parse_document(
    filename: str,
    data: bytes,
    max_chars: int = DEFAULT_MAX_CHARS,
) -> dict:
    """Bóc text từ một tài liệu.

    Args:
        filename: Tên tệp gốc — CHỈ dùng để lấy phần mở rộng và ghi log.
                  Tuyệt đối không dùng để mở bất kỳ đường dẫn nào trên đĩa.
        data: Nội dung thô của tệp.
        max_chars: Số ký tự tối đa trả về (<= 0 nghĩa là không cắt).

    Returns:
        dict gồm: text, chars, truncated, kind, meta, warnings

    Raises:
        UnsupportedDocument, MalformedDocument
    """
    if not data:
        raise MalformedDocument("Tệp rỗng.")
    if len(data) > MAX_INPUT_BYTES:
        raise UnsupportedDocument(
            f"Tệp lớn hơn giới hạn {MAX_INPUT_BYTES // (1024 * 1024)}MB."
        )

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext in _LEGACY:
        raise UnsupportedDocument(
            f"Định dạng .{ext} đời cũ không được hỗ trợ. "
            f"Hãy lưu lại dưới dạng .{ext}x (hoặc .pdf) rồi tải lên lại."
        )

    extractor = _EXTRACTORS.get(ext)
    if extractor is None:
        raise UnsupportedDocument(
            f"Không hỗ trợ phần mở rộng '.{ext}'. "
            f"Hỗ trợ: {', '.join('.' + k for k in sorted(_EXTRACTORS))}"
        )

    raw, meta = extractor(data)
    text, truncated = normalize_text(raw, max_chars)

    warnings: list[str] = []
    if not text:
        # Đây là trường hợp RẤT hay gặp và phải nói rõ cho giảng viên, nếu
        # không họ chỉ thấy mô tả trống mà không hiểu vì sao.
        if ext == "pdf":
            warnings.append(
                "Không bóc được chữ nào. Nhiều khả năng đây là PDF quét từ ảnh "
                "— cần OCR, hiện chưa hỗ trợ."
            )
        else:
            warnings.append("Tài liệu không chứa nội dung chữ nào đọc được.")
    if truncated:
        warnings.append(f"Nội dung đã được rút gọn còn {max_chars} ký tự.")
    if meta.get("total_pages", 0) > MAX_PDF_PAGES:
        warnings.append(
            f"Chỉ xử lý {MAX_PDF_PAGES}/{meta['total_pages']} trang đầu."
        )

    return {
        "text": text,
        "chars": len(text),
        "truncated": truncated,
        "kind": ext,
        "meta": meta,
        "warnings": warnings,
    }


#: Danh sách để endpoint và tài liệu API cùng dùng — tránh liệt kê hai nơi
#: rồi lệch nhau.
SUPPORTED_EXTENSIONS = sorted(_EXTRACTORS.keys())
