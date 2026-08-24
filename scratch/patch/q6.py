# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/imports/imports.service.js'
s = read(p)

# --- 1. generateQuiz: nhan them do kho ---
s = sub(s, """      '/api/generate/quiz',""", """      '/api/generate/quiz',""", 'neo goi AI')  # no-op check
s = sub(s, """const generateQuiz = async (user, jobId, { questionsPerLesson } = {}) => {""",
        """const generateQuiz = async (
  user,
  jobId,
  { questionsPerLesson, difficulty } = {}
) => {""", 'chu ky generateQuiz') if 'const generateQuiz = async (user, jobId, { questionsPerLesson } = {}) => {' in s else s
write(p, s)
print('kiem tra chu ky generateQuiz:')
