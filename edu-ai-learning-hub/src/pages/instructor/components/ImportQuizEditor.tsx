// src/pages/instructor/components/ImportQuizEditor.tsx
//
/* ============================================================================
   [THÊM 20/08/2026] SOẠN VÀ SỬA CÂU HỎI TRẮC NGHIỆM Ở MÀN HÌNH DUYỆT

   ── BA THỨ BẢN CŨ KHÔNG LÀM ĐƯỢC ─────────────────────────────────────────

   1. KHÔNG chọn được số câu và độ khó. Giao diện ghi cứng 3 câu mỗi bài, và
      khái niệm độ khó không tồn tại ở bất kỳ đâu trong hệ thống. Đề ra quá dễ
      (không phân loại được ai hiểu bài) hay quá khó (tỉ lệ đậu sụp, học viên bỏ
      ngang) đều chỉ còn cách bấm "soạn lại" rồi cầu may.

   2. KHÔNG sửa được câu hỏi. Toàn bộ khối câu hỏi là thẻ <p> và <li>, không một
      ô nhập nào. Sai một chữ trong đáp án thì phải soạn lại TOÀN BỘ đề — đốt
      thêm một lượt gọi mô hình và mất luôn những câu đang tốt — hoặc bỏ hết rồi
      vào trang Sửa khóa học gõ lại từ đầu.

   3. KHÔNG bỏ được từng câu. Chỉ có đúng một ô tick tất-cả-hoặc-không.

   ── VÌ SAO SỬA Ở ĐÂY MÀ KHÔNG PHẢI SAU KHI TẠO KHÓA HỌC ──────────────────

   Vì đây là lúc giảng viên đang ĐỌC nội dung để duyệt. Bắt họ nhớ "câu 3 bài 2
   sai" rồi tự đi tìm lại trong trang Sửa khóa học là cách chắc chắn nhất để
   những câu sai đó ở lại trong đề mãi mãi.

   ── CÂU HỎI ĐI VỀ ĐÂU ────────────────────────────────────────────────────

   Câu hỏi được gom theo CHƯƠNG và trở thành một bài học riêng kiểu QUIZ đặt ở
   cuối chương ("Bài kiểm tra — <tên chương>"). Đây là điều bản trước làm sai:
   nó gắn câu hỏi thẳng vào bài TEXT/VIDEO, mà mọi đường đọc trong hệ thống đều
   đòi `LessonType = 'QUIZ'`, nên câu hỏi lọt vào cơ sở dữ liệu rồi biến mất
   khỏi giao diện — học viên không làm được, giảng viên không xem được.
============================================================================ */

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand,
} from 'lucide-react';

import {
  generateQuiz,
  saveImportQuiz,
  type ProposedQuizQuestion,
  type QuizDifficulty,
} from '@/services/import.service';

export interface QuizLessonRef {
  sourcePath: string;
  lessonName: string;
  sectionName: string;
  /** Bài có nội dung văn bản đủ dài để ra đề không. */
  raDeDuoc: boolean;
  questions: ProposedQuizQuestion[];
}

interface Props {
  jobId: string;
  lessons: QuizLessonRef[];
  /** Gọi khi danh sách câu hỏi đổi — trang cha đồng bộ lại trạng thái của nó. */
  onChange: (
    capNhat: Array<{ sourcePath: string; questions: ProposedQuizQuestion[] }>
  ) => void;
  includeQuiz: boolean;
  onIncludeQuizChange: (v: boolean) => void;
}

const NHAN_DO_KHO: Record<QuizDifficulty, string> = {
  easy: 'Dễ — hỏi định nghĩa, sự kiện nêu thẳng trong bài',
  medium: 'Trung bình — hỏi liên hệ giữa các ý',
  hard: 'Khó — hỏi cách áp dụng vào tình huống',
  mixed: 'Trộn ba mức (khuyến nghị)',
};

const ImportQuizEditor: React.FC<Props> = ({
  jobId,
  lessons,
  onChange,
  includeQuiz,
  onIncludeQuizChange,
}) => {
  const [dangSoan, setDangSoan] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [soCau, setSoCau] = useState('3');
  const [doKho, setDoKho] = useState<QuizDifficulty>('mixed');
  const [canhBao, setCanhBao] = useState<string[]>([]);
  const [mo, setMo] = useState<Record<string, boolean>>({});
  /* Có thay đổi chưa lưu hay không. Không có cờ này thì giảng viên sửa xong,
     bấm "Tạo khóa học", và máy chủ vẫn dùng bản AI vừa sinh — im lặng bỏ hết
     công sửa. */
  const [chuaLuu, setChuaLuu] = useState(false);

  const soBaiRaDeDuoc = useMemo(
    () => lessons.filter((l) => l.raDeDuoc).length,
    [lessons]
  );
  const tongCau = useMemo(
    () => lessons.reduce((n, l) => n + l.questions.length, 0),
    [lessons]
  );

  /* Gom theo chương để hiển thị đúng cách câu hỏi sẽ được tạo ra: mỗi chương
     một bài kiểm tra. Nhìn thấy trước cấu trúc đó ngay ở đây thì giảng viên
     không phải đoán "đề này rồi sẽ nằm ở đâu". */
  const theoChuong = useMemo(() => {
    const map = new Map<string, QuizLessonRef[]>();
    for (const l of lessons) {
      if (l.questions.length === 0) continue;
      const arr = map.get(l.sectionName) || [];
      arr.push(l);
      map.set(l.sectionName, arr);
    }
    return [...map.entries()];
  }, [lessons]);

  /* ------------------------------------------------------------------ */

  const suaCauHoi = (
    sourcePath: string,
    index: number,
    thayDoi: Partial<ProposedQuizQuestion>
  ) => {
    setChuaLuu(true);
    onChange(
      lessons.map((l) =>
        l.sourcePath === sourcePath
          ? {
              sourcePath: l.sourcePath,
              questions: l.questions.map((q, i) =>
                i === index ? { ...q, ...thayDoi } : q
              ),
            }
          : { sourcePath: l.sourcePath, questions: l.questions }
      )
    );
  };

  const xoaCauHoi = (sourcePath: string, index: number) => {
    setChuaLuu(true);
    onChange(
      lessons.map((l) =>
        l.sourcePath === sourcePath
          ? {
              sourcePath: l.sourcePath,
              questions: l.questions.filter((_, i) => i !== index),
            }
          : { sourcePath: l.sourcePath, questions: l.questions }
      )
    );
  };

  const themCauHoi = (sourcePath: string) => {
    setChuaLuu(true);
    onChange(
      lessons.map((l) =>
        l.sourcePath === sourcePath
          ? {
              sourcePath: l.sourcePath,
              questions: [
                ...l.questions,
                {
                  question: '',
                  options: ['', '', '', ''],
                  correctIndex: 0,
                  explanation: '',
                },
              ],
            }
          : { sourcePath: l.sourcePath, questions: l.questions }
      )
    );
    setMo((p) => ({ ...p, [sourcePath]: true }));
  };

  /* ------------------------------------------------------------------ */

  const handleSoanDe = async () => {
    if (dangSoan) return;
    setDangSoan(true);
    setCanhBao([]);
    try {
      const kq = await generateQuiz(jobId, Number(soCau) || 3, doKho);

      /* Máy chủ XÓA đề cũ trên toàn bản nháp trước khi gán đề mới, nên phải
         đồng bộ cả những bài KHÔNG có trong kết quả — dùng `?? []` chứ không
         phải `|| l.questions`, nếu không đề cũ sẽ sống sót ở phía giao diện
         trong khi máy chủ đã bỏ. */
      const theoDuong = new Map<string, ProposedQuizQuestion[]>();
      for (const sec of kq.proposal.sections || []) {
        for (const bai of sec.lessons || []) {
          theoDuong.set(bai.sourcePath, bai.quizQuestions ?? []);
        }
      }
      onChange(
        lessons.map((l) => ({
          sourcePath: l.sourcePath,
          questions: theoDuong.get(l.sourcePath) ?? [],
        }))
      );

      setCanhBao(kq.warnings || []);
      setChuaLuu(false); // vừa sinh xong thì máy chủ và giao diện đang khớp nhau
      onIncludeQuizChange(true);
      toast.success(
        `AI đã soạn ${kq.totalQuestions} câu hỏi cho ${kq.lessonsWithQuiz} bài học.`
      );
    } catch (error: any) {
      toast.error(error?.message || 'Không soạn được câu hỏi.');
    } finally {
      setDangSoan(false);
    }
  };

  const handleLuu = async () => {
    if (dangLuu) return;

    /* Kiểm tra TRƯỚC khi gửi, để báo đúng câu nào hỏng. Máy chủ cũng kiểm lại
       (không tin client bao giờ), nhưng lỗi Joi trả về chỉ nói "câu hỏi thứ 3
       không hợp lệ" — ở đây nói được "Bài X, câu 3: chưa có nội dung". */
    for (const l of lessons) {
      for (let i = 0; i < l.questions.length; i += 1) {
        const q = l.questions[i];
        const nhan = `"${l.lessonName}", câu ${i + 1}`;
        if (!q.question.trim()) {
          toast.error(`${nhan}: chưa nhập nội dung câu hỏi.`);
          return;
        }
        const luaChon = q.options.map((o) => o.trim());
        if (luaChon.length < 2) {
          toast.error(`${nhan}: phải có ít nhất 2 lựa chọn.`);
          return;
        }
        if (luaChon.some((o) => !o)) {
          toast.error(`${nhan}: có lựa chọn còn để trống.`);
          return;
        }
        if (q.correctIndex < 0 || q.correctIndex >= luaChon.length) {
          toast.error(`${nhan}: chưa chọn đáp án đúng.`);
          return;
        }
      }
    }

    setDangLuu(true);
    try {
      const kq = await saveImportQuiz(
        jobId,
        lessons.map((l) => ({
          sourcePath: l.sourcePath,
          questions: l.questions.map((q) => ({
            ...q,
            question: q.question.trim(),
            options: q.options.map((o) => o.trim()),
            explanation: (q.explanation || '').trim(),
          })),
        }))
      );
      setChuaLuu(false);
      toast.success(
        `Đã lưu ${kq.totalQuestions} câu hỏi cho ${kq.lessonsWithQuiz} bài học.`
      );
    } catch (error: any) {
      toast.error(error?.message || 'Không lưu được câu hỏi.');
    } finally {
      setDangLuu(false);
    }
  };

  /* ------------------------------------------------------------------ */

  return (
    <div className='space-y-5'>
      {/* ── Bảng điều khiển soạn đề ── */}
      <div className='rounded-lg border border-border bg-muted/40 p-4'>
        <div className='mb-3 flex items-center gap-2'>
          <Sparkles className='h-4 w-4 text-primary' aria-hidden='true' />
          <span className='text-sm font-semibold'>Nhờ AI soạn đề</span>
        </div>

        {soBaiRaDeDuoc === 0 ? (
          <div className='flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
            <span>
              Chưa có bài học nào đủ nội dung để ra đề. Trắc nghiệm chỉ tạo được
              từ bài có tài liệu văn bản (PDF, DOCX, TXT…). Bài video cần có phụ
              đề đi kèm trong tệp nén.
            </span>
          </div>
        ) : (
          <>
            <p className='mb-3 text-sm text-muted-foreground'>
              {soBaiRaDeDuoc} bài học có đủ nội dung để ra đề. Câu hỏi sẽ được
              gom theo chương, mỗi chương thành một bài kiểm tra đặt ở cuối
              chương.
            </p>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr_auto]'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Số câu mỗi bài</Label>
                <Select value={soCau} onValueChange={setSoCau}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} câu
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs'>Độ khó</Label>
                <Select
                  value={doKho}
                  onValueChange={(v) => setDoKho(v as QuizDifficulty)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      ['mixed', 'easy', 'medium', 'hard'] as QuizDifficulty[]
                    ).map((k) => (
                      <SelectItem key={k} value={k}>
                        {NHAN_DO_KHO[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-end'>
                <Button
                  type='button'
                  onClick={handleSoanDe}
                  disabled={dangSoan}
                  className='w-full sm:w-auto'
                >
                  {dangSoan ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                      Đang soạn…
                    </>
                  ) : (
                    <>
                      <Wand className='h-4 w-4' aria-hidden='true' />
                      {tongCau > 0 ? 'Soạn lại đề' : 'Soạn đề'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {tongCau > 0 && (
              <p className='mt-2 text-xs text-muted-foreground'>
                Soạn lại sẽ <strong>thay thế toàn bộ</strong> đề hiện tại, kể cả
                những câu bạn đã sửa tay.
              </p>
            )}
          </>
        )}

        {canhBao.length > 0 && (
          <ul className='mt-3 space-y-1 text-xs text-muted-foreground'>
            {canhBao.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Tổng kết + lưu ── */}
      {tongCau > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <Checkbox
              id='include-quiz'
              checked={includeQuiz}
              onCheckedChange={(v) => onIncludeQuizChange(v === true)}
            />
            <div>
              <Label htmlFor='include-quiz' className='cursor-pointer text-sm font-medium'>
                Tạo kèm {tongCau} câu hỏi trong {theoChuong.length} bài kiểm tra
              </Label>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                Mỗi chương có câu hỏi sẽ nhận thêm một bài <strong>Bài kiểm tra
                — &lt;tên chương&gt;</strong> đặt ở cuối chương.
              </p>
            </div>
          </div>

          <Button
            type='button'
            variant={chuaLuu ? 'default' : 'outline'}
            onClick={handleLuu}
            disabled={dangLuu}
          >
            {dangLuu ? (
              <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
            ) : (
              <Save className='h-4 w-4' aria-hidden='true' />
            )}
            {chuaLuu ? 'Lưu thay đổi' : 'Đã lưu'}
          </Button>
        </div>
      )}

      {chuaLuu && (
        <div className='flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning'>
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          <span>
            Bạn có thay đổi chưa lưu. Bấm <strong>Lưu thay đổi</strong> trước khi
            tạo khóa học, nếu không hệ thống sẽ dùng bản đề gốc do AI soạn.
          </span>
        </div>
      )}

      {/* ── Danh sách câu hỏi, gom theo chương ── */}
      {theoChuong.map(([tenChuong, baiTrongChuong]) => {
        const soCauChuong = baiTrongChuong.reduce(
          (n, b) => n + b.questions.length,
          0
        );
        return (
          <div key={tenChuong} className='rounded-lg border border-border'>
            <div className='flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3'>
              <ListChecks className='h-4 w-4 text-primary' aria-hidden='true' />
              <span className='text-sm font-semibold'>
                Bài kiểm tra — {tenChuong}
              </span>
              <span className='rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground'>
                {soCauChuong} câu
              </span>
            </div>

            <div className='divide-y divide-border'>
              {baiTrongChuong.map((bai) => (
                <div key={bai.sourcePath} className='p-4'>
                  <button
                    type='button'
                    onClick={() =>
                      setMo((p) => ({ ...p, [bai.sourcePath]: !p[bai.sourcePath] }))
                    }
                    className='flex w-full items-center gap-2 text-left'
                  >
                    {mo[bai.sourcePath] ? (
                      <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                    ) : (
                      <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                    )}
                    <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                      {bai.lessonName}
                    </span>
                    <span className='shrink-0 text-xs text-muted-foreground'>
                      {bai.questions.length} câu
                    </span>
                  </button>

                  {mo[bai.sourcePath] && (
                    <div className='mt-4 space-y-4 pl-6'>
                      {bai.questions.map((q, qi) => (
                        <div
                          key={qi}
                          className='space-y-3 rounded-lg border border-border p-3'
                        >
                          <div className='flex items-start gap-2'>
                            <span className='mt-2 shrink-0 text-xs font-semibold text-muted-foreground'>
                              {qi + 1}.
                            </span>
                            <Textarea
                              value={q.question}
                              onChange={(e) =>
                                suaCauHoi(bai.sourcePath, qi, {
                                  question: e.target.value,
                                })
                              }
                              placeholder='Nội dung câu hỏi…'
                              rows={2}
                              className='flex-1 text-sm'
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='shrink-0 text-muted-foreground hover:text-danger'
                              onClick={() => xoaCauHoi(bai.sourcePath, qi)}
                              aria-label={`Xóa câu ${qi + 1}`}
                            >
                              <Trash2 className='h-4 w-4' aria-hidden='true' />
                            </Button>
                          </div>

                          <div className='space-y-2 pl-6'>
                            {q.options.map((o, oi) => (
                              <div key={oi} className='flex items-center gap-2'>
                                {/* Nút tròn thay cho checkbox: đúng MỘT đáp án
                                    đúng là bất biến của hệ thống, và checkbox
                                    gợi ý sai rằng chọn nhiều được. */}
                                <button
                                  type='button'
                                  onClick={() =>
                                    suaCauHoi(bai.sourcePath, qi, {
                                      correctIndex: oi,
                                    })
                                  }
                                  aria-label={`Đặt lựa chọn ${String.fromCharCode(65 + oi)} làm đáp án đúng`}
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                                    q.correctIndex === oi
                                      ? 'border-success bg-success text-white'
                                      : 'border-border text-muted-foreground hover:border-primary'
                                  }`}
                                >
                                  {q.correctIndex === oi ? (
                                    <Check className='h-3.5 w-3.5' aria-hidden='true' />
                                  ) : (
                                    String.fromCharCode(65 + oi)
                                  )}
                                </button>
                                <Input
                                  value={o}
                                  onChange={(e) => {
                                    const moi = [...q.options];
                                    moi[oi] = e.target.value;
                                    suaCauHoi(bai.sourcePath, qi, { options: moi });
                                  }}
                                  placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}`}
                                  className='h-9 text-sm'
                                />
                                {q.options.length > 2 && (
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon'
                                    className='h-9 w-9 shrink-0 text-muted-foreground'
                                    onClick={() => {
                                      const moi = q.options.filter((_, i) => i !== oi);
                                      /* Xóa một lựa chọn nằm TRƯỚC đáp án đúng
                                         làm mọi chỉ số sau nó lùi một bậc. Không
                                         dịch lại thì đáp án đúng lặng lẽ trỏ
                                         sang lựa chọn bên cạnh. */
                                      let ci = q.correctIndex;
                                      if (oi < ci) ci -= 1;
                                      else if (oi === ci) ci = 0;
                                      suaCauHoi(bai.sourcePath, qi, {
                                        options: moi,
                                        correctIndex: ci,
                                      });
                                    }}
                                    aria-label={`Xóa lựa chọn ${String.fromCharCode(65 + oi)}`}
                                  >
                                    <Trash2 className='h-3.5 w-3.5' aria-hidden='true' />
                                  </Button>
                                )}
                              </div>
                            ))}

                            {q.options.length < 6 && (
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                className='h-7 text-xs'
                                onClick={() =>
                                  suaCauHoi(bai.sourcePath, qi, {
                                    options: [...q.options, ''],
                                  })
                                }
                              >
                                <Plus className='h-3 w-3' aria-hidden='true' />
                                Thêm lựa chọn
                              </Button>
                            )}
                          </div>

                          <div className='pl-6'>
                            <Label className='text-xs text-muted-foreground'>
                              Giải thích (hiện ra sau khi học viên nộp bài)
                            </Label>
                            <Textarea
                              value={q.explanation || ''}
                              onChange={(e) =>
                                suaCauHoi(bai.sourcePath, qi, {
                                  explanation: e.target.value,
                                })
                              }
                              rows={2}
                              className='mt-1 text-sm'
                              placeholder='Vì sao đáp án này đúng…'
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => themCauHoi(bai.sourcePath)}
                      >
                        <Plus className='h-3.5 w-3.5' aria-hidden='true' />
                        Thêm câu hỏi cho bài này
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ImportQuizEditor;
