// src/components/categories/CategoryCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons'; // Giả sử có Icons.arrowRight
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

// Interface cho props, dựa trên Category từ service
export interface CategoryCardData {
  categoryId: number;
  categoryName: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null; // Ảnh đại diện chính
  courseCount?: number;
}

interface CategoryCardProps {
  category: CategoryCardData;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={cardVariants}>
      <Card className='group h-full flex flex-col overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-slate-700/50 dark:hover:shadow-primary/30 transition-all duration-300 border dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/40 rounded-xl'>
        <Link
          to={`/categories/${category.slug}`}
          className='block aspect-[16/10] overflow-hidden relative'
        >
          <img
            src={category.iconUrl || `https://i.imgur.com/d5p124y.png`} // Placeholder nếu không có iconUrl
            alt={category.categoryName}
            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
          />
          {category.courseCount !== undefined && category.courseCount > 0 && (
            <Badge
              variant='secondary'
              className='absolute top-3 right-3 bg-background/80 dark:bg-foreground/80 backdrop-blur-sm shadow-md'
            >
              {t('categories.courseCount', { count: category.courseCount })}
            </Badge>
          )}
        </Link>
        <CardContent className='p-5 flex flex-col flex-grow'>
          <Link to={`/categories/${category.slug}`} className='block'>
            <h3 className='text-xl font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary/90 transition-colors line-clamp-2 mb-1.5'>
              {category.categoryName}
            </h3>
          </Link>
          {category.description && (
            <p className='text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed'>
              {category.description}
            </p>
          )}
          <div className='mt-auto'>
            {' '}
            {/* Đẩy button xuống dưới */}
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='text-primary dark:text-primary/90 hover:bg-primary/10 dark:hover:bg-primary/20 px-0 group-hover:underline'
            >
              <Link to={`/categories/${category.slug}`}>
                {t('categories.exploreCourses')}{' '}
                <Icons.arrowRight className='ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5' />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CategoryCard;
