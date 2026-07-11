// src/components/common/PaginationControls.tsx (Hoặc đường dẫn của bạn)
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis, // Import PaginationEllipsis
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'; // Đảm bảo bạn đã export PaginationEllipsis từ index của pagination
import { Button } from '@/components/ui/button'; // Có thể dùng Button cho Prev/Next nếu muốn custom style hơn
import { useTranslation } from 'react-i18next';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  /** Số lượng nút trang hiển thị ở mỗi bên của trang hiện tại (không tính trang đầu, cuối, và ellipsis) */
  siblingCount?: number;
  /** Có luôn hiển thị nút trang đầu và cuối không */
  showFirstLastButtons?: boolean;
  isDisabled?: boolean; // Thêm prop để vô hiệu hóa toàn bộ
  className?: string; // Thêm prop className để tùy chỉnh style
}

const DOTS = '...';

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
  siblingCount = 1, // Mặc định hiển thị 1 nút ở mỗi bên trang hiện tại
  showFirstLastButtons = true, // Mặc định hiển thị nút trang đầu và cuối
  isDisabled = false,
  className,
}) => {
  const { t } = useTranslation();

  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*DOTS

    /*
      Trường hợp 1: Số lượng trang ít hơn số nút chúng ta muốn hiển thị.
      Chúng ta trả về khoảng [1..totalPages]
    */
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    /*
      Chúng ta không muốn hiển thị dấu "..." nếu chỉ có một số trang bị ẩn.
      Ví dụ: nếu siblingCount là 1 và totalPages là 5, chúng ta không muốn [1, ..., 3, 4, 5]
      mà muốn [1, 2, 3, 4, 5].
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Hiển thị dạng [1, 2, 3, ..., 10]
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Hiển thị dạng [1, ..., 8, 9, 10]
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      // Hiển thị dạng [1, ..., 4, 5, 6, ..., 10]
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    // Trường hợp không có dấu "..." nào, ví dụ khi totalPages nhỏ
    return range(1, totalPages);
  }, [totalPages, siblingCount, currentPage]);

  if (currentPage === 0 || totalPages <= 1) {
    // Không hiển thị gì nếu không có trang hoặc chỉ có 1 trang
    return null;
  }

  const onNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const onPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* Nút Previous */}
        <PaginationItem>
          <PaginationPrevious
            onClick={onPrevious}
            aria-disabled={currentPage === 1 || isDisabled}
            className={
              currentPage === 1 || isDisabled
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            aria-label={t('paginationControls.prev')}
            title={t('paginationControls.prev')}
          />
        </PaginationItem>

        {/* Các nút số trang */}
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <PaginationItem key={`${DOTS}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={currentPage === pageNumber}
                onClick={() => setCurrentPage(Number(pageNumber))} // Đảm bảo là number
                aria-current={currentPage === pageNumber ? 'page' : undefined}
                aria-label={t('paginationControls.gotoPage', {
                  page: pageNumber,
                })}
                className={
                  isDisabled
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
                aria-disabled={isDisabled}
                title={t('paginationControls.gotoPage', { page: pageNumber })}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* Nút Next */}
        <PaginationItem>
          <PaginationNext
            onClick={onNext}
            aria-disabled={currentPage === totalPages || isDisabled}
            className={
              currentPage === totalPages || isDisabled
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer'
            }
            aria-label={t('paginationControls.next')}
            title={t('paginationControls.next')}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControls;
