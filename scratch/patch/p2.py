# -*- coding: utf-8 -*-
import io, sys, re, ast
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)

p = '/ai-service/src/rag/chain.py'
s = read(p)
OLD_IMP = """from src.rag.prompts import (
    MASTER_SYSTEM_PROMPT,
    COURSE_SYSTEM_PROMPT,
    COURSE_SEARCH_PROMPT,
)"""
NEW_IMP = """from src.rag.prompts import (
    MASTER_SYSTEM_PROMPT,
    COURSE_SYSTEM_PROMPT,
    COURSE_SEARCH_PROMPT,
    COURSE_SEARCH_OUT_OF_SCOPE_MESSAGE,
    COURSE_SEARCH_EMPTY_MESSAGE,
)
# [THÊM 20/08/2026] Hai import dưới đây phục vụ trợ lý tìm khóa học ở trang
# /courses: hàng rào ý định dùng chung bộ định tuyến với chatbot, và bộ truy hồi
# lai dùng chung với agent — để hai đường không còn lệch chất lượng tìm kiếm.
from src.core.intent_router import classify_intent, UserIntent
from src.rag.hybrid_search import hybrid_course_search"""
assert s.count(OLD_IMP) == 1, 'khong tim thay khoi import'
s = s.replace(OLD_IMP, NEW_IMP)

start = s.index('async def search_courses_with_ai(')
m = re.search(r'\n(?=async def |def )', s[start + 10:])
end = (start + 10 + m.start() + 1) if m else len(s)
NEW_FN = open(ROOT + '/scratch/patch/newfn.py', encoding='utf-8').read()
s = s[:start] + NEW_FN + s[end:]
write(p, s)
ast.parse(read(p))
print('chain.py OK')
