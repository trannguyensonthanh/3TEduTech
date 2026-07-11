import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';

interface PaginationComponentProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({
  currentPage,
  totalPages,
  setCurrentPage,
}) => {
  const { t } = useTranslation();
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1 ? 'pointer-events-none opacity-50' : ''
            }
            aria-label={t('pagination.previous', 'Previous')}
          >
            {t('pagination.previous', 'Previous')}
          </PaginationPrevious>
        </PaginationItem>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const pageNumber =
            currentPage <= 3
              ? i + 1
              : currentPage >= totalPages - 2
                ? totalPages - 4 + i
                : currentPage - 2 + i;

          if (pageNumber <= 0 || pageNumber > totalPages) return null;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={currentPage === pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            className={
              currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
            }
            aria-label={t('pagination.next', 'Next')}
          >
            {t('pagination.next', 'Next')}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationComponent;
