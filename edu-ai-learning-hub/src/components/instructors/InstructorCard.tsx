// src/components/instructors/InstructorCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons'; // Cần Star, Users, BookOpen
import { Badge } from '@/components/ui/badge';
import { InstructorListItem } from '@/services/instructor.service'; // Import interface
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InstructorCardProps {
  instructor: InstructorListItem;
}

const cardVariants = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }, // easeOutExpo
  },
};

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor }) => {
  const initials = instructor.fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div variants={cardVariants}>
      <Card className="group h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl dark:shadow-slate-700/40 dark:hover:shadow-blue-500/20 transition-all duration-300 border dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl">
        <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
          <Link
            to={`/instructors/${instructor.slug || instructor.accountId}`}
            className="block mb-4"
          >
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background dark:border-slate-800 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-all duration-300 shadow-lg">
              <AvatarImage
                src={instructor.avatarUrl || undefined}
                alt={instructor.fullName}
              />
              <AvatarFallback className="text-3xl font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Link
            to={`/instructors/${instructor.slug || instructor.accountId}`}
            className="block"
          >
            <h3 className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-0.5">
              {instructor.fullName}
            </h3>
          </Link>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2 line-clamp-1">
            {instructor.professionalTitle || 'Educator'}
          </p>
          {instructor.headline && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 h-[30px]">
              {instructor.headline}
            </p>
          )}

          {/* Main Skills/Specializations */}
          {instructor.mainSkills && instructor.mainSkills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 my-3">
              {instructor.mainSkills.slice(0, 3).map(
                (
                  skill // Hiển thị tối đa 3 skills
                ) => (
                  <Badge
                    key={skill.skillId}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {skill.skillName}
                  </Badge>
                )
              )}
            </div>
          )}

          <div className="flex justify-center items-center space-x-4 text-xs text-muted-foreground mt-auto pt-3 border-t dark:border-slate-700/50 w-full">
            {instructor.averageRating != null &&
              instructor.averageRating > 0 && (
                <div
                  className="flex items-center"
                  title={`${instructor.averageRating.toFixed(
                    1
                  )} average rating`}
                >
                  <Icons.star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium">
                    {instructor.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            {instructor.totalStudents != null && (
              <div
                className="flex items-center"
                title={`${instructor.totalStudents.toLocaleString()} students`}
              >
                <Icons.users className="w-3.5 h-3.5 mr-1" />
                <span className="font-medium">
                  {instructor.totalStudents > 1000
                    ? `${(instructor.totalStudents / 1000).toFixed(1)}k`
                    : instructor.totalStudents}
                </span>
              </div>
            )}
            {instructor.totalCourses != null && (
              <div
                className="flex items-center"
                title={`${instructor.totalCourses} courses`}
              >
                <Icons.courses className="w-3.5 h-3.5 mr-1" />{' '}
                {/* Giả sử có Icons.courses */}
                <span className="font-medium">{instructor.totalCourses}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t dark:border-slate-700/50">
          <Link
            to={`/instructors/${instructor.slug || instructor.accountId}`}
            className="w-full"
          >
            <Button
              variant="outline"
              className="w-full h-11 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-500 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400"
            >
              View Profile <Icons.arrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default InstructorCard;
