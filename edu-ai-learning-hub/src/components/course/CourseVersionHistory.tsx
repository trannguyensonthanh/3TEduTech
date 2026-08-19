// src/components/course/CourseVersionHistory.tsx
//
// [THÊM 17/08/2026 — Course Versioning]
//
// Hiển thị dòng thời gian các phiên bản của một khóa học.
//
// Vì sao màn hình này quan trọng với đồ án: nó là BẰNG CHỨNG NHÌN THẤY ĐƯỢC của
// yêu cầu "cập nhật khóa học không được làm ảnh hưởng học viên đã mua". Người
// chấm nhìn vào đây thấy ngay v1 vẫn còn nguyên với đủ số học viên của nó, còn
// v2 mới là bản đang bán — thay vì phải tin vào lời giải thích.
//
// Component tự gọi API, tự xử lý loading/error nên chỉ cần truyền courseId:
//     <CourseVersionHistory courseId={course.courseId} />

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Loader2, ShoppingBag, BookOpen, Layers } from 'lucide-react';

import {
  getCourseVersionHistory,
  type CourseVersionHistoryResponse,
  type CourseVersionItem,
} from '@/services/course.service';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseVersionHistoryProps {
  /** ID của BẤT KỲ phiên bản nào trong dòng khóa học */
  courseId: number;
  className?: string;
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

/** Nhãn trạng thái của từng phiên bản, kèm màu sắc phù hợp */
const StatusBadge = ({ version }: { version: CourseVersionItem }) => {
  if (version.isLatestVersion && version.statusId === 'PUBLISHED') {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <ShoppingBag className="mr-1 h-3 w-3" />
        Đang bán
      </Badge>
    );
  }
  if (version.statusId === 'SUPERSEDED') {
    return (
      <Badge variant="secondary">
        <BookOpen className="mr-1 h-3 w-3" />
        Đã có bản mới hơn
      </Badge>
    );
  }
  if (version.statusId === 'ARCHIVED') {
    return <Badge variant="outline">Ngừng xuất bản</Badge>;
  }
  if (version.statusId === 'PENDING') {
    return <Badge variant="outline">Chờ duyệt</Badge>;
  }
  return <Badge variant="outline">{version.statusId}</Badge>;
};

const CourseVersionHistory = ({
  courseId,
  className,
}: CourseVersionHistoryProps) => {
  const [data, setData] = useState<CourseVersionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cờ này chống cập nhật state sau khi component đã unmount — người dùng bấm
    // rất nhanh sang khóa khác thì request cũ vẫn có thể trả về sau.
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCourseVersionHistory(courseId);
        if (active) setData(result);
      } catch (err) {
        if (active) {
          // 403 là trường hợp BÌNH THƯỜNG, không phải lỗi hệ thống: khách vãng
          // lai hoặc học viên chưa mua thì không có quyền xem lịch sử. Khi đó
          // component tự ẩn đi thay vì hiện một khối báo lỗi đỏ vô nghĩa.
          const status = (err as { status?: number })?.status;
          setError(
            status === 403
              ? 'FORBIDDEN'
              : 'Không tải được lịch sử phiên bản của khóa học.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (courseId) load();
    return () => {
      active = false;
    };
  }, [courseId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải lịch sử phiên bản...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Không đủ quyền → ẩn hẳn, không làm rối giao diện của khách.
  if (error === 'FORBIDDEN') return null;

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  // Chỉ có đúng một phiên bản thì không có "lịch sử" nào để kể.
  if (!data || data.versions.length <= 1) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Lịch sử phiên bản
          <Badge variant="outline" className="ml-1 font-normal">
            <Layers className="mr-1 h-3 w-3" />
            {data.versions.length} phiên bản
          </Badge>
        </CardTitle>
        <CardDescription>
          Mỗi phiên bản được lưu trữ độc lập. Học viên đã mua phiên bản nào sẽ
          tiếp tục học đúng nội dung và giữ nguyên toàn bộ tiến độ của phiên bản
          đó, kể cả khi khóa học đã có bản cập nhật mới hơn.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ol className="relative space-y-5 border-l border-border pl-6">
          {data.versions.map((v) => {
            const isCurrent = v.courseId === data.currentVersionId;
            return (
              <li key={v.courseId} className="relative">
                {/* Chấm tròn trên dòng thời gian */}
                <span
                  className={`absolute -left-[1.9rem] mt-1.5 h-3 w-3 rounded-full ring-4 ring-background ${
                    v.isLatestVersion ? 'bg-emerald-600' : 'bg-muted-foreground'
                  }`}
                  aria-hidden="true"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Phiên bản {v.versionNumber}</span>
                  <StatusBadge version={v} />
                  {isCurrent && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Bạn đang xem
                    </Badge>
                  )}
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {v.publishedAt ? (
                    <>Xuất bản: {formatDate(v.publishedAt)}</>
                  ) : (
                    <>Tạo: {formatDate(v.createdAt)}</>
                  )}
                  {v.archivedAt && <> · Được thay thế: {formatDate(v.archivedAt)}</>}
                  {typeof v.totalLessons === 'number' && (
                    <> · {v.totalLessons} bài học</>
                  )}
                  {/* studentCount chỉ có mặt khi người xem là Admin hoặc giảng
                      viên sở hữu — backend đã lược bỏ với học viên. */}
                  {typeof v.studentCount === 'number' && (
                    <> · {v.studentCount} học viên</>
                  )}
                </div>

                {v.versionNotes && (
                  <p className="mt-2 whitespace-pre-line rounded-md bg-muted/60 p-3 text-sm">
                    {v.versionNotes}
                  </p>
                )}

                {!isCurrent && v.statusId === 'PUBLISHED' && v.isLatestVersion && (
                  <Link
                    to={`/courses/${v.slug}`}
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Xem phiên bản mới nhất →
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
};

export default CourseVersionHistory;
