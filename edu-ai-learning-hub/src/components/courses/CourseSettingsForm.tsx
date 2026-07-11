import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Course } from "@/types/course";

interface CourseSettingsFormProps {
  course: Course;
  onUpdateCourseDetails: (field: keyof Course, value: string | number) => void;
}

const CourseSettingsForm: React.FC<CourseSettingsFormProps> = ({
  course,
  onUpdateCourseDetails,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="course-price">Course Price ($)</Label>
        <Input
          id="course-price"
          type="number"
          min="0"
          step="0.01"
          value={course.price}
          onChange={(e) =>
            onUpdateCourseDetails("price", parseFloat(e.target.value))
          }
        />
        <p className="text-sm text-muted-foreground mt-1">
          Set to 0 for a free course
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Drip Content</h3>
            <p className="text-sm text-muted-foreground">
              Release lessons gradually over time
            </p>
          </div>
          <Switch checked={false} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Course Discussion</h3>
            <p className="text-sm text-muted-foreground">
              Allow students to discuss in comments
            </p>
          </div>
          <Switch checked={true} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Certificate of Completion</h3>
            <p className="text-sm text-muted-foreground">
              Provide certificates when students complete the course
            </p>
          </div>
          <Switch checked={true} />
        </div>
      </div>
    </div>
  );
};

export default CourseSettingsForm;
