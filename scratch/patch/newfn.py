async def search_courses_with_ai(query: str, top_k: int = 5) -> dict:
    """
    Trợ lý TÌM KHÓA HỌC của trang /courses — chuyên biệt, một nhiệm vụ duy nhất.

    [VIẾT LẠI 20/08/2026]

    Ba khác biệt so với bản cũ:

    1. CÓ HÀNG RÀO PHẠM VI. Bản cũ nhận mọi câu hỏi và trả lời bằng mô hình lớn,
       nên nó vừa trùng chức năng với chatbot tổng, vừa đốt token cho những câu
       chẳng liên quan gì tới chọn khóa học. Nay câu hỏi đi qua bộ định tuyến ý
       định (mô hình định tuyến rẻ, cùng bộ với chatbot) và chỉ ý định
       SEARCH_COURSE hoặc BUY_COURSE mới được đi tiếp. Mọi ý định khác bị chặn
       TRƯỚC khi chạm tới mô hình sinh văn bản.

    2. DÙNG TÌM KIẾM LAI thay vì chỉ tìm theo vector. Trước đây hàm này gọi
       thẳng `search_documents` (chỉ vector đặc), trong khi chatbot tổng đã dùng
       `hybrid_course_search` (BM25 + vector + hợp nhất RRF). Nghịch lý: đúng
       chỗ người dùng gõ tên khóa học chính xác nhất lại là chỗ KHÔNG có khớp
       từ khóa. Nay hai đường dùng chung một bộ truy hồi.

    3. TRẢ VỀ TÊN KHÓA HỌC TÁCH RIÊNG (`matched_courses`) để backend đối chiếu
       với cơ sở dữ liệu rồi dựng thẻ khóa học thật. Kho vector không giữ giá,
       ảnh bìa hay trạng thái xuất bản — và cũng KHÔNG NÊN giữ, vì những thứ đó
       đổi liên tục. Nguồn sự thật vẫn là SQL Server.

    Returns:
        dict gồm: answer, sources, matched_courses, out_of_scope, intent.
    """
    settings = get_settings()
    clean_query = (query or "").strip()

    # --- Hàng rào 0: câu quá ngắn thì không gọi mô hình nào cả ---------------
    if len(clean_query) < 3:
        return {
            "answer": COURSE_SEARCH_EMPTY_MESSAGE,
            "sources": [],
            "matched_courses": [],
            "out_of_scope": False,
            "intent": None,
        }

    # --- Hàng rào 1: phân loại ý định ---------------------------------------
    # Chỉ hai ý định được đi tiếp:
    #   SEARCH_COURSE — "tôi muốn học lập trình web"
    #   BUY_COURSE    — "cho tôi mua khóa Python" (vẫn là đang tìm khóa học,
    #                   chỉ khác ở chỗ người dùng đã quyết định mua)
    # Bốn ý định còn lại (FAQ_QUERY, COURSE_LEARN, GENERAL_CHAT,
    # CONFIRM_PAYMENT) thuộc về chatbot tổng, không phải ô này.
    allowed = {UserIntent.SEARCH_COURSE, UserIntent.BUY_COURSE}
    intent_value = None
    try:
        routed = await classify_intent(clean_query)
        detected = routed.get("intent")
        intent_value = detected.value if hasattr(detected, "value") else str(detected)
        if detected not in allowed:
            logger.info(
                "[Course Search] Chan cau hoi ngoai pham vi (intent=%s): %s",
                intent_value,
                clean_query[:80],
            )
            return {
                "answer": COURSE_SEARCH_OUT_OF_SCOPE_MESSAGE,
                "sources": [],
                "matched_courses": [],
                "out_of_scope": True,
                "intent": intent_value,
            }
    except Exception as e:
        # Bộ định tuyến hỏng thì CHO ĐI TIẾP chứ không chặn. Chặn khi không phân
        # loại được nghĩa là một sự cố của mô hình định tuyến sẽ làm chết luôn
        # chức năng tìm kiếm — mà tìm kiếm mới là nhiệm vụ chính. Sai theo hướng
        # vẫn phục vụ được người dùng.
        logger.warning("[Course Search] Bo dinh tuyen y dinh loi, bo qua hang rao: %s", e)

    # --- Truy hồi: tìm kiếm lai trên phần mô tả tổng quan của khóa học -------
    results = await hybrid_course_search(
        query=clean_query,
        top_k=top_k,
        collection_name=settings.chroma_collection_courses,
        where={"type": "course_overview"},
    )

    if not results:
        return {
            "answer": COURSE_SEARCH_EMPTY_MESSAGE,
            "sources": [],
            "matched_courses": [],
            "out_of_scope": False,
            "intent": intent_value,
        }

    # --- Gom tên khóa học, giữ nguyên thứ hạng, bỏ trùng --------------------
    matched_courses = []
    seen = set()
    for r in results:
        name = (r.get("metadata") or {}).get("course_name")
        if not name:
            continue
        key = name.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        matched_courses.append(name.strip())

    context = "\n\n".join([r["content"] for r in results])
    prompt = COURSE_SEARCH_PROMPT.format(query=clean_query, context=context)

    answer = await generate_chat_response(query=prompt)

    sources = [
        {
            "file_name": (r.get("metadata") or {}).get("course_name", "Khoa hoc"),
            "content": r["content"][:200],
        }
        for r in results
    ]

    return {
        "answer": answer,
        "sources": sources,
        "matched_courses": matched_courses,
        "out_of_scope": False,
        "intent": intent_value,
    }
