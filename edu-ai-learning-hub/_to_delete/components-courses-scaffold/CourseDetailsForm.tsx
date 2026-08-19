import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Course } from "@/types/course";
import { Trash, Upload } from "lucide-react";

interface CourseDetailsFormProps {
  course: Course;
  onUpdateCourseDetails: (field: keyof Course, value: string | number) => void;
}

const CourseDetailsForm: React.FC<CourseDetailsFormProps> = ({
  course,
  onUpdateCourseDetails,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="course-title">Course Title</Label>
          <Input
            id="course-title"
            value={course.title}
            onChange={(e) => onUpdateCourseDetails("title", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="course-subtitle">Subtitle</Label>
          <Input
            id="course-subtitle"
            value={course.subtitle}
            onChange={(e) => onUpdateCourseDetails("subtitle", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="course-description">Description</Label>
          <Textarea
            id="course-description"
            value={course.description}
            onChange={(e) =>
              onUpdateCourseDetails("description", e.target.value)
            }
            rows={6}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="course-category">Category</Label>
            <Select
              value={course.category}
              onValueChange={(value) =>
                onUpdateCourseDetails("category", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3D Design">3D Design</SelectItem>
                <SelectItem value="Animation">Animation</SelectItem>
                <SelectItem value="Game Development">
                  Game Development
                </SelectItem>
                <SelectItem value="VR/AR">VR/AR</SelectItem>
                <SelectItem value="Visual Effects">Visual Effects</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="course-level">Level</Label>
            <Select
              value={course.level}
              onValueChange={(
                value: "beginner" | "intermediate" | "advanced"
              ) => onUpdateCourseDetails("level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label htmlFor="course-image">Course Cover Image</Label>
        <div className="mt-2">
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
            {course.coverImage ? (
              <div className="relative w-full">
                <img
                  src={course.coverImage}
                  alt="Course cover"
                  className="w-full h-[200px] object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => onUpdateCourseDetails("coverImage", "")}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary/80"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsForm;
