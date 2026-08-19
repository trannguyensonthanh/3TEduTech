// src/pages/instructor/components/StatCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading: boolean;
  className?: string;
  variant?: 'cyan' | 'fuchsia' | 'amber' | 'emerald' | 'default';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  isLoading,
  className,
  variant = 'default',
}) => {
  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border p-5 shadow-sm bg-card/80', className)}>
        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0 p-0'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-10 w-10 rounded-xl' />
        </CardHeader>
        <CardContent className='p-0 mt-4'>
          <Skeleton className='h-8 w-36' />
          <Skeleton className='h-3 w-32 mt-2' />
        </CardContent>
      </Card>
    );
  }

  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/30 dark:border-cyan-500/40 hover:border-cyan-400/60',
      gradient: 'from-cyan-500/10 via-background to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-cyan-500/10',
      glow: 'bg-cyan-500/20',
      valueGradient: 'from-cyan-500 via-blue-500 to-indigo-500 dark:from-cyan-300 dark:via-blue-400 dark:to-indigo-400',
    },
    fuchsia: {
      border: 'border-fuchsia-500/30 dark:border-fuchsia-500/40 hover:border-fuchsia-400/60',
      gradient: 'from-fuchsia-500/10 via-background to-purple-500/10 hover:from-fuchsia-500/20 hover:to-purple-500/20',
      iconBg: 'bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400 border border-fuchsia-500/30 shadow-fuchsia-500/10',
      glow: 'bg-fuchsia-500/20',
      valueGradient: 'from-fuchsia-500 via-purple-500 to-pink-500 dark:from-fuchsia-300 dark:via-purple-400 dark:to-pink-400',
    },
    amber: {
      border: 'border-amber-500/30 dark:border-amber-500/40 hover:border-amber-400/60',
      gradient: 'from-amber-500/10 via-background to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-amber-500/10',
      glow: 'bg-amber-500/20',
      valueGradient: 'from-amber-500 via-orange-500 to-yellow-500 dark:from-amber-300 dark:via-orange-400 dark:to-yellow-400',
    },
    emerald: {
      border: 'border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-400/60',
      gradient: 'from-emerald-500/10 via-background to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10',
      glow: 'bg-emerald-500/20',
      valueGradient: 'from-emerald-500 via-teal-500 to-green-500 dark:from-emerald-300 dark:via-teal-400 dark:to-green-400',
    },
    default: {
      border: 'border-indigo-500/30 dark:border-indigo-500/40 hover:border-indigo-400/60',
      gradient: 'from-indigo-500/10 via-background to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20',
      iconBg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-indigo-500/10',
      glow: 'bg-indigo-500/20',
      valueGradient: 'from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-300 dark:via-purple-400 dark:to-pink-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className='h-full group'
    >
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl bg-card/80 shadow-lg hover:shadow-2xl transition-all duration-300 border',
          style.border,
          'bg-gradient-to-br',
          style.gradient,
          className
        )}
      >
        {/* Ambient Radial Glow Orb */}
        <div
          className={cn(
            'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-transform duration-500 group-hover:scale-150 group-hover:opacity-100 opacity-70',
            style.glow
          )}
        />

        <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0 p-0 relative z-10'>
          <CardTitle className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
            {title}
          </CardTitle>
          <div
            className={cn(
              'p-2.5 rounded-xl shadow-md transition-transform duration-300 transform group-hover:rotate-6 group-hover:scale-110 flex items-center justify-center',
              style.iconBg
            )}
          >
            {icon}
          </div>
        </CardHeader>

        <CardContent className='p-0 mt-4 relative z-10'>
          <div className='text-3xl font-black tracking-tight font-outfit drop-shadow-sm'>
            <span className={cn('bg-clip-text text-transparent bg-gradient-to-r', style.valueGradient)}>
              {value}
            </span>
          </div>
          {description && (
            <p className='text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1 opacity-90 group-hover:text-foreground transition-colors'>
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
