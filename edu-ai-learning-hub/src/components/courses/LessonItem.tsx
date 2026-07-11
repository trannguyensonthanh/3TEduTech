import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDown,
  Clock,
  FileCheckIcon,
  FileText,
  Trash,
  Video,
  BookOpen,
} from "lucide-react";
import { Lesson } from "@/types/course";

interface LessonItemProps {
  lesson: Lesson;
  onEditLesson: () => void;
  onDeleteLesson: () => void;
  onToggleLessonPublish: () => void;
  onToggleLessonPreview: () => void;
  onAddResource: () => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  onEditLesson,
  onDeleteLesson,
  onToggleLessonPublish,
  onToggleLessonPreview,
  onAddResource,
}) => {
  return (
    <div key={lesson.id} className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {lesson.type === "VIDEO" && (
              <Video className="h-5 w-5 text-muted-foreground" />
            )}
            {lesson.type === "TEXT" && (
              <FileText className="h-5 w-5 text-muted-foreground" />
            )}
            {lesson.type === "QUIZ" && (
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium">{lesson.title}</h4>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {lesson.type}
              </Badge>
              {lesson.isPublished ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Published
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  Draft
                </Badge>
              )}
              {lesson.isPreview && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  Preview
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lesson.description || "No description provided"}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              {lesson.type === "VIDEO" && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {lesson.duration || "00:00"}
                </div>
              )}
              {lesson.resources.length > 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileCheckIcon className="h-4 w-4 mr-1" />
                  {lesson.resources.length} resource
                  {lesson.resources.length !== 1 ? "s" : ""}
                </div>
              )}
              {lesson.type === "QUIZ" && lesson.questions && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {lesson.questions.length} question
                  {lesson.questions.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEditLesson}>
                Edit Lesson
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddResource}>
                Add Resource
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleLessonPreview}>
                {lesson.isPreview
                  ? "Remove Free Preview"
                  : "Set as Free Preview"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleLessonPublish}>
                {lesson.isPublished ? "Unpublish Lesson" : "Publish Lesson"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={onDeleteLesson}
              >
                Delete Lesson
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {lesson.resources.length > 0 && (
        <div className="mt-4 pl-14">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="resources">
              <AccordionTrigger className="py-2">
                <span className="text-sm font-medium">
                  Resources ({lesson.resources.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {lesson.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center">
                        {resource.type === "pdf" && (
                          <FileText className="h-4 w-4 mr-2 text-red-500" />
                        )}
                        {resource.type === "doc" && (
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        )}
                        {resource.type === "zip" && (
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                        )}
                        {resource.type === "link" && (
                          <FileCheckIcon className="h-4 w-4 mr-2" />
                        )}
                        <span className="text-sm">{resource.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {} /* Handle delete resource */}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default LessonItem;
